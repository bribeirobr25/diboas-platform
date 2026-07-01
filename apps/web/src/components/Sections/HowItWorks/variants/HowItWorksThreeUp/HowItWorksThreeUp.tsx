'use client';

import Image from 'next/image';
import { SectionContainer } from '@/components/Sections/SectionContainer';
import { useImpressionTracking } from '@/hooks/useImpressionTracking';
import type { HowItWorksVariantProps } from '../types';
import styles from './HowItWorksThreeUp.module.css';

/**
 * HowItWorks — "three-up" variant.
 *
 * Three product screens in phone frames, side-by-side on desktop and stacked on
 * mobile, each with its one-line caption. A `<figure>`/`<figcaption>` pairs the
 * caption with the screen for screen readers; the image carries a distinct,
 * descriptive `alt`. An empty `image` renders a labelled placeholder frame so
 * the section is usable before the rendered mockups exist. Fires a single
 * `how_it_works_impression` event when the row scrolls into view (P10).
 */
export function HowItWorksThreeUp({
  config,
  className = '',
  enableAnalytics = true,
}: HowItWorksVariantProps) {
  const { content, seo, analytics } = config;

  // Section-impression (consent-gated + idempotent in the shared hook). Low
  // threshold so it fires on the tall stacked-mobile layout too.
  const rowRef = useImpressionTracking<HTMLOListElement>({
    eventName: 'how_it_works_impression',
    parameters: { sectionId: analytics.sectionId, variant: 'threeUp' },
    threshold: 0.2,
    enabled: enableAnalytics,
  });

  return (
    <SectionContainer
      variant="standard"
      padding="standard"
      ariaLabel={seo.ariaLabel}
      className={className}
    >
      <h2 className={styles.header}>{content.header}</h2>
      <ol ref={rowRef} className={styles.row}>
        {content.steps.map((step, index) => (
          <li key={step.caption} className={styles.item}>
            <figure className={styles.figure}>
              <div className={styles.phone}>
                <span className={styles.notch} aria-hidden="true" />
                <div className={styles.screen}>
                  {step.image ? (
                    <Image
                      src={step.image}
                      alt={step.imageAlt}
                      fill
                      sizes="(max-width: 640px) 80vw, 280px"
                      className={styles.screenImage}
                    />
                  ) : (
                    <span className={styles.placeholder} aria-hidden="true">
                      {index + 1}
                    </span>
                  )}
                </div>
              </div>
              <figcaption className={styles.caption}>{step.caption}</figcaption>
            </figure>
          </li>
        ))}
      </ol>
    </SectionContainer>
  );
}

HowItWorksThreeUp.displayName = 'HowItWorksThreeUp';
