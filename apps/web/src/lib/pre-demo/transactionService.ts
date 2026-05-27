/**
 * PreDemo Transaction Service
 *
 * Encapsulates transaction orchestration logic for deposit, send, and buy flows.
 * Uses the pure calculation functions from ./calculations.ts and wraps them in a
 * service pattern that provides higher-level transaction processing results.
 *
 * Domain-Driven Design: Transaction orchestration layer
 * Service Agnostic Abstraction: Pure functions, no React dependency
 * Code Reusability: Single source of truth for transaction processing
 */

import type { Asset, PendingTransaction } from './types';
import {
  calculateDepositFees,
  calculateSendFees,
  calculateBuyFees,
  checkInsufficientFunds,
  isAssetEnabled,
} from './calculations';

/** Result of processing a deposit */
export interface DepositProcessingResult {
  readonly pending: PendingTransaction;
  readonly isValid: boolean;
  readonly errorCode?: 'ZERO_AMOUNT' | 'NEGATIVE_AMOUNT';
}

/** Result of processing a send */
export interface SendProcessingResult {
  readonly pending: PendingTransaction;
  readonly isValid: boolean;
  readonly errorCode?: 'ZERO_AMOUNT' | 'NEGATIVE_AMOUNT' | 'INSUFFICIENT_FUNDS';
}

/** Result of processing a buy */
export interface BuyProcessingResult {
  readonly pending: PendingTransaction;
  readonly isValid: boolean;
  readonly errorCode?: 'ZERO_AMOUNT' | 'NEGATIVE_AMOUNT' | 'INSUFFICIENT_FUNDS' | 'ASSET_DISABLED';
}

/**
 * Process a deposit transaction.
 *
 * Calculates fees and returns a PendingTransaction ready for confirmation.
 */
export function processDeposit(
  grossAmount: number,
  paymentMethod: string = 'Credit Card'
): DepositProcessingResult {
  if (grossAmount < 0) {
    return {
      pending: createEmptyPending('deposit'),
      isValid: false,
      errorCode: 'NEGATIVE_AMOUNT',
    };
  }

  if (grossAmount === 0) {
    return {
      pending: createEmptyPending('deposit'),
      isValid: false,
      errorCode: 'ZERO_AMOUNT',
    };
  }

  const { totalFees, netAmount, feeItems } = calculateDepositFees(grossAmount);

  return {
    pending: {
      type: 'deposit',
      grossAmount,
      netAmount,
      totalFees,
      fees: feeItems,
      paymentMethod,
    },
    isValid: true,
  };
}

/**
 * Process a send transaction.
 *
 * Calculates fees and validates against the user's available balance.
 */
export function processSend(
  grossAmount: number,
  recipient: string,
  cashBalance: number,
  solBalance: number
): SendProcessingResult {
  if (grossAmount < 0) {
    return {
      pending: createEmptyPending('send'),
      isValid: false,
      errorCode: 'NEGATIVE_AMOUNT',
    };
  }

  if (grossAmount === 0) {
    return {
      pending: createEmptyPending('send'),
      isValid: false,
      errorCode: 'ZERO_AMOUNT',
    };
  }

  const { totalFees, netAmount, diboasFee, feeItems } = calculateSendFees(grossAmount);

  if (checkInsufficientFunds(grossAmount, totalFees, diboasFee, cashBalance, solBalance)) {
    return {
      pending: {
        type: 'send',
        grossAmount,
        netAmount,
        totalFees,
        fees: feeItems,
        recipient,
      },
      isValid: false,
      errorCode: 'INSUFFICIENT_FUNDS',
    };
  }

  return {
    pending: {
      type: 'send',
      grossAmount,
      netAmount,
      totalFees,
      fees: feeItems,
      recipient,
    },
    isValid: true,
  };
}

/**
 * Process a buy transaction.
 *
 * Calculates fees, validates asset eligibility, and checks balance.
 */
export function processBuy(
  grossAmount: number,
  asset: Asset,
  cashBalance: number,
  solBalance: number
): BuyProcessingResult {
  if (grossAmount < 0) {
    return {
      pending: createEmptyPending('buy'),
      isValid: false,
      errorCode: 'NEGATIVE_AMOUNT',
    };
  }

  if (grossAmount === 0) {
    return {
      pending: createEmptyPending('buy'),
      isValid: false,
      errorCode: 'ZERO_AMOUNT',
    };
  }

  if (!isAssetEnabled(asset.symbol)) {
    return {
      pending: createEmptyPending('buy'),
      isValid: false,
      errorCode: 'ASSET_DISABLED',
    };
  }

  const { totalFees, netAmount, feeItems } = calculateBuyFees(grossAmount, asset.symbol);

  // Extract diboasFee for insufficient funds check
  const diboasFee = feeItems['diboas']?.amount ?? 0;

  if (checkInsufficientFunds(grossAmount, totalFees, diboasFee, cashBalance, solBalance)) {
    return {
      pending: {
        type: 'buy',
        grossAmount,
        netAmount,
        totalFees,
        fees: feeItems,
        asset,
      },
      isValid: false,
      errorCode: 'INSUFFICIENT_FUNDS',
    };
  }

  return {
    pending: {
      type: 'buy',
      grossAmount,
      netAmount,
      totalFees,
      fees: feeItems,
      asset,
    },
    isValid: true,
  };
}

/** Create an empty pending transaction for error results */
function createEmptyPending(type: PendingTransaction['type']): PendingTransaction {
  return {
    type,
    grossAmount: 0,
    netAmount: 0,
    totalFees: 0,
    fees: {},
  };
}
