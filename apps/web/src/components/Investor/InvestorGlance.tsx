import styles from './investor.module.css';
import { StatStrip, type Stat } from './StatStrip';

interface InvestorGlanceProps {
  items: readonly Stat[];
  ariaLabel: string;
}

/**
 * "At a glance" fact strip for the public investor page — a scannable row of
 * non-sensitive facts directly under the hero, so a skimming investor gets the
 * thesis in a few seconds. Renders the shared `StatStrip` primitive in its flat
 * `page` variant (no hero) — one stat-grid implementation across the codebase.
 */
export function InvestorGlance({ items, ariaLabel }: InvestorGlanceProps) {
  return (
    <section className={`${styles.section} ${styles.toneNeutral}`}>
      <StatStrip items={items} ariaLabel={ariaLabel} variant="page" />
    </section>
  );
}
