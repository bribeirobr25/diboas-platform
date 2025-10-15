// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import path from "path";
import { fileURLToPath } from "url";

/**
 * ESLint Configuration - Flat Config Format (v9 Compatible)
 * 
 * Domain-Driven Design: Code quality rules aligned with architectural principles
 * Security & Audit Standards: Strict linting rules for security compliance
 * Error Handling & System Recovery: Comprehensive error detection
 * Performance & SEO Optimization: Rules for optimal code performance
 * Semantic Naming Conventions: Enforced naming standards
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

const eslintConfig = [
  // Global ignores
  {
    ignores: [
      "node_modules/**",
      ".next/**", 
      "out/**",
      "build/**",
      "dist/**",
      "next-env.d.ts",
      "*.config.js",
      "*.config.mjs",
      "public/**",
      ".turbo/**",
      "coverage/**"
    ],
  },
  // JavaScript recommended rules
  js.configs.recommended,
  // Next.js and TypeScript rules with compatibility layer
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // Custom rules for architectural compliance
{
  files: ["**/*.{js,jsx,ts,tsx}"],
  rules: {
    // Domain-Driven Design: Enforce proper naming
    "prefer-const": "error",
    "no-var": "error",
    
    // Security & Audit Standards
    "no-eval": "error",
    "no-implied-eval": "error", 
    "no-new-func": "error",
    "no-script-url": "error",
    
    // Error Handling & System Recovery
    "no-empty": "warn",
    "no-unreachable": "error",
    "no-unused-vars": "off", // Handled by TypeScript
    "@typescript-eslint/no-unused-vars": ["warn", { 
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_"
    }],
    
    // Performance & SEO Optimization
    "prefer-template": "warn",
    "no-useless-concat": "warn",
    
    // Code Reusability & DRY Principles
    "no-duplicate-imports": "error",
    
    // File Decoupling & Organization
    "import/no-cycle": "off", // Can be expensive, disabled for performance
    
    // Next.js specific optimizations
    "@next/next/no-img-element": "warn", // Prefer Next.js Image component
    "@next/next/no-head-element": "error", // Use next/head instead
  },
}, // Specific rules for component files
{
  files: ["**/components/**/*.{ts,tsx}", "**/app/**/*.{ts,tsx}"],
  rules: {
    // React best practices for components
    "react-hooks/exhaustive-deps": "warn",
    "react/jsx-key": "error",
    "react/no-array-index-key": "warn",
    
    // Semantic Naming Conventions for components
    "react/function-component-definition": ["warn", {
      "namedComponents": "function-declaration",
      "unnamedComponents": "arrow-function"
    }],
  },
}, // Configuration files
{
  files: ["**/*.config.{js,mjs,ts}", "**/next.config.js"],
  rules: {
    // Allow require() in config files
    "@typescript-eslint/no-var-requires": "off",
    "no-undef": "off"
  },
}, ...storybook.configs["flat/recommended"]];

export default eslintConfig;
