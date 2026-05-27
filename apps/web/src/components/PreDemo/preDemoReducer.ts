/**
 * PreDemo Reducer
 *
 * State management for the interactive demo flow
 * Handles sequential unlock (deposit → send → buy → goals)
 */

import type { PreDemoState, PreDemoAction } from './types';
import { RECIPIENT_OPTIONS, ASSET_PRICES, SOL_GAS_RESERVE } from '@/lib/pre-demo';

function formatDateTime(intlLocale: string = 'en-US'): string {
  const now = new Date();
  return now.toLocaleString(intlLocale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const initialPreDemoState: PreDemoState = {
  screen: 'login',
  cashBalance: 0,
  solBalance: 0,
  investments: { assets: {}, strategies: 0 },
  transactions: [],
  completedSteps: { deposit: false, send: false, buy: false, goals: false },
  pendingTransaction: null,
  termsAccepted: false,
  depositAmount: '',
  sendAmount: '',
  selectedRecipient: RECIPIENT_OPTIONS[0].handle,
  buyAmount: '',
  selectedCategory: 'Crypto',
  selectedAsset: 'BTC',
  feesExpanded: false,
  copiedAddress: null,
};

export function preDemoReducer(state: PreDemoState, action: PreDemoAction): PreDemoState {
  switch (action.type) {
    case 'SET_SCREEN':
      return { ...state, screen: action.screen };

    case 'SET_DEPOSIT_AMOUNT':
      return { ...state, depositAmount: action.amount };

    case 'SET_SEND_AMOUNT':
      return { ...state, sendAmount: action.amount };

    case 'SET_SELECTED_RECIPIENT':
      return { ...state, selectedRecipient: action.recipient };

    case 'SET_BUY_AMOUNT':
      return { ...state, buyAmount: action.amount };

    case 'SET_SELECTED_CATEGORY':
      return { ...state, selectedCategory: action.category, buyAmount: '' };

    case 'SET_SELECTED_ASSET':
      return { ...state, selectedAsset: action.asset, buyAmount: '' };

    case 'SET_PENDING_TRANSACTION':
      return { ...state, pendingTransaction: action.transaction, termsAccepted: false };

    case 'SET_TERMS_ACCEPTED':
      return { ...state, termsAccepted: action.accepted };

    case 'TOGGLE_FEES_EXPANDED':
      return { ...state, feesExpanded: !state.feesExpanded };

    case 'COMPLETE_DEPOSIT': {
      // Deposit arrives as SOL, then auto-swaps to USDC
      // Only retain SOL if balance is below 0.01 — top up to 0.03
      const solToRetain = state.solBalance < 0.01 ? SOL_GAS_RESERVE - state.solBalance : 0;
      const solRetainedUsd = solToRetain * ASSET_PRICES.SOL;
      const usdcAmount = Math.max(0, action.netAmount - solRetainedUsd);
      return {
        ...state,
        cashBalance: state.cashBalance + usdcAmount,
        solBalance: state.solBalance + solToRetain,
        transactions: [
          {
            id: Date.now(),
            type: 'deposit',
            description: 'Added Money (Credit Card)',
            amount: action.netAmount,
            grossAmount: action.grossAmount,
            fees: action.totalFees,
            feeDetails: action.feeDetails,
            date: formatDateTime(action.intlLocale),
          },
          ...state.transactions,
        ],
        completedSteps: { ...state.completedSteps, deposit: true },
        depositAmount: '',
        pendingTransaction: null,
        screen: 'home',
      };
    }

    case 'COMPLETE_SEND': {
      // Non-diBoaS fees (network/priority) are normally paid from the SOL reserve.
      // If the SOL reserve can't cover them, swap USDC → SOL for ALL fees instead,
      // keeping the SOL reserve intact.
      const sendDiboasFee = action.feeDetails['diboas']?.amount || 0;
      const sendNonDiboasFees = action.totalFees - sendDiboasFee;
      const sendSolCost = sendNonDiboasFees / ASSET_PRICES.SOL;
      const sendUsdcSwap = sendSolCost >= state.solBalance;
      const sendNewCash = sendUsdcSwap
        ? state.cashBalance - action.grossAmount - sendNonDiboasFees
        : state.cashBalance - (action.grossAmount - sendNonDiboasFees);
      const sendNewSol = sendUsdcSwap ? state.solBalance : state.solBalance - sendSolCost;
      return {
        ...state,
        cashBalance: Math.max(0, sendNewCash),
        solBalance: Math.max(0, sendNewSol),
        transactions: [
          {
            id: Date.now(),
            type: 'send',
            description: `Sent to ${action.recipient}`,
            amount: action.netAmount,
            grossAmount: action.grossAmount,
            fees: action.totalFees,
            feeDetails: action.feeDetails,
            date: formatDateTime(action.intlLocale),
          },
          ...state.transactions,
        ],
        completedSteps: { ...state.completedSteps, send: true },
        sendAmount: '',
        pendingTransaction: null,
        screen: 'home',
      };
    }

    case 'COMPLETE_BUY': {
      // Same SOL fee logic as COMPLETE_SEND:
      // If SOL reserve can't cover fees, swap USDC → SOL and keep reserve intact.
      const buyDiboasFee = action.feeDetails['diboas']?.amount || 0;
      const buyNonDiboasFees = action.totalFees - buyDiboasFee;
      const buySolCost = buyNonDiboasFees / ASSET_PRICES.SOL;
      const buyUsdcSwap = buySolCost >= state.solBalance;
      const buyNewCash = buyUsdcSwap
        ? state.cashBalance - action.grossAmount - buyNonDiboasFees
        : state.cashBalance - (action.grossAmount - buyNonDiboasFees);
      const buyNewSol = buyUsdcSwap ? state.solBalance : state.solBalance - buySolCost;
      return {
        ...state,
        cashBalance: Math.max(0, buyNewCash),
        solBalance: Math.max(0, buyNewSol),
        investments: {
          ...state.investments,
          assets: {
            ...state.investments.assets,
            [action.asset.symbol]: {
              amount:
                (state.investments.assets[action.asset.symbol]?.amount || 0) + action.netAmount,
              name: action.asset.name,
            },
          },
        },
        transactions: [
          {
            id: Date.now(),
            type: 'buy',
            description: `Bought ${action.asset.name} (${action.asset.symbol})`,
            amount: action.netAmount,
            grossAmount: action.grossAmount,
            fees: action.totalFees,
            feeDetails: action.feeDetails,
            asset: action.asset.symbol,
            date: formatDateTime(action.intlLocale),
          },
          ...state.transactions,
        ],
        completedSteps: { ...state.completedSteps, buy: true },
        buyAmount: '',
        pendingTransaction: null,
        screen: 'home',
      };
    }

    case 'SET_COPIED_ADDRESS':
      return { ...state, copiedAddress: action.chain };

    case 'CLEAR_PENDING':
      return { ...state, pendingTransaction: null, termsAccepted: false };

    default:
      return state;
  }
}
