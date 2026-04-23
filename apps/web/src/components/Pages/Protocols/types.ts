/**
 * Protocols Page - Types
 *
 * Type definitions for protocol data structures
 */

/**
 * Protocol data structure
 */
export interface Protocol {
  id: string;
  name: string;
  description: string;
  founded: string;
  tvl: string;
  blockchains: string;
  audits: string;
  regulatory: string;
  badge?: 'warning' | 'success';
  usedInStrategies?: string[];
  hasExceptionNote?: boolean;
  website: string;
  twitter: string;
  defiLlamaUrl?: string;
}

/**
 * Protocol category structure
 */
export interface ProtocolCategory {
  id: string;
  protocols: Protocol[];
}

/**
 * Protocol card labels
 */
export interface ProtocolLabels {
  founded: string;
  tvl: string;
  blockchains: string;
  audits: string;
  regulatory: string;
  showLess: string;
  showMore: string;
  websiteLink: string;
  twitterLink: string;
}

/**
 * Translated content for a single protocol card
 * Resolved from i18n at the grid level, passed to ProtocolCard
 */
export interface ProtocolI18nContent {
  name: string;
  description: string;
  founded: string;
  tvl: string;
  blockchains: string;
  audits: string;
  regulatory: string;
}
