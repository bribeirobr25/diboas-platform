/**
 * PreDemo Domain - Public API
 */

export type {
  PreDemoScreen,
  AssetCategory,
  ChainId,
  Asset,
  ChainConfig,
  Recipient,
  FeeItem,
  PendingTransaction,
  Transaction,
  CompletedSteps,
  Investments,
  TokenBalance,
} from './types';

export {
  ASSET_PRICES,
  CHAIN_CONFIG,
  WALLET_ADDRESSES,
  RECIPIENT_OPTIONS,
  ASSET_CATEGORIES,
  DEPOSIT_QUICK_AMOUNTS,
  SEND_QUICK_AMOUNTS,
  BUY_QUICK_AMOUNTS,
  FEE_RATES,
  CHAIN_ORDER,
  PROCESSING_TIMING,
  SOL_GAS_RESERVE,
} from './constants';

export {
  calculateDepositFees,
  calculateSendFees,
  calculateBuyFees,
  checkInsufficientFunds,
  isAssetEnabled,
} from './calculations';
