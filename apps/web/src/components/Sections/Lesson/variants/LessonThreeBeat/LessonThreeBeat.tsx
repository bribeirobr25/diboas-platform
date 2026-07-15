'use client';

import { useEffect, useRef } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/config';
import { analyticsService } from '@/lib/analytics';
import { LESSON_EVENTS, readMessageArray, type LessonMetadata } from '@/lib/learn';
import { SectionContainer } from '@/components/Sections/SectionContainer';
import { LessonHero } from '@/components/UI/LessonHero';
import { LessonProgressBar } from '@/components/UI/LessonProgressBar';
import { DisclaimerNote } from '@/components/UI/DisclaimerNote';
import { CTAButtonLink } from '@/components/UI/CTAButtonLink';
import { LocaleLink } from '@/components/UI/LocaleLink';
import {
  CalculatorVignettes,
  CompoundInterestCalculator,
} from '@/components/Sections/CompoundInterestCalculator';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import styles from './LessonThreeBeat.module.css';

// Calculator import note (2026-06-01): formerly wrapped in
// `dynamic(() => import(...), { ssr: false })` to defer Beat 3's interactive
// chunk. The wrap caused the calculator to render as an empty `<template>`
// placeholder on both dev and production — verified via `curl` on
// https://diboas.com/en/learn/compound-interest where the calculator labels
// were missing from the HTML and the dynamic chunk failed to swap the
// placeholder. Per `CLAUDE.md` "Lazy-loaded calculator pattern" + Next.js 16
// guidance, direct import from a `'use client'` component is the correct
// pattern — Next.js App Router code-splits client components automatically
// at the route level. The named export `CompoundInterestCalculator` is the
// canonical entry point (the file also re-exports as `default` for legacy
// consumers; knip's duplicate-export flag is expected per CLAUDE.md).

interface LessonThreeBeatProps {
  /** The registry entry: namespace, blocks, spine, video, read time. */
  lesson: LessonMetadata;
  /** Where the primary CTA scrolls/links to. Default `#waitlist`. */
  primaryCtaHref?: string;
  /** Where the secondary CTA links to. Default `/learn`. */
  secondaryCtaHref?: string;
  enableAnalytics?: boolean;
}

const BEAT_IDS = ['beat1', 'beat2', 'beat3'] as const;

/**
 * Three-beat talk variant (Phase 1 refactor, learn redesign plan 2026-07-15).
 *
 * Namespace, paragraph counts, and block composition all come from the lesson
 * registry entry: copy is read from `lesson.namespace` with until-exhausted
 * arrays (the JSON is the single source of truth for paragraph counts), and
 * `lesson.blocks` decides whether Beat 2 shows the vignette cluster and
 * whether Beat 3 embeds the calculator (Talk 1) or links out to a tool.
 */
export function LessonThreeBeat({
  lesson,
  primaryCtaHref = '#waitlist',
  secondaryCtaHref = '/learn',
  enableAnalytics = true,
}: LessonThreeBeatProps) {
  const intl = useTranslation();
  const locale: SupportedLocale = isValidLocale(intl.locale) ? intl.locale : 'en';

  const ns = lesson.namespace;
  const lessonId = lesson.id;

  const t = (key: string) => intl.formatMessage({ id: `${ns}.${key}` });

  // Until-exhausted array reading: the flattened catalog (intl.messages)
  // decides the paragraph count, so copy edits never desync from the code
  // (the Phase-0 B-0 bug class, retired for good).
  const tArray = (key: string): string[] =>
    readMessageArray(intl.messages as Record<string, unknown>, `${ns}.${key}`, (id) =>
      intl.formatMessage({ id })
    );

  const lessonViewedRef = useRef(false);
  useEffect(() => {
    if (!enableAnalytics || lessonViewedRef.current) return;
    lessonViewedRef.current = true;
    analyticsService.track({
      name: LESSON_EVENTS.LESSON_VIEWED,
      parameters: {
        lessonId,
        locale,
        readTimeMinutes: lesson.readTimeMinutes,
        timestamp: Date.now(),
      },
    });
  }, [enableAnalytics, lessonId, lesson.readTimeMinutes, locale]);

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

  // B-4a: the lesson -> tool funnel edge.
  const toolHref =
    lesson.blocks.beat3Tool.kind === 'toolCard'
      ? lesson.blocks.beat3Tool.href
      : '/tools/compound-interest';
  const handleToolDeepLink = () => {
    if (!enableAnalytics) return;
    analyticsService.track({
      name: LESSON_EVENTS.TOOL_DEEPLINK_CLICKED,
      parameters: {
        lessonId,
        locale,
        tool: toolHref.replace('/tools/', ''),
        timestamp: Date.now(),
      },
    });
  };

  // B-4b: LESSON_COMPLETED fires when the end-of-content CTA group becomes
  // >=50% visible, once per mount (the KPI definition in lib/learn/constants).
  const ctaGroupRef = useRef<HTMLDivElement | null>(null);
  const completedRef = useRef(false);
  useEffect(() => {
    if (!enableAnalytics) return;
    const el = ctaGroupRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || completedRef.current) continue;
          completedRef.current = true;
          analyticsService.track({
            name: LESSON_EVENTS.LESSON_COMPLETED,
            parameters: { lessonId, locale, timestamp: Date.now() },
          });
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [enableAnalytics, lessonId, locale]);

  const beat1Body = tArray('beat1.body');
  const beat2Intro = tArray('beat2.intro');
  const beat2Outro = tArray('beat2.outro');
  const beat3Intro = tArray('beat3.intro');
  const beat3Wrap = tArray('beat3.wrap');

  const beatLabels = [t('beat1.title'), t('beat2.title'), t('beat3.title')];

  const showVignettes = lesson.blocks.beat2Media === 'calculatorVignettes';
  const embedsCalculator = lesson.blocks.beat3Tool.kind === 'embeddedCalculator';

  return (
    <article className={styles.lesson}>
      <LessonHero
        title={t('lesson.h1')}
        readTime={t('lesson.readTime')}
        video={lesson.video}
        locale={locale}
        illustrationSrc={lesson.illustration}
        illustrationAlt=""
        videoAriaLabel={t('lesson.h1')}
      />

      <LessonProgressBar
        lessonId={lessonId}
        beatIds={BEAT_IDS}
        beatLabels={beatLabels}
        progressLabel={intl.formatMessage({ id: 'common.accessibility.lessonProgress' })}
        locale={locale}
        enableAnalytics={enableAnalytics}
      />

      {/* BEAT 1 */}
      <SectionErrorBoundary sectionId="lesson-beat-1" sectionType="lesson">
        <SectionContainer variant="standard" padding="standard" as="section">
          <div id="beat1" className={styles.beat}>
            <h2 className={styles.beatTitle}>{t('beat1.title')}</h2>
            {beat1Body.map((p) => (
              <p
                key={p}
                className={styles.beatBody}
                dangerouslySetInnerHTML={renderInlineEmphasis(p)}
              />
            ))}
          </div>
        </SectionContainer>
      </SectionErrorBoundary>

      {/* BEAT 2 */}
      <SectionErrorBoundary sectionId="lesson-beat-2" sectionType="lesson">
        <SectionContainer variant="standard" padding="standard" as="section">
          <div id="beat2" className={styles.beat}>
            <h2 className={styles.beatTitle}>{t('beat2.title')}</h2>
            {beat2Intro.map((p) => (
              <p
                key={p}
                className={styles.beatBody}
                dangerouslySetInnerHTML={renderInlineEmphasis(p)}
              />
            ))}
            {showVignettes && (
              <>
                <p className={styles.habitsLine}>{t('beat2.habitsLine')}</p>
                <p className={styles.beatBody}>{t('beat2.vignettesIntro')}</p>
                <CalculatorVignettes />
                <DisclaimerNote variant="projection">
                  {t('beat2.vignettesDisclaimer')}
                </DisclaimerNote>
                <p className={styles.brandCallback}>{t('beat2.vignettesOutro')}</p>
                <p className={styles.beatBody}>{t('beat2.habitsRecap')}</p>
              </>
            )}
            {beat2Outro.map((p) => (
              <p key={p} className={styles.beatBody}>
                {p}
              </p>
            ))}
          </div>
        </SectionContainer>
      </SectionErrorBoundary>

      {/* BEAT 3 */}
      <SectionErrorBoundary sectionId="lesson-beat-3" sectionType="lesson">
        <SectionContainer variant="standard" padding="standard" as="section">
          <div id="beat3" className={styles.beat}>
            <h2 className={styles.beatTitle}>{t('beat3.title')}</h2>
            {beat3Intro.map((p) => (
              <p key={p} className={styles.beatBody}>
                {p}
              </p>
            ))}

            {embedsCalculator && (
              <>
                <CompoundInterestCalculator variant="default" enableAnalytics={enableAnalytics} />
                <p className={styles.brandCallback}>{t('beat3.calculatorTagline')}</p>
                <p className={styles.afterCalculator}>{t('beat3.afterCalculator')}</p>
              </>
            )}

            {/* Talks without an embedded calculator link out instead; both
             * kinds share the toolDeepLink copy pattern. (Extract to a
             * ToolLinkCard component when the first toolCard talk goes live,
             * Phase 4.) */}
            <p className={styles.toolDeepLink}>
              {intl.formatMessage(
                { id: `${ns}.beat3.toolDeepLink` },
                {
                  // react-intl rich-text chunks callback. The callback's return
                  // element needs an explicit `key` because react-intl appends
                  // the result to a children array without auto-keying (v6.4.7
                  // behavior — confirmed warning gone with this key).
                  link: (chunks: React.ReactNode) => (
                    <LocaleLink
                      key="tool-deep-link"
                      href={toolHref}
                      prefetch={false}
                      onClick={handleToolDeepLink}
                    >
                      {chunks}
                    </LocaleLink>
                  ),
                }
              )}
            </p>

            {beat3Wrap.map((p) => (
              <p key={p} className={styles.beatBody}>
                {p}
              </p>
            ))}

            <div className={styles.ctaGroup} ref={ctaGroupRef}>
              <CTAButtonLink href={primaryCtaHref} variant="primary" onClick={handlePrimaryCta}>
                {t('beat3.cta.primary')}
              </CTAButtonLink>
              <p className={styles.ctaNote}>{t('beat3.cta.primaryNote')}</p>
              <LocaleLink
                href={secondaryCtaHref}
                className={styles.ctaSecondary}
                onClick={handleSecondaryCta}
                prefetch={false}
              >
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
