/**
 * Bundle Optimization Module
 *
 * Re-exports all bundle optimization utilities
 */

// Types and constants from bundleTypes
export {
  DEFAULT_BUNDLE_THRESHOLDS,
  type BundleAnalysis,
  type OptimizationSuggestion,
  type BundleAsset,
  type BundleStats,
  type DuplicatedModule,
  type UnusedExport,
  type WebpackOptimizationConfig,
  type NextJSOptimizationConfig,
  type SavingsResult,
  type BundleThresholds,
  type OptimizationType,
  type Priority,
  type Impact,
  type Effort
} from './bundleTypes';

// Analysis functions
export {
  analyzeBundleForOptimization,
  getAssetOptimizationSuggestions,
  analyzeCommonPatterns,
  findDuplicatedModules,
  findUnusedExports,
  sortSuggestions
} from './bundleAnalysis';

// Configuration generators
export {
  generateWebpackOptimizations,
  generateNextJSOptimizations,
  generateDynamicImportSuggestions,
  generateTreeShakingConfig
} from './bundleConfig';

// Report utilities
export {
  formatBytes,
  calculateTotalSavings,
  generateOptimizationReport
} from './bundleReport';
