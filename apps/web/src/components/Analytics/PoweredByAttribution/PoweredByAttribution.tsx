import styles from './PoweredByAttribution.module.css';

interface PoweredByAttributionProps {
  href: string;
  label: string;
  productName: string;
  className?: string;
}

export function PoweredByAttribution({
  href,
  label,
  productName,
  className,
}: PoweredByAttributionProps) {
  return (
    <p className={`${styles.attribution} ${className ?? ''}`}>
      <span>{label}</span>{' '}
      <a href={href} target="_blank" rel="noopener noreferrer" className={styles.link}>
        {productName}
      </a>
    </p>
  );
}
