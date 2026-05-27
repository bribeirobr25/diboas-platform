/**
 * PreDemo Fee Calculations
 *
 * Pure functions for calculating deposit, send, and buy fees.
 *
 * Phase 8 Item E (carry-forward #7 closeout): fee rates derived from
 * `marketDataService.getSync()` at call time instead of the static
 * `FEE_RATES` constant. Pre-demo-specific scenario values (xautSwapGas,
 * xautLp, defaultRate) stay local in `PRE_DEMO_BUY_EXTRAS` — they don't
 * have a `marketDataService` equivalent.
 *
 * Optional fee-rate overrides remain supported for the analytics-API
 * override pathway.
 */

import type { FeeItem } from './types';
import { marketDataService } from '@/lib/market-data';
import { ASSET_PRICES, PRE_DEMO_BUY_EXTRAS } from './constants';

/** Concrete shape of resolved fee rates, consumed by all calculation functions. */
export interface FeeRates {
  readonly deposit: {
    paymentProcessor: number;
    network: number;
    diboas: number;
    diboasMin: number;
    diboasMax: number;
  };
  readonly send: {
    network: number;
    priority: number;
    diboas: number;
  };
  readonly buy: {
    btcSwap: number;
    btcMinerRate: number;
    xautIssuer: number;
    xautSwapGas: number;
    xautLp: number;
    defaultRate: number;
    diboas: number;
    btcDiboas: number;
    xautDiboas: number;
  };
}

/** Fee rate override type — partial overrides merged with service-derived defaults. */
export type FeeRateOverrides = {
  deposit?: Partial<FeeRates['deposit']>;
  send?: Partial<FeeRates['send']>;
  buy?: Partial<FeeRates['buy']>;
};

/**
 * Resolve fee rates from `marketDataService` (canonical source) merged with
 * optional caller overrides. Phase 8 Item E: replaces previous static
 * `FEE_RATES` lookup; future live-data flows transparently through here.
 *
 * Mapping (11 of 14 fields service-backed):
 *   platformFees.deposit.{rate,minFee,maxFee} → deposit.{diboas,diboasMin,diboasMax}
 *   platformFees.send.rate                    → send.diboas
 *   platformFees.sell.rate                    → buy.diboas (buy execution fee = sell rate)
 *   thirdPartyFees.{paymentProcessor,networkFee,crossChainSwap,btcMiner,xautIssuer}
 *                                             → deposit.paymentProcessor + network,
 *                                               send.network, buy.{btcSwap,btcMinerRate,xautIssuer}
 *   networkGas.solPriorityFee                 → send.priority
 *
 * Local (PRE_DEMO_BUY_EXTRAS):
 *   buy.{xautSwapGas, xautLp, defaultRate}    — demo-specific, no service field
 *   buy.{btcDiboas, xautDiboas} = 0           — BTC/Gold buy is FREE by design
 */
export function resolveFeeRates(overrides?: FeeRateOverrides): FeeRates {
  const { platformFees, thirdPartyFees, networkGas } = marketDataService.getSync();
  const base: FeeRates = {
    deposit: {
      paymentProcessor: thirdPartyFees.paymentProcessor,
      network: thirdPartyFees.networkFee,
      diboas: platformFees.deposit.rate,
      diboasMin: platformFees.deposit.minFee,
      diboasMax: platformFees.deposit.maxFee,
    },
    send: {
      network: thirdPartyFees.networkFee,
      priority: networkGas.solPriorityFee,
      diboas: platformFees.send.rate,
    },
    buy: {
      btcSwap: thirdPartyFees.crossChainSwap,
      btcMinerRate: thirdPartyFees.btcMiner,
      xautIssuer: thirdPartyFees.xautIssuer,
      xautSwapGas: PRE_DEMO_BUY_EXTRAS.xautSwapGas,
      xautLp: PRE_DEMO_BUY_EXTRAS.xautLp,
      defaultRate: PRE_DEMO_BUY_EXTRAS.defaultRate,
      diboas: platformFees.sell.rate,
      btcDiboas: 0,
      xautDiboas: 0,
    },
  };
  if (!overrides) return base;
  return {
    deposit: { ...base.deposit, ...overrides.deposit },
    send: { ...base.send, ...overrides.send },
    buy: { ...base.buy, ...overrides.buy },
  };
}

/** Deposit fee calculation */
export function calculateDepositFees(
  grossAmount: number,
  rates: FeeRates = resolveFeeRates()
): {
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
  const diboasFee =
    grossAmount > 0
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
      processor: {
        label: 'preDemo.fees.paymentProcessor',
        amount: processorFee,
        tooltip: 'preDemo.fees.tooltips.paymentProcessor',
      },
      network: {
        label: 'preDemo.fees.networkFee',
        amount: networkFee,
        tooltip: 'preDemo.fees.tooltips.networkFee',
      },
      diboas: {
        label: 'preDemo.fees.diboasFee',
        amount: diboasFee,
        tooltip: 'preDemo.fees.tooltips.diboasFeeDeposit',
      },
    },
  };
}

/** Send fee calculation */
export function calculateSendFees(
  grossAmount: number,
  rates: FeeRates = resolveFeeRates()
): {
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
      network: {
        label: 'preDemo.fees.networkFee',
        amount: networkFee,
        tooltip: 'preDemo.fees.tooltips.networkFee',
      },
      priority: {
        label: 'preDemo.fees.priorityFee',
        amount: priorityFee,
        tooltip: 'preDemo.fees.tooltips.priorityFee',
      },
      diboas: {
        label: 'preDemo.fees.diboasFee',
        amount: diboasFee,
        tooltip: 'preDemo.fees.tooltips.diboasFeeSend',
      },
    },
  };
}

/** Buy fee calculation - dynamic based on asset */
export function calculateBuyFees(
  grossAmount: number,
  assetSymbol: string,
  rates: FeeRates = resolveFeeRates()
): {
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
        swap: {
          label: 'preDemo.fees.crossChainSwap',
          amount: swapFee,
          tooltip: 'preDemo.fees.tooltips.crossChainSwap',
        },
        miner: {
          label: 'preDemo.fees.btcMinerFee',
          amount: minerFee,
          tooltip: 'preDemo.fees.tooltips.btcMinerFee',
        },
        diboas: {
          label: 'preDemo.fees.diboasFee',
          amount: diboasFee,
          tooltip: 'preDemo.fees.tooltips.diboasFeeBuy',
        },
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
        issuer: {
          label: 'preDemo.fees.issuerMintRedemption',
          amount: issuerFee,
          tooltip: 'preDemo.fees.tooltips.issuerMintRedemption',
        },
        gas: {
          label: 'preDemo.fees.ethSwapGas',
          amount: swapGas,
          tooltip: 'preDemo.fees.tooltips.ethSwapGas',
        },
        lp: {
          label: 'preDemo.fees.dexLpFee',
          amount: lpFee,
          tooltip: 'preDemo.fees.tooltips.dexLpFee',
        },
        diboas: {
          label: 'preDemo.fees.diboasFee',
          amount: diboasFee,
          tooltip: 'preDemo.fees.tooltips.diboasFeeBuy',
        },
      },
    };
  }

  // Default for disabled assets
  const defaultFee = grossAmount * rates.buy.defaultRate;
  const rawDiboasFee = grossAmount * rates.buy.diboas;
  const diboasFee = grossAmount > 0 ? Math.min(25, Math.max(0.25, rawDiboasFee)) : 0;
  const totalFees = defaultFee + diboasFee;

  return {
    totalFees,
    netAmount: grossAmount - totalFees,
    feeItems: {
      fee: {
        label: 'preDemo.fees.transactionFee',
        amount: defaultFee,
        tooltip: 'preDemo.fees.tooltips.transactionFee',
      },
      diboas: {
        label: 'preDemo.fees.diboasFee',
        amount: diboasFee,
        tooltip: 'preDemo.fees.tooltips.diboasFeeBuy',
      },
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
  solBalance: number
): boolean {
  if (grossAmount <= 0) return false;

  const nonDiboasFees = totalFees - diboasFee;
  const solCost = nonDiboasFees / ASSET_PRICES.SOL;

  const cashCost =
    solCost >= solBalance
      ? grossAmount + totalFees // USDC SWAP: all fees are additional USDC cost
      : grossAmount + diboasFee; // SOL PAYS: diBoaS fee always paid in USDC

  return cashCost > cashBalance;
}

/** Check if an asset is enabled for trading */
export function isAssetEnabled(symbol: string): boolean {
  return symbol === 'BTC' || symbol === 'XAUT';
}
