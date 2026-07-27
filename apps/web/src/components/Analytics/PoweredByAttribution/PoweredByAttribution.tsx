import styles from './PoweredByAttribution.module.css';

interface PoweredByAttributionProps {
  href: string;
  label: string;
  productName: string;
  className?: string;
  /**
   * When true, the product name renders as plain text (no link) with a
   * "coming soon" note — used while the diBoaS Analytics site is not yet public.
   */
  comingSoon?: boolean;
  /** Parenthetical note shown after the product name when `comingSoon` (e.g. "coming soon"). */
  comingSoonLabel?: string;
}

export function PoweredByAttribution({
  href,
  label,
  productName,
  className,
  comingSoon,
  comingSoonLabel,
}: PoweredByAttributionProps) {
  return (
    <p className={`${styles.attribution} ${className ?? ''}`}>
      <span>{label}</span>{' '}
      {comingSoon ? (
        <span className={styles.product}>
          {productName}
          {comingSoonLabel ? ` (${comingSoonLabel})` : ''}
        </span>
      ) : (
        <a href={href} target="_blank" rel="noopener noreferrer" className={styles.link}>
          {productName}
        </a>
      )}
    </p>
  );
}
