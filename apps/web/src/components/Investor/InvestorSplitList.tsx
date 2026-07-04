import styles from './investor.module.css';

export interface SplitColumn {
  title: string;
  items: readonly string[];
}

interface InvestorSplitListProps {
  left: SplitColumn;
  right: SplitColumn;
}

/**
 * Two-column titled lists (e.g. "Live today / What the raise builds",
 * "Built / Not yet built"). Shared by the public investor page and the gated
 * room landing so the built-vs-not pattern is written once (DRY). Server component.
 */
export function InvestorSplitList({ left, right }: InvestorSplitListProps) {
  return (
    <div className={styles.twoCol}>
      {[left, right].map((col) => (
        <div key={col.title}>
          <p className={styles.colTitle}>{col.title}</p>
          <ul className={styles.list}>
            {col.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
