/**
 * diBoaS Sandbox — Next.js config.
 *
 * MVP-0 posture (docs/sandbox-app/BUILD_ORDER.md Stage P):
 * - Private prototype: noindex everywhere via headers (the password gate is
 *   the access control; robots is defense in depth).
 * - Security headers baseline now; the full nonce-CSP middleware is a
 *   promotion-gate item (Stage 1) — tracked, not forgotten.
 * - Domain packages are consumed from their built dist (turbo orders builds).
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
