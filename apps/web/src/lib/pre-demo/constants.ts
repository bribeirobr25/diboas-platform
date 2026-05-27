/**
 * PreDemo Domain Constants
 *
 * Asset prices, chain configs, recipients, fee rates, wallet addresses
 * All values match the reference demo exactly
 */

import type { Asset, AssetCategory, ChainId, ChainConfig, Recipient } from './types';

/** Asset prices (snapshot) */
export const ASSET_PRICES: Record<string, number> = {
  BTC: 97250.0,
  XAUT: 2945.0,
  ETH: 2650.0,
  SOL: 195.4,
  SUI: 3.85,
  TRX: 0.27,
} as const;

/** Chain configurations */
export const CHAIN_CONFIG: Record<ChainId, ChainConfig> = {
  SOL: { name: 'Solana', fullName: 'Solana Wallet', color: '#9945FF', tokens: ['USDC', 'SOL'] },
  BTC: { name: 'Bitcoin', fullName: 'Bitcoin Wallet', color: '#F7931A', tokens: ['BTC'] },
  ETH: {
    name: 'Ethereum',
    fullName: 'Ethereum Wallet',
    color: '#627EEA',
    tokens: ['XAUT', 'ETH'],
    l2Chains: {
      ARB: {
        name: 'Arbitrum',
        color: '#28A0F0',
        address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
        token: 'ETH',
      },
      BASE: {
        name: 'Base',
        color: '#0052FF',
        address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
        token: 'ETH',
      },
    },
  },
  SUI: { name: 'SUI', fullName: 'SUI Wallet', color: '#4DA2FF', tokens: ['SUI'], comingSoon: true },
  TRX: {
    name: 'TRON',
    fullName: 'TRON Wallet',
    color: '#FF0013',
    tokens: ['TRX'],
    comingSoon: true,
  },
} as const;

/** Wallet addresses (demo) */
export const WALLET_ADDRESSES: Record<ChainId, string> = {
  SOL: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  BTC: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
  ETH: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
  SUI: '0x2d78c927cd5de66d29e5e0a0f61f8e3f2b2e8c7a',
  TRX: 'TJYyFqNEJLJvN6KxQo3MBFfLjGZCBAPZBf',
} as const;

/** Recipient options for send */
export const RECIPIENT_OPTIONS: Recipient[] = [
  { handle: '@Adelaide.Rib', name: 'Adelaide Rib' },
  { handle: '@Satoshi.Nakamoto', name: 'Satoshi Nakamoto' },
  { handle: '@Della.RK', name: 'Della RK' },
] as const;

/** Asset categories with pricing */
export const ASSET_CATEGORIES: Record<AssetCategory, Asset[]> = {
  ETFs: [
    { symbol: 'SPYx', name: 'S&P 500 ETF', price: 592.45 },
    { symbol: 'QQQx', name: 'Nasdaq 100 ETF', price: 518.23 },
    { symbol: 'IWMon', name: 'Russell 2000 ETF', price: 224.67 },
  ],
  Stocks: [
    { symbol: 'TSLAx', name: 'Tesla', price: 248.5 },
    { symbol: 'GOOGLx', name: 'Alphabet', price: 175.3 },
    { symbol: 'NVDAx', name: 'NVIDIA', price: 137.85 },
  ],
  Crypto: [
    { symbol: 'BTC', name: 'Bitcoin', price: 97250.0 },
    { symbol: 'ETH', name: 'Ethereum', price: 2650.0 },
    { symbol: 'SOL', name: 'Solana', price: 195.4 },
    { symbol: 'SUI', name: 'Sui', price: 3.85 },
  ],
  Gold: [{ symbol: 'XAUT', name: 'Tether Gold', price: 2945.0 }],
} as const;

/** Quick amount presets */
export const DEPOSIT_QUICK_AMOUNTS = ['10', '25', '100'] as const;
export const SEND_QUICK_AMOUNTS = ['5', '10', '50'] as const;
export const BUY_QUICK_AMOUNTS = ['5', '10', '50'] as const;

/**
 * Pre-demo-specific buy scenario constants without a `marketDataService`
 * equivalent. Kept local because they're demo-specific values, not platform-wide
 * fees (Phase 8 Item E carry-forward: extend `thirdPartyFees` schema if these
 * grow into real platform constants).
 *
 * All other fee rates (deposit/send/buy parameters mapped 1:1 to `platformFees`
 * + `thirdPartyFees` + `networkGas`) are now derived inside
 * `calculations.ts` via `resolveFeeRates()` from `marketDataService.getSync()`.
 */
export const PRE_DEMO_BUY_EXTRAS = {
  xautSwapGas: 0.09, // Fixed ~$0.09 ETH swap gas (demo-specific)
  xautLp: 0.001, // ~0.10% DEX LP fee (no `thirdPartyFees.dexLpFee` schema field; deferred)
  defaultRate: 0.0006, // Default scenario rate for non-BTC/non-XAUT assets
} as const;

/** Chain order for wallet display */
export const CHAIN_ORDER: ChainId[] = ['SOL', 'BTC', 'ETH', 'SUI', 'TRX'];

/** SOL gas reserve kept per deposit for network/protocol fees */
export const SOL_GAS_RESERVE = 0.03;

/** Processing screen timing (ms) */
export const PROCESSING_TIMING = {
  processingDelay: 1500,
  approvedDelay: 1500,
  completeDelay: 1500,
} as const;
