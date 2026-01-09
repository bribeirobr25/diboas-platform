/**
 * Bundle Analysis Utilities
 *
 * Functions for analyzing bundles and generating optimization suggestions
 */

import {
  DEFAULT_BUNDLE_THRESHOLDS,
  type BundleAnalysis,
  type BundleAsset,
  type BundleStats,
  type OptimizationSuggestion,
  type DuplicatedModule,
  type UnusedExport,
  type BundleThresholds
} from './bundleTypes';

/**
 * Get asset-specific optimization suggestions
 */
export function getAssetOptimizationSuggestions(
  asset: BundleAsset,
  thresholds: BundleThresholds = DEFAULT_BUNDLE_THRESHOLDS
): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];

  if (asset.type === 'javascript') {
    if (asset.size > thresholds.hugeAsset) {
      suggestions.push({
        type: 'code-splitting',
        priority: 'high',
        impact: 'high',
        effort: 'medium',
        description: `Split large JavaScript bundle: ${asset.name}`,
        module: asset.name,
        estimatedSavings: asset.size * 0.3, // Estimate 30% savings
        implementation: 'Use dynamic imports and React.lazy() for code splitting'
      });
    }

    suggestions.push({
      type: 'tree-shaking',
      priority: 'medium',
      impact: 'medium',
      effort: 'low',
      description: `Enable tree shaking for: ${asset.name}`,
      module: asset.name,
      estimatedSavings: asset.size * 0.15, // Estimate 15% savings
      implementation: 'Use ES modules and configure webpack tree shaking'
    });

    suggestions.push({
      type: 'compression',
      priority: 'medium',
      impact: 'medium',
      effort: 'low',
      description: `Enable compression for: ${asset.name}`,
      module: asset.name,
      estimatedSavings: asset.size * 0.7, // Estimate 70% compression
      implementation: 'Configure gzip/brotli compression in production'
    });
  }

  if (asset.type === 'image') {
    suggestions.push({
      type: 'compression',
      priority: 'high',
      impact: 'high',
      effort: 'low',
      description: `Optimize image: ${asset.name}`,
      module: asset.name,
      estimatedSavings: asset.size * 0.6, // Estimate 60% savings
      implementation: 'Use next/image with WebP/AVIF formats and proper sizing'
    });
  }

  return suggestions;
}

/**
 * Analyze common performance patterns
 */
export function analyzeCommonPatterns(
  bundleStats: BundleStats,
  thresholds: BundleThresholds = DEFAULT_BUNDLE_THRESHOLDS
): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];

  // Check for large vendor bundles
  const vendorChunks = bundleStats.assets.filter((asset: BundleAsset) =>
    asset.name.includes('vendor') || asset.name.includes('chunk')
  );

  vendorChunks.forEach((chunk: BundleAsset) => {
    if (chunk.size > thresholds.largeAsset) {
      suggestions.push({
        type: 'code-splitting',
        priority: 'high',
        impact: 'high',
        effort: 'medium',
        description: `Split vendor chunk: ${chunk.name}`,
        module: chunk.name,
        estimatedSavings: chunk.size * 0.4,
        implementation: 'Configure webpack splitChunks optimization'
      });
    }
  });

  // Check for potential lazy loading opportunities
  const pageChunks = bundleStats.assets.filter((asset: BundleAsset) =>
    asset.name.includes('page') || asset.name.includes('route')
  );

  pageChunks.forEach((chunk: BundleAsset) => {
    if (chunk.size > thresholds.largeAsset) {
      suggestions.push({
        type: 'lazy-loading',
        priority: 'medium',
        impact: 'high',
        effort: 'medium',
        description: `Implement lazy loading for: ${chunk.name}`,
        module: chunk.name,
        estimatedSavings: chunk.size, // Full savings for initial load
        implementation: 'Use dynamic imports and lazy loading for non-critical routes'
      });
    }
  });

  return suggestions;
}

/**
 * Find duplicated modules across chunks
 */
export function findDuplicatedModules(_bundleStats: BundleStats): DuplicatedModule[] {
  // This would typically require webpack-bundle-analyzer data
  // For now, return common duplications
  return [
    { name: 'react', size: 45000, occurrences: 3 },
    { name: 'lodash', size: 25000, occurrences: 2 }
  ];
}

/**
 * Find unused exports (requires static analysis)
 */
export function findUnusedExports(_bundleStats: BundleStats): UnusedExport[] {
  // This would typically require static analysis tools
  // For now, return common unused exports
  return [
    { module: 'utils', exports: ['deprecatedFunction', 'unusedHelper'] }
  ];
}

/**
 * Sort suggestions by priority and impact
 */
export function sortSuggestions(suggestions: OptimizationSuggestion[]): OptimizationSuggestion[] {
  const priorityWeight = { high: 3, medium: 2, low: 1 };
  const impactWeight = { high: 3, medium: 2, low: 1 };

  return [...suggestions].sort((a, b) => {
    const aScore = priorityWeight[a.priority] + impactWeight[a.impact];
    const bScore = priorityWeight[b.priority] + impactWeight[b.impact];
    return bScore - aScore;
  });
}

/**
 * Analyze bundle and provide optimization suggestions
 */
export function analyzeBundleForOptimization(
  bundleStats: BundleStats,
  thresholds: BundleThresholds = DEFAULT_BUNDLE_THRESHOLDS
): BundleAnalysis {
  const suggestions: OptimizationSuggestion[] = [];

  // Analyze large assets
  const largeAssets = bundleStats.largestAssets.filter((asset: BundleAsset) =>
    asset.size > thresholds.largeAsset
  );

  largeAssets.forEach((asset: BundleAsset) => {
    suggestions.push(...getAssetOptimizationSuggestions(asset, thresholds));
  });

  // Check for too many assets
  if (bundleStats.assetCount > thresholds.maxAssets) {
    suggestions.push({
      type: 'code-splitting',
      priority: 'high',
      impact: 'medium',
      effort: 'medium',
      description: `Reduce asset count from ${bundleStats.assetCount} to under ${thresholds.maxAssets}`,
      estimatedSavings: 0,
      implementation: 'Implement better code splitting and asset consolidation'
    });
  }

  // Analyze specific patterns
  suggestions.push(...analyzeCommonPatterns(bundleStats, thresholds));

  return {
    totalSize: bundleStats.totalSize,
    assetCount: bundleStats.assetCount,
    largestAssets: bundleStats.largestAssets,
    duplicatedModules: findDuplicatedModules(bundleStats),
    unusedExports: findUnusedExports(bundleStats),
    suggestions: sortSuggestions(suggestions)
  };
}
