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
  readonly className?: string;
}

const HEADING_TAGS: Record<number, 'h2' | 'h3' | 'h4'> = { 2: 'h2', 3: 'h3', 4: 'h4' };

/**
 * InvestorDocBody — renders a generated investor-room document.
 *
 * Server-rendered, presentational. A highlighted "key points" callout, then the
 * document's ordered `blocks[]` rendered by type (heading / paragraph / list /
 * table / quote). The content is an exact, generated mirror of the source
 * markdown, so this component only maps blocks to semantic HTML — no parsing.
 */
export function InvestorDocBody({ content, keyPointsLabel, className = '' }: InvestorDocBodyProps) {
  const { keyPoints, blocks } = content;

  return (
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
              <Tag key={i} className={styles.heading} data-level={block.level}>
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
}

InvestorDocBody.displayName = 'InvestorDocBody';
