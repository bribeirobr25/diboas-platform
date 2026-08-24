/**
 * State-grammar middle sections (M3 — plan v3 D-M3-2), restructured by the
 * view-voice wave (2026-08-14, founder feedback): the cross-view standard is
 * now "plain lead → diBoaS explanation → expandable depth" —
 *
 *   1. the macro group's generated sentence renders as the BIG lead (its
 *      opening clause bolded when the template carries a colon; graceful
 *      whole-sentence lead when it doesn't — never string-dependent),
 *   2. a static diBoaS-voice explainer says why these three conditions
 *      matter (market.conditions.sectionExplainer ×4 locales),
 *   3. the three condition rows collapse to "title · state word" and expand
 *      (native <details>) to the weekly generated sentence + the educational
 *      explainer — mirroring the scored views' signal-group rows.
 *
 * NO score, NO band words, NO gauge (MM-2: those belong to scored views).
 * Hero/outage/data-status/CTA/methodology/footer stay shared shell chrome.
 *
 * Anti-slop note (plan §7): the sentences also appear inside the Bitcoin
 * view as inputs to its score — justified duplication (macro-as-input vs
 * macro-as-subject); the educational explainers are this page's EARNED
 * differentiator, not a re-arrangement.
 */

import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import type { SignalGroup } from '@/lib/analytics-sdk/types';
import styles from './page.module.css';

const COMPONENTS = [
  { id: 'MAC-01', key: 'dollar' },
  { id: 'MAC-02', key: 'rates' },
  { id: 'MAC-03', key: 'liquidity' },
] as const;

/** EN literal fallbacks (M3a) — the market-backdrop namespace lands in M3b. */
const FALLBACKS: Record<
  string,
  { title: string; active: string; inactive: string; explainer: string }
> = {
  dollar: {
    title: 'The dollar',
    active: 'Softening',
    inactive: 'Firm',
    explainer:
      'The broad dollar index tracks the US dollar against major currencies. A softer dollar tends to loosen global financial conditions; a firm one keeps them tight.',
  },
  rates: {
    title: 'Rates',
    active: 'Easing',
    inactive: 'Firm',
    explainer:
      'The US 10-year Treasury yield is the anchor price of money. Easing yields lower the bar for other assets; firm yields raise it.',
  },
  liquidity: {
    title: 'Liquidity',
    active: 'Expanding',
    inactive: 'Contracting',
    explainer:
      'M2 measures the broad money supply. Expanding liquidity is a supportive backdrop; contraction withdraws it.',
  },
};

/** Colon-split for the bold lead: templates in the macro family open with
 *  "Macro conditions are X: …". When a variant carries no colon the whole
 *  sentence renders as the lead — the split is a presentation preference,
 *  never a parsing dependency. */
function splitLead(sentence: string): { lead: string; rest: string | null } {
  const idx = sentence.indexOf(': ');
  if (idx > 0 && idx < 80) {
    return { lead: sentence.slice(0, idx + 1), rest: sentence.slice(idx + 2) };
  }
  return { lead: sentence, rest: null };
}

interface StateViewSectionsProps {
  viewSlug: string;
  signalGroups: SignalGroup[];
  t: (key: string, fallback: string) => string;
}

export function StateViewSections({ viewSlug, signalGroups, t }: StateViewSectionsProps) {
  const macro = signalGroups.find((g) => g.id === 'macro_environment');
  if (!macro || !macro.signals || macro.signals.length === 0) return null;

  // 5.140 + 5.141: prefer the state-grammar lead, which carries a beat per
  // condition and, unlike `summary`, no "(2 of 3 points)" — a score fragment
  // does not belong on a view whose grammar carries no score. Falls back to
  // `summary` so a dataset generated before this field existed still renders.
  const { lead, rest } = splitLead(macro.state_view?.lead ?? macro.summary ?? '');
  const depth = macro.state_view?.depth;

  return (
    <SectionErrorBoundary
      sectionId="market-backdrop-conditions"
      sectionType="dashboard"
      enableReporting
      context={{ page: 'market', section: 'conditions', view: viewSlug }}
    >
      <section className={styles.scoreSec}>
        {/* The weekly generated read as the BIG lead (view-voice standard). */}
        <p className={styles.stateLead}>
          <strong className={styles.stateLeadStrong}>{lead}</strong>
          {rest ? <span className={styles.stateLeadRest}> {rest}</span> : null}
        </p>
        {/* The numbers behind the three beats, one expandable step down. Native
            <details>, no JS, matching the scored view's memo affordance. */}
        {depth ? (
          <details className={`${styles.scoreDetail} ${styles.stateDepth}`}>
            {/* Same classes as the scored view's memo toggle rather than a
                parallel set: identical affordance, one place to restyle. */}
            <summary className={styles.memoToggle}>
              {t('conditions.depthToggle', 'What is behind the three conditions')}
            </summary>
            <p className={styles.scoreDetailBody}>{depth}</p>
          </details>
        ) : null}
        {/* Why these three matter — static diBoaS voice, the page's context. */}
        <p className={styles.stateExplainer}>
          {t(
            'conditions.sectionExplainer',
            'Three forces set the weather behind every market: what the dollar is doing, what money costs, and how much of it is moving. No single week decides anything. The direction is what matters.'
          )}
        </p>
      </section>

      <section className={styles.section}>
        <div className={styles.secHead}>
          <h2 className={styles.h2}>{t('conditions.title', 'The three conditions')}</h2>
        </div>
        <div className={styles.conditionTable} data-backdrop-conditions>
          {COMPONENTS.map(({ id, key }) => {
            const sig = macro.signals?.find((s) => s.id === id);
            if (!sig) return null;
            const fb = FALLBACKS[key];
            const stateWord =
              sig.state === 'ACTIVE'
                ? t(`conditions.${key}.active`, fb.active)
                : t(`conditions.${key}.inactive`, fb.inactive);
            return (
              <details key={id} className={styles.conditionRow}>
                <summary className={styles.conditionSummary}>
                  <span className={styles.conditionTitle}>
                    {t(`conditions.${key}.title`, fb.title)}
                  </span>
                  <span className={styles.conditionState}>{stateWord}</span>
                  <span className={styles.chevron} aria-hidden="true" />
                </summary>
                <div className={styles.conditionBody}>
                  {/* The weekly generated sentence (drift-gated, CLO-lineage). */}
                  <p className={styles.conditionRead}>{sig.summary}</p>
                  {/* The static educational explainer — this page's earned
                      differentiator (plan §7 anti-slop resolution). */}
                  <p className={styles.conditionExplainer}>
                    {t(`explainers.${key}`, fb.explainer)}
                  </p>
                </div>
              </details>
            );
          })}
        </div>
      </section>
    </SectionErrorBoundary>
  );
}
