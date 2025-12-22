import globals from "globals";
import pluginJs from "@eslint/js";

export default [
  {
    ignores: [
      "**/coverage/**", 
      "**/node_modules/**", 
      "terraform/**", 
      "package-lock.json"
    ],
  },
  {
    files: ["src/azure-sa/*.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: pluginJs.configs.recommended.rules,
  },
  {
    files: ["src/azure-sa/public/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    rules: pluginJs.configs.recommended.rules,
  },
];