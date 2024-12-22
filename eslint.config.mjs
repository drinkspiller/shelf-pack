import js from "@eslint/js";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const eslintConfigPrettier = require("eslint-config-prettier");

export default [
  {
    // Add other directories or files to ignore:
    ignores: [
      "bench/",
      "build/",
      "dist/",
      "docs/",
      "node_modules/",
      "test/",
      "**/*.min.js",
    ],
  },

  js.configs.recommended,

  // Other ESLint configuration can go here
  // Prettier must be last to override other configs.
  eslintConfigPrettier,

  // Custom rules or overrides for your project.
  {
    rules: {},
  },
];
