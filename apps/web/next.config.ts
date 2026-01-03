import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    optimizeCss: true,
  },
  // Exclude Storybook files from production builds
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  webpack: (config, { isServer, dev }) => {
    // Exclude .stories files from production builds
    if (!isServer) {
      config.module.rules.push({
        test: /\.stories\.(js|jsx|ts|tsx)$/,
        loader: 'ignore-loader'
      });
    }

    // Optimize chunk loading and preload strategy
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          // Create separate chunk for dynamic imports
          dynamicImports: {
            test: /[\\/]variants[\\/]/,
            name: 'variants',
            chunks: 'async',
            priority: 10,
            reuseExistingChunk: true,
          },
        },
      };
    }

    return config;
  },
};

// Wrap with Sentry for source maps and error tracking
const sentryWebpackPluginOptions = {
  // Suppresses source map uploading logs during build
  silent: true,
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Only upload source maps in production
  disableServerWebpackPlugin: process.env.NODE_ENV !== 'production',
  disableClientWebpackPlugin: process.env.NODE_ENV !== 'production',
};

// Apply configs: bundle analyzer -> sentry
const configWithPlugins = withBundleAnalyzer(nextConfig);

export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(configWithPlugins, sentryWebpackPluginOptions)
  : configWithPlugins;
