import js from "@eslint/js";
import {defineConfig} from "eslint/config"; // eslint-disable-line
import globals from "globals";
import tseslint from "typescript-eslint";
import stylistic from "@stylistic/eslint-plugin";
import pluginVue from "eslint-plugin-vue";
import importPlugin from "eslint-plugin-import";

export default defineConfig([
  {
    files: ["**/*.{ts,vue}"],
    plugins: {js},
    extends: ["js/recommended"],
    languageOptions: {globals: globals.browser},
  },
  tseslint.configs.recommendedTypeChecked,
  pluginVue.configs["flat/essential"],
  {
    files: ["**/*.vue", "**/*.ts", "*.ts"],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        project: ["./tsconfig.json"],
        extraFileExtensions: ['.vue'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    plugins: {
      "@stylistic": stylistic,
      import: importPlugin,
    },
    rules: {
      "object-curly-spacing": ["error", "never"],
      "semi": ["error", "always"],
      "comma-dangle": ["error", "always-multiline"],
      "@stylistic/semi": ["error", "always"],
      "@stylistic/member-delimiter-style": ["error", {
        "multiline": {delimiter: "comma", requireLast: true},
        "singleline": {delimiter: "comma", requireLast: false},
      }],
      "vue/multi-word-component-names": "off",
      "import/extensions": ["error", "always"],
      "@typescript-eslint/no-unused-vars": ["error", {
        argsIgnorePattern: "^_",
      }],
      "@typescript-eslint/strict-boolean-expressions": ["error", {
        allowNumber: false,
        allowString: false,
      }],
    },
  },
]);
