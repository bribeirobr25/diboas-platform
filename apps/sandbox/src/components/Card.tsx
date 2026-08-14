import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Card.module.css';

type Tone = 'default' | 'tint';

/**
 * Card primitive (design-system, slice A1). 14 MVP-0 components rolled their
 * own card container; this is the shared rounded surface. `default` = clean
 * white (--sb-card) with a hairline for definition on the warm off-white page;
 * `tint` = the faint teal wash (--sb-card-tint) for an emphasized surface (e.g.
 * the "put to work" job). Purely presentational — no client hooks, so no
 * 'use client'. Passes through the rest (role, aria-*, etc.).
 */
export function Card({
  tone = 'default',
  children,
  className,
  ...rest
}: {
  tone?: Tone;
  children: ReactNode;
} & HTMLAttributes<HTMLDivElement>) {
  const cls = [styles.card, styles[tone], className].filter(Boolean).join(' ');
  return (
    <div {...rest} className={cls}>
      {children}
    </div>
  );
}
