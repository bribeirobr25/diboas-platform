const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  experimental: {
    // `optimizeCss` removed 2026-05-12 (Sentry errors 102736586 / 102736587).
    // It requires `critters` to be installed, which it isn't, and the feature
    // is a webpack-only post-processor — inert under Turbopack (same F1-audit
    // precedent that removed dead `splitChunks` config). Was throwing on the
    // dev `_error` fallback path when pages-router error rendering kicked in.
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
      '@diboas/i18n',
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

  // Redirects
  async redirects() {
    return [
      {
        source: '/favicon.ico',
        destination: '/favicon.avif',
        permanent: false,
      },
      // 2026-05-13: `/daily-market` renamed to `/market`. Locale-prefixed
      // redirect covers the path after middleware has already prefixed the
      // locale (the standard navigation path).
      {
        source: '/:locale(en|pt-BR|es|de)/daily-market',
        destination: '/:locale/market',
        permanent: true,
      },
      // Bare path (no locale prefix). Without this rule, `/daily-market`
      // would go through middleware first → 307 to `/en/daily-market` → then
      // the rule above → 301 to `/en/market`. That's a two-hop chain. The
      // direct rule avoids it for direct bookmarks/external links.
      {
        source: '/daily-market',
        destination: '/market',
        permanent: true,
      },
    ];
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
            value: `public, max-age=${maxAge}, immutable`,
          },
        ],
      },
      {
        source: '/assets/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: `public, max-age=${maxAge}`,
          },
        ],
      },
      {
        source: '/fonts/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: `public, max-age=${maxAge}, immutable`,
          },
        ],
      },
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
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
      // Asset optimization headers
      ...assetHeaders,
    ];
  },

  // Transpile workspace packages
  transpilePackages: ['@diboas/ui', '@diboas/i18n'],

  // F1 (audit/2026-05-08): the `webpack: (config) => {...}` function and its
  // ~190 lines of cacheGroup splitChunks config + WebpackPerformancePlugin
  // were dead code at build time — `next build` in Next.js 16 uses Turbopack
  // by default (see `package.json` scripts), so the webpack hook never ran.
  // Verified in the baseline measurement: zero `framework-*` chunks under
  // `.next/static/chunks` and no `performance-report.json`. Removed to
  // reduce surface area; if a future build needs to switch back to webpack,
  // restore from git history (see commit removing F1 dead config).
  //
  // Turbopack-specific tuning, when needed, goes in the `turbopack` key
  // below. https://nextjs.org/docs/app/api-reference/next-config-js/turbopack

  // Turbopack configuration for Next.js 16
  turbopack: {},

  // Remove powered by header
  poweredByHeader: false,
};

// Sentry configuration options
const sentryWebpackPluginOptions = {
  // Suppress source-map upload logs during build. If you need to diagnose a
  // Sentry build-time issue (release creation, source-map upload failures),
  // temporarily flip this to `false` to surface the plugin's verbose output
  // in the build log — that's how we caught the disabled-DSN-key incident
  // (2026-05-30) and the missing SENTRY_ORG/SENTRY_PROJECT env vars
  // (2026-05-31).
  silent: true,

  // Upload source maps for better error debugging
  // Only upload in production builds with SENTRY_AUTH_TOKEN set
  disableServerWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
  disableClientWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,

  // Hide source maps from browser devtools in production
  hideSourceMaps: process.env.NODE_ENV === 'production',

  // Widens the scope of the SDK to capture more errors
  widenClientFileUpload: true,

  // Routes browser requests through a tunnel to avoid ad-blockers.
  // Phase 5.1.b (audit/2026-05-09): moved from `/monitoring` to
  // `/api/monitoring`. The locale-prefix middleware redirects bare
  // unknown paths to `/<locale>/...`, so `/monitoring` was hitting
  // `/en/monitoring` (404). The middleware matcher already excludes
  // `/api/...`, so this path is reached directly without redirect.
  tunnelRoute: '/api/monitoring',

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
