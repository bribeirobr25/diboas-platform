/**
 * AssetIcon — branded icons for crypto assets with 2-letter fallback
 * Extracted from BuyScreen for file decoupling (≤150 lines).
 */

import { CRYPTO_COLORS } from '@/lib/constants/crypto-colors';
import styles from '../PreDemo.module.css';

const FALLBACK_COLOR_MAP: Record<string, string> = {
  SP: '#1a73e8',
  QQ: '#e91e63',
  IW: '#2196f3',
  AP: '#333',
  GO: '#4caf50',
  TS: '#f44336',
  NV: '#76b900',
  MS: '#00a1f1',
};

export function AssetIcon({ symbol }: { symbol: string }) {
  // BTC
  if (symbol === 'BTC') {
    return (
      <div className={styles.assetIcon} style={{ background: CRYPTO_COLORS.BTC }}>
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path fill="white" d="M15.3 10.5c.2-1.2-.7-1.8-2-2.2l.4-1.6-1-.3-.4 1.5c-.3-.1-.5-.1-.8-.2l.4-1.5-1-.3-.4 1.6c-.2-.1-.4-.1-.6-.2l-1.4-.3-.3 1.1s.7.2.7.2c.4.1.5.4.5.6l-.5 2.1c0 0 .1 0 .1 0l-.1 0-.7 2.9c-.1.2-.2.4-.6.3 0 0-.7-.2-.7-.2l-.5 1.2 1.3.3c.2.1.5.1.7.2l-.4 1.6 1 .3.4-1.6c.3.1.5.2.8.2l-.4 1.6 1 .3.4-1.6c1.7.3 2.9.2 3.4-1.3.4-1.2 0-1.9-.9-2.4.7-.2 1.2-.6 1.3-1.5zm-2.3 3.3c-.3 1.2-2.3.6-3 .4l.5-2.1c.7.2 2.8.5 2.5 1.7zm.3-3.3c-.3 1.1-1.9.5-2.5.4l.5-1.9c.6.1 2.3.4 2 1.5z" />
        </svg>
      </div>
    );
  }

  // XAUT
  if (symbol === 'XAUT') {
    return (
      <div className={styles.assetIcon} style={{ background: CRYPTO_COLORS.XAUT }}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
          <rect x="7" y="8" width="10" height="8" rx="1" />
          <rect x="9" y="6" width="6" height="3" rx="0.5" />
        </svg>
      </div>
    );
  }

  // ETH
  if (symbol === 'ETH') {
    return (
      <div className={styles.assetIcon} style={{ background: CRYPTO_COLORS.ETH }}>
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path fill="white" fillOpacity="0.6" d="M12 4v6l5 2.5z" />
          <path fill="white" d="M12 4l-5 8.5 5-2.5z" />
          <path fill="white" fillOpacity="0.6" d="M12 15.5v4.5l5-7z" />
          <path fill="white" d="M12 15.5l-5-2.5 5 7z" />
          <path fill="white" fillOpacity="0.2" d="M12 14.5l5-2.5-5-2.5z" />
          <path fill="white" fillOpacity="0.6" d="M7 12l5 2.5v-5z" />
        </svg>
      </div>
    );
  }

  // SOL
  if (symbol === 'SOL') {
    return (
      <div className={styles.assetIcon} style={{ background: `linear-gradient(135deg, ${CRYPTO_COLORS.SOL}, #14F195)` }}>
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path fill="white" d="M4.5 16.5l2.3-2.3c.1-.1.3-.2.4-.2h12.3c.3 0 .4.3.2.5l-2.3 2.3c-.1.1-.3.2-.4.2H4.7c-.3 0-.4-.3-.2-.5zm2.3-5.3c.1-.1.3-.2.4-.2h12.3c.3 0 .4.3.2.5l-2.3 2.3c-.1.1-.3.2-.4.2H4.7c-.3 0-.4-.3-.2-.5l2.3-2.3zm12.5-4l-2.3 2.3c-.1.1-.3.2-.4.2H4.3c-.3 0-.4-.3-.2-.5l2.3-2.3c.1-.1.3-.2.4-.2h12.3c.3 0 .4.3.2.5z" />
        </svg>
      </div>
    );
  }

  // SUI
  if (symbol === 'SUI') {
    return (
      <div className={styles.assetIcon} style={{ background: CRYPTO_COLORS.SUI }}>
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path fill="white" d="M12 6c-2.5 0-4.5 2-4.5 4.5 0 1.5.7 2.8 1.8 3.6l2.2 2.2c.3.3.7.3 1 0l2.2-2.2c1.1-.8 1.8-2.1 1.8-3.6C16.5 8 14.5 6 12 6zm0 7c-1.4 0-2.5-1.1-2.5-2.5S10.6 8 12 8s2.5 1.1 2.5 2.5S13.4 13 12 13z" />
        </svg>
      </div>
    );
  }

  // Fallback: 2-letter colored icon
  const letters = symbol.slice(0, 2);
  const color = FALLBACK_COLOR_MAP[letters] || '#64748b';

  return (
    <div className={styles.assetIcon} style={{ background: color }}>
      {letters}
    </div>
  );
}
