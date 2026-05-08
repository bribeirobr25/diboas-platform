const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      // Icon libraries for tree shaking
      'lucide-react',
      '@radix-ui/react-icons',
      
      // Utility libraries
      'date-fns',
      'lodash-es',
      'clsx',
      'class-variance-authority',
      'tailwind-merge',
      
      // Internationalization
      'react-intl',
      
      // React Aria (used by @diboas/ui)
      '@react-aria/button',
      '@react-aria/focus',
      '@react-aria/interactions',
      '@react-aria/utils',

      // Our workspace packages
      '@diboas/ui',
      '@diboas/i18n'
    ],
  },
  
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
    reactRemoveProperties: process.env.NODE_ENV === 'production' ? true : false,
  },
  
  
  // Enable compression
  compress: true,
  
  // `output: 'standalone'` removed 2026-05-08 (Phase 4 W6): Vercel
  // handles bundling for its own runtime; standalone is only needed for
  // self-hosted Docker deployments. Leaving it on caused `next start`
  // to print a warning every CI run ("does not work with output:
  // standalone configuration"), polluting the workflow logs.
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    qualities: [75, 80],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: process.env.NODE_ENV !== 'production',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'diboas.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.diboas.com',
      },
      {
        protocol: 'https',
        hostname: 'assets.diboas.com',
      },
    ],
  },
  
  // Redirects for favicon fallback
  async redirects() {
    return [
      {
        source: '/favicon.ico',
        destination: '/favicon.avif',
        permanent: false,
      },
    ]
  },

  // Security headers (CSP is handled per-request in middleware.ts with nonces)
  async headers() {
    const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development';

    // Asset optimization headers
    const maxAge = environment === 'production' ? 31536000 : 3600;
    const assetHeaders = [
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: `public, max-age=${maxAge}, immutable`
          }
        ]
      },
      {
        source: '/assets/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: `public, max-age=${maxAge}`
          }
        ]
      },
      {
        source: '/fonts/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: `public, max-age=${maxAge}, immutable`
          }
        ]
      }
    ];

    return [
      // Security headers for all routes (CSP excluded — set in middleware with nonce)
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
          },
        ],
      },
      // Asset optimization headers
      ...assetHeaders,
    ];
  },
  
  // Transpile workspace packages
  transpilePackages: ['@diboas/ui', '@diboas/i18n'],
  
  // Server external packages for optimization
  serverExternalPackages: [],
  
  // Webpack configuration with advanced optimization
  webpack: (config, { isServer, dev }) => {
    // Handle pnpm's symlinked node_modules structure
    config.resolve.symlinks = true;
    
    // Development optimizations
    if (dev) {
      // Ensure module format compatibility
      config.optimization.providedExports = false;
      config.optimization.usedExports = false;
      config.optimization.sideEffects = false;
      
      // Simplified chunk splitting for development
      config.optimization.splitChunks = false;
      
      // Ensure proper module resolution
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    
    // Add performance monitoring plugin (only in production builds)
    if (!isServer && !dev && process.env.NODE_ENV === 'production') {
      try {
        const WebpackPerformancePlugin = require('./src/lib/performance/webpack-performance-plugin');
        
        config.plugins.push(new WebpackPerformancePlugin({
          outputPath: '.next/performance-report.json',
          // Budgets recalibrated 2026-05-07 from measured production baseline.
          // The plugin sums *webpack entrypoint* chunk sizes (framework + vendor +
          // locale + page chunks for every route). This is a different metric
          // from Next.js's user-facing "First Load JS" (per-route incremental
          // cost after HTTP/2 parallel delivery + shared-chunk caching). The
          // ceiling here is "no worse than 2026-05-07 baseline" — meant to
          // catch regressions (a new 500 KB library, accidental de-optimisation),
          // not to model real-world user payload. A First-Load-JS-aware budget
          // is tracked as a Phase 2 improvement in PENDING_ALL.md.
          budgets: {
            maxAssetSize: 300 * 1024, // 300KB per individual asset (current peak ~194KB)
            maxEntrypointSize: 3100 * 1024, // 3.1MB (peak 2.69MB + ~15% headroom)
            maxTotalSize: 8 * 1024 * 1024, // 8MB (current 6.71MB + ~19% headroom)
            maxAssets: 300 // 4 locales × ~60 namespaces + framework chunks (current 278)
          },
          logLevel: 'warn',
          failOnBudgetExceeded: true // M3 audit fix 2026-05-07: catch regressions in CI
        }));
      } catch (error) {
        console.warn('Failed to load performance plugin:', error.message);
      }
    }
    
    // Advanced bundle optimization for production
    if (!dev && !isServer) {
      // Native webpack `config.performance` block intentionally NOT set here.
      // Budget enforcement lives in WebpackPerformancePlugin above (single
      // source of truth). The native block was removed 2026-05-07 to avoid
      // two parallel budget systems with different thresholds emitting
      // contradictory warnings — see audit/A.0.1 + CTO feedback.

      // Phase 4 W1 (audit/2026-05-08): every cacheGroup now scopes
      // `type: 'javascript/auto'`. Without this filter, webpack registered
      // the Inter+Geist font CSS file under `manifest.rootMainFiles`,
      // which Next.js's HTML renderer iterates as `<script>` tags — the
      // browser then refused to execute the CSS as JS ("MIME type
      // 'text/css' is not executable"). Restricting cacheGroups to JS
      // modules keeps CSS in Next.js's dedicated style pipeline.
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 200000, // 200KB max chunks
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        enforceSizeThreshold: 50000,
        cacheGroups: {
          // Framework libraries (React, Next.js)
          framework: {
            test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
            name: 'framework',
            type: 'javascript/auto',
            priority: 40,
            enforce: true,
            reuseExistingChunk: true,
            chunks: 'all',
          },

          // UI Component libraries
          uiLibs: {
            test: /[\\/]node_modules[\\/](@radix-ui|lucide-react|class-variance-authority|clsx|tailwind-merge)[\\/]/,
            name: 'ui-libs',
            type: 'javascript/auto',
            priority: 35,
            reuseExistingChunk: true,
            chunks: 'all',
          },

          // Internationalization libraries
          i18n: {
            test: /[\\/]node_modules[\\/](@formatjs|react-intl)[\\/]/,
            name: 'i18n',
            type: 'javascript/auto',
            priority: 32,
            reuseExistingChunk: true,
            chunks: 'all',
          },

          // Section Components (our heaviest code)
          sections: {
            test: /[\\/]src[\\/]components[\\/]Sections[\\/]/,
            name: 'sections',
            type: 'javascript/auto',
            priority: 30,
            reuseExistingChunk: true,
            chunks: 'all',
            minSize: 30000,
          },

          // Design System & Config
          designSystem: {
            test: /[\\/]src[\\/](config|styles|lib)[\\/]/,
            name: 'design-system',
            type: 'javascript/auto',
            priority: 25,
            reuseExistingChunk: true,
            chunks: 'all',
            minSize: 20000,
          },

          // Shared Components
          components: {
            test: /[\\/]src[\\/]components[\\/](?!Sections)/,
            name: 'components',
            type: 'javascript/auto',
            priority: 20,
            reuseExistingChunk: true,
            chunks: 'all',
            minSize: 15000,
          },

          // Remaining vendor libraries
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            type: 'javascript/auto',
            priority: 10,
            reuseExistingChunk: true,
            chunks: 'all',
            maxSize: 150000, // Smaller vendor chunks
          },

          // Common code between pages
          common: {
            name: 'common',
            type: 'javascript/auto',
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
            chunks: 'all',
            minSize: 10000,
          },
          
          // Default
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
            chunks: 'all',
            minSize: 10000,
          },
        },
      };
      
      // Tree shaking optimizations
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
      
      // Optimize module concatenation
      config.optimization.concatenateModules = true;
      
      // Enable aggressive dead code elimination
      config.optimization.innerGraph = true;
      
      // Optimize imports resolution
      config.resolve.alias = {
        ...config.resolve.alias,
        // Replace heavy libraries with lighter alternatives if needed
        'react-intl': 'react-intl/lib',
      };
    }
    
    return config;
  },

  // Turbopack configuration for Next.js 16
  turbopack: {},

  // Remove powered by header
  poweredByHeader: false,
};

// Sentry configuration options
const sentryWebpackPluginOptions = {
  // Suppress source map upload logs during build
  silent: true,

  // Upload source maps for better error debugging
  // Only upload in production builds with SENTRY_AUTH_TOKEN set
  disableServerWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
  disableClientWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,

  // Hide source maps from browser devtools in production
  hideSourceMaps: process.env.NODE_ENV === 'production',

  // Widens the scope of the SDK to capture more errors
  widenClientFileUpload: true,

  // Routes browser requests through a tunnel to avoid ad-blockers
  tunnelRoute: '/monitoring',

  // Webpack-scoped options (migrated from deprecated top-level keys)
  webpack: {
    treeshake: {
      removeDebugLogging: process.env.NODE_ENV === 'production',
    },
    automaticVercelMonitors: true,
  },
};

// Export with Sentry wrapper if DSN is configured, otherwise export plain config
module.exports = process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig;