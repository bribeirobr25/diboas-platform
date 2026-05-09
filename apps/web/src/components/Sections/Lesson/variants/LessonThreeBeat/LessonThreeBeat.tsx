'use client';

import { useEffect, useRef } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/config';
import { analyticsService } from '@/lib/analytics';
import {
  LESSON_EVENTS,
  READ_TIME_MINUTES,
  type LessonId,
  type VideoSourceConfig,
} from '@/lib/learn';
import { SectionContainer } from '@/components/Sections/SectionContainer';
import { LessonHero } from '@/components/UI/LessonHero';
import { LessonProgressBar } from '@/components/UI/LessonProgressBar';
import { DisclaimerNote } from '@/components/UI/DisclaimerNote';
import { CTAButtonLink } from '@/components/UI/CTAButtonLink';
import { LocaleLink } from '@/components/UI/LocaleLink';
import {
  CompoundInterestCalculator,
  CalculatorVignettes,
} from '@/components/Sections/CompoundInterestCalculator';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import styles from './LessonThreeBeat.module.css';

interface LessonThreeBeatProps {
  lessonId: LessonId;
  /** From the lesson registry; if undefined, hero falls back to text + illustration. */
  video?: VideoSourceConfig;
  /** Where the primary CTA scrolls/links to. Default `#waitlist`. */
  primaryCtaHref?: string;
  /** Where the secondary CTA links to. Default `/learn`. */
  secondaryCtaHref?: string;
  enableAnalytics?: boolean;
}

const BEAT_IDS = ['beat1', 'beat2', 'beat3'] as const;

/**
 * Lesson 01 — "How Money Really Grows" three-beat variant.
 *
 * Composes the calculator + chart + vignettes built in Phase A.1/A.2 with
 * the lesson copy from `learn-compound-interest.json`. Translation IDs follow
 * the namespace-prefix convention (`learn-compound-interest.beat1.title`).
 */
export function LessonThreeBeat({
  lessonId,
  video,
  primaryCtaHref = '#waitlist',
  secondaryCtaHref = '/learn',
  enableAnalytics = true,
}: LessonThreeBeatProps) {
  const intl = useTranslation();
  const locale: SupportedLocale = isValidLocale(intl.locale) ? intl.locale : 'en';

  const t = (key: string) =>
    intl.formatMessage({ id: `learn-compound-interest.${key}` });

  const tArray = (key: string, length: number): string[] =>
    Array.from({ length }, (_, i) => t(`${key}.${i}`));

  const lessonViewedRef = useRef(false);
  useEffect(() => {
    if (!enableAnalytics || lessonViewedRef.current) return;
    lessonViewedRef.current = true;
    analyticsService.track({
      name: LESSON_EVENTS.LESSON_VIEWED,
      parameters: {
        lessonId,
        locale,
        readTimeMinutes: READ_TIME_MINUTES[lessonId],
        timestamp: Date.now(),
      },
    });
  }, [enableAnalytics, lessonId, locale]);

  const handlePrimaryCta = () => {
    if (!enableAnalytics) return;
    analyticsService.track({
      name: LESSON_EVENTS.CTA_PRIMARY_CLICKED,
      parameters: { lessonId, locale, timestamp: Date.now() },
    });
  };

  const handleSecondaryCta = () => {
    if (!enableAnalytics) return;
    analyticsService.track({
      name: LESSON_EVENTS.CTA_SECONDARY_CLICKED,
      parameters: { lessonId, locale, timestamp: Date.now() },
    });
  };

  const beat1Body = tArray('beat1.body', 7);
  const beat2Intro = tArray('beat2.intro', 4);
  const beat2Outro = tArray('beat2.outro', 3);
  const beat3Intro = tArray('beat3.intro', 5);
  const beat3Wrap = tArray('beat3.wrap', 2);

  const beatLabels = [t('beat1.title'), t('beat2.title'), t('beat3.title')];

  return (
    <article className={styles.lesson}>
      <LessonHero
        title={t('lesson.h1')}
        readTime={t('lesson.readTime')}
        video={video}
        locale={locale}
        illustrationAlt=""
        videoAriaLabel={t('lesson.h1')}
      />

      <LessonProgressBar
        lessonId={lessonId}
        beatIds={BEAT_IDS}
        beatLabels={beatLabels}
        locale={locale}
        enableAnalytics={enableAnalytics}
      />

      {/* BEAT 1 — Saving is half of the story. */}
      <SectionErrorBoundary sectionId="lesson-beat-1" sectionType="lesson">
        <SectionContainer variant="standard" padding="standard" as="section">
          <div id="beat1" className={styles.beat}>
            <h2 className={styles.beatTitle}>{t('beat1.title')}</h2>
            {beat1Body.map((p) => (
              <p key={p} className={styles.beatBody} dangerouslySetInnerHTML={renderInlineEmphasis(p)} />
            ))}
          </div>
        </SectionContainer>
      </SectionErrorBoundary>

      {/* BEAT 2 — The system's secret engine. */}
      <SectionErrorBoundary sectionId="lesson-beat-2" sectionType="lesson">
        <SectionContainer variant="standard" padding="standard" as="section">
          <div id="beat2" className={styles.beat}>
            <h2 className={styles.beatTitle}>{t('beat2.title')}</h2>
            {beat2Intro.map((p) => (
              <p key={p} className={styles.beatBody} dangerouslySetInnerHTML={renderInlineEmphasis(p)} />
            ))}
            <p className={styles.habitsLine}>{t('beat2.habitsLine')}</p>
            <p className={styles.beatBody}>{t('beat2.vignettesIntro')}</p>
            <CalculatorVignettes />
            <DisclaimerNote variant="projection">{t('beat2.vignettesDisclaimer')}</DisclaimerNote>
            <p className={styles.brandCallback}>{t('beat2.vignettesOutro')}</p>
            <p className={styles.beatBody}>{t('beat2.habitsRecap')}</p>
            {beat2Outro.map((p) => (
              <p key={p} className={styles.beatBody}>{p}</p>
            ))}
          </div>
        </SectionContainer>
      </SectionErrorBoundary>

      {/* BEAT 3 — Now use it yourself. */}
      <SectionErrorBoundary sectionId="lesson-beat-3" sectionType="lesson">
        <SectionContainer variant="standard" padding="standard" as="section">
          <div id="beat3" className={styles.beat}>
            <h2 className={styles.beatTitle}>{t('beat3.title')}</h2>
            {beat3Intro.map((p) => (
              <p key={p} className={styles.beatBody}>{p}</p>
            ))}

            <CompoundInterestCalculator
              variant="default"
              enableAnalytics={enableAnalytics}
            />

            <p className={styles.brandCallback}>{t('beat3.calculatorTagline')}</p>
            <p className={styles.afterCalculator}>{t('beat3.afterCalculator')}</p>

            {beat3Wrap.map((p) => (
              <p key={p} className={styles.beatBody}>{p}</p>
            ))}

            <div className={styles.ctaGroup}>
              <CTAButtonLink href={primaryCtaHref} variant="primary" onClick={handlePrimaryCta}>
                {t('beat3.cta.primary')}
              </CTAButtonLink>
              <p className={styles.ctaNote}>{t('beat3.cta.primaryNote')}</p>
              <LocaleLink href={secondaryCtaHref} className={styles.ctaSecondary} onClick={handleSecondaryCta}>
                {t('beat3.cta.secondary')}
              </LocaleLink>
            </div>
          </div>
        </SectionContainer>
      </SectionErrorBoundary>
    </article>
  );
}

/**
 * Tiny helper to render `**bold**` markers inline.
 * Beat 1 uses one bold span ("~$2,252 in 12 years."); we accept the markdown-y
 * marker in the translation file so translators can preserve emphasis without
 * having to know the styling.
 */
function renderInlineEmphasis(text: string): { __html: string } {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
  const html = escaped
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
  return { __html: html };
}
