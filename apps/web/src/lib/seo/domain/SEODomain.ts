/**
 * SEO Domain Layer - Domain-Driven Design Implementation
 * 
 * Domain Services: SEO-specific business logic
 * Service Abstraction: Clean interfaces for SEO operations
 * Error Handling: Resilient SEO generation with fallbacks
 */

import { SupportedLocale } from '@diboas/i18n';

// Domain Entities
export interface SEOPage {
  readonly url: string;
  readonly locale: SupportedLocale;
  readonly lastModified: Date;
  readonly changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  readonly priority: number;
  readonly canonical?: string;
}

export interface SEOConfiguration {
  readonly domain: string;
  readonly defaultLocale: SupportedLocale;
  readonly supportedLocales: SupportedLocale[];
  readonly siteName: string;
  readonly siteDescription: string;
}

// Domain Services Interface
export interface SEODomainService {
  generateSitemap(): Promise<string>;
  generateRobotsTxt(): string;
  getCanonicalUrl(path: string, locale: SupportedLocale): string;
  generateOpenGraphImage(page: string): Promise<string>;
  validateSEOCompliance(url: string): Promise<SEOComplianceResult>;
}

// Value Objects
export interface SEOComplianceResult {
  readonly isCompliant: boolean;
  readonly issues: string[];
  readonly score: number;
  readonly recommendations: string[];
}

// Domain Events (Event-Driven Architecture)
export interface SEOEvent {
  readonly type: 'sitemap-generated' | 'robots-updated' | 'og-image-generated' | 'seo-validated';
  readonly timestamp: Date;
  readonly data: Record<string, unknown>;
}

// Domain Errors
export class SEODomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly recoverable: boolean = true
  ) {
    super(message);
    this.name = 'SEODomainError';
  }
}

export class SEOGenerationError extends SEODomainError {
  constructor(message: string, public readonly pageUrl: string) {
    super(message, 'SEO_GENERATION_FAILED', true);
  }
}

export class SEOValidationError extends SEODomainError {
  constructor(message: string, public readonly validationIssues: string[]) {
    super(message, 'SEO_VALIDATION_FAILED', false);
  }
}