/**
 * PreDemo Domain Constants
 *
 * Asset prices, chain configs, recipients, fee rates, wallet addresses
 * All values match the reference demo exactly
 */

import type { Asset, AssetCategory, ChainId, ChainConfig, Recipient } from './types';

/** Asset prices (snapshot) */
export const ASSET_PRICES: Record<string, number> = {
  BTC: 97250.00,
  XAUT: 2945.00,
  ETH: 2650.00,
  SOL: 195.40,
  SUI: 3.85,
} as const;

/** Chain configurations */
export const CHAIN_CONFIG: Record<ChainId, ChainConfig> = {
  SOL: { name: 'Solana', fullName: 'Solana Wallet', color: '#9945FF', tokens: ['USDC', 'SOL'] },
  BTC: { name: 'Bitcoin', fullName: 'Bitcoin Wallet', color: '#F7931A', tokens: ['BTC'] },
  ETH: { name: 'Ethereum', fullName: 'Ethereum Wallet', color: '#627EEA', tokens: ['XAUT', 'ETH'] },
  SUI: { name: 'SUI', fullName: 'SUI Wallet', color: '#4DA2FF', tokens: ['SUI'], comingSoon: true },
} as const;

/** Wallet addresses (demo) */
export const WALLET_ADDRESSES: Record<ChainId, string> = {
  SOL: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  BTC: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
  ETH: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
  SUI: '0x2d78c927cd5de66d29e5e0a0f61f8e3f2b2e8c7a',
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
    { symbol: 'TSLAx', name: 'Tesla', price: 248.50 },
    { symbol: 'GOOGLx', name: 'Alphabet', price: 175.30 },
    { symbol: 'NVDAx', name: 'NVIDIA', price: 137.85 },
  ],
  Crypto: [
    { symbol: 'BTC', name: 'Bitcoin', price: 97250.00 },
    { symbol: 'ETH', name: 'Ethereum', price: 2650.00 },
    { symbol: 'SOL', name: 'Solana', price: 195.40 },
    { symbol: 'SUI', name: 'Sui', price: 3.85 },
  ],
  Gold: [
    { symbol: 'XAUT', name: 'Tether Gold', price: 2945.00 },
  ],
} as const;

/** Quick amount presets */
export const DEPOSIT_QUICK_AMOUNTS = ['10', '25', '100'] as const;
export const SEND_QUICK_AMOUNTS = ['5', '10', '50'] as const;
export const BUY_QUICK_AMOUNTS = ['5', '10', '50'] as const;

/** Fee rates */
export const FEE_RATES = {
  deposit: {
    card: 0.029,      // 2.90%
    network: 0.0001,   // 0.01%
    diboas: 0,
  },
  send: {
    network: 0.0001,   // 0.01%
    priority: 0.009,   // Fixed ~$0.009
    diboas: 0,
  },
  buy: {
    btcSwap: 0.003,    // Cross-chain swap ~0.30%
    btcMinerMin: 0.75,
    btcMinerMax: 1.50,
    btcMinerRate: 0.01,
    xautIssuer: 0.0025, // 0.25%
    xautSwapGas: 0.09,  // Fixed ~$0.09
    xautLp: 0.001,      // ~0.10%
    defaultRate: 0.0006,
    diboas: 0,
  },
} as const;

/** Chain order for wallet display */
export const CHAIN_ORDER: ChainId[] = ['SOL', 'BTC', 'ETH', 'SUI'];

/** SOL gas reserve kept per deposit for network/protocol fees */
export const SOL_GAS_RESERVE = 0.03;

/** Processing screen timing (ms) */
export const PROCESSING_TIMING = {
  processingDelay: 1500,
  approvedDelay: 1500,
  completeDelay: 1500,
} as const;
