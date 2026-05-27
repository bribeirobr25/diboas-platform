/**
 * PreDemo Domain - Public API
 */

export type {
  PreDemoScreen,
  AssetCategory,
  ChainId,
  L2ChainId,
  L2ChainConfig,
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
  resolveFeeRates,
  type FeeRateOverrides,
} from './calculations';

export { formatCurrency } from './format';

export { getPreDemoFeeRateValues, type PreDemoFeeRateValues } from './feeRateDisplay';

export { processDeposit, processSend, processBuy } from './transactionService';

export type {
  DepositProcessingResult,
  SendProcessingResult,
  BuyProcessingResult,
} from './transactionService';
