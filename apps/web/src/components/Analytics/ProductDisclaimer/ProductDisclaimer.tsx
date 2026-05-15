import styles from './ProductDisclaimer.module.css';

interface ProductDisclaimerProps {
  text: string;
  className?: string;
}

export function ProductDisclaimer({ text, className }: ProductDisclaimerProps) {
  return (
    <p className={`${styles.disclaimer} ${className ?? ''}`} role="note">
      {text}
    </p>
  );
}
