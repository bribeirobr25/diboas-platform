'use client';

import { useMemo, useCallback } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { usePreDemo } from '../PreDemoProvider';
import { DemoHeader } from '../components/DemoHeader';
import { DemoFooter } from '../components/DemoFooter';
import { BalanceCard } from '../components/BalanceCard';
import { FeeBreakdown } from '../components/FeeBreakdown';
import {
  calculateSendFees,
  checkInsufficientFunds,
  SEND_QUICK_AMOUNTS,
  RECIPIENT_OPTIONS,
} from '@/lib/pre-demo';
import styles from '../PreDemo.module.css';

function formatCurrency(amount: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

export function SendScreen() {
  const intl = useTranslation();
  const { state, dispatch, setScreen } = usePreDemo();

  const t = (key: string) => intl.formatMessage({ id: key });

  const amount = parseFloat(state.sendAmount) || 0;
  const fees = useMemo(() => calculateSendFees(amount), [amount]);
  const insufficientFunds = checkInsufficientFunds(
    amount, fees.totalFees, state.cashBalance, state.solBalance,
  );

  const handleAmountChange = useCallback(
    (value: string) => {
      const sanitized = value.replace(/[^0-9.]/g, '');
      dispatch({ type: 'SET_SEND_AMOUNT', amount: sanitized });
    },
    [dispatch],
  );

  const handleQuickAmount = useCallback(
    (quickAmount: string) => {
      dispatch({ type: 'SET_SEND_AMOUNT', amount: quickAmount });
    },
    [dispatch],
  );

  const handleRecipientChange = useCallback(
    (handle: string) => {
      dispatch({ type: 'SET_SELECTED_RECIPIENT', recipient: handle });
    },
    [dispatch],
  );

  const handleProceed = useCallback(() => {
    if (amount <= 0 || insufficientFunds) return;

    dispatch({
      type: 'SET_PENDING_TRANSACTION',
      transaction: {
        type: 'send',
        grossAmount: amount,
        netAmount: fees.netAmount,
        totalFees: fees.totalFees,
        fees: fees.feeItems,
        recipient: state.selectedRecipient,
      },
    });

    setScreen('send-confirm');
  }, [amount, insufficientFunds, fees, state.selectedRecipient, dispatch, setScreen]);

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
            {t('preDemo.send.send')}
          </button>
          <button className={`${styles.tab} ${styles.tabDisabled}`} disabled>
            {t('preDemo.send.payment')}
          </button>
        </div>

        {/* Recipient selector */}
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>
            {t('preDemo.send.recipientLabel')}
          </label>
          <select
            value={state.selectedRecipient}
            onChange={(e) => handleRecipientChange(e.target.value)}
            className={styles.selectField}
          >
            {RECIPIENT_OPTIONS.map((recipient) => (
              <option key={recipient.handle} value={recipient.handle}>
                {recipient.handle} - {recipient.name}
              </option>
            ))}
          </select>
          <span className={styles.onChainNote}>
            {t('preDemo.send.onChainTransfer')}
          </span>
        </div>

        {/* Amount label */}
        <div className={styles.fieldLabel}>
          {t('preDemo.send.amountLabel')}
        </div>

        {/* Amount input */}
        <div className={styles.amountInputContainer}>
          <span className={styles.amountPrefix}>$</span>
          <input
            type="text"
            inputMode="decimal"
            value={state.sendAmount}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder="0.00"
            className={styles.amountInput}
          />
        </div>

        {/* Insufficient funds warning */}
        {insufficientFunds && amount > 0 && (
          <div className={styles.warningBanner}>
            {t('preDemo.send.insufficientFunds')}
          </div>
        )}

        {/* Quick amounts */}
        <div className={styles.quickAmounts}>
          {SEND_QUICK_AMOUNTS.map((qa) => (
            <button
              key={qa}
              onClick={() => handleQuickAmount(qa)}
              className={`${styles.quickAmountButton} ${
                state.sendAmount === qa ? styles.quickAmountActive : ''
              }`}
            >
              ${qa}
            </button>
          ))}
        </div>

        {/* Fee breakdown */}
        {amount > 0 && <FeeBreakdown feeItems={fees.feeItems} totalFees={fees.totalFees} />}

        {/* They'll receive row */}
        {amount > 0 && !insufficientFunds && (
          <div className={styles.receiveRow}>
            <span className={styles.receiveLabel}>{intl.formatMessage({ id: 'preDemo.transaction.theyReceive', defaultMessage: "They'll receive" })}</span>
            <span className={styles.receiveAmount}>{formatCurrency(fees.netAmount)}</span>
          </div>
        )}

        {/* Proceed button */}
        <button
          onClick={handleProceed}
          disabled={amount <= 0 || insufficientFunds}
          className={styles.primaryButton}
        >
          {t('preDemo.send.proceed')}
        </button>
      </div>

      <DemoFooter />
    </div>
  );
}
