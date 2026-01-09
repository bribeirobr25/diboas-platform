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
  hasWarning?: boolean;
  hasSuccess?: boolean;
  website: string;
  twitter: string;
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
}
