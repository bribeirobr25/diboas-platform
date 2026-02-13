'use client';

import { useMemo, useCallback } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { usePreDemo } from '../PreDemoProvider';
import { DemoHeader } from '../components/DemoHeader';
import { DemoFooter } from '../components/DemoFooter';
import { BalanceCard } from '../components/BalanceCard';
import { FeeBreakdown } from '../components/FeeBreakdown';
import { calculateDepositFees, DEPOSIT_QUICK_AMOUNTS } from '@/lib/pre-demo';
import styles from '../PreDemo.module.css';

function formatCurrency(amount: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

export function DepositScreen() {
  const intl = useTranslation();
  const { state, dispatch, setScreen } = usePreDemo();

  const t = (key: string) => intl.formatMessage({ id: key });

  const amount = parseFloat(state.depositAmount) || 0;

  const fees = useMemo(() => calculateDepositFees(amount), [amount]);

  const handleAmountChange = useCallback(
    (value: string) => {
      const sanitized = value.replace(/[^0-9.]/g, '');
      dispatch({ type: 'SET_DEPOSIT_AMOUNT', amount: sanitized });
    },
    [dispatch],
  );

  const handleQuickAmount = useCallback(
    (quickAmount: string) => {
      dispatch({ type: 'SET_DEPOSIT_AMOUNT', amount: quickAmount });
    },
    [dispatch],
  );

  const handleProceed = useCallback(() => {
    if (amount <= 0) return;

    dispatch({
      type: 'SET_PENDING_TRANSACTION',
      transaction: {
        type: 'deposit',
        grossAmount: amount,
        netAmount: fees.netAmount,
        totalFees: fees.totalFees,
        fees: fees.feeItems,
        paymentMethod: 'card',
      },
    });

    setScreen('deposit-confirm');
  }, [amount, fees, dispatch, setScreen]);

  return (
    <div className={styles.screen}>
      <DemoHeader />

      <div className={styles.screenContent}>
        {/* Back button */}
        <button
          onClick={() => setScreen('home')}
          className={styles.backButton}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {t('preDemo.common.back')}
        </button>

        {/* Compact balance card */}
        <div className={styles.compactCard}>
          <BalanceCard compact showTapToView={false} />
        </div>

        {/* Tabs */}
        <div className={styles.tabRow}>
          <button className={`${styles.tab} ${styles.tabActive}`}>
            {t('preDemo.deposit.addMoney')}
          </button>
          <button className={`${styles.tab} ${styles.tabDisabled}`} disabled>
            {t('preDemo.deposit.withdraw')}
          </button>
        </div>

        {/* Payment method label */}
        <div className={styles.fieldLabel}>
          {t('preDemo.deposit.paymentMethod')}
        </div>

        {/* Payment method selector with Heroicons-style icons */}
        <div className={styles.methodRow}>
          <button className={`${styles.methodButton} ${styles.methodActive}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            {t('preDemo.deposit.card')}
          </button>
          <button className={`${styles.methodButton} ${styles.methodDisabled}`} disabled>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            {t('preDemo.deposit.bank')}
          </button>
          <button className={`${styles.methodButton} ${styles.methodDisabled}`} disabled>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            {t('preDemo.deposit.mobile')}
          </button>
        </div>

        {/* Amount label */}
        <div className={styles.fieldLabel}>
          {t('preDemo.deposit.amountLabel')}
        </div>

        {/* Amount input */}
        <div className={styles.amountInputContainer}>
          <span className={styles.amountPrefix}>$</span>
          <input
            type="text"
            inputMode="decimal"
            value={state.depositAmount}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder="0.00"
            className={styles.amountInput}
          />
        </div>

        {/* Quick amounts */}
        <div className={styles.quickAmounts}>
          {DEPOSIT_QUICK_AMOUNTS.map((qa) => (
            <button
              key={qa}
              onClick={() => handleQuickAmount(qa)}
              className={`${styles.quickAmountButton} ${
                state.depositAmount === qa ? styles.quickAmountActive : ''
              }`}
            >
              ${qa}
            </button>
          ))}
        </div>

        {/* Fee breakdown */}
        {amount > 0 && <FeeBreakdown feeItems={fees.feeItems} totalFees={fees.totalFees} />}

        {/* You'll receive row */}
        {amount > 0 && (
          <div className={styles.receiveRow}>
            <span className={styles.receiveLabel}>{intl.formatMessage({ id: 'preDemo.transaction.youllReceive', defaultMessage: "You'll receive" })}</span>
            <span className={styles.receiveAmount}>{formatCurrency(fees.netAmount)}</span>
          </div>
        )}

        {/* Proceed button */}
        <button
          onClick={handleProceed}
          disabled={amount <= 0}
          className={styles.primaryButton}
        >
          {t('preDemo.deposit.proceed')}
        </button>
      </div>

      <DemoFooter />
    </div>
  );
}
