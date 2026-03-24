'use client';

/**
 * ConfirmationScreen — transaction review and confirmation
 * Transaction sequences extracted to TransactionSequences.tsx
 */

import { useCallback, useMemo } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { usePreDemo } from '../PreDemoProvider';
import { DemoHeader } from '../components/DemoHeader';
import { DemoFooter } from '../components/DemoFooter';
import { FeeBreakdown } from '../components/FeeBreakdown';
import { DepositIcon, SendIcon, InvestIcon, BackIcon } from '../components/Icons';
import { formatCurrency } from '@/lib/pre-demo';
import { useLocale } from '@/components/Providers';
import { getIntlLocale } from '@/config/formats';
import { analyticsService } from '@/lib/analytics';
import { buildDepositSequence, buildSendSequence, buildBuySequence } from './TransactionSequences';
import type { TransitionStep } from '../hooks';
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

interface ConfirmationScreenProps {
  runSequence: (steps: TransitionStep[]) => void;
}

export function ConfirmationScreen({ runSequence }: ConfirmationScreenProps) {
  const intl = useTranslation();
  const { state, dispatch, setScreen } = usePreDemo();
  const { locale } = useLocale();

  const t = (key: string) => intl.formatMessage({ id: key });

  const pending = state.pendingTransaction;

  // Calculate crypto quantity for buy
  const cryptoQuantity = useMemo(() => {
    if (!pending || pending.type !== 'buy' || !pending.asset?.price || pending.netAmount <= 0) return 0;
    return pending.netAmount / pending.asset.price;
  }, [pending]);

  const handleConfirm = useCallback(() => {
    if (!pending) return;

    const intlLocale = getIntlLocale(locale);

    if (pending.type === 'deposit') {
      runSequence(buildDepositSequence(pending, dispatch, intlLocale));
    } else if (pending.type === 'send') {
      runSequence(buildSendSequence(pending, dispatch, intlLocale));
    } else {
      runSequence(buildBuySequence(pending, dispatch, intlLocale));
    }
  }, [pending, dispatch, locale, runSequence]);

  if (!pending) return null;

  // Derived keys based on transaction type
  const typeKeys = {
    deposit: { title: 'preDemo.confirm.titleDeposit', typeLabel: 'preDemo.confirm.typeDeposit', back: 'deposit', receive: 'preDemo.confirm.youReceive', terms: 'preDemo.confirm.termsDeposit', confirm: 'preDemo.confirm.confirmDeposit' },
    send: { title: 'preDemo.confirm.titleSend', typeLabel: 'preDemo.confirm.typeSend', back: 'send', receive: 'preDemo.confirm.theyReceive', terms: 'preDemo.confirm.termsSend', confirm: 'preDemo.confirm.confirmTransfer' },
    buy: { title: 'preDemo.confirm.titleBuy', typeLabel: 'preDemo.confirm.typeBuy', back: 'buy', receive: 'preDemo.confirm.youReceive', terms: 'preDemo.confirm.termsBuy', confirm: 'preDemo.confirm.confirmPurchase' },
  } as const;
  const keys = typeKeys[pending.type];

  return (
    <div className={styles.screen}>
      <DemoHeader />

      <div className={styles.screenContent}>
        {/* Back button */}
        <button
          onClick={() => {
            dispatch({ type: 'CLEAR_PENDING' });
            setScreen(keys.back as Parameters<typeof setScreen>[0]);
          }}
          className={styles.backButton}
        >
          <BackIcon />
          {t('preDemo.common.back')}
        </button>

        {/* Title + subtitle */}
        <h2 className={styles.sectionTitle}>{t(keys.title)}</h2>
        <p className={styles.sectionSubtitle}>{t('preDemo.confirm.subtitle')}</p>

        {/* Transaction details card */}
        <div className={styles.confirmCard}>
          <div className={styles.confirmHeader}>
            <div className={styles.confirmIcon}>
              <TypeIcon type={pending.type} />
            </div>
            <div>
              <div className={styles.confirmTypeLabel}>{t(keys.typeLabel)}</div>
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

        {/* Fee breakdown */}
        <FeeBreakdown
          feeItems={pending.fees}
          totalFees={pending.totalFees}
          alwaysExpanded
        />

        {/* Net amount */}
        <div className={styles.confirmTotal}>
          <span>{t(keys.receive)}</span>
          {pending.type === 'buy' && pending.asset && cryptoQuantity > 0 ? (
            <div className={styles.textRight}>
              <span className={styles.confirmTotalAmount}>
                {cryptoQuantity.toFixed(8)} {pending.asset.symbol}
              </span>
              <br />
              <span className={styles.confirmApproxLabel}>
                {t('preDemo.transaction.approximate')} {formatCurrency(pending.netAmount, 2, locale)}
              </span>
            </div>
          ) : (
            <span className={styles.confirmTotalAmount}>
              {formatCurrency(pending.netAmount, 2, locale)}
            </span>
          )}
        </div>

        {/* Terms checkbox */}
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
            <span className={styles.checkboxText}>{t(keys.terms)}</span>
          </label>
        </div>

        {/* Confirm button */}
        <button
          onClick={handleConfirm}
          disabled={!state.termsAccepted}
          className={styles.primaryButton}
        >
          {t(keys.confirm)}
        </button>
      </div>

      <DemoFooter />
    </div>
  );
}
