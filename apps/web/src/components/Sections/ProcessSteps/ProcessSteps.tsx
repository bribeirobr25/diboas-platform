'use client';

import Image from 'next/image';
import { SectionContainer } from '@/components/Sections/SectionContainer';
import { useConfigTranslation } from '@/lib/i18n/config-translator';
import { useImpressionTracking } from '@/hooks/useImpressionTracking';
import type { AppFeaturesCarouselVariantConfig } from '@/config/appFeaturesCarousel';
import styles from './ProcessSteps.module.css';

interface ProcessStepsProps {
  /**
   * Reuses the AppFeaturesCarousel config shape so the same content/i18n keys
   * can render either as a carousel or as this static, all-at-once steps grid.
   */
  readonly config: AppFeaturesCarouselVariantConfig;
  readonly enableAnalytics?: boolean;
  readonly className?: string;
}

/**
 * ProcessSteps — a static, numbered "how it works" layout.
 *
 * Shows every step at once (numbered badge + optional image + title + copy) in a
 * responsive row, so the whole sequence is graspable at a glance — the static
 * alternative to AppFeaturesCarousel for short, linear processes. Fires one
 * `process_steps_impression` event on scroll-into-view (P10, shared hook).
 */
export function ProcessSteps({
  config,
  enableAnalytics = true,
  className = '',
}: ProcessStepsProps) {
  const t = useConfigTranslation(config);

  const rowRef = useImpressionTracking<HTMLOListElement>({
    eventName: 'process_steps_impression',
    parameters: { sectionId: config.analytics?.trackingPrefix ?? 'process_steps' },
    threshold: 0.2,
    enabled: enableAnalytics,
  });

  return (
    <SectionContainer
      variant="standard"
      padding="standard"
      ariaLabel={t.sectionTitle}
      className={className}
    >
      <h2 className={styles.header}>{t.sectionTitle}</h2>
      <ol ref={rowRef} className={styles.row}>
        {t.cards.map((card, index) => (
          <li key={card.id} className={styles.step}>
            <span className={styles.badge} aria-hidden="true">
              {index + 1}
            </span>
            {card.assets?.image ? (
              <div className={styles.imageWrap}>
                <Image
                  src={card.assets.image}
                  alt={card.seo?.imageAlt ?? ''}
                  fill
                  sizes="(max-width: 768px) 90vw, 260px"
                  className={styles.image}
                />
              </div>
            ) : null}
            <h3 className={styles.stepTitle}>{card.content.title}</h3>
            <p className={styles.stepDesc}>{card.content.description}</p>
          </li>
        ))}
      </ol>
    </SectionContainer>
  );
}

ProcessSteps.displayName = 'ProcessSteps';
