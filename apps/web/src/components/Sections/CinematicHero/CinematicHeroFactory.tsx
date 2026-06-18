'use client';

/**
 * CinematicHeroFactory — composition shell for the reusable animated hero.
 *
 * Layering (back → front): token gradient fallback + WebGL canvas (decorative,
 * aria-hidden) → optional duotone poster (band heroes) → contrast scrim →
 * SSR content (h1/eyebrow/subcopy/CTAs). The `<h1>` and copy are still
 * server-rendered (client components SSR their initial HTML, so LCP/SEO are
 * unaffected); the canvas hydrates on the client.
 *
 * Marked `'use client'` (first line) so the whole hero is one unambiguous client
 * boundary — without it, Turbopack mis-resolved the SceneCanvas client boundary
 * in dev when this factory was reached through a server component, leaving the
 * WebGL canvas un-hydrated.
 *
 * Reused across surfaces via `scene` + `theme`; content is passed in as
 * already-resolved strings (no copy lives here).
 */

import Image from 'next/image';
import { SceneCanvas } from './scenes/SceneCanvas';
import { CinematicHeroContent } from './content/CinematicHeroContent';
import type { CinematicHeroProps } from './types';
import styles from './CinematicHero.module.css';

export function CinematicHeroFactory({
  eyebrow,
  headline,
  accentHeadline,
  subheadline,
  subheadline2,
  primaryCta,
  secondaryCta,
  scene,
  theme,
  align = 'left',
  posterImage,
  posterAlt = '',
  posterDuotone = false,
  priority = false,
  className = '',
  sectionId = 'cinematic-hero',
  rootRef,
}: CinematicHeroProps) {
  const isBand = Boolean(posterImage);

  return (
    <section
      ref={rootRef}
      className={`${styles.hero} ${className}`}
      data-theme={theme}
      data-scene={scene}
      data-align={align}
      data-band={isBand ? 'true' : undefined}
      aria-labelledby={`${sectionId}-title`}
    >
      {/* Decorative WebGL layer (aria-hidden); gradient fallback painted under it */}
      <div className={styles.sceneLayer}>
        <SceneCanvas scene={scene} theme={theme} />
      </div>

      {/* Optional duotone photo band (B2C / About) */}
      {posterImage && (
        <div
          className={`${styles.poster} ${posterDuotone ? styles.posterDuotone : ''}`}
          aria-hidden={posterAlt ? undefined : 'true'}
        >
          <Image
            src={posterImage}
            alt={posterAlt}
            fill
            priority={priority}
            quality={80}
            sizes="100vw"
            style={{ objectFit: 'cover' }}
          />
        </div>
      )}

      {/* Contrast scrim — guarantees ≥4.5:1 on the headline over any scene/photo */}
      <div className={styles.scrim} aria-hidden="true" />

      <div className={styles.container}>
        <CinematicHeroContent
          eyebrow={eyebrow}
          headline={headline}
          accentHeadline={accentHeadline}
          subheadline={subheadline}
          subheadline2={subheadline2}
          primaryCta={primaryCta}
          secondaryCta={secondaryCta}
          sectionId={sectionId}
        />
      </div>
    </section>
  );
}

export default CinematicHeroFactory;
