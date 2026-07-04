import styles from './investor.module.css';

export interface InvestorDoc {
  num: string;
  title: string;
  summary: string;
  status: 'available' | 'in-preparation';
  /** Present only for linked (room) cards. Omitted → static preview (public page). */
  slug?: string;
}

interface InvestorDocCardsProps {
  docs: readonly InvestorDoc[];
  statusLabels: { available: string; inPrep: string };
  /**
   * When provided, each card is a link to `${hrefBase}${doc.slug}` (gated room).
   * Omit for static, non-linked previews (public /investors page).
   */
  hrefBase?: string;
}

/**
 * Numbered document-card grid, shared by the gated room landing (linked cards)
 * and the public investor page (static previews). Reuses the tokenized `.docCard`
 * chrome so both surfaces stay identical (DRY). Server component.
 */
export function InvestorDocCards({ docs, statusLabels, hrefBase }: InvestorDocCardsProps) {
  return (
    <div className={styles.docGrid}>
      {docs.map((doc) => {
        const inner = (
          <>
            <span className={styles.docNum}>{doc.num}</span>
            <h3 className={styles.docTitle}>{doc.title}</h3>
            <p className={styles.docSummary}>{doc.summary}</p>
            <span
              className={`${styles.docStatus} ${doc.status === 'in-preparation' ? styles.docStatusPrep : ''}`}
            >
              {doc.status === 'in-preparation' ? statusLabels.inPrep : statusLabels.available}
            </span>
          </>
        );
        const key = `${doc.num}-${doc.title}`;
        return hrefBase && doc.slug ? (
          <a key={key} href={`${hrefBase}${doc.slug}`} className={styles.docCard}>
            {inner}
          </a>
        ) : (
          <div key={key} className={styles.docCard}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}
