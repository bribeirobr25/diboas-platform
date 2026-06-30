import styles from './investor.module.css';

interface InvestorProseProps {
  eyebrow?: string;
  header?: string;
  paragraphs?: readonly string[];
  /** 'white' (default), 'neutral', or 'dark' section background. */
  tone?: 'white' | 'neutral' | 'dark';
  headingLevel?: 'h1' | 'h2';
  children?: React.ReactNode;
  id?: string;
}

const TONE_CLASS = {
  white: styles.toneWhite,
  neutral: styles.toneNeutral,
  dark: styles.toneDark,
} as const;

/**
 * Reusable prose section for the investor vertical (eyebrow + header +
 * paragraphs), tokenized and accessible. Shared by the public page and the
 * gated room to keep copy rendering DRY.
 */
export function InvestorProse({
  eyebrow,
  header,
  paragraphs,
  tone = 'white',
  headingLevel = 'h2',
  children,
  id,
}: InvestorProseProps) {
  const Heading = headingLevel;
  return (
    <section className={`${styles.section} ${TONE_CLASS[tone]}`} id={id}>
      <div className={styles.inner}>
        {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
        {header ? <Heading className={styles.header}>{header}</Heading> : null}
        {paragraphs?.map((p) => (
          <p key={p} className={styles.paragraph}>
            {p}
          </p>
        ))}
        {children}
      </div>
    </section>
  );
}
