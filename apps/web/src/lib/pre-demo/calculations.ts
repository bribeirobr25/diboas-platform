/**
 * PreDemo Fee Calculations
 *
 * Pure functions for calculating deposit, send, and buy fees.
 * All functions accept an optional fee rates parameter for analytics API override.
 * Fallback: hardcoded FEE_RATES constants.
 */

import type { FeeItem } from './types';
import { FEE_RATES, ASSET_PRICES } from './constants';

/** Fee rate override type — partial overrides merged with defaults */
export type FeeRateOverrides = Partial<{
  deposit: Partial<typeof FEE_RATES.deposit>;
  send: Partial<typeof FEE_RATES.send>;
  buy: Partial<typeof FEE_RATES.buy>;
}>;

/**
 * Resolve fee rates with optional overrides.
 * Fallback chain: override value → hardcoded FEE_RATES constant.
 * Future: diBoaS analytics API provides live fee rates.
 */
export function resolveFeeRates(overrides?: FeeRateOverrides): typeof FEE_RATES {
  if (!overrides) return FEE_RATES;
  return {
    deposit: { ...FEE_RATES.deposit, ...overrides.deposit },
    send: { ...FEE_RATES.send, ...overrides.send },
    buy: { ...FEE_RATES.buy, ...overrides.buy },
  };
}

/** Deposit fee calculation */
export function calculateDepositFees(grossAmount: number, rates = FEE_RATES): {
  processorFee: number;
  networkFee: number;
  diboasFee: number;
  totalFees: number;
  netAmount: number;
  feeItems: Record<string, FeeItem>;
} {
  const processorFee = grossAmount * rates.deposit.paymentProcessor;
  const networkFee = grossAmount * rates.deposit.network;
  const rawDiboasFee = grossAmount * rates.deposit.diboas;
  const diboasFee = grossAmount > 0
    ? Math.min(rates.deposit.diboasMax, Math.max(rates.deposit.diboasMin, rawDiboasFee))
    : 0;
  const totalFees = processorFee + networkFee + diboasFee;
  const netAmount = grossAmount - totalFees;

  return {
    processorFee,
    networkFee,
    diboasFee,
    totalFees,
    netAmount,
    feeItems: {
      processor: { label: 'preDemo.fees.paymentProcessor', amount: processorFee, tooltip: 'preDemo.fees.tooltips.paymentProcessor' },
      network: { label: 'preDemo.fees.networkFee', amount: networkFee, tooltip: 'preDemo.fees.tooltips.networkFee' },
      diboas: { label: 'preDemo.fees.diboasFee', amount: diboasFee, tooltip: 'preDemo.fees.tooltips.diboasFeeDeposit' },
    },
  };
}

/** Send fee calculation */
export function calculateSendFees(grossAmount: number, rates = FEE_RATES): {
  networkFee: number;
  priorityFee: number;
  diboasFee: number;
  totalFees: number;
  netAmount: number;
  feeItems: Record<string, FeeItem>;
} {
  const networkFee = grossAmount * rates.send.network;
  const priorityFee = rates.send.priority;
  const diboasFee = grossAmount * rates.send.diboas;
  const totalFees = networkFee + priorityFee + diboasFee;
  const netAmount = grossAmount - totalFees;

  return {
    networkFee,
    priorityFee,
    diboasFee,
    totalFees,
    netAmount,
    feeItems: {
      network: { label: 'preDemo.fees.networkFee', amount: networkFee, tooltip: 'preDemo.fees.tooltips.networkFee' },
      priority: { label: 'preDemo.fees.priorityFee', amount: priorityFee, tooltip: 'preDemo.fees.tooltips.priorityFee' },
      diboas: { label: 'preDemo.fees.diboasFee', amount: diboasFee, tooltip: 'preDemo.fees.tooltips.diboasFeeSend' },
    },
  };
}

/** Buy fee calculation - dynamic based on asset */
export function calculateBuyFees(grossAmount: number, assetSymbol: string, rates = FEE_RATES): {
  totalFees: number;
  netAmount: number;
  feeItems: Record<string, FeeItem>;
} {
  const isBitcoin = assetSymbol === 'BTC';
  const isGold = assetSymbol === 'XAUT';

  if (isBitcoin) {
    const swapFee = grossAmount * rates.buy.btcSwap;
    const minerFee = grossAmount * rates.buy.btcMinerRate;
    const diboasFee = grossAmount * rates.buy.btcDiboas;
    const totalFees = swapFee + minerFee + diboasFee;

    return {
      totalFees,
      netAmount: grossAmount - totalFees,
      feeItems: {
        swap: { label: 'preDemo.fees.crossChainSwap', amount: swapFee, tooltip: 'preDemo.fees.tooltips.crossChainSwap' },
        miner: { label: 'preDemo.fees.btcMinerFee', amount: minerFee, tooltip: 'preDemo.fees.tooltips.btcMinerFee' },
        diboas: { label: 'preDemo.fees.diboasFee', amount: diboasFee, tooltip: 'preDemo.fees.tooltips.diboasFeeBuy' },
      },
    };
  }

  if (isGold) {
    const issuerFee = grossAmount * rates.buy.xautIssuer;
    const swapGas = rates.buy.xautSwapGas;
    const lpFee = grossAmount * rates.buy.xautLp;
    const diboasFee = grossAmount * rates.buy.xautDiboas;
    const totalFees = issuerFee + swapGas + lpFee + diboasFee;

    return {
      totalFees,
      netAmount: grossAmount - totalFees,
      feeItems: {
        issuer: { label: 'preDemo.fees.issuerMintRedemption', amount: issuerFee, tooltip: 'preDemo.fees.tooltips.issuerMintRedemption' },
        gas: { label: 'preDemo.fees.ethSwapGas', amount: swapGas, tooltip: 'preDemo.fees.tooltips.ethSwapGas' },
        lp: { label: 'preDemo.fees.dexLpFee', amount: lpFee, tooltip: 'preDemo.fees.tooltips.dexLpFee' },
        diboas: { label: 'preDemo.fees.diboasFee', amount: diboasFee, tooltip: 'preDemo.fees.tooltips.diboasFeeBuy' },
      },
    };
  }

  // Default for disabled assets
  const defaultFee = grossAmount * rates.buy.defaultRate;
  const rawDiboasFee = grossAmount * rates.buy.diboas;
  const diboasFee = grossAmount > 0
    ? Math.min(25, Math.max(0.25, rawDiboasFee))
    : 0;
  const totalFees = defaultFee + diboasFee;

  return {
    totalFees,
    netAmount: grossAmount - totalFees,
    feeItems: {
      fee: { label: 'preDemo.fees.transactionFee', amount: defaultFee, tooltip: 'preDemo.fees.tooltips.transactionFee' },
      diboas: { label: 'preDemo.fees.diboasFee', amount: diboasFee, tooltip: 'preDemo.fees.tooltips.diboasFeeBuy' },
    },
  };
}

/**
 * Check whether a Send or Buy transaction would exceed the available cash balance.
 *
 * Mirrors the reducer's two-path fee logic:
 * - USDC SWAP (solCost >= solBalance): fees paid from USDC → cost = grossAmount + fees
 * - SOL PAYS  (solCost <  solBalance): fees paid from SOL  → cost = grossAmount − fees
 *
 * Returns true when the transaction should be blocked.
 */
export function checkInsufficientFunds(
  grossAmount: number,
  totalFees: number,
  diboasFee: number,
  cashBalance: number,
  solBalance: number,
): boolean {
  if (grossAmount <= 0) return false;

  const nonDiboasFees = totalFees - diboasFee;
  const solCost = nonDiboasFees / ASSET_PRICES.SOL;

  const cashCost = solCost >= solBalance
    ? grossAmount + totalFees        // USDC SWAP: all fees are additional USDC cost
    : grossAmount + diboasFee;       // SOL PAYS: diBoaS fee always paid in USDC

  return cashCost > cashBalance;
}

/** Check if an asset is enabled for trading */
export function isAssetEnabled(symbol: string): boolean {
  return symbol === 'BTC' || symbol === 'XAUT';
}
