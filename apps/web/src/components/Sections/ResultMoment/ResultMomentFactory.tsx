'use client';

/**
 * ResultMoment — the Money Tools "result moment" (Phase 3 redesign crown jewel).
 *
 * A generic, purely presentational surface that turns a computed tool result
 * into a captivating, shareable artifact: the hero figure lands (animated
 * count-up), the divergence draws on, the honest both-sides framing stays in
 * view, a contextual waitlist CTA appears, and a one-tap branded share fires.
 *
 * It is deliberately i18n-free and math-free: every string is pre-resolved and
 * every number pre-computed by the calling calculator (which owns the live
 * `marketDataService` snapshot, the `useResultShare` hook, and the locale
 * formatters). That keeps this component reusable across all priority tools
 * without re-deriving any figure here — one engine, four expressions.
 */

import type { ReactNode } from 'react';
import type { DivergenceSeries } from '@/components/UI/DivergenceChart';
import { ResultMomentDefault } from './variants/Default';

export type ResultMomentVariant = 'default';

/** A secondary figure shown beneath the chart (cash / bank / etc.). */
export interface ResultMomentSupportingPoint {
  id: string;
  label: string;
  /** Pre-formatted value string (locale currency). */
  value: string;
  /** Honest explanatory note (e.g. the FX-rate or bank-rate basis). */
  note?: string;
  /** `primary` highlights the diBoaS outcome; `muted` for comparisons. */
  variant?: 'primary' | 'muted';
}

/** Divergence-chart config (already market-data-bound at the call site). */
export interface ResultMomentChartConfig {
  series: DivergenceSeries[];
  xCaptions?: [string, string];
  formatValue: (value: number) => string;
  ariaLabel: string;
}

/** Contextual waitlist CTA shown after the result. */
export interface ResultMomentCta {
  headline: string;
  body?: string;
  label: string;
  /** Locale-relative href (rendered via LocaleLink). */
  href: string;
}

/** Share control — wired to `useResultShare` by the caller. */
export interface ResultMomentShareControl {
  onShare: () => void | Promise<void>;
  label: string;
  copiedLabel: string;
  copied: boolean;
}

export interface ResultMomentProps {
  variant?: ResultMomentVariant;
  /** Small category label above the figure. */
  eyebrow: string;
  /** The hero figure (animated on first reveal, snaps on live recompute). */
  headlineValue: number;
  /** Formats the animated hero value (locale currency). */
  headlineFormatter: (value: number) => string;
  /**
   * When set, renders this node as the hero INSTEAD of the animated numeric
   * value — for results that are honestly a range, not a point (e.g. asset
   * history's LOW-confidence "calm-framing", audit M6). No count-up, no single
   * precise number.
   */
  headlineOverride?: ReactNode;
  /**
   * Hero color semantics. `positive` (default) = teal action accent for a win;
   * `negative` = accessible error red for a loss (so retrospective tools never
   * celebrate a loss); `neutral` = ink. Honesty over spectacle.
   */
  headlineTone?: 'positive' | 'negative' | 'neutral';
  /** Caption under the hero figure (what the number is). */
  headlineCaption?: ReactNode;
  chart?: ResultMomentChartConfig;
  supportingPoints?: ResultMomentSupportingPoint[];
  /** Honest framing / both-sides disclaimer. */
  disclaimer?: ReactNode;
  cta: ResultMomentCta;
  /**
   * Share control. Omit to suppress sharing entirely — e.g. a LOW-confidence
   * range result must not be broadcast as a single precise number on a card.
   */
  share?: ResultMomentShareControl;
  className?: string;
}

export function ResultMoment({ variant = 'default', ...props }: ResultMomentProps) {
  switch (variant) {
    case 'default':
    default:
      return <ResultMomentDefault {...props} />;
  }
}
