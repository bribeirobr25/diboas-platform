/**
 * Canonical crypto asset / chain color map
 * Single source of truth for chain/token colors across the platform
 */

/** Primary brand colors per crypto asset (used for icons, text accents) */
export const CRYPTO_COLORS: Record<string, string> = {
  BTC: '#F7931A',
  ETH: '#627EEA',
  SOL: '#9945FF',
  SUI: '#4DA2FF',
  TRX: '#FF0013',
  XAUT: '#D4AF37',
  USDC: '#2775CA',
  USDT: '#26A17B',
} as const;

export type CryptoSymbol = keyof typeof CRYPTO_COLORS;

/** Background colors per chain for icon containers (light tints) */
export const CHAIN_BG_COLORS: Record<string, string> = {
  SOL: '#f5f3ff',
  BTC: '#fff7ed',
  ETH: '#eff6ff',
  SUI: '#ecfeff',
  TRX: '#fff5f5',
} as const;

/** Text/accent colors per chain for fiat totals and highlights */
export const CHAIN_TEXT_COLORS: Record<string, string> = {
  SOL: '#9945FF',
  BTC: '#F7931A',
  ETH: '#627EEA',
  SUI: '#4DA2FF',
  TRX: '#FF0013',
} as const;
