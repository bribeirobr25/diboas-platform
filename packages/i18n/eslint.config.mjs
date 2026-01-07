/**
 * ESLint Configuration - @diboas/i18n Package
 *
 * Flat Config Format (ESLint v9 Compatible)
 * Aligned with diBoaS 12 Principles of Excellence
 */

import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  // Global ignores
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "*.config.js",
      "*.config.mjs",
      "*.config.ts",
    ],
  },
  // JavaScript recommended rules
  js.configs.recommended,
  // TypeScript rules
  ...tseslint.configs.recommended,
  // Custom rules
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      // Security & Audit Standards
      "no-eval": "error",
      "no-implied-eval": "error",

      // Error Handling & System Recovery
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      }],

      // Code Reusability & DRY Principles
      "no-duplicate-imports": "error",

      // Allow explicit any for i18n message typing flexibility
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];
