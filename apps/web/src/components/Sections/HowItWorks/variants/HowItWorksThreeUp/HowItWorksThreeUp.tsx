import Image from 'next/image';
import { SectionContainer } from '@/components/Sections/SectionContainer';
import type { HowItWorksVariantProps } from '../types';
import styles from './HowItWorksThreeUp.module.css';

/**
 * HowItWorks — "three-up" variant.
 *
 * Three product screens in phone frames, side-by-side on desktop and stacked on
 * mobile, each with its one-line caption. A `<figure>`/`<figcaption>` pairs the
 * caption with the screen for screen readers; the image carries a distinct,
 * descriptive `alt`. An empty `image` renders a labelled placeholder frame so
 * the section is usable before the rendered mockups exist.
 */
export function HowItWorksThreeUp({ config, className = '' }: HowItWorksVariantProps) {
  const { content, seo } = config;

  return (
    <SectionContainer
      variant="standard"
      padding="standard"
      ariaLabel={seo.ariaLabel}
      className={className}
    >
      <h2 className={styles.header}>{content.header}</h2>
      <ol className={styles.row}>
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
