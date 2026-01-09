/**
 * SEO Type Definitions
 * Domain-Driven Design: Clear domain models for SEO concerns
 * Service Agnostic: Abstract interfaces for metadata generation
 */

import { Metadata } from 'next';

// Value Objects (DDD Pattern)
export interface SEOMetadata {
  title: string;
  description: string;
  keywords?: string[];
  author?: string;
  robots?: string;
  canonicalUrl?: string;
}

export interface OpenGraphMetadata {
  title?: string;
  description?: string;
  type?: 'website' | 'article';
  image?: string;
  url?: string;
  siteName?: string;
  locale?: string;
  alternateLocales?: string[];
}

export interface TwitterMetadata {
  card?: 'summary' | 'summary_large_image' | 'app' | 'player';
  site?: string;
  creator?: string;
  title?: string;
  description?: string;
  image?: string;
}

// Structured Data Types
export interface Organization {
  '@type': 'Organization';
  name: string;
  url: string;
  logo?: string;
  sameAs?: string[];
  contactPoint?: ContactPoint;
}

export interface ContactPoint {
  '@type': 'ContactPoint';
  telephone?: string;
  contactType: string;
  availableLanguage?: string[];
  areaServed?: string[];
}

export interface BreadcrumbItem {
  '@type': 'ListItem';
  position: number;
  name: string;
  item?: string;
}

export interface BreadcrumbList {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: BreadcrumbItem[];
}

export interface WebPage {
  '@context': 'https://schema.org';
  '@type': 'WebPage';
  name: string;
  description: string;
  url: string;
  breadcrumb?: BreadcrumbList;
  publisher?: Organization;
  dateModified?: string;
  datePublished?: string;
}

// Aggregate Root (DDD Pattern)
export interface PageSEOConfig {
  metadata: SEOMetadata;
  openGraph?: OpenGraphMetadata;
  twitter?: TwitterMetadata;
  structuredData?: {
    organization?: Organization;
    webpage?: WebPage;
    breadcrumbs?: BreadcrumbList;
    categorySpecific?: Record<string, unknown>;
    custom?: Record<string, unknown>;
  };
  alternateLanguages?: {
    lang: string;
    url: string;
  }[];
}

// Service Interface (Service Abstraction Pattern)
export interface SEOService {
  generateMetadata(config: PageSEOConfig, locale?: string): Metadata;
  generateStructuredData(config: PageSEOConfig): string;
  generateCanonicalUrl(path: string, locale?: string): string;
  generateAlternateUrls(path: string): { lang: string; url: string }[];
}