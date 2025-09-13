/**
 * Content Management Types
 * 
 * Single Source of Truth for all marketing content structure
 * Type safety ensures consistency across all pages
 */

import { type SupportedLocale } from '@diboas/i18n';

// SEO & Performance: Metadata structure for all pages
export interface PageMetadata {
  title: string;
  description: string;
  keywords?: string[];
  openGraph?: {
    title?: string;
    description?: string;
    image?: string;
    type?: 'website' | 'article';
  };
  twitter?: {
    title?: string;
    description?: string;
    image?: string;
    card?: 'summary' | 'summary_large_image';
  };
  canonical?: string;
  alternates?: Record<SupportedLocale, string>;
  jsonLd?: any; // Structured data
}

// DRY Principle: Reusable content structures
export interface CTAButton {
  text: string;
  href: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  trackingEvent?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export interface MascotDisplay {
  type: 'acqua' | 'mystic' | 'coral';
  variant?: 'basic' | 'simple' | 'cute' | 'hello' | 'flying' | 'flying2' | 'learn' | 'full';
  animation?: 'bounce' | 'float' | 'none';
}

// Section Content Interfaces
export interface HeroContent {
  title: string;
  subtitle?: string;
  description?: string;
  cta?: {
    primary?: CTAButton;
    secondary?: CTAButton;
  };
  mascot?: MascotDisplay;
  backgroundImage?: string;
  trustIndicators?: {
    users?: string;
    rating?: string;
    security?: string;
  };
}

export interface FeatureItem {
  id: string;
  icon?: string;
  title: string;
  description: string;
  image?: string;
  cta?: CTAButton;
}

export interface FeaturesContent {
  title: string;
  subtitle?: string;
  items: FeatureItem[];
  layout?: 'grid' | 'carousel' | 'list';
  columns?: 2 | 3 | 4;
}

export interface TrustFeature {
  title: string;
  description: string;
  icon?: string;
}

export interface TrustStat {
  number: string;
  label: string;
  trend?: 'up' | 'down' | 'stable';
}

export interface TrustContent {
  title: string;
  subtitle?: string;
  features: TrustFeature[];
  stats?: TrustStat[];
  certifications?: {
    title: string;
    description: string;
    badges: string[];
  };
  backgroundImage?: string;
}

export interface TestimonialContent {
  quote: string;
  author: {
    name: string;
    title?: string;
    company?: string;
    avatar?: string;
  };
  rating?: number;
}

export interface TestimonialsContent {
  title: string;
  subtitle?: string;
  testimonials: TestimonialContent[];
  layout?: 'carousel' | 'grid';
}

export interface PricingTier {
  id: string;
  name: string;
  price: {
    amount: number;
    currency: string;
    period?: string;
  };
  description?: string;
  features: string[];
  cta: CTAButton;
  popular?: boolean;
  comingSoon?: boolean;
}

export interface PricingContent {
  title: string;
  subtitle?: string;
  tiers: PricingTier[];
  faq?: {
    question: string;
    answer: string;
  }[];
}

export interface ComparisonItem {
  feature: string;
  diboas: boolean | string;
  competitor1?: boolean | string;
  competitor2?: boolean | string;
  competitor3?: boolean | string;
}

export interface ComparisonContent {
  title: string;
  subtitle?: string;
  competitors: {
    diboas: { name: string; logo?: string };
    competitor1?: { name: string; logo?: string };
    competitor2?: { name: string; logo?: string };
    competitor3?: { name: string; logo?: string };
  };
  items: ComparisonItem[];
  cta?: CTAButton;
}

export interface CTAContent {
  title: string;
  subtitle?: string;
  description?: string;
  cta: CTAButton;
  backgroundStyle?: 'gradient' | 'solid' | 'image';
  mascot?: MascotDisplay;
}

// Page Section Union Type
export interface PageSection {
  id: string;
  type: 'hero' | 'features' | 'trust' | 'testimonials' | 'pricing' | 'comparison' | 'cta';
  props?: {
    variant?: string;
    background?: string;
    className?: string;
    [key: string]: any;
  };
  content: 
    | HeroContent 
    | FeaturesContent 
    | TrustContent 
    | TestimonialsContent 
    | PricingContent 
    | ComparisonContent 
    | CTAContent;
  // Performance: Lazy load below-fold sections
  lazyLoad?: boolean;
  // Analytics: Track section visibility
  trackVisibility?: boolean;
}

// Complete Page Configuration
export interface PageConfig {
  // SEO: Page metadata
  metadata: PageMetadata;
  
  // Content: Page sections
  sections: PageSection[];
  
  // Analytics: Page-specific tracking
  analytics?: {
    category: string;
    trackPageView?: boolean;
    customEvents?: Record<string, any>;
  };
  
  // Performance: Page optimization settings  
  optimization?: {
    preloadAssets?: string[];
    criticalCSS?: string;
    lazyLoadImages?: boolean;
  };
  
  // Accessibility: Page-specific a11y settings
  accessibility?: {
    skipLinks?: boolean;
    pageHeading?: string;
    landmarks?: boolean;
  };
}

// Domain-specific page configurations
export type MarketingPageKey = 
  | 'home'
  | 'banking'
  | 'investing' 
  | 'defi'
  | 'credit'
  | 'about'
  | 'careers'
  | 'contact'
  | 'privacy'
  | 'terms'
  | 'security';

export type LearnPageKey =
  | 'learn'
  | 'financial-basics'
  | 'money-management'
  | 'investment-guide'
  | 'cryptocurrency-guide'
  | 'defi-explained'
  | 'special-content';

export type BusinessPageKey =
  | 'business'
  | 'business-account'
  | 'business-banking'
  | 'payments'
  | 'treasury'
  | 'yield-strategies'
  | 'credit-solutions';

export type RewardsPageKey =
  | 'rewards'
  | 'ai-guides'
  | 'referral-program'
  | 'points-system'
  | 'badges-leaderboard'
  | 'campaigns'
  | 'token-airdrop';

export type AllPageKeys = MarketingPageKey | LearnPageKey | BusinessPageKey | RewardsPageKey;