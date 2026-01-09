/**
 * Bundle Configuration Generators
 *
 * Generate optimization configurations for webpack and Next.js
 */

import type { WebpackOptimizationConfig, NextJSOptimizationConfig } from './bundleTypes';

/**
 * Generate webpack optimization configuration
 */
export function generateWebpackOptimizations(): WebpackOptimizationConfig {
  return {
    splitChunks: {
      chunks: 'all',
      minSize: 20000,
      maxSize: 500000, // 500KB max chunk size
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
          chunks: 'all'
        },
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true
        },
        styles: {
          name: 'styles',
          test: /\.css$/,
          chunks: 'all',
          enforce: true
        }
      }
    },
    usedExports: true,
    sideEffects: false,
    minimize: true,
    minimizer: [
      '...',
      // Add terser options for better compression
      {
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.debug']
          },
          mangle: {
            safari10: true
          },
          output: {
            comments: false,
            ascii_only: true
          }
        }
      }
    ]
  };
}

/**
 * Generate Next.js optimization configuration
 */
export function generateNextJSOptimizations(): NextJSOptimizationConfig {
  return {
    experimental: {
      optimizeCss: true,
      optimizePackageImports: [
        'lucide-react',
        'date-fns',
        'lodash'
      ]
    },
    images: {
      formats: ['image/avif', 'image/webp'],
      minimumCacheTTL: 31536000, // 1 year
      deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
      imageSizes: [16, 32, 48, 64, 96, 128, 256, 384]
    },
    compiler: {
      removeConsole: process.env.NODE_ENV === 'production',
      reactRemoveProperties: process.env.NODE_ENV === 'production'
    },
    swcMinify: true,
    compress: true
  };
}

/**
 * Generate dynamic import suggestions
 */
export function generateDynamicImportSuggestions(): string[] {
  return [
    "// Heavy components should be dynamically imported",
    "const HeavyChart = dynamic(() => import('./HeavyChart'), { ssr: false });",
    "",
    "// Large libraries should be loaded on demand",
    "const loadChartLibrary = () => import('chart.js');",
    "",
    "// Route-based code splitting",
    "const AdminPanel = dynamic(() => import('./AdminPanel'));",
    "",
    "// Feature-based splitting",
    "const AdvancedFeatures = dynamic(() => import('./AdvancedFeatures'), {",
    "  loading: () => <LoadingSpinner />",
    "});"
  ];
}

/**
 * Generate tree shaking configuration
 */
export function generateTreeShakingConfig(): string[] {
  return [
    "// package.json",
    `{`,
    `  "sideEffects": false,`,
    `  "exports": {`,
    `    ".": {`,
    `      "import": "./dist/esm/index.js",`,
    `      "require": "./dist/cjs/index.js"`,
    `    }`,
    `  }`,
    `}`,
    "",
    "// Use named imports instead of default imports",
    "import { specific, functions } from 'library';",
    "// Instead of:",
    "// import * as library from 'library';"
  ];
}
