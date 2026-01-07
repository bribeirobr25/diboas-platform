/**
 * ESLint Configuration - @diboas/ui Package
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
  // Custom rules for UI components
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

      // UI components may need flexible typing for props
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];
