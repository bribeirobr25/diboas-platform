/**
 * WalletCard — single chain wallet card with token list, L2 section, export key
 * Extracted from WalletDetailsScreen for file decoupling (≤150 lines).
 */

import { CopyIcon, KeyIcon } from '../components/Icons';
import { ChainSvgIcon, L2ChainIcon } from '../components/ChainIcons';
import {
  CHAIN_CONFIG,
  WALLET_ADDRESSES,
  formatCurrency,
  type ChainId,
  type TokenBalance,
} from '@/lib/pre-demo';
import { CHAIN_BG_COLORS, CHAIN_TEXT_COLORS } from '@/lib/constants/crypto-colors';
import type { SupportedLocale } from '@diboas/i18n/server';
import { truncateAddress, getWalletTotalValue, ChevronIcon } from './walletHelpers';
import { analyticsService } from '@/lib/analytics';
import styles from '../PreDemo.module.css';

interface WalletCardProps {
  chain: ChainId;
  tokens: TokenBalance[];
  isCopied: boolean;
  copyFeedback: string | null;
  l2Expanded: boolean;
  locale: SupportedLocale;
  t: (key: string) => string;
  onCopyAddress: (chain: ChainId) => void;
  onToggleL2: () => void;
  onExportKey: (chain: ChainId) => void;
}

export function WalletCard({
  chain,
  tokens,
  isCopied,
  copyFeedback,
  l2Expanded,
  locale,
  t,
  onCopyAddress,
  onToggleL2,
  onExportKey,
}: WalletCardProps) {
  const config = CHAIN_CONFIG[chain];
  const address = WALLET_ADDRESSES[chain];
  const totalValue = getWalletTotalValue(tokens);
  const isComingSoon = config.comingSoon === true;

  return (
    <div
      className={`${styles.walletCard} ${isComingSoon ? styles.walletCardDisabled : ''}`}
    >
      {/* Wallet header */}
      <div className={styles.walletHeader}>
        <div
          className={`${styles.chainIcon} ${styles.chainIconBox}`}
          style={{ backgroundColor: CHAIN_BG_COLORS[chain] }}
        >
          <ChainSvgIcon chain={chain} />
        </div>
        <div className={styles.walletInfo}>
          <div className={styles.walletName}>{config.fullName}</div>
          <div className={styles.walletAddress}>
            {truncateAddress(address)}
            <button
              onClick={() => onCopyAddress(chain)}
              className={styles.copyButton}
              title={t('preDemo.wallet.copyAddress')}
            >
              {isCopied ? (
                <span className={styles.copiedText}>{t('preDemo.wallet.copied')}</span>
              ) : copyFeedback === 'failed' ? (
                <span className={styles.copyFailedText}>
                  {t('preDemo.wallet.copyFailed')}
                </span>
              ) : (
                <CopyIcon />
              )}
            </button>
          </div>
        </div>
        {isComingSoon && (
          <span className={styles.soonBadge}>
            {t('preDemo.wallet.soon')}
          </span>
        )}
        {!isComingSoon && totalValue > 0 && (
          <span
            className={styles.walletHeaderTotal}
            style={{ color: CHAIN_TEXT_COLORS[chain] }}
          >
            {formatCurrency(totalValue, 2, locale)}
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
                  <span className={`${styles.tokenAmount} ${styles.textMuted}`}>
                    0
                  </span>
                ) : token.symbol === 'USDC' ? (
                  <span className={styles.tokenAmount}>
                    {formatCurrency(token.usdValue, 2, locale)}
                  </span>
                ) : (
                  <>
                    <span className={styles.tokenAmount}>
                      {token.amount.toFixed(token.decimals)}
                    </span>
                    <span className={styles.tokenUsd}>
                      ≈ {formatCurrency(token.usdValue, 2, locale)}
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* L2 expandable section */}
      {config.l2Chains && !isComingSoon && (
        <div className={styles.l2Section}>
          <button
            className={styles.l2Header}
            onClick={() => {
              onToggleL2();
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
                    <span className={`${styles.tokenAmount} ${styles.textMuted}`}>
                      0
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Export private key button */}
      {!isComingSoon && (
        <button
          className={styles.exportKeyButton}
          onClick={() => onExportKey(chain)}
        >
          <KeyIcon />
          {t('preDemo.wallet.exportKey')}
        </button>
      )}
    </div>
  );
}
