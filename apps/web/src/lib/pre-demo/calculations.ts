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
      card: { label: 'Card processing (2.90%)', amount: cardFee, tooltip: 'Credit/debit card processing fee charged by payment network' },
      network: { label: 'Network fee (0.01%)', amount: networkFee, tooltip: 'Blockchain network transaction fee' },
      diboas: { label: 'diBoaS fee', amount: diboasFee, tooltip: 'diBoaS does not charge for adding money' },
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
      network: { label: 'Network fee (0.01%)', amount: networkFee, tooltip: 'Blockchain network transaction fee' },
      priority: { label: 'Priority fee', amount: priorityFee, tooltip: 'Fast transaction priority fee for quick settlement' },
      diboas: { label: 'diBoaS fee', amount: diboasFee, tooltip: 'diBoaS does not charge for sending money' },
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
        swap: { label: 'Cross-chain swap (~0.30%)', amount: swapFee, tooltip: 'THORChain-style cross-chain routing fee' },
        miner: { label: 'BTC miner fee', amount: minerFee, tooltip: 'Bitcoin network miner fee, varies with network congestion' },
        diboas: { label: 'diBoaS fee', amount: diboasFee, tooltip: 'diBoaS does not charge for investing' },
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
        issuer: { label: 'Issuer mint/redemption (0.25%)', amount: issuerFee, tooltip: 'Tether Gold issuer fee for minting/redeeming tokens' },
        gas: { label: 'ETH swap gas (~$0.09)', amount: swapGas, tooltip: 'Ethereum network gas fee for token swap' },
        lp: { label: 'DEX LP fee (~0.10%)', amount: lpFee, tooltip: 'Decentralized exchange liquidity provider fee' },
        diboas: { label: 'diBoaS fee', amount: diboasFee, tooltip: 'diBoaS does not charge for investing' },
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
      fee: { label: 'Transaction fee', amount: defaultFee, tooltip: 'Standard transaction fee' },
      diboas: { label: 'diBoaS fee', amount: diboasFee, tooltip: 'diBoaS does not charge for investing' },
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
