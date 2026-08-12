/**
 * State-grammar middle sections (M3 — plan v3 D-M3-2): the Macro Backdrop's
 * composition — three condition cards (state word + the weekly generated
 * sentence + a static educational explainer) under the macro group summary
 * as the calm lead. NO score, NO band words, NO gauge (MM-2: those belong to
 * scored views). Rendered by MarketViewShell's `state` branch in place of
 * the scored sections; hero/outage/data-status/CTA/methodology/footer stay
 * shared shell chrome.
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

interface StateViewSectionsProps {
  viewSlug: string;
  signalGroups: SignalGroup[];
  t: (key: string, fallback: string) => string;
}

export function StateViewSections({ viewSlug, signalGroups, t }: StateViewSectionsProps) {
  const macro = signalGroups.find((g) => g.id === 'macro_environment');
  if (!macro || !macro.signals || macro.signals.length === 0) return null;

  return (
    <SectionErrorBoundary
      sectionId="market-backdrop-conditions"
      sectionType="dashboard"
      enableReporting
      context={{ page: 'market', section: 'conditions', view: viewSlug }}
    >
      <section className={styles.scoreSec}>
        {/* The macro group summary as the calm lead (weekly-generated, ×4). */}
        <p className={styles.standfirst}>{macro.summary}</p>
      </section>

      <section className={styles.section}>
        <div className={styles.secHead}>
          <h2 className={styles.h2}>{t('conditions.title', 'The three conditions')}</h2>
        </div>
        <ul className={styles.srcPills} data-backdrop-conditions>
          {COMPONENTS.map(({ id, key }) => {
            const sig = macro.signals?.find((s) => s.id === id);
            if (!sig) return null;
            const fb = FALLBACKS[key];
            const stateWord =
              sig.state === 'ACTIVE'
                ? t(`conditions.${key}.active`, fb.active)
                : t(`conditions.${key}.inactive`, fb.inactive);
            return (
              <li key={id} className={styles.conditionCard}>
                <h3 className={styles.conditionTitle}>
                  {t(`conditions.${key}.title`, fb.title)}
                  <span className={styles.conditionState}> · {stateWord}</span>
                </h3>
                {/* The weekly generated sentence (drift-gated, CLO-lineage). */}
                <p className={styles.conditionRead}>{sig.summary}</p>
                {/* The static educational explainer — this page's earned
                    differentiator (plan §7 anti-slop resolution). */}
                <p className={styles.conditionExplainer}>{t(`explainers.${key}`, fb.explainer)}</p>
              </li>
            );
          })}
        </ul>
      </section>
    </SectionErrorBoundary>
  );
}
