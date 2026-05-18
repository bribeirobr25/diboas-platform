// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";
import js from "@eslint/js";
import nextConfig from "eslint-config-next";

/**
 * ESLint Configuration - Flat Config Format (v9 Compatible)
 *
 * Uses eslint-config-next native flat config (no FlatCompat needed).
 *
 * Domain-Driven Design: Code quality rules aligned with architectural principles
 * Security & Audit Standards: Strict linting rules for security compliance
 * Error Handling & System Recovery: Comprehensive error detection
 * Performance & SEO Optimization: Rules for optimal code performance
 * Semantic Naming Conventions: Enforced naming standards
 */

// New react-hooks rules introduced in eslint-config-next@16 that the codebase predates.
// Downgrade from error to warn to avoid blocking lint while the codebase is incrementally updated.
const newReactHooksRules = [
  "react-hooks/error-boundaries",
  "react-hooks/set-state-in-effect",
  "react-hooks/purity",
  "react-hooks/preserve-manual-memoization",
  "react-hooks/static-components",
  "react-hooks/refs",
];

// ESLint v9 flat config scopes plugin lookups per-config-object. The
// `@typescript-eslint` plugin is registered inside `nextConfig`'s blocks via
// the `typescript-eslint` meta-package; rule references outside those blocks
// cannot resolve it. So instead of re-registering the plugin (which raises
// "Cannot redefine plugin"), we overlay our custom `@typescript-eslint/no-
// unused-vars` options directly onto the existing nextConfig rule
// registration via this map. (2026-05-18 fix.)
const adjustedNextConfig = nextConfig.map(config => {
  if (!config.rules) return config;
  const overrides = {};
  for (const rule of newReactHooksRules) {
    if (config.rules[rule]) {
      overrides[rule] = "warn";
    }
  }
  // Overlay underscore-prefix ignore pattern on the existing no-unused-vars
  // rule (nextConfig registers it as plain "warn"; we want the project-
  // standard underscore-prefix convention for "intentionally unused" args).
  if (config.rules['@typescript-eslint/no-unused-vars']) {
    overrides['@typescript-eslint/no-unused-vars'] = ['warn', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }];
  }
  if (Object.keys(overrides).length === 0) return config;
  return { ...config, rules: { ...config.rules, ...overrides } };
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
      "coverage/**",
      // Utility scripts using CommonJS
      "analyze-*.js",
      "scripts/**/*.js",
      // Storybook config (development tool) + build output
      ".storybook/**",
      "storybook-static/**",
      // pa11y screenshot output (binary; only present locally)
      "pa11y-screenshots/**",
      // Playwright test report output (CI artifact)
      "playwright-report/**",
      "test-results/**"
    ],
  },
  // JavaScript recommended rules
  js.configs.recommended,
  // Next.js config (native flat config — no FlatCompat needed)
  ...adjustedNextConfig,
  // TypeScript files: disable no-undef (TypeScript handles this natively)
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "no-undef": "off",
    },
  },
  // Custom rules for architectural compliance.
  // Note: `@typescript-eslint/*` rules cannot be added here in flat config
  // (plugin scope is per-config-object; `eslint-config-next` already owns
  // the registration). The `no-unused-vars` argument pattern is overlaid in
  // `adjustedNextConfig.map` above.
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
      "no-unused-vars": "off", // Handled by TypeScript / @typescript-eslint (overlaid in adjustedNextConfig)

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
  },
  // Specific rules for component files
  {
    files: ["**/components/**/*.{ts,tsx}", "**/app/**/*.{ts,tsx}"],
    rules: {
      // React best practices for components
      "react-hooks/exhaustive-deps": "warn",
      "react/jsx-key": "error",
      "react/no-array-index-key": "warn",

      // Security: prevent reverse-tabnabbing via target="_blank" without rel.
      // Audit fix A1 (2026-05-07): catches cases where Next.js <Link>, raw <a>,
      // or any other element opens a new tab without rel="noopener noreferrer".
      "react/jsx-no-target-blank": ["error", {
        "allowReferrer": false,
        "enforceDynamicLinks": "always",
        "warnOnSpreadAttributes": true
      }],

      // Semantic Naming Conventions for components
      "react/function-component-definition": ["warn", {
        "namedComponents": "function-declaration",
        "unnamedComponents": "arrow-function"
      }],
    },
  },
  // Configuration files — allow require() and undefined globals.
  // `@typescript-eslint/no-var-requires` is not configurable here (plugin
  // scope owned by nextConfig); `.config.{js,mjs,ts}` files are already
  // ignored by nextConfig's own ignore patterns, so this acts as defense
  // in depth for any project-specific config file that escapes those.
  {
    files: ["**/*.config.{js,mjs,ts}", "**/next.config.js"],
    rules: {
      "no-undef": "off",
    },
  },
  ...storybook.configs["flat/recommended"],
];

export default eslintConfig;
