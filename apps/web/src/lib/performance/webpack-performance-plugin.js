/**
 * Webpack Performance Plugin
 * 
 * Domain-Driven Design: Build-time performance monitoring domain
 * Monitoring & Observability: Bundle analysis and performance tracking
 * Error Handling & System Recovery: Graceful performance validation
 * File Decoupling & Organization: Dedicated build-time monitoring
 */

const fs = require('fs');
const path = require('path');

class WebpackPerformancePlugin {
  constructor(options = {}) {
    this.options = {
      outputPath: '.next/performance-report.json',
      budgets: {
        maxAssetSize: 300 * 1024, // 300KB (source maps excluded from count)
        maxEntrypointSize: 800 * 1024, // 800KB (source maps excluded from count)
        maxTotalSize: 4 * 1024 * 1024, // 4MB (source maps excluded from count)
        maxAssets: 300 // Raised from 40 — 4 locales × ~60 namespaces + framework chunks
      },
      logLevel: 'warn',
      failOnBudgetExceeded: false,
      ...options
    };
  }

  apply(compiler) {
    compiler.hooks.done.tap('WebpackPerformancePlugin', (stats) => {
      try {
        this.analyzePerformance(stats);
      } catch (error) {
        this.log('error', 'Performance analysis failed:', error.message);
      }
    });
  }

  analyzePerformance(stats) {
    const compilation = stats.compilation;
    const assets = compilation.getAssets();
    const entrypoints = Array.from(compilation.entrypoints.values());

    // Calculate bundle statistics
    const bundleStats = this.calculateBundleStats(assets, entrypoints);
    
    // Validate against budgets
    const validation = this.validateBudgets(bundleStats);
    
    // Generate detailed report
    const report = this.generateReport(bundleStats, validation, stats);
    
    // Save report to file
    this.saveReport(report);
    
    // Log results
    this.logResults(validation);
    
    // Fail build if configured and budgets exceeded
    if (this.options.failOnBudgetExceeded && !validation.passed) {
      throw new Error(`Performance budgets exceeded: ${validation.violations.join(', ')}`);
    }
  }

  calculateBundleStats(assets, entrypoints) {
    const assetSizes = assets.map(asset => ({
      name: asset.name,
      size: asset.source?.size() || 0,
      type: this.getAssetType(asset.name),
      isSourceMap: asset.name.endsWith('.map')
    }));

    // Exclude source maps from budget-relevant metrics (they're never served to users)
    const userFacingAssets = assetSizes.filter(a => !a.isSourceMap);

    const entrypointSizes = entrypoints.map(entrypoint => ({
      name: entrypoint.name,
      size: entrypoint.getFiles().reduce((total, file) => {
        if (file.endsWith('.map')) return total; // Exclude source maps from entrypoint size
        const asset = assets.find(a => a.name === file);
        return total + (asset?.source?.size() || 0);
      }, 0),
      files: entrypoint.getFiles().filter(f => !f.endsWith('.map'))
    }));

    const totalSize = userFacingAssets.reduce((total, asset) => total + asset.size, 0);

    return {
      totalSize,
      assetCount: userFacingAssets.length,
      assets: userFacingAssets,
      entrypoints: entrypointSizes,
      largestAssets: userFacingAssets
        .sort((a, b) => b.size - a.size)
        .slice(0, 10),
      assetsByType: this.groupAssetsByType(userFacingAssets)
    };
  }

  validateBudgets(bundleStats) {
    const violations = [];
    const { budgets } = this.options;

    // Check total size
    if (bundleStats.totalSize > budgets.maxTotalSize) {
      violations.push(`Total bundle size ${this.formatBytes(bundleStats.totalSize)} exceeds budget ${this.formatBytes(budgets.maxTotalSize)}`);
    }

    // Check asset count
    if (bundleStats.assetCount > budgets.maxAssets) {
      violations.push(`Asset count ${bundleStats.assetCount} exceeds budget ${budgets.maxAssets}`);
    }

    // Check individual asset sizes
    bundleStats.assets.forEach(asset => {
      if (asset.size > budgets.maxAssetSize) {
        violations.push(`Asset ${asset.name} size ${this.formatBytes(asset.size)} exceeds budget ${this.formatBytes(budgets.maxAssetSize)}`);
      }
    });

    // Check entrypoint sizes
    bundleStats.entrypoints.forEach(entrypoint => {
      if (entrypoint.size > budgets.maxEntrypointSize) {
        violations.push(`Entrypoint ${entrypoint.name} size ${this.formatBytes(entrypoint.size)} exceeds budget ${this.formatBytes(budgets.maxEntrypointSize)}`);
      }
    });

    return {
      passed: violations.length === 0,
      violations,
      score: Math.max(0, 100 - (violations.length * 20)) // Simple scoring
    };
  }

  generateReport(bundleStats, validation, stats) {
    return {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      webpack: {
        version: stats.compilation.compiler.webpack?.version || 'unknown'
      },
      performance: {
        budgets: this.options.budgets,
        validation,
        stats: bundleStats,
        recommendations: this.generateRecommendations(validation.violations, bundleStats)
      },
      build: {
        duration: stats.endTime - stats.startTime,
        errors: stats.compilation.errors.length,
        warnings: stats.compilation.warnings.length,
        hash: stats.hash
      }
    };
  }

  generateRecommendations(violations, bundleStats) {
    const recommendations = [];

    if (violations.some(v => v.includes('Total bundle size'))) {
      recommendations.push({
        type: 'optimization',
        message: 'Consider implementing code splitting with dynamic imports',
        impact: 'high',
        effort: 'medium'
      });
      
      recommendations.push({
        type: 'optimization',
        message: 'Review and optimize large dependencies',
        impact: 'high',
        effort: 'low'
      });
    }

    if (violations.some(v => v.includes('Asset count'))) {
      recommendations.push({
        type: 'bundling',
        message: 'Consider combining similar assets or using asset bundling',
        impact: 'medium',
        effort: 'low'
      });
    }

    // Analyze largest assets for specific recommendations
    bundleStats.largestAssets.slice(0, 3).forEach(asset => {
      if (asset.type === 'javascript' && asset.size > 200 * 1024) {
        recommendations.push({
          type: 'code-splitting',
          message: `Large JavaScript file ${asset.name} (${this.formatBytes(asset.size)}) could benefit from code splitting`,
          impact: 'high',
          effort: 'medium'
        });
      }
      
      if (asset.type === 'image' && asset.size > 100 * 1024) {
        recommendations.push({
          type: 'image-optimization',
          message: `Large image ${asset.name} (${this.formatBytes(asset.size)}) should be optimized`,
          impact: 'medium',
          effort: 'low'
        });
      }
    });

    return recommendations;
  }

  saveReport(report) {
    try {
      const outputDir = path.dirname(this.options.outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      fs.writeFileSync(
        this.options.outputPath,
        JSON.stringify(report, null, 2),
        'utf8'
      );
      
      this.log('info', `Performance report saved to ${this.options.outputPath}`);
    } catch (error) {
      this.log('error', 'Failed to save performance report:', error.message);
    }
  }

  logResults(validation) {
    if (validation.passed) {
      this.log('info', `✅ Performance budgets passed (Score: ${validation.score}/100)`);
    } else {
      this.log('warn', `⚠️ Performance budget violations (Score: ${validation.score}/100):`);
      validation.violations.forEach(violation => {
        this.log('warn', `  - ${violation}`);
      });
    }
  }

  getAssetType(filename) {
    const ext = path.extname(filename).toLowerCase();
    
    if (['.js', '.mjs', '.ts', '.tsx'].includes(ext)) return 'javascript';
    if (['.css', '.scss', '.sass', '.less'].includes(ext)) return 'stylesheet';
    if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif'].includes(ext)) return 'image';
    if (['.woff', '.woff2', '.ttf', '.eot'].includes(ext)) return 'font';
    if (['.json'].includes(ext)) return 'data';
    
    return 'other';
  }

  groupAssetsByType(assets) {
    const grouped = {};
    
    assets.forEach(asset => {
      const type = asset.type;
      if (!grouped[type]) {
        grouped[type] = {
          count: 0,
          totalSize: 0,
          assets: []
        };
      }
      
      grouped[type].count++;
      grouped[type].totalSize += asset.size;
      grouped[type].assets.push(asset);
    });
    
    return grouped;
  }

  formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  }

  log(level, ...args) {
    const levels = { error: 0, warn: 1, info: 2, debug: 3 };
    const configLevel = levels[this.options.logLevel] || 1;
    const messageLevel = levels[level] || 1;
    
    if (messageLevel <= configLevel) {
      const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'info' ? 'ℹ️' : '🐛';
      console.log(`${prefix} [Performance]`, ...args);
    }
  }
}

module.exports = WebpackPerformancePlugin;