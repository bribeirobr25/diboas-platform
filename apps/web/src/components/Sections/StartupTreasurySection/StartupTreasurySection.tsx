'use client';

import Image from 'next/image';
import { SectionContainer } from '@/components/Sections/SectionContainer';
import { LocaleLink } from '@/components/UI/LocaleLink';
import { CTAButtonLink } from '@/components/UI/CTAButtonLink';
import { ArrowRight } from '@/components/UI/LucideIcon';
import { useConfigTranslation } from '@/lib/i18n/config-translator';
import { useImpressionTracking } from '@/hooks/useImpressionTracking';
import { analyticsService } from '@/lib/analytics';
import type { StartupTreasurySectionConfig } from '@/config/startupTreasury';
import styles from './StartupTreasurySection.module.css';

interface StartupTreasurySectionProps {
  readonly config: StartupTreasurySectionConfig;
  readonly enableAnalytics?: boolean;
  readonly className?: string;
}

/**
 * StartupTreasurySection — B2B "Startup Treasury" section (business landing).
 *
 * Static, text-led, card-based composition matching the rest of the business page:
 * centered intro → body copy beside a supporting image card → tool-CTA bridge line
 * + two CTAs (ghost calculator link + solid "Talk to Bar"). No carousel, no motion,
 * no numbers. All copy from i18n keys. (The operating-floor mechanic lives in the
 * page's dedicated "How It Works" section, so it is not repeated here.)
 *
 * CTA navigation is owned by LocaleLink / CTAButtonLink; onClick only records
 * analytics (fire-and-forget) — never window.location/open (double-navigates; see
 * docs/tech/implementation-notes.md).
 */
export function StartupTreasurySection({
  config,
  enableAnalytics = true,
  className = '',
}: StartupTreasurySectionProps) {
  const t = useConfigTranslation(config);

  const rootRef = useImpressionTracking<HTMLDivElement>({
    eventName: `${config.analytics.trackingPrefix}_visible`,
    parameters: { sectionId: config.analytics.sectionId },
    threshold: 0.2,
    enabled: enableAnalytics,
  });

  const trackSecondary = () => {
    void analyticsService.trackEvent(`${config.analytics.trackingPrefix}_calculator_click`, {
      href: config.cta.secondary.href,
    });
  };
  const trackPrimary = () => {
    void analyticsService.trackEvent(`${config.analytics.trackingPrefix}_contact_click`, {
      href: config.cta.primary.href,
    });
  };

  const imageOnLeft = config.image.position === 'left';
  const isGenerous = config.style.verticalPadding === 'generous';

  return (
    <SectionContainer
      variant="wide"
      padding="standard"
      backgroundColor={config.style.backgroundColor}
      ariaLabel={t.seo.ariaLabel}
      className={className}
    >
      <div ref={rootRef} className={`${styles.root} ${isGenerous ? styles.generous : ''}`}>
        {/* Intro — centered, matches the page's section headings. On desktop the
            subhead moves into the body column (as a lead) to balance the text
            against the image and tighten the headline-to-image gap; on
            tablet/mobile it stays here under the headline. The two copies are
            breakpoint-toggled via CSS (only one is ever displayed). */}
        <header className={styles.intro}>
          <p className={`u-eyebrow ${styles.eyebrow}`}>{t.content.eyebrow}</p>
          <h2 className={styles.headline}>{t.content.headline}</h2>
          <p className={styles.introSubhead}>{t.content.subheadline}</p>
        </header>

        {/* Body copy beside a supporting image card (image DOM-first; reversed to
            the right for the default 'right' position). */}
        <div className={`${styles.split} ${imageOnLeft ? '' : styles.imageRight}`}>
          <div className={styles.imageCard}>
            <Image
              src={config.image.src}
              alt={t.image.alt}
              fill
              sizes="(max-width: 900px) 100vw, 46vw"
              className={styles.image}
            />
          </div>
          <div className={styles.body}>
            <p className={styles.lead}>{t.content.subheadline}</p>
            {t.content.body.map((paragraph: string, index: number) => (
              // Paragraphs come from the translation file and never reorder.
              // eslint-disable-next-line react/no-array-index-key
              <p key={index} className={styles.paragraph}>
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* Tool-CTA bridge line + two CTAs */}
        <div className={styles.ctaBlock}>
          <p className={styles.bridge}>{t.cta.bridgeLine}</p>
          <div className={styles.ctaRow}>
            <LocaleLink
              href={config.cta.secondary.href}
              className={styles.secondary}
              onClick={trackSecondary}
            >
              {t.cta.secondary.text}
              <ArrowRight className={styles.secondaryIcon} aria-hidden="true" />
            </LocaleLink>
            <CTAButtonLink
              href={config.cta.primary.href}
              variant="primary"
              size="lg"
              onClick={trackPrimary}
            >
              {t.cta.primary.text}
            </CTAButtonLink>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}

StartupTreasurySection.displayName = 'StartupTreasurySection';
