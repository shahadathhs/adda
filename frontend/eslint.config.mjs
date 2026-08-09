import js from "@eslint/js";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default defineConfig([
  globalIgnores(["node_modules/*", "dist/*", "src/routeTree.gen.ts"]),

  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    plugins: { js },
    extends: ["js/recommended"],
    rules: {
      "no-console": ["warn", { allow: ["warn", "error", "info", "group", "groupEnd"] }],
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-unused-expressions": "error",
    },
  },

  ...tseslint.configs.recommended,

  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      "@typescript-eslint/no-empty-object-type": "warn",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-namespace": "warn",
      "no-undef": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  },

  // Route files (TanStack Router) must export `Route` alongside their component,
  // and the entry file is side-effectful — both trip react-refresh needlessly.
  {
    files: ["src/routes/**/*.{ts,tsx}", "src/main.tsx"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },

  // shadcn/ui primitives legitimately export variant helpers / context next to
  // their components.
  {
    files: ["src/shared/ui/**/*.{ts,tsx}"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },

  // Run Prettier as an ESLint rule (and disable conflicting formatting rules).
  eslintPluginPrettierRecommended,
]);
