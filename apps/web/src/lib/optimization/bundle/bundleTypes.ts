/**
 * Bundle Optimization Types
 *
 * Type definitions for bundle analysis and optimization
 */

/**
 * Optimization suggestion types
 */
export type OptimizationType =
  | 'code-splitting'
  | 'tree-shaking'
  | 'compression'
  | 'lazy-loading'
  | 'module-replacement';

/**
 * Priority levels
 */
export type Priority = 'high' | 'medium' | 'low';

/**
 * Impact levels
 */
export type Impact = 'high' | 'medium' | 'low';

/**
 * Effort levels
 */
export type Effort = 'low' | 'medium' | 'high';

/**
 * Bundle analysis result
 */
export interface BundleAnalysis {
  totalSize: number;
  assetCount: number;
  largestAssets: Array<{ name: string; size: number; type: string }>;
  duplicatedModules: Array<{ name: string; size: number; occurrences: number }>;
  unusedExports: Array<{ module: string; exports: string[] }>;
  suggestions: OptimizationSuggestion[];
}

/**
 * Optimization suggestion
 */
export interface OptimizationSuggestion {
  type: OptimizationType;
  priority: Priority;
  impact: Impact;
  effort: Effort;
  description: string;
  module?: string;
  estimatedSavings: number; // bytes
  implementation: string;
}

/**
 * Bundle asset information
 */
export interface BundleAsset {
  name: string;
  size: number;
  type: string;
}

/**
 * Bundle statistics from webpack or similar build tool
 */
export interface BundleStats {
  totalSize: number;
  assetCount: number;
  largestAssets: BundleAsset[];
  assets: BundleAsset[];
}

/**
 * Duplicated module information
 */
export interface DuplicatedModule {
  name: string;
  size: number;
  occurrences: number;
}

/**
 * Unused export information
 */
export interface UnusedExport {
  module: string;
  exports: string[];
}

/**
 * Webpack optimization configuration
 */
export interface WebpackOptimizationConfig {
  splitChunks: {
    chunks: string;
    minSize: number;
    maxSize: number;
    cacheGroups: Record<string, unknown>;
  };
  usedExports: boolean;
  sideEffects: boolean;
  minimize: boolean;
  minimizer: unknown[];
}

/**
 * Next.js optimization configuration
 */
export interface NextJSOptimizationConfig {
  experimental: {
    optimizeCss: boolean;
    optimizePackageImports: string[];
  };
  images: {
    formats: string[];
    minimumCacheTTL: number;
    deviceSizes: number[];
    imageSizes: number[];
  };
  compiler: {
    removeConsole: boolean;
    reactRemoveProperties: boolean;
  };
  swcMinify: boolean;
  compress: boolean;
}

/**
 * Savings calculation result
 */
export interface SavingsResult {
  totalSavings: number;
  highImpactSavings: number;
  easyWins: OptimizationSuggestion[];
}

/**
 * Bundle thresholds configuration
 */
export interface BundleThresholds {
  largeAsset: number;
  hugeAsset: number;
  maxAssets: number;
}

/**
 * Default bundle thresholds
 */
export const DEFAULT_BUNDLE_THRESHOLDS: BundleThresholds = {
  largeAsset: 500 * 1024, // 500KB
  hugeAsset: 1024 * 1024, // 1MB
  maxAssets: 50
};
