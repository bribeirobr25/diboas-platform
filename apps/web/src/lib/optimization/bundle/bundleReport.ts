/**
 * Bundle Report Utilities
 *
 * Generate optimization reports and calculate savings
 */

import type { BundleAnalysis, OptimizationSuggestion, SavingsResult } from './bundleTypes';
import {
  generateWebpackOptimizations,
  generateNextJSOptimizations,
  generateDynamicImportSuggestions
} from './bundleConfig';

/**
 * Format bytes to human readable format
 */
export function formatBytes(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
}

/**
 * Calculate potential savings from all suggestions
 */
export function calculateTotalSavings(suggestions: OptimizationSuggestion[]): SavingsResult {
  const totalSavings = suggestions.reduce(
    (sum, suggestion) => sum + suggestion.estimatedSavings,
    0
  );

  const highImpactSavings = suggestions
    .filter(s => s.impact === 'high')
    .reduce((sum, suggestion) => sum + suggestion.estimatedSavings, 0);

  const easyWins = suggestions.filter(
    s => s.effort === 'low' && (s.impact === 'high' || s.impact === 'medium')
  );

  return {
    totalSavings,
    highImpactSavings,
    easyWins
  };
}

/**
 * Generate optimization report
 */
export function generateOptimizationReport(analysis: BundleAnalysis): string {
  const savings = calculateTotalSavings(analysis.suggestions);

  const report = [
    "# Bundle Optimization Report",
    "",
    `## Current Bundle Status`,
    `- Total Size: ${formatBytes(analysis.totalSize)}`,
    `- Asset Count: ${analysis.assetCount}`,
    `- Largest Asset: ${analysis.largestAssets[0]?.name} (${formatBytes(analysis.largestAssets[0]?.size || 0)})`,
    "",
    `## Optimization Potential`,
    `- Total Savings: ${formatBytes(savings.totalSavings)}`,
    `- High Impact Savings: ${formatBytes(savings.highImpactSavings)}`,
    `- Easy Wins: ${savings.easyWins.length} optimizations`,
    "",
    "## Priority Recommendations",
    ...analysis.suggestions.slice(0, 5).map((suggestion, index) =>
      `${index + 1}. **${suggestion.description}**\n   - Impact: ${suggestion.impact}, Effort: ${suggestion.effort}\n   - Savings: ${formatBytes(suggestion.estimatedSavings)}\n   - Implementation: ${suggestion.implementation}\n`
    ),
    "",
    "## Implementation Guide",
    "### Webpack Configuration",
    "```javascript",
    ...JSON.stringify(generateWebpackOptimizations(), null, 2).split('\n'),
    "```",
    "",
    "### Next.js Configuration",
    "```javascript",
    ...JSON.stringify(generateNextJSOptimizations(), null, 2).split('\n'),
    "```",
    "",
    "### Dynamic Import Examples",
    "```javascript",
    ...generateDynamicImportSuggestions(),
    "```"
  ];

  return report.join('\n');
}
