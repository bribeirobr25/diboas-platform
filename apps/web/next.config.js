/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  experimental: {
    optimizeCss: true,
  },
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    domains: ['diboas.com', 'cdn.diboas.com'],
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
  
  // Transpile any packages if needed
  transpilePackages: [],
  
  // Remove powered by header
  poweredByHeader: false,
};

module.exports = nextConfig;