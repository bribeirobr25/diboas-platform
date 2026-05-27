'use client';

/**
 * WalletDetailsScreen — orchestrator component
 * Sub-components: PortfolioCard, WalletCard, ExportKeyModal
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { usePreDemo } from '../PreDemoProvider';
import { DemoHeader } from '../components/DemoHeader';
import { DemoFooter } from '../components/DemoFooter';
import { BackIcon } from '../components/Icons';
import { CHAIN_ORDER, ASSET_PRICES, WALLET_ADDRESSES, type ChainId } from '@/lib/pre-demo';
import { useLocale } from '@/components/Providers';
import { analyticsService } from '@/lib/analytics';
import { getWalletTokens } from './walletHelpers';
import { PortfolioCard } from './PortfolioCard';
import { WalletCard } from './WalletCard';
import { ExportKeyModal } from './ExportKeyModal';
import styles from '../PreDemo.module.css';

export function WalletDetailsScreen() {
  const intl = useTranslation();
  const { state, dispatch, setScreen } = usePreDemo();
  const { locale } = useLocale();
  const [showExportModal, setShowExportModal] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [l2Expanded, setL2Expanded] = useState(false);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Clear feedback timer on unmount
  useEffect(() => {
    return () => clearTimeout(feedbackTimerRef.current);
  }, []);

  const t = (key: string) => intl.formatMessage({ id: key });

  const totalInvestments = useMemo(() => {
    return Object.values(state.investments.assets).reduce((sum, asset) => sum + asset.amount, 0);
  }, [state.investments.assets]);

  const solReserveValue = state.solBalance * ASSET_PRICES.SOL;
  const totalBalance = state.cashBalance + totalInvestments + solReserveValue;

  const handleCopyAddress = useCallback(
    (chain: ChainId) => {
      analyticsService.track({ name: 'pre_demo_wallet_copy_address', parameters: { chain } });
      const address = WALLET_ADDRESSES[chain];
      navigator.clipboard
        .writeText(address)
        .then(() => {
          setCopyFeedback('copied');
          dispatch({ type: 'SET_COPIED_ADDRESS', chain });
          clearTimeout(feedbackTimerRef.current);
          feedbackTimerRef.current = setTimeout(() => {
            dispatch({ type: 'SET_COPIED_ADDRESS', chain: null });
            setCopyFeedback(null);
          }, 2000);
        })
        .catch(() => {
          setCopyFeedback('failed');
          clearTimeout(feedbackTimerRef.current);
          feedbackTimerRef.current = setTimeout(() => setCopyFeedback(null), 2000);
        });
    },
    [dispatch]
  );

  const handleExportKey = useCallback((chain: ChainId) => {
    analyticsService.track({ name: 'pre_demo_wallet_export_key_open', parameters: { chain } });
    setShowExportModal(true);
  }, []);

  return (
    <div className={styles.screen}>
      <DemoHeader />

      <div className={styles.screenContent}>
        {/* Back button */}
        <button onClick={() => setScreen('home')} className={styles.backButton}>
          <BackIcon />
          {t('preDemo.common.back')}
        </button>

        {/* Title */}
        <h2 className={styles.sectionTitle}>{t('preDemo.wallet.title')}</h2>
        <p className={styles.sectionSubtitle}>{t('preDemo.wallet.subtitle')}</p>

        {/* Total portfolio gradient card */}
        <PortfolioCard
          totalBalance={totalBalance}
          cashBalance={state.cashBalance + solReserveValue}
          totalInvestments={totalInvestments}
          locale={locale}
          t={t}
        />

        {/* Wallet cards */}
        <div className={styles.walletList}>
          {CHAIN_ORDER.map((chain) => {
            const tokens = getWalletTokens(
              chain,
              state.cashBalance,
              state.investments,
              state.solBalance
            );
            return (
              <WalletCard
                key={chain}
                chain={chain}
                tokens={tokens}
                isCopied={state.copiedAddress === chain}
                copyFeedback={copyFeedback}
                l2Expanded={l2Expanded}
                locale={locale}
                t={t}
                onCopyAddress={handleCopyAddress}
                onToggleL2={() => setL2Expanded((prev) => !prev)}
                onExportKey={handleExportKey}
              />
            );
          })}
        </div>

        {/* Self-custody notice */}
        <div className={styles.selfCustodyNotice}>
          <div className={styles.selfCustodyIcon}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <div className={styles.selfCustodyTitle}>{t('preDemo.wallet.selfCustodyTitle')}</div>
            <div className={styles.selfCustodyText}>{t('preDemo.wallet.selfCustodyText')}</div>
          </div>
        </div>
      </div>

      <DemoFooter />

      {/* Export Key Modal */}
      {showExportModal && <ExportKeyModal onClose={() => setShowExportModal(false)} t={t} />}
    </div>
  );
}
