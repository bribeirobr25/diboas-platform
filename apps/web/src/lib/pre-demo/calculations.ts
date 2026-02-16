/**
 * PreDemo Fee Calculations
 *
 * Pure functions for calculating deposit, send, and buy fees
 * All formulas match the reference demo exactly
 */

import type { FeeItem } from './types';
import { FEE_RATES, ASSET_PRICES } from './constants';

/** Deposit fee calculation */
export function calculateDepositFees(grossAmount: number): {
  cardFee: number;
  networkFee: number;
  diboasFee: number;
  totalFees: number;
  netAmount: number;
  feeItems: Record<string, FeeItem>;
} {
  const cardFee = grossAmount * FEE_RATES.deposit.card;
  const networkFee = grossAmount * FEE_RATES.deposit.network;
  const diboasFee = FEE_RATES.deposit.diboas;
  const totalFees = cardFee + networkFee + diboasFee;
  const netAmount = grossAmount - totalFees;

  return {
    cardFee,
    networkFee,
    diboasFee,
    totalFees,
    netAmount,
    feeItems: {
      card: { label: 'preDemo.fees.cardProcessing', amount: cardFee, tooltip: 'preDemo.fees.tooltips.cardProcessing' },
      network: { label: 'preDemo.fees.networkFee', amount: networkFee, tooltip: 'preDemo.fees.tooltips.networkFee' },
      diboas: { label: 'preDemo.fees.diboasFee', amount: diboasFee, tooltip: 'preDemo.fees.tooltips.diboasFeeDeposit' },
    },
  };
}

/** Send fee calculation */
export function calculateSendFees(grossAmount: number): {
  networkFee: number;
  priorityFee: number;
  diboasFee: number;
  totalFees: number;
  netAmount: number;
  feeItems: Record<string, FeeItem>;
} {
  const networkFee = grossAmount * FEE_RATES.send.network;
  const priorityFee = FEE_RATES.send.priority;
  const diboasFee = FEE_RATES.send.diboas;
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
export function calculateBuyFees(grossAmount: number, assetSymbol: string): {
  totalFees: number;
  netAmount: number;
  feeItems: Record<string, FeeItem>;
} {
  const isBitcoin = assetSymbol === 'BTC';
  const isGold = assetSymbol === 'XAUT';

  if (isBitcoin) {
    const swapFee = grossAmount * FEE_RATES.buy.btcSwap;
    const minerFee = grossAmount > 0
      ? Math.min(Math.max(FEE_RATES.buy.btcMinerMin, grossAmount * FEE_RATES.buy.btcMinerRate), FEE_RATES.buy.btcMinerMax)
      : 0;
    const diboasFee = FEE_RATES.buy.diboas;
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
    const issuerFee = grossAmount * FEE_RATES.buy.xautIssuer;
    const swapGas = FEE_RATES.buy.xautSwapGas;
    const lpFee = grossAmount * FEE_RATES.buy.xautLp;
    const diboasFee = FEE_RATES.buy.diboas;
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
  const defaultFee = grossAmount * FEE_RATES.buy.defaultRate;
  const diboasFee = FEE_RATES.buy.diboas;
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
  cashBalance: number,
  solBalance: number,
): boolean {
  if (grossAmount <= 0) return false;

  // diBoaS fees are 0 currently; adjust here if they become non-zero
  const nonDiboasFees = totalFees;
  const solCost = nonDiboasFees / ASSET_PRICES.SOL;

  const cashCost = solCost >= solBalance
    ? grossAmount + nonDiboasFees   // USDC SWAP: fees are additional USDC cost
    : grossAmount - nonDiboasFees;  // SOL PAYS: fees deducted from SOL reserve

  return cashCost > cashBalance;
}

/** Check if an asset is enabled for trading */
export function isAssetEnabled(symbol: string): boolean {
  return symbol === 'BTC' || symbol === 'XAUT';
}
