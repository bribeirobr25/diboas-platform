import type { RegimeSummary } from '@/lib/analytics-sdk/types';
import styles from './CalmSummary.module.css';

interface CalmSummaryProps {
  data: RegimeSummary;
  length?: 'short' | 'detailed' | 'plain';
  className?: string;
}

/**
 * The analyst memo is authored in PARAGRAPHS and was rendered as one block
 * (PENDING_ALL 5.304 / 5.372).
 *
 * Measured on production 2026-09-15: one `<p>`, zero `<br>`, 1,403 characters.
 * The `\n\n` the editorial layer writes IS present in the text node — it is
 * `white-space: normal` that collapses it to a single space. So the data
 * carried the structure and the renderer discarded it, which is why no gate
 * saw anything wrong: every figure reconciled, every locale was present, and
 * the only casualty was the reading.
 *
 * It matters because the memo's two halves do different jobs — in the
 * 2026-09-15 cycle, "the structural block did not move" and then "underneath
 * it the week was not still". Run together, the second beat reads as a
 * continuation of the first rather than the turn it is.
 */
function paragraphsOf(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function CalmSummary({ data, length = 'detailed', className }: CalmSummaryProps) {
  // Plain (grandmother) layer is optional/back-compat — render nothing if a
  // cycle predates it (P3, 2026-07-11).
  if (length === 'plain') {
    if (!data.plain) return null;
    return <p className={`${styles.summary} ${styles.plain} ${className ?? ''}`}>{data.plain}</p>;
  }

  const text = length === 'short' ? data.short : data.detailed;
  const paragraphs = paragraphsOf(text ?? '');
  const classes = `${styles.summary} ${styles[length]} ${className ?? ''}`;

  // Single-paragraph content keeps TODAY'S EXACT DOM — a bare <p>. `short` and
  // `plain` are always one sentence, and a one-paragraph memo should not gain a
  // wrapper just because the code can now handle two. The wrapper appears only
  // when there is genuinely something to separate.
  if (paragraphs.length <= 1) return <p className={classes}>{text}</p>;

  return (
    <div className={classes}>
      {/* Keyed by content, not index: the list is static and derived, and an
          index key would add an eighth instance of a warning class this repo
          already carries seven of. Two byte-identical paragraphs in one memo
          would be a copy defect, not a keying problem. */}
      {paragraphs.map((p) => (
        <p key={p}>{p}</p>
      ))}
    </div>
  );
}
