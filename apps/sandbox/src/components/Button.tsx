import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

type Variant = 'primary' | 'secondary';

/**
 * Button primitive (design-system, slice A1). The 12 MVP-0 components each
 * rolled their own <button>; this is the shared, accessible primary/secondary.
 *
 * A11y note (audited): white text needs >=4.5:1, but white on the vivid sea-green
 * #18c1a3 is only 2.28:1 and on teal-600 (#0d9488) 3.74:1 — both FAIL. The
 * accessible primary therefore fills with teal-700 (#0f766e, 5.47:1 on white),
 * not the raw mockup green. `secondary` is the outlined action (e.g. Cancel),
 * teal-700 border + text on transparent. Purely presentational — no client
 * hooks, so no 'use client' needed (the onClick lives in the calling component).
 */
export function Button({
  variant = 'primary',
  fullWidth = false,
  children,
  className,
  ...rest
}: {
  variant?: Variant;
  fullWidth?: boolean;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = [styles.button, styles[variant], fullWidth ? styles.fullWidth : '', className]
    .filter(Boolean)
    .join(' ');
  return (
    <button type="button" {...rest} className={cls}>
      {children}
    </button>
  );
}
