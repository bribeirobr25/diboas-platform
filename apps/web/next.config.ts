import type { NextConfig } from "next";

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

export default withBundleAnalyzer(nextConfig);
