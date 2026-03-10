import {
  ASSET_PRICES,
  SOL_GAS_RESERVE,
  type ChainId,
  type TokenBalance,
  type Investments,
} from '@/lib/pre-demo';
import styles from '../PreDemo.module.css';

export function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/** Background colors per chain for icon containers */
export const CHAIN_BG_COLORS: Record<ChainId, string> = {
  SOL: '#f5f3ff',
  BTC: '#fff7ed',
  ETH: '#eff6ff',
  SUI: '#ecfeff',
  TRX: '#fff5f5',
};

/** Text colors per chain for fiat totals */
export const CHAIN_TEXT_COLORS: Record<ChainId, string> = {
  SOL: '#9945FF',
  BTC: '#F7931A',
  ETH: '#627EEA',
  SUI: '#4DA2FF',
  TRX: '#FF0013',
};

export function getWalletTokens(
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
export function getWalletTotalValue(tokens: TokenBalance[]): number {
  return tokens.reduce((sum, t) => sum + t.usdValue, 0);
}

/** Chevron icon for expand/collapse */
export function ChevronIcon({ expanded }: { expanded: boolean }) {
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
