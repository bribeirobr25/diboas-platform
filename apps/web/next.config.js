/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  experimental: {
    optimizeCss: true,
  },
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
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
  
  // Security headers with CSP and asset optimization
  async headers() {
    const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development';
    
    // CSP configuration inline to avoid module loading issues
    const csp = environment === 'production' 
      ? "default-src 'self'; script-src 'self' 'unsafe-inline' https://vercel.live; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https://diboas.com https://cdn.diboas.com; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' https://vitals.vercel-analytics.com https://api.diboas.com; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self' https://diboas.com https://app.diboas.com"
      : "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://nextjs.org; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https://diboas.com https://cdn.diboas.com http://localhost:* https://localhost:*; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' https://vitals.vercel-analytics.com https://api.diboas.com http://localhost:* https://localhost:* ws://localhost:* wss://localhost:*; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self' https://diboas.com https://app.diboas.com";
    
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
      // Security headers for all routes
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: csp,
          },
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
  
  // Webpack configuration for pnpm workspaces and performance monitoring
  webpack: (config, { isServer, dev }) => {
    // Handle pnpm's symlinked node_modules structure
    config.resolve.symlinks = true;
    
    // Add performance monitoring plugin (only in production)
    if (!isServer && !dev && process.env.NODE_ENV === 'production') {
      const WebpackPerformancePlugin = require('./src/lib/performance/webpack-performance-plugin');
      
      config.plugins.push(new WebpackPerformancePlugin({
        outputPath: '.next/performance-report.json',
        budgets: {
          maxAssetSize: 500 * 1024, // 500KB
          maxEntrypointSize: 1024 * 1024, // 1MB
          maxTotalSize: 5 * 1024 * 1024, // 5MB
          maxAssets: 50
        },
        logLevel: 'warn',
        failOnBudgetExceeded: process.env.CI === 'true'
      }));
    }
    
    // Bundle analyzer for detailed analysis
    if (process.env.ANALYZE === 'true') {
      const BundleAnalyzerPlugin = require('@next/bundle-analyzer')({
        enabled: true,
        openAnalyzer: false
      });
      
      config.plugins.push(BundleAnalyzerPlugin);
    }
    
    return config;
  },
  
  // Remove powered by header
  poweredByHeader: false,
};

module.exports = nextConfig;