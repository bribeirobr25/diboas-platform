/**
 * Bundle Optimization Service
 *
 * Performance & SEO Optimization: Advanced bundle optimization strategies
 * Code Reusability & DRY: Shared optimization utilities
 * Monitoring & Observability: Bundle analysis and optimization tracking
 * Service Agnostic Abstraction: Framework-independent optimization
 */

// Import all bundle utilities from extracted modules
import {
  DEFAULT_BUNDLE_THRESHOLDS,
  analyzeBundleForOptimization,
  getAssetOptimizationSuggestions,
  generateWebpackOptimizations,
  generateNextJSOptimizations,
  generateDynamicImportSuggestions,
  generateTreeShakingConfig,
  formatBytes,
  calculateTotalSavings,
  generateOptimizationReport,
  type BundleAnalysis,
  type BundleStats,
  type OptimizationSuggestion,
  type BundleAsset,
  type WebpackOptimizationConfig,
  type NextJSOptimizationConfig
} from './bundle';

// Re-export types for backwards compatibility
export type {
  BundleAnalysis,
  OptimizationSuggestion,
  BundleAsset,
  BundleStats,
  WebpackOptimizationConfig,
  NextJSOptimizationConfig
};

/**
 * Bundle Optimization Service
 *
 * Class-based wrapper for backwards compatibility
 */
export class BundleOptimizer {
  private readonly LARGE_ASSET_THRESHOLD = DEFAULT_BUNDLE_THRESHOLDS.largeAsset;
  private readonly HUGE_ASSET_THRESHOLD = DEFAULT_BUNDLE_THRESHOLDS.hugeAsset;
  private readonly MAX_ASSETS_COUNT = DEFAULT_BUNDLE_THRESHOLDS.maxAssets;

  /**
   * Analyze bundle and provide optimization suggestions
   */
  analyzeBundleForOptimization(bundleStats: BundleStats): BundleAnalysis {
    return analyzeBundleForOptimization(bundleStats, {
      largeAsset: this.LARGE_ASSET_THRESHOLD,
      hugeAsset: this.HUGE_ASSET_THRESHOLD,
      maxAssets: this.MAX_ASSETS_COUNT
    });
  }

  /**
   * Get asset-specific optimization suggestions
   */
  private getAssetOptimizationSuggestions(asset: BundleStats['assets'][0]): OptimizationSuggestion[] {
    return getAssetOptimizationSuggestions(asset, {
      largeAsset: this.LARGE_ASSET_THRESHOLD,
      hugeAsset: this.HUGE_ASSET_THRESHOLD,
      maxAssets: this.MAX_ASSETS_COUNT
    });
  }

  /**
   * Generate webpack optimization configuration
   */
  generateWebpackOptimizations() {
    return generateWebpackOptimizations();
  }

  /**
   * Generate Next.js optimization configuration
   */
  generateNextJSOptimizations() {
    return generateNextJSOptimizations();
  }

  /**
   * Generate dynamic import suggestions
   */
  generateDynamicImportSuggestions(): string[] {
    return generateDynamicImportSuggestions();
  }

  /**
   * Generate tree shaking configuration
   */
  generateTreeShakingConfig(): string[] {
    return generateTreeShakingConfig();
  }

  /**
   * Calculate potential savings from all suggestions
   */
  calculateTotalSavings(suggestions: OptimizationSuggestion[]) {
    return calculateTotalSavings(suggestions);
  }

  /**
   * Generate optimization report
   */
  generateOptimizationReport(analysis: BundleAnalysis): string {
    return generateOptimizationReport(analysis);
  }

  /**
   * Format bytes to human readable format
   */
  private formatBytes(bytes: number): string {
    return formatBytes(bytes);
  }
}

// Singleton instance
export const bundleOptimizer = new BundleOptimizer();
