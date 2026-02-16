'use client';

import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { usePreDemo } from '../PreDemoProvider';
import { DemoHeader } from '../components/DemoHeader';
import { DemoFooter } from '../components/DemoFooter';
import { CopyIcon, KeyIcon, AlertIcon, ExternalLinkIcon, CloseIcon, BackIcon } from '../components/Icons';
import {
  CHAIN_CONFIG,
  WALLET_ADDRESSES,
  CHAIN_ORDER,
  ASSET_PRICES,
  SOL_GAS_RESERVE,
  formatCurrency,
  type ChainId,
  type TokenBalance,
  type Investments,
} from '@/lib/pre-demo';
import { analyticsService } from '@/lib/analytics';
import styles from '../PreDemo.module.css';

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/** Background colors per chain for icon containers */
const CHAIN_BG_COLORS: Record<ChainId, string> = {
  SOL: '#f5f3ff',
  BTC: '#fff7ed',
  ETH: '#eff6ff',
  SUI: '#ecfeff',
  TRX: '#fff5f5',
};

/** Text colors per chain for fiat totals */
const CHAIN_TEXT_COLORS: Record<ChainId, string> = {
  SOL: '#9945FF',
  BTC: '#F7931A',
  ETH: '#627EEA',
  SUI: '#4DA2FF',
  TRX: '#FF0013',
};

function getWalletTokens(
  chain: ChainId,
  cashBalance: number,
  investments: Investments,
  solBalance: number,
): TokenBalance[] {
  switch (chain) {
    case 'SOL': {
      const reservedSol = Math.min(solBalance, SOL_GAS_RESERVE);
      const extraSol = Math.max(0, solBalance - SOL_GAS_RESERVE);
      const reservedSolUsd = reservedSol * ASSET_PRICES.SOL;
      const extraSolUsd = extraSol * ASSET_PRICES.SOL;
      return [
        { symbol: 'USDC', amount: cashBalance, usdValue: cashBalance, decimals: 2 },
        { symbol: 'SOL', label: 'solNetworkFees', amount: reservedSol, usdValue: reservedSolUsd, decimals: 4 },
        { symbol: 'SOL', label: 'solExtra', amount: extraSol, usdValue: extraSolUsd, decimals: 4 },
      ];
    }
    case 'BTC': {
      const btcInvestment = investments.assets['BTC']?.amount || 0;
      const btcAmount = btcInvestment > 0 ? btcInvestment / ASSET_PRICES.BTC : 0;
      return [
        { symbol: 'BTC', amount: btcAmount, usdValue: btcInvestment, decimals: 8 },
      ];
    }
    case 'ETH': {
      const xautInvestment = investments.assets['XAUT']?.amount || 0;
      const xautAmount = xautInvestment > 0 ? xautInvestment / ASSET_PRICES.XAUT : 0;
      return [
        { symbol: 'XAUT', amount: xautAmount, usdValue: xautInvestment, decimals: 4 },
        { symbol: 'ETH', amount: 0, usdValue: 0, decimals: 4 },
      ];
    }
    case 'SUI':
      return [
        { symbol: 'SUI', amount: 0, usdValue: 0, decimals: 4 },
      ];
    case 'TRX':
      return [
        { symbol: 'TRX', amount: 0, usdValue: 0, decimals: 4 },
      ];
    default:
      return [];
  }
}

/** Calculate total fiat value for a chain */
function getWalletTotalValue(tokens: TokenBalance[]): number {
  return tokens.reduce((sum, t) => sum + t.usdValue, 0);
}

/** Branded chain SVG icons matching the original demo */
function ChainSvgIcon({ chain }: { chain: ChainId }) {
  switch (chain) {
    case 'SOL':
      return (
        <svg viewBox="0 0 24 24" width="20" height="20">
          <defs>
            <linearGradient id="solGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00FFA3" />
              <stop offset="100%" stopColor="#DC1FFF" />
            </linearGradient>
          </defs>
          <path fill="url(#solGrad)" d="M4.5 16.5l2.3-2.3c.1-.1.3-.2.4-.2h12.3c.3 0 .4.3.2.5l-2.3 2.3c-.1.1-.3.2-.4.2H4.7c-.3 0-.4-.3-.2-.5zm2.3-5.3c.1-.1.3-.2.4-.2h12.3c.3 0 .4.3.2.5l-2.3 2.3c-.1.1-.3.2-.4.2H4.7c-.3 0-.4-.3-.2-.5l2.3-2.3zm12.5-4l-2.3 2.3c-.1.1-.3.2-.4.2H4.3c-.3 0-.4-.3-.2-.5l2.3-2.3c.1-.1.3-.2.4-.2h12.3c.3 0 .4.3.2.5z" />
        </svg>
      );
    case 'BTC':
      return (
        <svg viewBox="0 0 24 24" width="20" height="20">
          <circle cx="12" cy="12" r="10" fill="#F7931A" />
          <path fill="white" d="M15.3 10.5c.2-1.2-.7-1.8-2-2.2l.4-1.6-1-.3-.4 1.5c-.3-.1-.5-.1-.8-.2l.4-1.5-1-.3-.4 1.6c-.2-.1-.4-.1-.6-.2l-1.4-.3-.3 1.1s.7.2.7.2c.4.1.5.4.5.6l-.5 2.1c0 0 .1 0 .1 0l-.1 0-.7 2.9c-.1.2-.2.4-.6.3 0 0-.7-.2-.7-.2l-.5 1.2 1.3.3c.2.1.5.1.7.2l-.4 1.6 1 .3.4-1.6c.3.1.5.2.8.2l-.4 1.6 1 .3.4-1.6c1.7.3 2.9.2 3.4-1.3.4-1.2 0-1.9-.9-2.4.7-.2 1.2-.6 1.3-1.5zm-2.3 3.3c-.3 1.2-2.3.6-3 .4l.5-2.1c.7.2 2.8.5 2.5 1.7zm.3-3.3c-.3 1.1-1.9.5-2.5.4l.5-1.9c.6.1 2.3.4 2 1.5z" />
        </svg>
      );
    case 'ETH':
      return (
        <svg viewBox="0 0 24 24" width="20" height="20">
          <circle cx="12" cy="12" r="10" fill="#627EEA" />
          <path fill="white" fillOpacity="0.6" d="M12 4v6l5 2.5z" />
          <path fill="white" d="M12 4l-5 8.5 5-2.5z" />
          <path fill="white" fillOpacity="0.6" d="M12 15.5v4.5l5-7z" />
          <path fill="white" d="M12 15.5l-5-2.5 5 7z" />
          <path fill="white" fillOpacity="0.2" d="M12 14.5l5-2.5-5-2.5z" />
          <path fill="white" fillOpacity="0.6" d="M7 12l5 2.5v-5z" />
        </svg>
      );
    case 'SUI':
      return (
        <svg viewBox="0 0 24 24" width="20" height="20">
          <circle cx="12" cy="12" r="10" fill="#4DA2FF" />
          <path fill="white" d="M12 6c-2.5 0-4.5 2-4.5 4.5 0 1.5.7 2.8 1.8 3.6l2.2 2.2c.3.3.7.3 1 0l2.2-2.2c1.1-.8 1.8-2.1 1.8-3.6C16.5 8 14.5 6 12 6zm0 7c-1.4 0-2.5-1.1-2.5-2.5S10.6 8 12 8s2.5 1.1 2.5 2.5S13.4 13 12 13z" />
        </svg>
      );
    case 'TRX':
      return (
        <svg viewBox="0 0 24 24" width="20" height="20">
          <circle cx="12" cy="12" r="10" fill="#FF0013" />
          <path fill="white" d="M7 7l10 0-5 11z" />
          <path fill="#FF0013" d="M8.5 8l3.5 3.5 3.5-3.5z" />
        </svg>
      );
    default:
      return null;
  }
}

/** Branded L2 chain icons (16x16) */
function L2ChainIcon({ l2Id, color }: { l2Id: string; color: string }) {
  switch (l2Id) {
    case 'ARB':
      return (
        <svg viewBox="0 0 16 16" width="16" height="16">
          <circle cx="8" cy="8" r="7" fill={color} />
          <path fill="white" d="M8 3.5l-3.5 7h2l1.5-3 1.5 3h2z" />
        </svg>
      );
    case 'BASE':
      return (
        <svg viewBox="0 0 16 16" width="16" height="16">
          <circle cx="8" cy="8" r="7" fill={color} />
          <path fill="white" d="M8 4C5.8 4 4 5.8 4 8s1.8 4 4 4 4-1.8 4-4H8V4z" />
        </svg>
      );
    default:
      return null;
  }
}

/** Chevron icon for expand/collapse */
function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      className={`${styles.l2Chevron} ${expanded ? styles.l2ChevronOpen : ''}`}
    >
      <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 6l4 4 4-4" />
    </svg>
  );
}

/** Export Key Modal — matches original demo exactly */
function ExportKeyModal({ onClose, t }: { onClose: () => void; t: (key: string) => string }) {
  return (
    <div className={styles.exportModalOverlay} onClick={onClose}>
      <div className={styles.exportModalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.exportModalHeader}>
          <h2 className={styles.exportModalTitle}>{t('preDemo.wallet.exportModalTitle')}</h2>
          <button onClick={onClose} className={styles.exportModalClose} aria-label={t('preDemo.common.back')}>
            <CloseIcon />
          </button>
        </div>

        <div className={styles.exportModalBody}>
          <p className={styles.exportModalText}>
            {t('preDemo.wallet.exportModalDesc1Prefix')}
            <strong>{t('preDemo.wallet.exportModalDesc1Bold')}</strong>
            {t('preDemo.wallet.exportModalDesc1Suffix')}
          </p>
          <p className={styles.exportModalText}>
            <strong>{t('preDemo.wallet.exportModalDesc2Bold')}</strong>
            {t('preDemo.wallet.exportModalDesc2Suffix')}
          </p>

          {/* Amber info box */}
          <div className={styles.exportModalAmberBox}>
            <p className={styles.exportModalAmberTitle}>
              {t('preDemo.wallet.exportModalStepsTitle')}
            </p>
            <ol className={styles.exportModalSteps}>
              <li>{t('preDemo.wallet.exportModalStep1')}</li>
              <li>{t('preDemo.wallet.exportModalStep2')}</li>
              <li>{t('preDemo.wallet.exportModalStep3')}</li>
            </ol>
          </div>

          {/* Red warning box */}
          <div className={styles.exportModalRedBox}>
            <p className={styles.exportModalWarningText}>
              <AlertIcon />
              <span>
                <strong>{t('preDemo.wallet.exportModalWarningLabel')}</strong>
                {t('preDemo.wallet.exportModalWarningBody')}
              </span>
            </p>
          </div>
        </div>

        {/* CTA button (disabled in demo) */}
        <button disabled className={styles.exportModalButton}>
          <ExternalLinkIcon />
          {t('preDemo.wallet.exportModalButton')}
          <span className={styles.exportModalButtonDemo}>{t('preDemo.wallet.exportModalButtonDemo')}</span>
        </button>

        <p className={styles.exportModalFooter}>
          {t('preDemo.wallet.exportModalFooter')}
        </p>
      </div>
    </div>
  );
}

export function WalletDetailsScreen() {
  const intl = useTranslation();
  const { state, dispatch, setScreen } = usePreDemo();
  const [showExportModal, setShowExportModal] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [l2Expanded, setL2Expanded] = useState(false);

  const t = (key: string) => intl.formatMessage({ id: key });

  const totalInvestments = useMemo(() => {
    return Object.values(state.investments.assets).reduce(
      (sum, asset) => sum + asset.amount,
      0,
    );
  }, [state.investments.assets]);

  const solReserveValue = state.solBalance * ASSET_PRICES.SOL;
  const totalBalance = state.cashBalance + totalInvestments + solReserveValue;

  const handleCopyAddress = useCallback(
    (chain: ChainId) => {
      analyticsService.track({ name: 'pre_demo_wallet_copy_address', parameters: { chain } });
      const address = WALLET_ADDRESSES[chain];
      navigator.clipboard.writeText(address).then(() => {
        setCopyFeedback('copied');
        dispatch({ type: 'SET_COPIED_ADDRESS', chain });
        setTimeout(() => {
          dispatch({ type: 'SET_COPIED_ADDRESS', chain: null });
          setCopyFeedback(null);
        }, 2000);
      }).catch(() => {
        setCopyFeedback('failed');
        setTimeout(() => setCopyFeedback(null), 2000);
      });
    },
    [dispatch],
  );

  return (
    <div className={styles.screen}>
      <DemoHeader />

      <div className={styles.screenContent}>
        {/* Back button */}
        <button
          onClick={() => setScreen('home')}
          className={styles.backButton}
        >
          <BackIcon />
          {t('preDemo.common.back')}
        </button>

        {/* Title */}
        <h2 className={styles.sectionTitle}>
          {t('preDemo.wallet.title')}
        </h2>
        <p className={styles.sectionSubtitle}>
          {t('preDemo.wallet.subtitle')}
        </p>

        {/* Total portfolio gradient card */}
        <div className={styles.portfolioCard}>
          <div className={styles.portfolioLabel}>
            {t('preDemo.wallet.totalBalance')}
          </div>
          <div className={styles.portfolioAmount}>
            {formatCurrency(totalBalance)}
          </div>
          <div className={styles.portfolioBreakdown}>
            <div className={styles.portfolioBreakdownItem}>
              <span className={styles.portfolioBreakdownLabel}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8, marginRight: 4, flexShrink: 0 }}>
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                {t('preDemo.wallet.cash')}
              </span>
              <span>{formatCurrency(state.cashBalance + solReserveValue)}</span>
            </div>
            <div className={styles.portfolioBreakdownItem}>
              <span className={styles.portfolioBreakdownLabel}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8, marginRight: 4, flexShrink: 0 }}>
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
                {t('preDemo.wallet.investments')}
              </span>
              <span>{formatCurrency(totalInvestments)}</span>
            </div>
          </div>
        </div>

        {/* Wallet cards */}
        <div className={styles.walletList}>
          {CHAIN_ORDER.map((chain) => {
            const config = CHAIN_CONFIG[chain];
            const address = WALLET_ADDRESSES[chain];
            const tokens = getWalletTokens(chain, state.cashBalance, state.investments, state.solBalance);
            const isCopied = state.copiedAddress === chain;
            const totalValue = getWalletTotalValue(tokens);
            const isComingSoon = config.comingSoon === true;

            return (
              <div
                key={chain}
                className={`${styles.walletCard} ${isComingSoon ? styles.walletCardDisabled : ''}`}
              >
                {/* Wallet header */}
                <div className={styles.walletHeader}>
                  <div
                    className={styles.chainIcon}
                    style={{
                      backgroundColor: CHAIN_BG_COLORS[chain],
                      borderRadius: 12,
                      width: 40,
                      height: 40,
                    }}
                  >
                    <ChainSvgIcon chain={chain} />
                  </div>
                  <div className={styles.walletInfo}>
                    <div className={styles.walletName}>{config.fullName}</div>
                    <div className={styles.walletAddress}>
                      {truncateAddress(address)}
                      <button
                        onClick={() => handleCopyAddress(chain)}
                        className={styles.copyButton}
                        title={t('preDemo.wallet.copyAddress')}
                      >
                        {isCopied ? (
                          <span className={styles.copiedText}>{t('preDemo.wallet.copied')}</span>
                        ) : copyFeedback === 'failed' ? (
                          <span style={{ color: '#ef4444', fontSize: '0.7rem' }}>
                            {t('preDemo.wallet.copyFailed')}
                          </span>
                        ) : (
                          <CopyIcon />
                        )}
                      </button>
                    </div>
                  </div>
                  {/* "Soon" badge for comingSoon chains */}
                  {isComingSoon && (
                    <span className={styles.soonBadge}>
                      {t('preDemo.wallet.soon')}
                    </span>
                  )}
                  {/* Fiat total */}
                  {!isComingSoon && totalValue > 0 && (
                    <span
                      className={styles.walletHeaderTotal}
                      style={{ color: CHAIN_TEXT_COLORS[chain] }}
                    >
                      {formatCurrency(totalValue)}
                    </span>
                  )}
                </div>

                {/* Token list or "No tokens yet" */}
                {isComingSoon ? (
                  <p className={styles.noTokensText}>
                    {t('preDemo.wallet.noTokensYet')}
                  </p>
                ) : (
                  <div className={styles.tokenList}>
                    {tokens.map((token) => (
                      <div key={token.label || token.symbol} className={styles.tokenItem}>
                        <span className={styles.tokenSymbol}>
                          {token.label === 'solNetworkFees'
                            ? t('preDemo.wallet.solNetworkFees')
                            : token.symbol}
                        </span>
                        <div className={styles.tokenValues}>
                          {token.amount === 0 ? (
                            <span className={styles.tokenAmount} style={{ color: '#94a3b8' }}>
                              0
                            </span>
                          ) : token.symbol === 'USDC' ? (
                            <span className={styles.tokenAmount}>
                              {formatCurrency(token.usdValue)}
                            </span>
                          ) : (
                            <>
                              <span className={styles.tokenAmount}>
                                {token.amount.toFixed(token.decimals)}
                              </span>
                              <span className={styles.tokenUsd}>
                                ≈ {formatCurrency(token.usdValue)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* L2 expandable section — only for chains with l2Chains */}
                {config.l2Chains && !isComingSoon && (
                  <div className={styles.l2Section}>
                    <button
                      className={styles.l2Header}
                      onClick={() => {
                        setL2Expanded(!l2Expanded);
                        analyticsService.track({
                          name: 'pre_demo_wallet_l2_toggle',
                          parameters: { expanded: !l2Expanded },
                        });
                      }}
                    >
                      <span className={styles.l2HeaderLabel}>
                        {t('preDemo.wallet.l2Chains')}
                      </span>
                      <ChevronIcon expanded={l2Expanded} />
                    </button>
                    {l2Expanded && (
                      <div className={styles.l2Content}>
                        {Object.entries(config.l2Chains).map(([id, l2]) => (
                          <div key={id} className={styles.l2ChainItem}>
                            <div className={styles.l2ChainInfo}>
                              <L2ChainIcon l2Id={id} color={l2.color} />
                              <span className={styles.l2ChainName}>{l2.name}</span>
                              <span className={styles.l2ChainAddress}>
                                {truncateAddress(l2.address)}
                              </span>
                            </div>
                            <div className={styles.l2TokenRow}>
                              <span className={styles.tokenSymbol}>{l2.token}</span>
                              <span className={styles.tokenAmount} style={{ color: '#94a3b8' }}>
                                0
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Export private key button — only for non-comingSoon chains */}
                {!isComingSoon && (
                  <button
                    className={styles.exportKeyButton}
                    onClick={() => {
                      analyticsService.track({ name: 'pre_demo_wallet_export_key_open', parameters: { chain } });
                      setShowExportModal(true);
                    }}
                  >
                    <KeyIcon />
                    {t('preDemo.wallet.exportKey')}
                  </button>
                )}
              </div>
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
            <div className={styles.selfCustodyTitle}>
              {t('preDemo.wallet.selfCustodyTitle')}
            </div>
            <div className={styles.selfCustodyText}>
              {t('preDemo.wallet.selfCustodyText')}
            </div>
          </div>
        </div>
      </div>

      <DemoFooter />

      {/* Export Key Modal */}
      {showExportModal && (
        <ExportKeyModal onClose={() => setShowExportModal(false)} t={t} />
      )}
    </div>
  );
}
