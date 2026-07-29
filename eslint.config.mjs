import { defineConfig, globalIgnores } from "eslint/config";
import nextPlugin from "@next/eslint-plugin-next";
import reactHooks from "eslint-plugin-react-hooks";
import typescriptEslint from "typescript-eslint";

export default defineConfig([
  ...typescriptEslint.configs.recommended,
  {
    files: ["**/*.{js,mjs,ts,tsx}"],
    plugins: {
      "@next/next": nextPlugin,
      "react-hooks": reactHooks,
    },
    rules: {
      ...nextPlugin.configs["core-web-vitals"].rules,
      ...reactHooks.configs.flat.recommended.rules,
      "react-hooks/set-state-in-effect": "off",
    },
  },
  globalIgnores([".next/**", "out/**", ".pages-preview/**", "node_modules/**", "playwright-report/**", "test-results/**", "reports/**"]),
]);
