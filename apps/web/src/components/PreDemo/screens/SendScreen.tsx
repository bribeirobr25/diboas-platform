'use client';

import { useMemo, useCallback } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { Select } from '@diboas/ui';
import { usePreDemo } from '../PreDemoProvider';
import { DemoHeader } from '../components/DemoHeader';
import { DemoFooter } from '../components/DemoFooter';
import { BalanceCard } from '../components/BalanceCard';
import { FeeBreakdown } from '../components/FeeBreakdown';
import { processSend, SEND_QUICK_AMOUNTS, RECIPIENT_OPTIONS, formatCurrency } from '@/lib/pre-demo';
import { useLocale } from '@/components/Providers';
import { getCurrencyForLocale, getCurrencySymbol } from '@/config/formats';
import { analyticsService } from '@/lib/analytics';
import styles from '../PreDemo.module.css';

export function SendScreen() {
  const intl = useTranslation();
  const { state, dispatch, setScreen } = usePreDemo();

  const { locale } = useLocale();
  const currencySymbol = getCurrencySymbol(getCurrencyForLocale(locale));

  const t = (key: string) => intl.formatMessage({ id: key });

  const amount = parseFloat(state.sendAmount) || 0;
  const sendResult = useMemo(
    () => processSend(amount, state.selectedRecipient, state.cashBalance, state.solBalance),
    [amount, state.selectedRecipient, state.cashBalance, state.solBalance]
  );
  const insufficientFunds = sendResult.errorCode === 'INSUFFICIENT_FUNDS';

  const handleAmountChange = useCallback(
    (value: string) => {
      const sanitized = value.replace(/[^0-9.]/g, '');
      dispatch({ type: 'SET_SEND_AMOUNT', amount: sanitized });
    },
    [dispatch]
  );

  const handleQuickAmount = useCallback(
    (quickAmount: string) => {
      analyticsService.track({
        name: 'pre_demo_send_quick_amount',
        parameters: { amount: quickAmount },
      });
      dispatch({ type: 'SET_SEND_AMOUNT', amount: quickAmount });
    },
    [dispatch]
  );

  const handleRecipientChange = useCallback(
    (handle: string) => {
      analyticsService.track({
        name: 'pre_demo_send_recipient_change',
        parameters: { recipient: handle },
      });
      dispatch({ type: 'SET_SELECTED_RECIPIENT', recipient: handle });
    },
    [dispatch]
  );

  const handleProceed = useCallback(() => {
    if (!sendResult.isValid) return;

    dispatch({
      type: 'SET_PENDING_TRANSACTION',
      transaction: sendResult.pending,
    });

    setScreen('send-confirm');
  }, [sendResult, dispatch, setScreen]);

  return (
    <div className={styles.screen}>
      <DemoHeader />

      <div className={styles.screenContent}>
        {/* Back button */}
        <button onClick={() => setScreen('home')} className={styles.backButton}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
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
          <button className={`${styles.tab} ${styles.tabActive}`}>{t('preDemo.send.send')}</button>
          <button className={`${styles.tab} ${styles.tabDisabled}`} disabled>
            {t('preDemo.send.payment')}
          </button>
        </div>

        {/* Recipient selector */}
        <div className={styles.inputGroup}>
          <label htmlFor="predemo-send-recipient" className={styles.inputLabel}>
            {t('preDemo.send.recipientLabel')}
          </label>
          <Select
            id="predemo-send-recipient"
            name="recipient"
            value={state.selectedRecipient}
            onChange={(e) => handleRecipientChange(e.target.value)}
            aria-label={t('preDemo.send.recipientLabel')}
          >
            {RECIPIENT_OPTIONS.map((recipient) => (
              <option key={recipient.handle} value={recipient.handle}>
                {recipient.handle} - {recipient.name}
              </option>
            ))}
          </Select>
          <span className={styles.onChainNote}>{t('preDemo.send.onChainTransfer')}</span>
        </div>

        {/* Amount label */}
        <label htmlFor="predemo-send-amount" className={styles.fieldLabel}>
          {t('preDemo.send.amountLabel')}
        </label>

        {/* Amount input */}
        <div className={styles.amountInputContainer}>
          <span className={styles.amountPrefix}>{currencySymbol}</span>
          <input
            id="predemo-send-amount"
            name="sendAmount"
            type="text"
            inputMode="decimal"
            value={state.sendAmount}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder="0.00"
            className={styles.amountInput}
            aria-label={t('preDemo.send.amountLabel')}
          />
        </div>

        {/* Insufficient funds warning */}
        {insufficientFunds && amount > 0 && (
          <div className={styles.warningBanner}>{t('preDemo.send.insufficientFunds')}</div>
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
              {currencySymbol}
              {qa}
            </button>
          ))}
        </div>

        {/* Fee breakdown */}
        {amount > 0 && (
          <FeeBreakdown
            feeItems={sendResult.pending.fees}
            totalFees={sendResult.pending.totalFees}
          />
        )}

        {/* They'll receive row */}
        {amount > 0 && !insufficientFunds && (
          <div className={styles.receiveRow}>
            <span className={styles.receiveLabel}>{t('preDemo.transaction.theyReceive')}</span>
            <span className={styles.receiveAmount}>
              {formatCurrency(sendResult.pending.netAmount, 2, locale)}
            </span>
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
