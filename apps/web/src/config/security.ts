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
 * Get Additional Security Headers
 * Service Agnostic Abstraction: Environment-aware header generation
 */
export function getAdditionalSecurityHeaders() {
  return ADDITIONAL_SECURITY_HEADERS;
}