import stylistic from "@stylistic/eslint-plugin";

export default {
  extends: ["@vue/eslint-config-prettier"],
  parserOptions: {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  rules: {},
  plugins: {"@stylistic": stylistic},
  overrides: [
    {
      files: ["*.ts"],
      extends: ["standard-with-typescript"],
      parserOptions: {
        "project": "./tsconfig.json"
      },
      rules: {
        "@typescript-eslint/semi": ["error", "always"],
        "@typescript-eslint/quotes": ["error", "double"],
        "@typescript-eslint/comma-dangle": ["error", "always-multiline"],
        "@typescript-eslint/space-before-function-paren": ["error", {}]
      }
    },
    {
      files: ["*.vue"],
      extends: ["@vue/eslint-config-typescript"],
      parser: "vue-eslint-parser",
      parserOptions: {
        parser: "@typescript-eslint/parser",
        project: "./tsconfig.json"
      }
    }
  ]
}
