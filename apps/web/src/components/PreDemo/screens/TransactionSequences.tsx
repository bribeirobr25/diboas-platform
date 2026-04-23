/**
 * Transaction processing sequences for deposit, send, and buy flows.
 * Extracted from ConfirmationScreen for file decoupling (≤150 lines).
 */

import { PROCESSING_TIMING, type PendingTransaction } from '@/lib/pre-demo';
import { analyticsService } from '@/lib/analytics';
import {
  applicationEventBus,
  ApplicationEventType,
} from '@/lib/events/ApplicationEventBus';
import type { PreDemoAction } from '../types';
import type { TransitionStep } from '../hooks';

type Dispatch = React.Dispatch<PreDemoAction>;

export function buildDepositSequence(
  pending: PendingTransaction,
  dispatch: Dispatch,
  intlLocale: string,
): TransitionStep[] {
  return [
    { screen: 'deposit-processing', delayMs: 0 },
    { screen: 'deposit-approved', delayMs: PROCESSING_TIMING.processingDelay },
    { screen: 'deposit-complete', delayMs: PROCESSING_TIMING.processingDelay + PROCESSING_TIMING.approvedDelay },
    {
      screen: 'home',
      delayMs: PROCESSING_TIMING.processingDelay + PROCESSING_TIMING.approvedDelay + PROCESSING_TIMING.completeDelay,
      onReach: () => {
        dispatch({
          type: 'COMPLETE_DEPOSIT',
          netAmount: pending.netAmount,
          grossAmount: pending.grossAmount,
          totalFees: pending.totalFees,
          feeDetails: pending.fees,
          intlLocale,
        });

        analyticsService.track({
          name: 'pre_demo_transaction_completed',
          parameters: { type: 'deposit', amount: pending.grossAmount, net_amount: pending.netAmount, fees: pending.totalFees },
        });

        applicationEventBus.emit(ApplicationEventType.PRE_DEMO_DEPOSIT_COMPLETED, {
          source: 'preDemo',
          timestamp: Date.now(),
          metadata: { amount: pending.grossAmount },
        });
      },
    },
  ];
}

export function buildSendSequence(
  pending: PendingTransaction,
  dispatch: Dispatch,
  intlLocale: string,
): TransitionStep[] {
  return [
    { screen: 'send-processing', delayMs: 0 },
    { screen: 'send-complete', delayMs: PROCESSING_TIMING.processingDelay },
    {
      screen: 'home',
      delayMs: PROCESSING_TIMING.processingDelay + PROCESSING_TIMING.completeDelay,
      onReach: () => {
        dispatch({
          type: 'COMPLETE_SEND',
          grossAmount: pending.grossAmount,
          netAmount: pending.netAmount,
          totalFees: pending.totalFees,
          recipient: pending.recipient || '',
          feeDetails: pending.fees,
          intlLocale,
        });

        analyticsService.track({
          name: 'pre_demo_transaction_completed',
          parameters: { type: 'send', amount: pending.grossAmount, net_amount: pending.netAmount, fees: pending.totalFees, recipient: pending.recipient },
        });

        applicationEventBus.emit(ApplicationEventType.PRE_DEMO_SEND_COMPLETED, {
          source: 'preDemo',
          timestamp: Date.now(),
          metadata: { amount: pending.grossAmount, recipient: pending.recipient },
        });
      },
    },
  ];
}

export function buildBuySequence(
  pending: PendingTransaction,
  dispatch: Dispatch,
  intlLocale: string,
): TransitionStep[] {
  return [
    { screen: 'buy-processing', delayMs: 0 },
    { screen: 'buy-complete', delayMs: PROCESSING_TIMING.processingDelay },
    {
      screen: 'home',
      delayMs: PROCESSING_TIMING.processingDelay + PROCESSING_TIMING.completeDelay,
      onReach: () => {
        dispatch({
          type: 'COMPLETE_BUY',
          grossAmount: pending.grossAmount,
          netAmount: pending.netAmount,
          totalFees: pending.totalFees,
          asset: pending.asset
            ? { symbol: pending.asset.symbol, name: pending.asset.name }
            : { symbol: '', name: '' },
          feeDetails: pending.fees,
          intlLocale,
        });

        analyticsService.track({
          name: 'pre_demo_transaction_completed',
          parameters: { type: 'buy', amount: pending.grossAmount, net_amount: pending.netAmount, fees: pending.totalFees, asset: pending.asset?.symbol },
        });

        applicationEventBus.emit(ApplicationEventType.PRE_DEMO_BUY_COMPLETED, {
          source: 'preDemo',
          timestamp: Date.now(),
          metadata: { amount: pending.grossAmount, asset: pending.asset?.symbol },
        });
      },
    },
  ];
}
