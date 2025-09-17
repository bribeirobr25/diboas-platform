/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  experimental: {
    optimizeCss: true,
  },
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'diboas.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.diboas.com',
      },
    ],
  },
  
  // Security headers
  async headers() {
    return [
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
        ],
      },
    ];
  },
  
  // Transpile workspace packages
  transpilePackages: ['@diboas/ui', '@diboas/i18n'],
  
  // Webpack configuration for pnpm workspaces
  webpack: (config) => {
    // Handle pnpm's symlinked node_modules structure
    config.resolve.symlinks = true;
    return config;
  },
  
  // Remove powered by header
  poweredByHeader: false,
};

module.exports = nextConfig;