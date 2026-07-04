import styles from './investor.module.css';

export interface GlanceItem {
  value: string;
  label: string;
}

interface InvestorGlanceProps {
  items: readonly GlanceItem[];
  ariaLabel: string;
}

/**
 * "At a glance" fact strip for the public investor page — a scannable row of
 * non-sensitive facts directly under the hero, so a skimming investor gets the
 * thesis in a few seconds. Server component, tokenized, mobile-first.
 */
export function InvestorGlance({ items, ariaLabel }: InvestorGlanceProps) {
  return (
    <section className={`${styles.section} ${styles.toneNeutral}`} aria-label={ariaLabel}>
      <dl className={styles.glanceStrip}>
        {items.map((item) => (
          <div key={item.value} className={styles.glanceItem}>
            <dt className={styles.glanceValue}>{item.value}</dt>
            <dd className={styles.glanceLabel}>{item.label}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
