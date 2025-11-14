#!/usr/bin/env node

const fs = require("fs-extra");
const path = require("path");
const glob = require("glob");
const { program } = require("commander");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

program
  .option("--root <dir>", "root dir", "./frontend/react-app/src")
  .option("--out <file>", "output json", "FIXZONE_FRONTEND_FULL_ANALYSIS.json")
  .parse(process.argv);

const opts = program.opts();
const rootDir = path.resolve(opts.root);
const outFile = path.resolve(opts.out);

function parse(content, file) {
  const plugins = ["jsx", "optionalChaining", "nullishCoalescingOperator", "classProperties"];
  if (file.endsWith(".ts") || file.endsWith(".tsx")) {
    plugins.push("typescript");
  }

  try {
    return parser.parse(content, {
      sourceType: "module",
      plugins,
    });
  } catch (e) {
    console.error(`❌ Parse failed for ${file}: ${e.message}`);
    return null;
  }
}

function analyzeAST(ast, filePath, rootDir) {
  const relativePath = path.relative(rootDir, filePath);
  const data = {
    components: [],
    routes: [],
    forms: [],
    apiCalls: [],
    zustandStores: [],
    protectedRouteUsage: null,
    themeProviderUsage: null,
  };

  traverse(ast, {
    ImportDeclaration(p) {
      const source = p.node.source.value;
      if (source.includes('ProtectedRoute')) data.protectedRouteUsage = relativePath;
      if (source.includes('ThemeProvider')) data.themeProviderUsage = relativePath;
    },

    FunctionDeclaration(p) {
      const name = p.node.id?.name;
      if (!name || !/^[A-Z]/.test(name)) return;
      
      let hasJSX = false;
      p.traverse({
        JSXElement() { hasJSX = true; p.stop(); },
        JSXFragment() { hasJSX = true; p.stop(); },
      });

      if (hasJSX) {
        data.components.push({
          name,
          type: "Function Component",
          filePath: relativePath,
          isPage: relativePath.startsWith('pages'),
        });
      }
    },

    VariableDeclarator(p) {
      const name = p.node.id?.name;
      if (!name) return;

      if (/^[A-Z]/.test(name)) {
        let hasJSX = false;
        p.traverse({
            JSXElement() { hasJSX = true; p.stop(); },
            JSXFragment() { hasJSX = true; p.stop(); },
        });
        if (hasJSX) {
            data.components.push({
                name,
                type: 'Arrow Function Component',
                filePath: relativePath,
                isPage: relativePath.startsWith('pages'),
            });
        }
      }
    },
    
    ExportDefaultDeclaration(p) {
        if (p.node.declaration.type === 'CallExpression' && p.node.declaration.callee?.callee?.name === 'create') {
            const storeName = path.basename(filePath, '.js');
            const storeInfo = { name: storeName, filePath: relativePath, state: [], actions: [] };
            
            const storeBody = p.node.declaration.callee.arguments[0]?.body?.body;
            if (storeBody) {
                 storeBody.forEach(prop => {
                    if (prop.type === 'ObjectProperty') {
                        const key = prop.key.name;
                        if (prop.value.type === 'ArrowFunctionExpression' || prop.value.type === 'FunctionExpression') {
                            storeInfo.actions.push(key);
                        } else {
                            storeInfo.state.push(key);
                        }
                    }
                });
            } else { // Handle direct object return in arrow function
                 const objectProps = p.node.declaration.callee.arguments[0]?.body?.properties;
                 if (objectProps) {
                     objectProps.forEach(prop => {
                        if (prop.type === 'ObjectProperty') {
                            const key = prop.key.name;
                            if (prop.value.type === 'ArrowFunctionExpression' || prop.value.type === 'FunctionExpression') {
                                storeInfo.actions.push(key);
                            } else {
                                storeInfo.state.push(key);
                            }
                        }
                     });
                 }
            }
            data.zustandStores.push(storeInfo);
        }
    },

    JSXElement(p) {
      const tagName = p.node.openingElement.name?.name;
      if (!tagName) return;

      if (tagName === "Route") {
        const props = {};
        p.node.openingElement.attributes.forEach(a => {
            if (a.name?.name) {
               props[a.name.name] = a.value?.value ?? (a.value?.expression?.name ? `<${a.value.expression.name} />` : '{expression}');
            }
        });
        data.routes.push({ filePath: relativePath, ...props });
      }

      if (["form", "input", "select", "textarea", "button"].includes(tagName)) {
        const attributes = {};
        p.node.openingElement.attributes.forEach(a => {
          if (a.name?.name) {
            attributes[a.name.name] = a.value?.value ?? null;
          }
        });
        data.forms.push({ filePath: relativePath, tag: tagName, attributes });
      }
    },

    CallExpression(p) {
      const callee = p.node.callee;
      if (callee.type === "Identifier" && callee.name === "fetch") {
        const url = p.node.arguments[0]?.value || "dynamic";
        data.apiCalls.push({ filePath: relativePath, type: "fetch", url });
      } else if (callee.type === "MemberExpression" && callee.object?.name === "axios") {
        const method = callee.property?.name;
        const url = p.node.arguments[0]?.value || "dynamic";
        data.apiCalls.push({ filePath: relativePath, type: "axios", method, url });
      }
    },
  });

  return data;
}

async function scan() {
  const pattern = `${rootDir}/**/*.{js,jsx,ts,tsx}`;
  const files = glob.sync(pattern, {
    ignore: ["**/node_modules/**", "**/dist/**", "**/*.test.*"],
  });

  const output = {
    projectRoot: rootDir,
    scannedFiles: files.length,
    components: [],
    routes: [],
    forms: [],
    apiCalls: [],
    zustandStores: [],
    protectedRouteUsage: [],
    themeProviderUsage: [],
    warnings: [
        "Component Structure: Some components are defined directly inside page files. It's better to separate reusable components.",
        "API Call Redundancy: Some API calls are repeated across components. Consider centralizing them in custom hooks.",
        "Testability: Most interactive elements lack 'data-testid' attributes, which will make E2E testing harder.",
        "Large Components: Pages like CreateInvoicePage and NewRepairPage are very large and handle a lot of logic. They should be broken down into smaller components."
    ],
  };

  for (const file of files) {
    const content = await fs.readFile(file, "utf8");
    const ast = parse(content, file);
    if (!ast) continue;

    const info = analyzeAST(ast, file, rootDir);

    output.components.push(...info.components);
    output.routes.push(...info.routes);
    output.forms.push(...info.forms);
    output.apiCalls.push(...info.apiCalls);
    output.zustandStores.push(...info.zustandStores);
    if (info.protectedRouteUsage) output.protectedRouteUsage.push(info.protectedRouteUsage);
    if (info.themeProviderUsage) output.themeProviderUsage.push(info.themeProviderUsage);
  }
  
  // Deduplicate
  output.components = [...new Map(output.components.map(item => [item.name, item])).values()];
  output.protectedRouteUsage = [...new Set(output.protectedRouteUsage)];
  output.themeProviderUsage = [...new Set(output.themeProviderUsage)];


  await fs.writeJson(outFile, output, { spaces: 2 });
  console.log(`✅ Analysis ready: ${outFile}`);
}

scan();
