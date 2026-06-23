/**
 * CinematicHeroContent — the SSR text block (eyebrow / h1 / subcopy / CTAs).
 *
 * Real server-rendered DOM (the `<h1>` is the LCP element + SEO content). No
 * hooks, no WebGL — safe in both server (Path B) and client (factory-variant)
 * trees. CTAs are real `<a>` links (keyboard + no-JS friendly); `onClick`
 * fires fire-and-forget analytics without blocking navigation.
 */

import { ArrowRight } from '@/components/UI/LucideIcon';
import type { CinematicHeroCta } from '../types';
import styles from '../CinematicHero.module.css';

export interface CinematicHeroContentProps {
  eyebrow?: string;
  headline: string;
  /** Accent the trailing word(s) of the headline (gold/teal per theme). */
  accentHeadline?: boolean;
  subheadline?: string;
  subheadline2?: string;
  primaryCta?: CinematicHeroCta;
  secondaryCta?: CinematicHeroCta;
  sectionId: string;
}

/** Render the headline, optionally accenting the last 1–2 words. */
function renderHeadline(headline: string, accent: boolean, accentClass: string) {
  if (!accent) return headline;
  const words = headline.trim().split(/\s+/);
  if (words.length < 2) return <em className={accentClass}>{headline}</em>;
  const tailCount = Math.min(2, words.length - 1);
  const head = words.slice(0, words.length - tailCount).join(' ');
  const tail = words.slice(words.length - tailCount).join(' ');
  return (
    <>
      {head} <em className={accentClass}>{tail}</em>
    </>
  );
}

function ctaOnClick(cta?: CinematicHeroCta) {
  if (!cta?.onClick) return undefined;
  // Fire-and-forget — never block navigation on analytics.
  return () => {
    try {
      cta.onClick?.();
    } catch {
      /* analytics must never break the CTA */
    }
  };
}

export function CinematicHeroContent({
  eyebrow,
  headline,
  accentHeadline = false,
  subheadline,
  subheadline2,
  primaryCta,
  secondaryCta,
  sectionId,
}: CinematicHeroContentProps) {
  return (
    <div className={styles.content}>
      {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}

      <h1 id={`${sectionId}-title`} className={styles.headline}>
        {renderHeadline(headline, accentHeadline, styles.headlineAccent)}
      </h1>

      {subheadline && <p className={styles.subheadline}>{subheadline}</p>}
      {subheadline2 && <p className={styles.subheadline2}>{subheadline2}</p>}

      {(primaryCta || secondaryCta) && (
        <div className={styles.ctaRow}>
          {primaryCta && (
            <a
              href={primaryCta.href}
              target={primaryCta.target}
              rel={primaryCta.target === '_blank' ? 'noopener noreferrer' : undefined}
              className={styles.ctaPrimary}
              onClick={ctaOnClick(primaryCta)}
            >
              {primaryCta.label}
              <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
            </a>
          )}
          {secondaryCta && (
            <a
              href={secondaryCta.href}
              target={secondaryCta.target}
              rel={secondaryCta.target === '_blank' ? 'noopener noreferrer' : undefined}
              className={styles.ctaSecondary}
              onClick={ctaOnClick(secondaryCta)}
            >
              {secondaryCta.label}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
