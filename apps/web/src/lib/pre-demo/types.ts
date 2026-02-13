/**
 * PreDemo Domain Types
 *
 * Type definitions for the interactive demo flow
 */

/** All demo screen identifiers */
export type PreDemoScreen =
  | 'login'
  | 'creating-account'
  | 'creating-wallet'
  | 'home'
  | 'deposit'
  | 'deposit-confirm'
  | 'deposit-processing'
  | 'deposit-approved'
  | 'deposit-complete'
  | 'send'
  | 'send-confirm'
  | 'send-processing'
  | 'send-complete'
  | 'buy'
  | 'buy-confirm'
  | 'buy-processing'
  | 'buy-complete'
  | 'wallet-details'
  | 'dream-mode';

/** Asset category names */
export type AssetCategory = 'ETFs' | 'Stocks' | 'Crypto' | 'Gold';

/** Chain identifiers */
export type ChainId = 'SOL' | 'BTC' | 'ETH' | 'SUI';

/** Asset definition */
export interface Asset {
  readonly symbol: string;
  readonly name: string;
  readonly price: number;
}

/** Chain configuration */
export interface ChainConfig {
  readonly name: string;
  readonly fullName: string;
  readonly color: string;
  readonly tokens: string[];
  readonly comingSoon?: boolean;
}

/** Recipient option */
export interface Recipient {
  readonly handle: string;
  readonly name: string;
}

/** Fee line item */
export interface FeeItem {
  readonly label: string;
  readonly amount: number;
  readonly tooltip: string;
}

/** Pending transaction */
export interface PendingTransaction {
  readonly type: 'deposit' | 'send' | 'buy';
  readonly grossAmount: number;
  readonly netAmount: number;
  readonly totalFees: number;
  readonly fees: Record<string, FeeItem>;
  readonly paymentMethod?: string;
  readonly recipient?: string;
  readonly asset?: Asset;
}

/** Transaction record */
export interface Transaction {
  readonly id: number;
  readonly type: 'deposit' | 'send' | 'buy';
  readonly description: string;
  readonly amount: number;
  readonly grossAmount: number;
  readonly fees: number;
  readonly feeDetails: Record<string, FeeItem>;
  readonly date: string;
  readonly asset?: string;
}

/** Completed steps tracker */
export interface CompletedSteps {
  deposit: boolean;
  send: boolean;
  buy: boolean;
  goals: boolean;
}

/** Investment holdings */
export interface Investments {
  assets: Record<string, { amount: number; name: string }>;
  strategies: number;
}

/** Token balance */
export interface TokenBalance {
  readonly symbol: string;
  readonly amount: number;
  readonly usdValue: number;
  readonly decimals: number;
  readonly label?: string;
}
