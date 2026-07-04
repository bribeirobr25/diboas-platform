import styles from './investor.module.css';

export interface DocNavEntry {
  slug: string;
  num: string;
  title: string;
}

interface InvestorDocNavProps {
  docs: readonly DocNavEntry[];
  currentSlug: string;
  /** e.g. `/en/investor-room/` */
  hrefBase: string;
  /** e.g. `/en/investor-room` */
  roomHref: string;
  labels: { prev: string; next: string; backToRoom: string; navAria: string };
}

/**
 * Previous / back-to-room / next navigation for the investor-room document
 * pages — lets a reader move through the diligence set without returning to the
 * landing each time. Derives order from the shared `docs` list; fails safe (only
 * "back to room" shows) if the current slug isn't found. Server component.
 */
export function InvestorDocNav({
  docs,
  currentSlug,
  hrefBase,
  roomHref,
  labels,
}: InvestorDocNavProps) {
  const i = docs.findIndex((d) => d.slug === currentSlug);
  const prev = i > 0 ? docs[i - 1] : null;
  const next = i >= 0 && i < docs.length - 1 ? docs[i + 1] : null;

  return (
    <nav className={styles.docNav} aria-label={labels.navAria}>
      {prev ? (
        <a href={`${hrefBase}${prev.slug}`} className={styles.docNavLink}>
          <span className={styles.docNavDir}>← {labels.prev}</span>
          <span className={styles.docNavTitle}>{prev.title}</span>
        </a>
      ) : (
        <span aria-hidden="true" />
      )}

      <a href={roomHref} className={styles.docNavRoom}>
        {labels.backToRoom}
      </a>

      {next ? (
        <a href={`${hrefBase}${next.slug}`} className={`${styles.docNavLink} ${styles.docNavNext}`}>
          <span className={styles.docNavDir}>{labels.next} →</span>
          <span className={styles.docNavTitle}>{next.title}</span>
        </a>
      ) : (
        <span aria-hidden="true" />
      )}
    </nav>
  );
}
