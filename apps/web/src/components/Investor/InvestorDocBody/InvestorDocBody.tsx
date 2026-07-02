import { Fragment } from 'react';
import styles from './InvestorDocBody.module.css';

/** Typed content blocks — mirror the generator output (scripts/generate-investor-docs.mjs). */
export type DocBlock =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'quote'; text: string }
  | { type: 'callout'; lines: string[] };

export interface InvestorDocContent {
  readonly keyPoints: string[];
  readonly blocks: DocBlock[];
}

interface InvestorDocBodyProps {
  readonly content: InvestorDocContent;
  /** Localized label for the key-points callout (e.g. "Key points"). */
  readonly keyPointsLabel: string;
  /** Localized label for the jump-to table of contents (e.g. "On this page"). */
  readonly onThisPageLabel: string;
  readonly className?: string;
}

const HEADING_TAGS: Record<number, 'h2' | 'h3' | 'h4'> = { 2: 'h2', 3: 'h3', 4: 'h4' };

/** Minimum top-level sections before a jump-to ToC earns its space. */
const TOC_MIN_SECTIONS = 3;

/** Deterministic, diacritic-folded slug for a heading — stable anchor id. */
function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Precompute a stable, unique anchor id for every top-level section heading,
 * keyed by its block index. "Top-level" is the *shallowest* heading level the
 * document actually uses — some docs lead with h2 (source `#` sections), others
 * (business-plan, investor-faq) lead with h3 because their only `#` is the title
 * — so we anchor the ToC to whichever is the primary section level per doc.
 *
 * Both the ToC links and the rendered headings read from this map so they can
 * never disagree. Collisions (repeat heading text) get a numeric suffix; an
 * empty slug (e.g. a non-latin heading) falls back to `section-<i>`.
 */
function buildHeadingIds(blocks: DocBlock[]): {
  idByIndex: Record<number, string>;
  toc: { id: string; text: string }[];
} {
  const levels = blocks
    .filter((b): b is Extract<DocBlock, { type: 'heading' }> => b.type === 'heading')
    .map((b) => b.level);
  const sectionLevel = levels.length ? Math.min(...levels) : 2;

  const idByIndex: Record<number, string> = {};
  const toc: { id: string; text: string }[] = [];
  const seen = new Set<string>();
  blocks.forEach((block, i) => {
    if (block.type !== 'heading' || block.level !== sectionLevel) return;
    const base = slugify(block.text) || `section-${i}`;
    let id = base;
    let n = 2;
    while (seen.has(id)) id = `${base}-${n++}`;
    seen.add(id);
    idByIndex[i] = id;
    toc.push({ id, text: block.text });
  });
  return { idByIndex, toc };
}

/**
 * InvestorDocBody — renders a generated investor-room document.
 *
 * Server-rendered, presentational. A highlighted "key points" callout, then the
 * document's ordered `blocks[]` rendered by type (heading / paragraph / list /
 * table / quote). The content is an exact, generated mirror of the source
 * markdown, so this component only maps blocks to semantic HTML — no parsing.
 */
export function InvestorDocBody({
  content,
  keyPointsLabel,
  onThisPageLabel,
  className = '',
}: InvestorDocBodyProps) {
  const { keyPoints, blocks } = content;
  const { idByIndex, toc } = buildHeadingIds(blocks);
  const showToc = toc.length >= TOC_MIN_SECTIONS;

  const doc = (
    <div className={`${styles.doc} ${className}`}>
      {keyPoints.length > 0 ? (
        <aside className={styles.keyPoints} aria-label={keyPointsLabel}>
          <p className={styles.keyPointsLabel}>{keyPointsLabel}</p>
          <ul className={styles.keyPointsList}>
            {keyPoints.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
        </aside>
      ) : null}

      {blocks.map((block, i) => {
        switch (block.type) {
          case 'heading': {
            const Tag = HEADING_TAGS[block.level] ?? 'h3';
            return (
              <Tag key={i} id={idByIndex[i]} className={styles.heading} data-level={block.level}>
                {block.text}
              </Tag>
            );
          }
          case 'paragraph':
            return (
              <p key={i} className={styles.paragraph}>
                {block.text}
              </p>
            );
          case 'list':
            return block.ordered ? (
              <ol key={i} className={styles.list}>
                {block.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ol>
            ) : (
              <ul key={i} className={styles.list}>
                {block.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            );
          case 'table':
            return (
              <div key={i} className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      {block.headers.map((h, j) => (
                        <th key={j} scope="col">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, r) => (
                      <tr key={r}>
                        {row.map((cell, c) => (
                          <td key={c}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case 'quote':
            return (
              <blockquote key={i} className={styles.quote}>
                {block.text}
              </blockquote>
            );
          case 'callout':
            return (
              <div key={i} className={styles.callout}>
                {block.lines.map((line, j) => (
                  <p key={j}>{line}</p>
                ))}
              </div>
            );
          default:
            return <Fragment key={i} />;
        }
      })}
    </div>
  );

  if (!showToc) return doc;

  return (
    <div className={styles.layout}>
      <nav className={styles.toc} aria-label={onThisPageLabel}>
        {/* Native <details>, open by default (renders in every browser with no
            content-visibility gotcha). Desktop: locked open + sticky. Mobile:
            the summary stays an interactive toggle. Prints hidden. No JS. */}
        <details className={styles.tocDetails} open>
          <summary className={styles.tocSummary}>{onThisPageLabel}</summary>
          <ul className={styles.tocList}>
            {toc.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`}>{item.text}</a>
              </li>
            ))}
          </ul>
        </details>
      </nav>
      {doc}
    </div>
  );
}

InvestorDocBody.displayName = 'InvestorDocBody';
