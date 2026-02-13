'use client';

import { useCallback, useMemo, useRef } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { usePreDemo } from '../PreDemoProvider';
import { DemoHeader } from '../components/DemoHeader';
import { DemoFooter } from '../components/DemoFooter';
import { FeeBreakdown } from '../components/FeeBreakdown';
import { PROCESSING_TIMING } from '@/lib/pre-demo';
import {
  applicationEventBus,
  ApplicationEventType,
} from '@/lib/events/ApplicationEventBus';
import styles from '../PreDemo.module.css';

function formatCurrency(amount: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/** Type icon SVGs */
function TypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'deposit':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      );
    case 'send':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      );
    default:
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      );
  }
}

/** Payment method display name */
function getMethodDisplay(method: string): string {
  switch (method) {
    case 'card':
      return 'Credit Card';
    case 'bank':
      return 'Bank Transfer';
    case 'mobile':
      return 'Mobile Money';
    default:
      return method;
  }
}

export function ConfirmationScreen() {
  const intl = useTranslation();
  const { state, dispatch, setScreen } = usePreDemo();
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const t = (key: string) => intl.formatMessage({ id: key });

  const pending = state.pendingTransaction;

  if (!pending) return null;

  const txType = pending.type;

  // Title by type
  const titleKey =
    txType === 'deposit'
      ? 'preDemo.confirm.titleDeposit'
      : txType === 'send'
        ? 'preDemo.confirm.titleSend'
        : 'preDemo.confirm.titleBuy';

  // Type label
  const typeLabelKey =
    txType === 'deposit'
      ? 'preDemo.confirm.typeDeposit'
      : txType === 'send'
        ? 'preDemo.confirm.typeSend'
        : 'preDemo.confirm.typeBuy';

  // Back navigation
  const backScreen =
    txType === 'deposit'
      ? 'deposit'
      : txType === 'send'
        ? 'send'
        : 'buy';

  // Processing screen prefix
  const processingPrefix = txType;

  // "You'll receive" vs "They'll receive"
  const receiveKey =
    txType === 'send'
      ? 'preDemo.confirm.theyReceive'
      : 'preDemo.confirm.youReceive';

  // Terms text key
  const termsKey =
    txType === 'deposit'
      ? 'preDemo.confirm.termsDeposit'
      : txType === 'send'
        ? 'preDemo.confirm.termsSend'
        : 'preDemo.confirm.termsBuy';

  // Confirm button text — type-specific
  const confirmButtonKey =
    txType === 'deposit'
      ? 'preDemo.confirm.confirmDeposit'
      : txType === 'send'
        ? 'preDemo.confirm.confirmTransfer'
        : 'preDemo.confirm.confirmPurchase';

  // Calculate crypto quantity for buy
  const cryptoQuantity = useMemo(() => {
    if (txType !== 'buy' || !pending.asset?.price || pending.netAmount <= 0) return 0;
    return pending.netAmount / pending.asset.price;
  }, [txType, pending.netAmount, pending.asset?.price]);

  const handleConfirm = useCallback(() => {
    // Clear any existing timers
    timerRef.current.forEach(clearTimeout);
    timerRef.current = [];

    // Start processing flow
    setScreen(`${processingPrefix}-processing` as Parameters<typeof setScreen>[0]);

    // Approved step (only deposit has explicit approved)
    if (txType === 'deposit') {
      const t1 = setTimeout(() => {
        setScreen('deposit-approved');
      }, PROCESSING_TIMING.processingDelay);
      timerRef.current.push(t1);

      const t2 = setTimeout(() => {
        setScreen('deposit-complete');
      }, PROCESSING_TIMING.processingDelay + PROCESSING_TIMING.approvedDelay);
      timerRef.current.push(t2);

      const t3 = setTimeout(() => {
        dispatch({
          type: 'COMPLETE_DEPOSIT',
          netAmount: pending.netAmount,
          grossAmount: pending.grossAmount,
          totalFees: pending.totalFees,
          feeDetails: pending.fees,
        });

        applicationEventBus.emit(ApplicationEventType.PRE_DEMO_DEPOSIT_COMPLETED, {
          source: 'preDemo',
          timestamp: Date.now(),
          metadata: { amount: pending.grossAmount },
        });
      }, PROCESSING_TIMING.processingDelay + PROCESSING_TIMING.approvedDelay + PROCESSING_TIMING.completeDelay);
      timerRef.current.push(t3);
    } else if (txType === 'send') {
      const t1 = setTimeout(() => {
        setScreen('send-complete');
      }, PROCESSING_TIMING.processingDelay);
      timerRef.current.push(t1);

      const t2 = setTimeout(() => {
        dispatch({
          type: 'COMPLETE_SEND',
          grossAmount: pending.grossAmount,
          netAmount: pending.netAmount,
          totalFees: pending.totalFees,
          recipient: pending.recipient || '',
          feeDetails: pending.fees,
        });

        applicationEventBus.emit(ApplicationEventType.PRE_DEMO_SEND_COMPLETED, {
          source: 'preDemo',
          timestamp: Date.now(),
          metadata: { amount: pending.grossAmount, recipient: pending.recipient },
        });
      }, PROCESSING_TIMING.processingDelay + PROCESSING_TIMING.completeDelay);
      timerRef.current.push(t2);
    } else {
      // buy
      const t1 = setTimeout(() => {
        setScreen('buy-complete');
      }, PROCESSING_TIMING.processingDelay);
      timerRef.current.push(t1);

      const t2 = setTimeout(() => {
        dispatch({
          type: 'COMPLETE_BUY',
          grossAmount: pending.grossAmount,
          netAmount: pending.netAmount,
          totalFees: pending.totalFees,
          asset: pending.asset
            ? { symbol: pending.asset.symbol, name: pending.asset.name }
            : { symbol: '', name: '' },
          feeDetails: pending.fees,
        });

        applicationEventBus.emit(ApplicationEventType.PRE_DEMO_BUY_COMPLETED, {
          source: 'preDemo',
          timestamp: Date.now(),
          metadata: {
            amount: pending.grossAmount,
            asset: pending.asset?.symbol,
          },
        });
      }, PROCESSING_TIMING.processingDelay + PROCESSING_TIMING.completeDelay);
      timerRef.current.push(t2);
    }
  }, [txType, processingPrefix, pending, dispatch, setScreen]);

  return (
    <div className={styles.screen}>
      <DemoHeader />

      <div className={styles.screenContent}>
        {/* Back button */}
        <button
          onClick={() => {
            dispatch({ type: 'CLEAR_PENDING' });
            setScreen(backScreen as Parameters<typeof setScreen>[0]);
          }}
          className={styles.backButton}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {t('preDemo.common.back')}
        </button>

        {/* Title + subtitle */}
        <h2 className={styles.sectionTitle}>{t(titleKey)}</h2>
        <p className={styles.sectionSubtitle}>{t('preDemo.confirm.subtitle')}</p>

        {/* Transaction details card */}
        <div className={styles.confirmCard}>
          <div className={styles.confirmHeader}>
            <div className={styles.confirmIcon}>
              <TypeIcon type={txType} />
            </div>
            <div>
              <div className={styles.confirmTypeLabel}>{t(typeLabelKey)}</div>
              {pending.paymentMethod && (
                <div className={styles.confirmMethod}>
                  {getMethodDisplay(pending.paymentMethod)}
                </div>
              )}
            </div>
          </div>

          {/* Recipient (send only) */}
          {txType === 'send' && pending.recipient && (
            <div className={styles.confirmDetail}>
              <span className={styles.confirmDetailLabel}>
                {t('preDemo.confirm.recipient')}
              </span>
              <span className={styles.confirmDetailValue}>{pending.recipient}</span>
            </div>
          )}

          {/* Asset (buy only) */}
          {txType === 'buy' && pending.asset && (
            <div className={styles.confirmDetail}>
              <span className={styles.confirmDetailLabel}>
                {t('preDemo.confirm.asset')}
              </span>
              <span className={styles.confirmDetailValue}>
                {pending.asset.name} ({pending.asset.symbol})
              </span>
            </div>
          )}

          {/* Total amount */}
          <div className={styles.confirmDetail}>
            <span className={styles.confirmDetailLabel}>
              {t('preDemo.confirm.totalAmount')}
            </span>
            <span className={styles.confirmDetailValue}>
              {formatCurrency(pending.grossAmount)}
            </span>
          </div>
        </div>

        {/* Fee breakdown (always expanded, negative amounts) */}
        <FeeBreakdown
          feeItems={pending.fees}
          totalFees={pending.totalFees}
          alwaysExpanded
        />

        {/* Net amount — crypto format for buy, fiat for others */}
        <div className={styles.confirmTotal}>
          <span>{t(receiveKey)}</span>
          {txType === 'buy' && pending.asset && cryptoQuantity > 0 ? (
            <div style={{ textAlign: 'right' }}>
              <span className={styles.confirmTotalAmount}>
                {cryptoQuantity.toFixed(8)} {pending.asset.symbol}
              </span>
              <br />
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                {intl.formatMessage({ id: 'preDemo.transaction.approximate', defaultMessage: '≈' })} {formatCurrency(pending.netAmount)}
              </span>
            </div>
          ) : (
            <span className={styles.confirmTotalAmount}>
              {formatCurrency(pending.netAmount)}
            </span>
          )}
        </div>

        {/* Terms checkbox with colored border */}
        <div className={styles.termsCardHighlighted}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={state.termsAccepted}
              onChange={(e) =>
                dispatch({ type: 'SET_TERMS_ACCEPTED', accepted: e.target.checked })
              }
              className={styles.checkbox}
            />
            <span className={styles.checkboxText}>{t(termsKey)}</span>
          </label>
        </div>

        {/* Confirm button — type-specific text */}
        <button
          onClick={handleConfirm}
          disabled={!state.termsAccepted}
          className={styles.primaryButton}
        >
          {t(confirmButtonKey)}
        </button>
      </div>

      <DemoFooter />
    </div>
  );
}
