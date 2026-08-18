import js from "@eslint/js";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";

// TypeScript is linted by oxlint (.oxlintrc.json): TypeScript 7 ships no JS
// compiler API, which typescript-eslint requires to parse TS. ESLint here
// only covers plain JS files; formatting of TS is enforced by
// `prettier --check` (see the lint script).
export default defineConfig([
  globalIgnores(["node_modules/*", "dist/*", "**/*.ts", "**/*.tsx"]),

  {
    files: ["**/*.{js,cjs,mjs}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      "no-console": ["warn", { allow: ["warn", "error", "info", "group", "groupEnd"] }],
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-unused-expressions": "error",
    },
  },

  // Run Prettier as an ESLint rule (and disable conflicting formatting rules).
  eslintPluginPrettierRecommended,
]);
