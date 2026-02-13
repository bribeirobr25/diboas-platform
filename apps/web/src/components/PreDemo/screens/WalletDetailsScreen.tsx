'use client';

import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { usePreDemo } from '../PreDemoProvider';
import { DemoHeader } from '../components/DemoHeader';
import { DemoFooter } from '../components/DemoFooter';
import {
  CHAIN_CONFIG,
  WALLET_ADDRESSES,
  CHAIN_ORDER,
  ASSET_PRICES,
  SOL_GAS_RESERVE,
} from '@/lib/pre-demo';
import type { ChainId, TokenBalance, Investments } from '@/lib/pre-demo';
import styles from '../PreDemo.module.css';

function formatCurrency(amount: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

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
};

/** Text colors per chain for fiat totals */
const CHAIN_TEXT_COLORS: Record<ChainId, string> = {
  SOL: '#9945FF',
  BTC: '#F7931A',
  ETH: '#627EEA',
  SUI: '#4DA2FF',
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
    default:
      return null;
  }
}

/** Heroicons-style copy icon */
function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

/** Heroicons-style key icon */
function KeyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  );
}

/** Alert icon for warning box */
function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ flexShrink: 0, marginTop: 2 }}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

/** External link icon */
function ExternalLinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

/** Close icon */
function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

/** Export Key Modal — matches original demo exactly */
function ExportKeyModal({ onClose }: { onClose: () => void }) {
  return (
    <div className={styles.exportModalOverlay} onClick={onClose}>
      <div className={styles.exportModalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.exportModalHeader}>
          <h2 className={styles.exportModalTitle}>Your Private Keys</h2>
          <button onClick={onClose} className={styles.exportModalClose}>
            <CloseIcon />
          </button>
        </div>

        <div className={styles.exportModalBody}>
          <p className={styles.exportModalText}>
            Your private keys are secured by a <strong>trusted 3rd party wallet provider</strong>.
          </p>
          <p className={styles.exportModalText}>
            <strong>diBoaS never stores or has access to your private keys.</strong> You maintain full control of your wallets.
          </p>

          {/* Amber info box */}
          <div className={styles.exportModalAmberBox}>
            <p className={styles.exportModalAmberTitle}><strong>To export your keys:</strong></p>
            <ol className={styles.exportModalSteps}>
              <li>Open your wallet provider dashboard</li>
              <li>Verify your identity</li>
              <li>Access your recovery phrase</li>
            </ol>
          </div>

          {/* Red warning box */}
          <div className={styles.exportModalRedBox}>
            <p className={styles.exportModalWarningText}>
              <AlertIcon />
              <span><strong>Warning:</strong> Never share your private keys with anyone. Anyone with your keys can access your funds.</span>
            </p>
          </div>
        </div>

        {/* CTA button (disabled in demo) */}
        <button disabled className={styles.exportModalButton}>
          <ExternalLinkIcon />
          Open Wallet Dashboard
          <span className={styles.exportModalButtonDemo}>(Demo)</span>
        </button>

        <p className={styles.exportModalFooter}>
          Secured by 3rd party provider · Industry-leading security
        </p>
      </div>
    </div>
  );
}

export function WalletDetailsScreen() {
  const intl = useTranslation();
  const { state, dispatch, setScreen } = usePreDemo();
  const [showExportModal, setShowExportModal] = useState(false);

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
      const address = WALLET_ADDRESSES[chain];
      navigator.clipboard.writeText(address).catch(() => {
        // Fallback: ignore clipboard errors in demo
      });
      dispatch({ type: 'SET_COPIED_ADDRESS', chain });
      setTimeout(() => {
        dispatch({ type: 'SET_COPIED_ADDRESS', chain: null });
      }, 2000);
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
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
                        ) : (
                          <CopyIcon />
                        )}
                      </button>
                    </div>
                  </div>
                  {/* "Soon" badge for comingSoon chains */}
                  {isComingSoon && (
                    <span className={styles.soonBadge}>
                      {intl.formatMessage({ id: 'preDemo.wallet.soon', defaultMessage: 'Soon' })}
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
                    {intl.formatMessage({ id: 'preDemo.wallet.noTokensYet', defaultMessage: 'No tokens yet' })}
                  </p>
                ) : (
                  <div className={styles.tokenList}>
                    {tokens.map((token) => (
                      <div key={token.label || token.symbol} className={styles.tokenItem}>
                        <span className={styles.tokenSymbol}>
                          {token.label === 'solNetworkFees'
                            ? intl.formatMessage({ id: 'preDemo.wallet.solNetworkFees', defaultMessage: 'SOL for network fees' })
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

                {/* Export private key button — only for non-comingSoon chains */}
                {!isComingSoon && (
                  <button
                    className={styles.exportKeyButton}
                    onClick={() => setShowExportModal(true)}
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
        <ExportKeyModal onClose={() => setShowExportModal(false)} />
      )}
    </div>
  );
}
