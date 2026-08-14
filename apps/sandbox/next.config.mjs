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
  // Dev-only: allow the LAN-IP origin so the dev client (HMR socket, Server
  // Actions) bootstraps and hydrates when the page is opened over the network IP
  // instead of localhost — e.g. the Docker-hosted Playwright browser used for
  // visual + dev-log verification, which cannot reach `localhost`. No prod
  // effect. Env-driven (machine-specific): set DEV_ALLOWED_ORIGINS to a
  // comma-separated list of LAN IPs. Mirrors apps/web. Find yours via
  // `ifconfig en0 | grep "inet "`.
  allowedDevOrigins: (process.env.DEV_ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
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
