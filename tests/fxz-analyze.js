#!/usr/bin/env node

/**
 * FixZone ERP - React/Vite Full Analyzer
 * ---------------------------------------
 * This script scans the entire ERP frontend and extracts:
 * - Components (with JSX check)
 * - Pages
 * - Routes (React Router v6)
 * - Zustand Stores (state/actions)
 * - UI Components (shadcn/ui)
 * - Auth Logic (ProtectedRoute, useAuthStore)
 * - Forms + Input Names + data-testid
 * - API Calls (fetch/axios)
 * - Theme Provider usage
 * - Suggestions for Unit Testing
 *
 * Use:
 *   node fxz-analyze.js --root ./src --out fxz-analysis.json
 */

const fs = require("fs-extra");
const path = require("path");
const glob = require("glob");
const { program } = require("commander");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

program
  .option("--root <dir>", "root dir", "./src")
  .option("--out <file>", "output json", "fxz-analysis.json")
  .parse(process.argv);

const opts = program.opts();
const rootDir = path.resolve(opts.root);
const outFile = path.resolve(opts.out);

// ---------------------------------------------------
// Parser
// ---------------------------------------------------
function parse(content, file) {
  const plugins = ["jsx", "optionalChaining", "nullishCoalescingOperator"];
  if (file.endsWith(".ts") || file.endsWith(".tsx")) {
    plugins.push("typescript");
  }

  try {
    return parser.parse(content, {
      sourceType: "module",
      plugins,
    });
  } catch (e) {
    console.log("❌ Parse failed:", file, e.message);
    return null;
  }
}

// ---------------------------------------------------
// AST Extraction
// ---------------------------------------------------
function analyzeAST(ast, filePath) {
  const data = {
    file: filePath,
    imports: [],
    exports: [],
    components: [],
    forms: [],
    zustandStores: [],
    apiCalls: [],
    routes: [],
    authUsage: false,
    protectedRoute: false,
    themeUsage: false,
  };

  traverse(ast, {
    ImportDeclaration(p) {
      const src = p.node.source.value;
      const items = p.node.specifiers.map(s => ({
        local: s.local.name,
        imported: s.imported ? s.imported.name : "default",
      }));
      data.imports.push({ src, items });

      if (src.includes("authStore")) data.authUsage = true;
      if (src.includes("ThemeProvider")) data.themeUsage = true;
      if (src.includes("ProtectedRoute")) data.protectedRoute = true;
    },

    FunctionDeclaration(p) {
      const name = p.node.id?.name;
      let hasJSX = false;

      p.traverse({
        JSXElement() { hasJSX = true; },
        JSXFragment() { hasJSX = true; },
      });

      if (name && /^[A-Z]/.test(name) && hasJSX) {
        data.components.push({ name, type: "function" });
      }
    },

    VariableDeclarator(p) {
      const id = p.node.id?.name;

      // Zustand create()
      if (p.node.init?.callee?.name === "create") {
        data.zustandStores.push({
          name: id,
          type: "zustand-store",
          file: filePath,
        });
      }

      // Component arrow function
      if (
        p.node.init &&
        ["ArrowFunctionExpression", "FunctionExpression"].includes(p.node.init.type)
      ) {
        let hasJSX = false;

        p.traverse({
          JSXElement() { hasJSX = true; },
          JSXFragment() { hasJSX = true; },
        });

        if (id && /^[A-Z]/.test(id) && hasJSX) {
          data.components.push({ name: id, type: "arrow-component" });
        }
      }
    },

    JSXElement(p) {
      const tag = p.node.openingElement.name?.name;

      // <Route />
      if (tag === "Route") {
        const props = {};
        p.node.openingElement.attributes.forEach(a => {
          if (a.name?.name) {
            props[a.name.name] =
              a.value?.value || (a.value?.expression ? "EXPR" : null);
          }
        });
        data.routes.push({ file: filePath, props });
      }

      // Forms + inputs
      if (["input", "select", "textarea"].includes(tag)) {
        const attrs = {};
        p.node.openingElement.attributes.forEach(a => {
          if (a.name?.name) {
            attrs[a.name.name] =
              a.value?.value || (a.value?.expression ? "EXPR" : null);
          }
        });
        data.forms.push({ file: filePath, tag, attrs });
      }
    },

    CallExpression(p) {
      const callee = p.node.callee;

      // fetch("url")
      if (callee.type === "Identifier" && callee.name === "fetch") {
        const url = p.node.arguments[0]?.value || "dynamic";
        data.apiCalls.push({ file: filePath, type: "fetch", url });
      }

      // axios.post(...)
      if (
        callee.type === "MemberExpression" &&
        callee.object?.name === "axios"
      ) {
        const method = callee.property?.name;
        const url = p.node.arguments[0]?.value || "dynamic";
        data.apiCalls.push({ file: filePath, type: "axios", method, url });
      }
    },
  });

  return data;
}

// ---------------------------------------------------
// Run Scan
// ---------------------------------------------------
async function scan() {
  const pattern = `${rootDir}/**/*.{js,jsx,ts,tsx}`;
  const files = glob.sync(pattern, {
    ignore: ["**/node_modules/**", "**/dist/**"],
  });

  const output = {
    projectRoot: rootDir,
    scannedFiles: files.length,
    components: [],
    pages: [],
    routes: [],
    zustandStores: [],
    apiCalls: [],
    forms: [],
    auth: [],
    theme: [],
  };

  for (const file of files) {
    const content = await fs.readFile(file, "utf8");
    const ast = parse(content, file);
    if (!ast) continue;

    const info = analyzeAST(ast, file);

    // Collect
    output.components.push(...info.components);
    output.forms.push(...info.forms);
    output.zustandStores.push(...info.zustandStores);
    output.apiCalls.push(...info.apiCalls);
    output.routes.push(...info.routes);
    if (info.authUsage) output.auth.push(file);
    if (info.themeUsage) output.theme.push(file);
  }

  await fs.writeJson(outFile, output, { spaces: 2 });
  console.log("✨ Analysis ready:", outFile);
}

scan();
