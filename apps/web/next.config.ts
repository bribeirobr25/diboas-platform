import type { NextConfig } from "next";

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Enable instrumentation for asset tracking
    instrumentationHook: true,
  },
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Track asset usage in development
      config.plugins.push({
        apply: (compiler: any) => {
          compiler.hooks.emit.tapAsync('AssetUsageTracker', (compilation: any, callback: any) => {
            const assets = Object.keys(compilation.assets);
            const usedAssets = assets.filter(asset => 
              asset.startsWith('static/') || asset.includes('assets/')
            );
            
            if (usedAssets.length > 0) {
              console.log('\n📦 Assets loaded on this page:');
              usedAssets.forEach(asset => console.log(`   - ${asset}`));
            }
            
            callback();
          });
        }
      });
    }
    
    return config;
  },
};

export default withBundleAnalyzer(nextConfig);
