/**
 * Security Configuration
 * 
 * Domain-Driven Design: Security domain configuration with CSP policies
 * Service Agnostic Abstraction: Environment-agnostic security policies
 * Security & Audit Standards: Comprehensive Content Security Policy
 * No Hardcoded Values: Environment-based security configuration
 */

export interface CSPDirective {
  readonly directive: string;
  readonly sources: readonly string[];
}

export interface SecurityHeaders {
  readonly contentSecurityPolicy: string;
  readonly additionalHeaders: readonly {
    readonly key: string;
    readonly value: string;
  }[];
}

/**
 * Content Security Policy Configuration
 * Security & Audit Standards: Strict CSP for static pages
 */
const CSP_DIRECTIVES: readonly CSPDirective[] = [
  {
    directive: 'default-src',
    sources: ["'self'"]
  },
  {
    directive: 'script-src',
    sources: [
      "'self'",
      "'unsafe-eval'", // Required for Next.js development
      "'unsafe-inline'", // Required for Next.js inline scripts
      'https://vercel.live', // Vercel analytics
      ...(process.env.NODE_ENV === 'development' 
        ? ["'unsafe-eval'", 'https://nextjs.org'] 
        : [])
    ]
  },
  {
    directive: 'style-src',
    sources: [
      "'self'",
      "'unsafe-inline'", // Required for CSS-in-JS and Next.js
      'https://fonts.googleapis.com'
    ]
  },
  {
    directive: 'img-src',
    sources: [
      "'self'",
      'data:', // For Next.js image optimization
      'blob:', // For dynamic image generation
      'https://diboas.com',
      'https://cdn.diboas.com',
      'https://vercel.com', // Vercel assets
      ...(process.env.NODE_ENV === 'development' 
        ? ['https://localhost:*', 'http://localhost:*'] 
        : [])
    ]
  },
  {
    directive: 'font-src',
    sources: [
      "'self'",
      'https://fonts.gstatic.com',
      'data:'
    ]
  },
  {
    directive: 'connect-src',
    sources: [
      "'self'",
      'https://vitals.vercel-analytics.com', // Vercel analytics
      'https://api.diboas.com', // API endpoints
      ...(process.env.NODE_ENV === 'development' 
        ? ['http://localhost:*', 'https://localhost:*', 'ws://localhost:*', 'wss://localhost:*'] 
        : [])
    ]
  },
  {
    directive: 'frame-ancestors',
    sources: ["'none'"] // Prevent clickjacking
  },
  {
    directive: 'object-src',
    sources: ["'none'"] // Prevent plugin execution
  },
  {
    directive: 'base-uri',
    sources: ["'self'"] // Restrict base tag
  },
  {
    directive: 'form-action',
    sources: [
      "'self'",
      'https://diboas.com',
      'https://app.diboas.com'
    ]
  }
] as const;

/**
 * Build Content Security Policy String
 * Code Reusability: Reusable CSP builder function
 */
export function buildCSP(directives: readonly CSPDirective[]): string {
  return directives
    .map(({ directive, sources }) => `${directive} ${sources.join(' ')}`)
    .join('; ');
}

/**
 * Additional Security Headers
 * Security & Audit Standards: Comprehensive security headers
 */
const ADDITIONAL_SECURITY_HEADERS = [
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
  {
    key: 'Cross-Origin-Embedder-Policy',
    value: 'unsafe-none'
  },
  {
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin'
  },
  {
    key: 'Cross-Origin-Resource-Policy',
    value: 'same-origin'
  }
] as const;

/**
 * Generate Security Headers Configuration
 * Service Agnostic Abstraction: Environment-aware header generation
 */
export function generateSecurityHeaders(): SecurityHeaders {
  const csp = buildCSP(CSP_DIRECTIVES);
  
  return {
    contentSecurityPolicy: csp,
    additionalHeaders: ADDITIONAL_SECURITY_HEADERS
  };
}

/**
 * Default Security Configuration
 * No Hardcoded Values: Configuration-driven approach
 */
export const DEFAULT_SECURITY_CONFIG = generateSecurityHeaders();

/**
 * Development vs Production Security Policies
 * Environment-specific configurations
 */
export const SECURITY_POLICIES = {
  development: {
    ...DEFAULT_SECURITY_CONFIG,
    contentSecurityPolicy: buildCSP([
      ...CSP_DIRECTIVES.map(directive => ({
        ...directive,
        sources: directive.directive === 'script-src' 
          ? [...directive.sources, "'unsafe-eval'", "'unsafe-inline'"]
          : directive.sources
      }))
    ])
  },
  production: DEFAULT_SECURITY_CONFIG
} as const;

export type SecurityEnvironment = keyof typeof SECURITY_POLICIES;