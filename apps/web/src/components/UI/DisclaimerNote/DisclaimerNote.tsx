import styles from './DisclaimerNote.module.css';

interface DisclaimerNoteProps {
  /** "projection" — used for any future-value / illustrative-figure context. */
  variant?: 'projection';
  children: React.ReactNode;
  className?: string;
}

/**
 * Small disclaimer text used adjacent to any projection display
 * (calculator output, vignette tables). CLO requirement per A.8.5.
 */
export function DisclaimerNote({ variant = 'projection', children, className }: DisclaimerNoteProps) {
  return (
    <p
      className={`${styles.note} ${className ?? ''}`}
      data-variant={variant}
      role="note"
    >
      {children}
    </p>
  );
}
