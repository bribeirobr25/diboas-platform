'use client';

import { useCallback, useMemo, useRef } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { usePreDemo } from '../PreDemoProvider';
import { DemoHeader } from '../components/DemoHeader';
import { DemoFooter } from '../components/DemoFooter';
import { FeeBreakdown } from '../components/FeeBreakdown';
import { DepositIcon, SendIcon, InvestIcon, BackIcon } from '../components/Icons';
import { PROCESSING_TIMING, formatCurrency } from '@/lib/pre-demo';
import { useLocale } from '@/components/Providers';
import { getIntlLocale } from '@/config/formats';
import { analyticsService } from '@/lib/analytics';
import {
  applicationEventBus,
  ApplicationEventType,
} from '@/lib/events/ApplicationEventBus';
import styles from '../PreDemo.module.css';

/** Type icon — delegates to shared Icon components */
function TypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'deposit':
      return <DepositIcon />;
    case 'send':
      return <SendIcon />;
    default:
      return <InvestIcon />;
  }
}

/** Payment method i18n key */
const METHOD_KEYS: Record<string, string> = {
  card: 'preDemo.confirm.methodCard',
  bank: 'preDemo.confirm.methodBank',
  mobile: 'preDemo.confirm.methodMobile',
};

export function ConfirmationScreen() {
  const intl = useTranslation();
  const { state, dispatch, setScreen } = usePreDemo();
  const { locale } = useLocale();
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const t = (key: string) => intl.formatMessage({ id: key });

  const pending = state.pendingTransaction;

  // Calculate crypto quantity for buy (hook must be called unconditionally)
  const cryptoQuantity = useMemo(() => {
    if (!pending || pending.type !== 'buy' || !pending.asset?.price || pending.netAmount <= 0) return 0;
    return pending.netAmount / pending.asset.price;
  }, [pending]);

  const handleConfirm = useCallback(() => {
    if (!pending) return;

    // Clear any existing timers
    timerRef.current.forEach(clearTimeout);
    timerRef.current = [];

    const processingPrefix = pending.type;

    // Start processing flow
    setScreen(`${processingPrefix}-processing` as Parameters<typeof setScreen>[0]);

    // Approved step (only deposit has explicit approved)
    if (pending.type === 'deposit') {
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
          intlLocale: getIntlLocale(locale),
        });

        analyticsService.track({
          name: 'pre_demo_transaction_completed',
          parameters: {
            type: 'deposit',
            amount: pending.grossAmount,
            net_amount: pending.netAmount,
            fees: pending.totalFees,
          },
        });

        applicationEventBus.emit(ApplicationEventType.PRE_DEMO_DEPOSIT_COMPLETED, {
          source: 'preDemo',
          timestamp: Date.now(),
          metadata: { amount: pending.grossAmount },
        });
      }, PROCESSING_TIMING.processingDelay + PROCESSING_TIMING.approvedDelay + PROCESSING_TIMING.completeDelay);
      timerRef.current.push(t3);
    } else if (pending.type === 'send') {
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
          intlLocale: getIntlLocale(locale),
        });

        analyticsService.track({
          name: 'pre_demo_transaction_completed',
          parameters: {
            type: 'send',
            amount: pending.grossAmount,
            net_amount: pending.netAmount,
            fees: pending.totalFees,
            recipient: pending.recipient,
          },
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
          intlLocale: getIntlLocale(locale),
        });

        analyticsService.track({
          name: 'pre_demo_transaction_completed',
          parameters: {
            type: 'buy',
            amount: pending.grossAmount,
            net_amount: pending.netAmount,
            fees: pending.totalFees,
            asset: pending.asset?.symbol,
          },
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
  }, [pending, dispatch, setScreen]);

  if (!pending) return null;

  // Title by type
  const titleKey =
    pending.type === 'deposit'
      ? 'preDemo.confirm.titleDeposit'
      : pending.type === 'send'
        ? 'preDemo.confirm.titleSend'
        : 'preDemo.confirm.titleBuy';

  // Type label
  const typeLabelKey =
    pending.type === 'deposit'
      ? 'preDemo.confirm.typeDeposit'
      : pending.type === 'send'
        ? 'preDemo.confirm.typeSend'
        : 'preDemo.confirm.typeBuy';

  // Back navigation
  const backScreen =
    pending.type === 'deposit'
      ? 'deposit'
      : pending.type === 'send'
        ? 'send'
        : 'buy';

  // "You'll receive" vs "They'll receive"
  const receiveKey =
    pending.type === 'send'
      ? 'preDemo.confirm.theyReceive'
      : 'preDemo.confirm.youReceive';

  // Terms text key
  const termsKey =
    pending.type === 'deposit'
      ? 'preDemo.confirm.termsDeposit'
      : pending.type === 'send'
        ? 'preDemo.confirm.termsSend'
        : 'preDemo.confirm.termsBuy';

  // Confirm button text — type-specific
  const confirmButtonKey =
    pending.type === 'deposit'
      ? 'preDemo.confirm.confirmDeposit'
      : pending.type === 'send'
        ? 'preDemo.confirm.confirmTransfer'
        : 'preDemo.confirm.confirmPurchase';

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
          <BackIcon />
          {t('preDemo.common.back')}
        </button>

        {/* Title + subtitle */}
        <h2 className={styles.sectionTitle}>{t(titleKey)}</h2>
        <p className={styles.sectionSubtitle}>{t('preDemo.confirm.subtitle')}</p>

        {/* Transaction details card */}
        <div className={styles.confirmCard}>
          <div className={styles.confirmHeader}>
            <div className={styles.confirmIcon}>
              <TypeIcon type={pending.type} />
            </div>
            <div>
              <div className={styles.confirmTypeLabel}>{t(typeLabelKey)}</div>
              {pending.paymentMethod && (
                <div className={styles.confirmMethod}>
                  {t(METHOD_KEYS[pending.paymentMethod] || 'preDemo.confirm.methodCard')}
                </div>
              )}
            </div>
          </div>

          {/* Recipient (send only) */}
          {pending.type === 'send' && pending.recipient && (
            <div className={styles.confirmDetail}>
              <span className={styles.confirmDetailLabel}>
                {t('preDemo.confirm.recipient')}
              </span>
              <span className={styles.confirmDetailValue}>{pending.recipient}</span>
            </div>
          )}

          {/* Asset (buy only) */}
          {pending.type === 'buy' && pending.asset && (
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
              {formatCurrency(pending.grossAmount, 2, locale)}
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
          {pending.type === 'buy' && pending.asset && cryptoQuantity > 0 ? (
            <div style={{ textAlign: 'right' }}>
              <span className={styles.confirmTotalAmount}>
                {cryptoQuantity.toFixed(8)} {pending.asset.symbol}
              </span>
              <br />
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                {t('preDemo.transaction.approximate')} {formatCurrency(pending.netAmount, 2, locale)}
              </span>
            </div>
          ) : (
            <span className={styles.confirmTotalAmount}>
              {formatCurrency(pending.netAmount, 2, locale)}
            </span>
          )}
        </div>

        {/* Terms checkbox with colored border */}
        <div className={styles.termsCardHighlighted}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={state.termsAccepted}
              onChange={(e) => {
                analyticsService.track({ name: 'pre_demo_terms_toggle', parameters: { type: pending.type, accepted: e.target.checked } });
                dispatch({ type: 'SET_TERMS_ACCEPTED', accepted: e.target.checked });
              }}
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
