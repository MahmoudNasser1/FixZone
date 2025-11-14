import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';
import * as parser from '@babel/parser';
import _traverse, { NodePath } from '@babel/traverse';
import { program } from 'commander';
import * as t from '@babel/types';

// Compatibility fix for ES Modules
const traverse = _traverse.default;

// Define TypeScript interfaces for our data structures
interface ComponentInfo {
  name: string;
  type: string;
  filePath: string;
  isPage: boolean;
}

interface RouteInfo {
  path: string | null;
  element: string | null;
  filePath: string;
}

interface FormInfo {
  tag: string;
  attributes: Record<string, any>;
  filePath: string;
}

interface ApiCallInfo {
  type: 'fetch' | 'axios';
  url: string;
  method?: string;
  filePath: string;
}

interface ZustandStoreInfo {
  name: string;
  filePath: string;
  state: string[];
  actions: string[];
}

interface AnalysisOutput {
  projectRoot: string;
  scannedFiles: number;
  components: ComponentInfo[];
  routes: RouteInfo[];
  forms: FormInfo[];
  apiCalls: ApiCallInfo[];
  zustandStores: ZustandStoreInfo[];
  protectedRouteUsage: string[];
  themeProviderUsage: string[];
  warnings: string[];
}

/**
 * Main analyzer class
 */
class DeepAnalyzer {
  private rootDir: string;
  private output: AnalysisOutput;

  constructor(rootDir: string) {
    this.rootDir = path.resolve(rootDir);
    this.output = {
      projectRoot: this.rootDir,
      scannedFiles: 0,
      components: [],
      routes: [],
      forms: [],
      apiCalls: [],
      zustandStores: [],
      protectedRouteUsage: [],
      themeProviderUsage: [],
      warnings: [],
    };
  }

  /**
   * Parses file content to AST
   */
  private parse(content: string, filePath: string): parser.ParseResult<any> | null {
    try {
      return parser.parse(content, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript', 'classProperties', 'optionalChaining', 'nullishCoalescingOperator'],
      });
    } catch (e: any) {
      this.output.warnings.push(`Failed to parse ${filePath}: ${e.message}`);
      return null;
    }
  }

  /**
   * Analyzes a single file's AST
   */
  private analyzeFile(ast: parser.ParseResult<any>, filePath: string): void {
    const relativePath = path.relative(this.rootDir, filePath);

    traverse(ast, {
      // Imports
      ImportDeclaration: (p: NodePath<t.ImportDeclaration>) => {
        const source = p.node.source.value;
        if (source.includes('ProtectedRoute')) {
          this.output.protectedRouteUsage.push(relativePath);
        }
        if (source.includes('ThemeProvider')) {
          this.output.themeProviderUsage.push(relativePath);
        }
      },
      
      // Components (Functions and Arrow Functions)
      VariableDeclarator: (p: NodePath<t.VariableDeclarator>) => {
        if (p.node.id.type === 'Identifier') {
          const name = p.node.id.name;
          let hasJsx = false;
          
          if (name.match(/^[A-Z]/)) {
            p.traverse({
              JSXElement: () => { hasJsx = true; p.stop(); },
              JSXFragment: () => { hasJsx = true; p.stop(); },
            });

            if (hasJsx && !this.output.components.find(c => c.name === name)) {
              this.output.components.push({
                name,
                type: 'Arrow Function Component',
                filePath: relativePath,
                isPage: relativePath.startsWith('pages/'),
              });
            }
          }
        }
      },
      FunctionDeclaration: (p: NodePath<t.FunctionDeclaration>) => {
         if (p.node.id && p.node.id.name.match(/^[A-Z]/)) {
            let hasJsx = false;
            p.traverse({
                JSXElement: () => { hasJsx = true; p.stop(); },
                JSXFragment: () => { hasJsx = true; p.stop(); },
            });

            if (hasJsx && !this.output.components.find(c => c.name === p.node.id!.name)) {
                this.output.components.push({
                    name: p.node.id!.name,
                    type: 'Function Component',
                    filePath: relativePath,
                    isPage: relativePath.startsWith('pages/'),
                });
            }
         }
      },
      
      // JSX Elements (Routes and Forms)
      JSXElement: (p: NodePath<t.JSXElement>) => {
        const openingElement = p.node.openingElement;
        if (openingElement.name.type !== 'JSXIdentifier') return;

        const tagName = openingElement.name.name;
        
        // Routes
        if (tagName === 'Route') {
          const props: Record<string, any> = {};
          openingElement.attributes.forEach((attr) => {
            if (attr.type === 'JSXAttribute' && attr.name.type === 'JSXIdentifier') {
              const attrName = attr.name.name;
              if (attr.value?.type === 'StringLiteral') {
                props[attrName] = attr.value.value;
              } else if (
                attr.value?.type === 'JSXExpressionContainer' &&
                attr.value.expression.type !== 'JSXEmptyExpression' // Check it's not empty
              ) {
                // Simplified representation for non-literal props
                if ('name' in attr.value.expression) {
                   props[attrName] = `<${attr.value.expression.name} />`;
                } else {
                   props[attrName] = `{expression}`;
                }
              }
            }
          });
          this.output.routes.push({
            path: props.path || null,
            element: props.element || null,
            filePath: relativePath,
          });
        }

        // Forms
        if (['form', 'input', 'textarea', 'select', 'button'].includes(tagName)) {
          const attributes: Record<string, any> = {};
           openingElement.attributes.forEach((attr) => {
               if (attr.type === 'JSXAttribute' && attr.name.type === 'JSXIdentifier') {
                   const attrName = attr.name.name;
                   if (attr.value?.type === 'StringLiteral') {
                       attributes[attrName] = attr.value.value;
                   }
               }
           });
          this.output.forms.push({ tag: tagName, attributes, filePath: relativePath });
        }
      },

      // API Calls
      CallExpression: (p: NodePath<t.CallExpression>) => {
        const callee = p.node.callee;
        let calleeName = '';
        if (callee.type === 'Identifier') {
          calleeName = callee.name;
        } else if (callee.type === 'MemberExpression' && callee.object.type === 'Identifier') {
          calleeName = callee.object.name;
        }

        if (calleeName === 'fetch') {
          const urlArg = p.node.arguments[0];
          const url = (urlArg && urlArg.type === 'StringLiteral') ? urlArg.value : 'dynamic';
          this.output.apiCalls.push({ type: 'fetch', url, filePath: relativePath });
        } else if (calleeName === 'axios' && callee.type === 'MemberExpression' && callee.property.type === 'Identifier') {
          const method = callee.property.name;
          const urlArg = p.node.arguments[0];
          const url = (urlArg && urlArg.type === 'StringLiteral') ? urlArg.value : 'dynamic';
          this.output.apiCalls.push({ type: 'axios', url, method, filePath: relativePath });
        }
      },

      // Zustand Stores
      ExportDefaultDeclaration: (p: NodePath<t.ExportDefaultDeclaration>) => {
        const declaration = p.node.declaration;
        if (
          declaration.type === 'CallExpression' &&
          declaration.callee.type === 'CallExpression' &&
          declaration.callee.callee.type === 'Identifier' &&
          declaration.callee.callee.name === 'create'
        ) {
          const storeName = path.basename(filePath, '.js');
          const storeInfo: ZustandStoreInfo = {
            name: storeName,
            filePath: relativePath,
            state: [],
            actions: [],
          };

          const storeFactory = declaration.callee.arguments[0];
          if (storeFactory?.type === 'ArrowFunctionExpression' && storeFactory.body.type === 'ObjectExpression') {
            storeFactory.body.properties.forEach(prop => {
              if (prop.type === 'ObjectProperty' && prop.key.type === 'Identifier') {
                const key = prop.key.name;
                if (prop.value.type === 'ArrowFunctionExpression' || prop.value.type === 'FunctionExpression') {
                  storeInfo.actions.push(key);
                } else {
                  storeInfo.state.push(key);
                }
              }
            });
          }
          this.output.zustandStores.push(storeInfo);
        }
      },
    });
  }

  /**
   * Main execution method
   */
  public async run(): Promise<AnalysisOutput> {
    const files = await glob(`${this.rootDir}/**/*.{js,jsx,ts,tsx}`, {
      ignore: ['**/node_modules/**', '**/dist/**'],
    });

    this.output.scannedFiles = files.length;

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      const ast = this.parse(content, file);
      if (ast) {
        this.analyzeFile(ast, file);
      }
    }
    
    // Add warnings from previous reports
    this.output.warnings.push(
        "Component Structure: Some components are defined directly inside page files. It's better to separate reusable components.",
        "API Call Redundancy: Some API calls are repeated across components. Consider centralizing them in custom hooks.",
        "Testability: Most interactive elements lack 'data-testid' attributes, which will make E2E testing harder.",
        "Large Components: Pages like CreateInvoicePage and NewRepairPage are very large and handle a lot of logic. They should be broken down into smaller components."
    );
    
    return this.output;
  }
}

// CLI setup
program
  .option('--root <dir>', 'Root directory of the frontend source code', './frontend/react-app/src')
  .option('--out <file>', 'Output JSON file path', './FIXZONE_FRONTEND_FULL_ANALYSIS.json')
  .parse(process.argv);

const opts = program.opts();

const analyzer = new DeepAnalyzer(opts.root);
analyzer.run()
  .then(output => {
    return fs.writeJson(opts.out, output, { spaces: 2 });
  })
  .then(() => {
    console.log(`✅ Deep analysis complete. Results saved to ${opts.out}`);
  })
  .catch(err => {
    console.error('❌ An error occurred during analysis:', err);
  });
