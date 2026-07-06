import styles from './StatStrip.module.css';

/** One stat: `value` is the prominent figure, `label` the caption, `note` the optional honesty rider. */
export interface Stat {
  value: string;
  label: string;
  note?: string;
}

interface StatStripProps {
  /** Secondary stats (or all stats, for the flat `page` variant). */
  items: readonly Stat[];
  /** Optional dominant stat — rendered at ~2× scale above the row (`doc` variant). */
  hero?: Stat;
  ariaLabel?: string;
  /**
   * `page` — flat equal-weight strip (the public /investors band, unchanged).
   * `doc`  — one hero + secondaries, hierarchy by typography (the room stat bands).
   */
  variant?: 'page' | 'doc';
}

function StatCell({ stat, kind }: { stat: Stat; kind: 'hero' | 'item' }) {
  return (
    <div className={kind === 'hero' ? styles.hero : styles.item}>
      <dt className={styles.value}>{stat.value}</dt>
      <dd className={styles.label}>{stat.label}</dd>
      {stat.note ? <dd className={styles.note}>{stat.note}</dd> : null}
    </div>
  );
}

/**
 * The single stat-grid implementation in the codebase (A3 numbers layer).
 * Server component, tokenized, mobile-first, print-friendly. Consumed by
 * `InvestorGlance` (public band, flat) and `InvestorDocBody` (room stat bands,
 * hero + secondaries). Hierarchy is typography + spacing — never colored boxes.
 */
export function StatStrip({ items, hero, ariaLabel, variant = 'page' }: StatStripProps) {
  const wrapClass = `${styles.strip} ${variant === 'doc' ? styles.doc : styles.page}`;
  return (
    <dl className={wrapClass} aria-label={ariaLabel}>
      {hero ? <StatCell stat={hero} kind="hero" /> : null}
      {items.length > 0 ? (
        <div className={styles.items}>
          {items.map((stat) => (
            <StatCell key={stat.value + stat.label} stat={stat} kind="item" />
          ))}
        </div>
      ) : null}
    </dl>
  );
}
