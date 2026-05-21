/**
 * Asset History calculator — retrospective performance of 8 assets across
 * 2 start years (2010, 2016) and 2 modes (lump sum, monthly DCA).
 *
 * Phase E (2026-05-16). Math runs against the locked historical anchor table
 * from `marketDataService.getHistoricalAnchors()` (Phase C+).
 *
 * Confidence stratification per audit M6:
 *   - HIGH:    single terminal number ±5%
 *   - MEDIUM:  single number with explicit ± uncertainty bar
 *   - LOW:     RANGE display, NOT a single number — calm-framing principle
 *
 * BTC DCA starting 2010 is the only LOW-confidence case in scope: research
 * `btc-vs-assets-inflation-fx-final-analysis.md` Part 1 documents the
 * $500M–$1.5B range for $100/month over 190 months — public DCA calculators
 * differ by ±50% on this window. We surface the range, scaled linearly with
 * user-provided amount.
 *
 * DCA terminal-value approach:
 *   - For research-validated scenarios (8 assets × 2 years per Part 1/Part 2
 *     tables), we use the research's pre-computed terminal-value-per-$100/mo
 *     and scale linearly with user contribution. This avoids the linear-
 *     interpolation under-counting trap that affects high-volatility assets
 *     (a naive end-vs-start interpolation under-counts BTC 2016 by 4×).
 *   - LUMP SUM uses the simple start→end ratio (`amount × end/start`) which
 *     is exact regardless of path.
 */

import {
  marketDataService,
  type AssetAnchor,
  type AssetCode,
  type AnchorConfidence,
  type AnchorYear,
} from '@/lib/market-data';

const END_YEAR: AnchorYear = 2026;
const END_MONTH = 5;

export interface AssetHistoryArgs {
  asset: AssetCode;
  startYear: 2010 | 2016;
  mode: 'lumpSum' | 'monthlyDca';
  amount: number;
}

export interface AssetHistoryResult {
  startAnchor: AssetAnchor;
  endAnchor: AssetAnchor;
  totalContributed: number;
  confidence: AnchorConfidence;
  /** Terminal value when confidence allows a single number; null when LOW. */
  terminalValue: number | null;
  /** Only populated for LOW-confidence outcomes (BTC DCA 2010). */
  rangeLow?: number;
  rangeHigh?: number;
  /** Months spanned by the DCA window (ignored for lump sum). */
  months: number;
}

export class AssetHistoryDataError extends Error {
  constructor(reason: string) {
    super(`Asset history data unavailable: ${reason}`);
    this.name = 'AssetHistoryDataError';
  }
}

export function calculateAssetHistory(args: AssetHistoryArgs): AssetHistoryResult {
  const anchors = marketDataService.getHistoricalAnchors();
  if (!anchors) {
    throw new AssetHistoryDataError('marketDataService.getHistoricalAnchors() returned undefined');
  }

  const startAnchor = anchors.anchors.find(
    (a) => a.asset === args.asset && a.year === args.startYear,
  );
  const endAnchor = anchors.anchors.find((a) => a.asset === args.asset && a.year === END_YEAR);
  if (!startAnchor || !endAnchor) {
    throw new AssetHistoryDataError(`anchors missing for ${args.asset} ${args.startYear} → ${END_YEAR}`);
  }

  const months = monthsBetween(
    args.startYear,
    startAnchor.monthIndicative,
    END_YEAR,
    END_MONTH,
  );

  // BTC DCA 2010 is the only LOW-confidence path — research Part 1 documents
  // the $500M–$1.5B range for $100/month over 190 months. We scale linearly
  // with the user-provided amount.
  if (args.asset === 'BTC' && args.startYear === 2010 && args.mode === 'monthlyDca') {
    const scale = args.amount / 100;
    return {
      startAnchor,
      endAnchor,
      totalContributed: args.amount * months,
      confidence: 'LOW',
      terminalValue: null,
      rangeLow: 500_000_000 * scale,
      rangeHigh: 1_500_000_000 * scale,
      months,
    };
  }

  if (args.mode === 'lumpSum') {
    const terminalValue = args.amount * (endAnchor.price / startAnchor.price);
    return {
      startAnchor,
      endAnchor,
      totalContributed: args.amount,
      confidence: pairConfidence(startAnchor.confidence, endAnchor.confidence),
      terminalValue,
      months,
    };
  }

  // Monthly DCA — use research-validated terminal-per-$100/mo (research
  // doc Parts 1 + 2 tables), scaled linearly with user contribution.
  const dcaTerminal = DCA_TERMINAL_PER_100[args.asset]?.[args.startYear];
  if (dcaTerminal === undefined) {
    throw new AssetHistoryDataError(
      `DCA terminal value not validated for ${args.asset} ${args.startYear}`,
    );
  }
  const scale = args.amount / 100;
  const terminalValue = dcaTerminal * scale;

  // DCA over volatile assets (BTC) — uncertainty meaningful even when
  // research provides a HIGH number, because BTC anchor-month-by-month
  // volatility is large. Cap at MEDIUM unless overridden.
  const confidence: AnchorConfidence =
    args.asset === 'BTC' ? 'MEDIUM' : pairConfidence(startAnchor.confidence, endAnchor.confidence);

  return {
    startAnchor,
    endAnchor,
    totalContributed: args.amount * months,
    confidence,
    terminalValue,
    months,
  };
}

/**
 * Research-validated DCA terminal values per $100/month, by asset × start
 * year. Source: docs/researches/btc-vs-assets-inflation-fx-final-analysis.md
 * Parts 1 (Jul 2010 → May 2026, 190 months, $19,000 total) and Part 2
 * (Mar 2016 → May 2026, 122 months, $12,200 total).
 *
 * For Ibovespa, value is in BRL (asset is BRL-priced).
 * For DAX, value is in EUR (asset is EUR-priced).
 * All others in USD.
 *
 * BTC 2010 is excluded — handled as LOW-confidence RANGE in the caller above.
 */
const DCA_TERMINAL_PER_100: Partial<Record<AssetCode, Record<2010 | 2016, number>>> = {
  BTC: { 2010: 0, 2016: 200_000 }, // 2010 unused — LOW-confidence branch returns early
  SP500: { 2010: 66_000, 2016: 22_000 },
  QQQ: { 2010: 110_000, 2016: 28_000 },
  GOLD: { 2010: 33_000, 2016: 22_000 },
  MSCI_WORLD: { 2010: 40_000, 2016: 20_000 },
  DAX: { 2010: 33_000, 2016: 17_000 },
  IBOVESPA: { 2010: 30_000, 2016: 22_000 },
  TLT: { 2010: 23_000, 2016: 13_500 },
};

function monthsBetween(
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number,
): number {
  return (endYear - startYear) * 12 + (endMonth - startMonth);
}

function pairConfidence(a: AnchorConfidence, b: AnchorConfidence): AnchorConfidence {
  // Confidence pair takes the worst — pessimistic by design.
  if (a === 'LOW' || b === 'LOW') return 'LOW';
  if (a === 'MEDIUM' || b === 'MEDIUM') return 'MEDIUM';
  return 'HIGH';
}
