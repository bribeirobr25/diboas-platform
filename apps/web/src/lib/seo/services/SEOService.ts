/**
 * SEO Service Implementation
 * 
 * Service Agnostic Abstraction: Clean service layer
 * Error Handling & Recovery: Resilient SEO generation
 * Monitoring & Observability: Event tracking and logging
 * Security Standards: Safe URL generation and validation
 */

import { SupportedLocale } from '@diboas/i18n';
import { BRAND_CONFIG } from '@/config/brand';
import { ENV_CONFIG } from '@/config/environment';
import { 
  SEODomainService, 
  SEOPage, 
  SEOConfiguration, 
  SEOComplianceResult,
  SEOEvent,
  SEOGenerationError,
  SEOValidationError
} from '../domain/SEODomain';

// Configuration Management - Centralized SEO config
const SEO_CONFIG: SEOConfiguration = {
  domain: process.env.NEXT_PUBLIC_SITE_DOMAIN || 'diboas.com',
  defaultLocale: 'en',
  supportedLocales: ['en', 'pt-BR', 'es', 'de'],
  siteName: BRAND_CONFIG.FULL_NAME,
  siteDescription: BRAND_CONFIG.DESCRIPTION,
};

// Static pages registry - DRY Principle
const STATIC_PAGES = [
  // Main pages
  { path: '/', priority: 1.0, changeFreq: 'daily' as const },
  { path: '/about', priority: 0.8, changeFreq: 'monthly' as const },
  { path: '/contact', priority: 0.7, changeFreq: 'monthly' as const },
  
  // Banking section
  { path: '/banking-services', priority: 0.9, changeFreq: 'weekly' as const },
  { path: '/account', priority: 0.8, changeFreq: 'weekly' as const },
  { path: '/credit', priority: 0.8, changeFreq: 'weekly' as const },
  
  // Investment section
  { path: '/investing', priority: 0.9, changeFreq: 'weekly' as const },
  { path: '/cryptocurrency', priority: 0.8, changeFreq: 'daily' as const },
  { path: '/defi-strategies', priority: 0.8, changeFreq: 'daily' as const },
  
  // Learning section
  { path: '/learn/financial-basics', priority: 0.7, changeFreq: 'monthly' as const },
  { path: '/learn/investment-guide', priority: 0.7, changeFreq: 'monthly' as const },
  { path: '/learn/cryptocurrency-guide', priority: 0.7, changeFreq: 'weekly' as const },
  { path: '/learn/defi-explained', priority: 0.7, changeFreq: 'weekly' as const },
  { path: '/learn/money-management', priority: 0.7, changeFreq: 'monthly' as const },
  { path: '/learn/benefits', priority: 0.6, changeFreq: 'monthly' as const },
  
  // Business section
  { path: '/business/account', priority: 0.8, changeFreq: 'weekly' as const },
  { path: '/business/banking', priority: 0.8, changeFreq: 'weekly' as const },
  { path: '/business/credit-solutions', priority: 0.8, changeFreq: 'weekly' as const },
  { path: '/business/payments', priority: 0.8, changeFreq: 'weekly' as const },
  { path: '/business/treasury', priority: 0.7, changeFreq: 'weekly' as const },
  { path: '/business/yield-strategies', priority: 0.7, changeFreq: 'weekly' as const },
  { path: '/business/benefits', priority: 0.6, changeFreq: 'monthly' as const },
  
  // Rewards section
  { path: '/rewards/referral-program', priority: 0.7, changeFreq: 'weekly' as const },
  { path: '/rewards/points-system', priority: 0.7, changeFreq: 'weekly' as const },
  { path: '/rewards/campaigns', priority: 0.6, changeFreq: 'weekly' as const },
  { path: '/rewards/badges-leaderboard', priority: 0.5, changeFreq: 'daily' as const },
  { path: '/rewards/token-airdrop', priority: 0.6, changeFreq: 'weekly' as const },
  { path: '/rewards/ai-guides', priority: 0.5, changeFreq: 'monthly' as const },
  { path: '/rewards/benefits', priority: 0.5, changeFreq: 'monthly' as const },
  
  // Security section
  { path: '/security/safety-guide', priority: 0.7, changeFreq: 'monthly' as const },
  { path: '/security/audit-reports', priority: 0.6, changeFreq: 'monthly' as const },
  { path: '/security/benefits', priority: 0.5, changeFreq: 'monthly' as const },
  
  // Other pages
  { path: '/benefits', priority: 0.6, changeFreq: 'monthly' as const },
  { path: '/careers', priority: 0.6, changeFreq: 'weekly' as const },
  { path: '/investors', priority: 0.6, changeFreq: 'monthly' as const },
  { path: '/help/faq', priority: 0.5, changeFreq: 'monthly' as const },
  { path: '/legal/terms', priority: 0.4, changeFreq: 'yearly' as const },
] as const;

export class SEOServiceImpl implements SEODomainService {
  private readonly config: SEOConfiguration;
  private readonly eventBus: ((event: SEOEvent) => void)[];

  constructor(config: SEOConfiguration = SEO_CONFIG) {
    this.config = config;
    this.eventBus = [];
  }

  // Event-Driven Architecture: Subscribe to SEO events
  public onEvent(handler: (event: SEOEvent) => void): void {
    this.eventBus.push(handler);
  }

  // Emit domain events
  private emitEvent(event: SEOEvent): void {
    this.eventBus.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        // Error Handling: Don't let event handler failures break SEO generation
        console.error('SEO event handler failed:', error);
      }
    });
  }

  public async generateSitemap(): Promise<string> {
    try {
      const pages = this.generateAllPages();
      const sitemap = this.buildSitemapXML(pages);
      
      this.emitEvent({
        type: 'sitemap-generated',
        timestamp: new Date(),
        data: { pageCount: pages.length, domain: this.config.domain }
      });

      return sitemap;
    } catch (error) {
      throw new SEOGenerationError(
        `Failed to generate sitemap: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'sitemap.xml'
      );
    }
  }

  public generateRobotsTxt(): string {
    try {
      const domain = this.config.domain;
      const sitemapUrl = `https://${domain}/sitemap.xml`;
      
      const robots = [
        'User-agent: *',
        'Allow: /',
        '',
        '# Disallow admin and private areas',
        'Disallow: /admin/',
        'Disallow: /api/',
        'Disallow: /_next/',
        '',
        `Sitemap: ${sitemapUrl}`,
        '',
        `# Generated for ${domain} on ${new Date().toISOString()}`
      ].join('\\n');

      this.emitEvent({
        type: 'robots-updated',
        timestamp: new Date(),
        data: { domain, sitemapUrl }
      });

      return robots;
    } catch (error) {
      throw new SEOGenerationError(
        `Failed to generate robots.txt: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'robots.txt'
      );
    }
  }

  public getCanonicalUrl(path: string, locale: SupportedLocale): string {
    try {
      // Security: Sanitize path to prevent injection
      const sanitizedPath = this.sanitizePath(path);
      const localePrefix = locale === this.config.defaultLocale ? '' : `/${locale}`;
      return `https://${this.config.domain}${localePrefix}${sanitizedPath}`;
    } catch (error) {
      // Error Recovery: Fallback to home page
      console.warn(`Failed to generate canonical URL for ${path}, falling back to home`);
      return `https://${this.config.domain}`;
    }
  }

  public async generateOpenGraphImage(page: string): Promise<string> {
    try {
      // For now, return a default OG image path
      // TODO: Implement dynamic OG image generation
      const ogImagePath = `/api/og/${encodeURIComponent(page)}`;
      
      this.emitEvent({
        type: 'og-image-generated',
        timestamp: new Date(),
        data: { page, imagePath: ogImagePath }
      });

      return ogImagePath;
    } catch (error) {
      throw new SEOGenerationError(
        `Failed to generate OG image for page: ${page}`,
        page
      );
    }
  }

  public async validateSEOCompliance(url: string): Promise<SEOComplianceResult> {
    try {
      const issues: string[] = [];
      const recommendations: string[] = [];
      
      // Basic URL validation
      if (!url.startsWith('https://')) {
        issues.push('URL should use HTTPS');
        recommendations.push('Update URL to use HTTPS protocol');
      }

      if (!url.includes(this.config.domain)) {
        issues.push('URL domain mismatch');
        recommendations.push(`Ensure URL belongs to ${this.config.domain}`);
      }

      // Calculate compliance score
      const score = Math.max(0, 100 - (issues.length * 20));
      
      const result: SEOComplianceResult = {
        isCompliant: issues.length === 0,
        issues,
        score,
        recommendations
      };

      this.emitEvent({
        type: 'seo-validated',
        timestamp: new Date(),
        data: { url, score, isCompliant: result.isCompliant }
      });

      return result;
    } catch (error) {
      throw new SEOValidationError(
        `SEO validation failed for URL: ${url}`,
        ['Validation process encountered an error']
      );
    }
  }

  // Private helper methods
  private generateAllPages(): SEOPage[] {
    const pages: SEOPage[] = [];
    const now = new Date();

    // Generate pages for all locales
    for (const locale of this.config.supportedLocales) {
      for (const staticPage of STATIC_PAGES) {
        pages.push({
          url: this.getCanonicalUrl(staticPage.path, locale),
          locale,
          lastModified: now,
          changeFrequency: staticPage.changeFreq,
          priority: staticPage.priority,
          canonical: this.getCanonicalUrl(staticPage.path, this.config.defaultLocale)
        });
      }
    }

    return pages;
  }

  private buildSitemapXML(pages: SEOPage[]): string {
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
    const urlsetOpen = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">';
    
    const urls = pages.map(page => {
      const alternates = this.config.supportedLocales
        .map(locale => {
          const altUrl = this.getCanonicalUrl(this.extractPath(page.url), locale);
          return `    <xhtml:link rel="alternate" hreflang="${locale}" href="${altUrl}" />`;
        })
        .join('\\n');

      return [
        '  <url>',
        `    <loc>${page.url}</loc>`,
        `    <lastmod>${page.lastModified.toISOString().split('T')[0]}</lastmod>`,
        `    <changefreq>${page.changeFrequency}</changefreq>`,
        `    <priority>${page.priority}</priority>`,
        alternates,
        '  </url>'
      ].join('\\n');
    }).join('\\n');

    return [xmlHeader, urlsetOpen, urls, '</urlset>'].join('\\n');
  }

  private sanitizePath(path: string): string {
    // Security: Remove dangerous characters and normalize path
    return path
      .replace(/[<>:"\\|?*]/g, '') // Remove dangerous characters
      .replace(/\\/\\/+/g, '/') // Replace multiple slashes with single
      .replace(/\\/+$/, '') // Remove trailing slash
      || '/'; // Default to home if empty
  }

  private extractPath(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname;
    } catch {
      return '/';
    }
  }
}

// Service Factory - DRY Principle & Service Abstraction
export const createSEOService = (config?: SEOConfiguration): SEODomainService => {
  return new SEOServiceImpl(config);
};

// Default service instance
export const seoService = createSEOService();