'use client';

import { useEffect, useRef } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/config';
import { analyticsService } from '@/lib/analytics';
import {
  LESSON_EVENTS,
  getNextLiveLesson,
  getPrevLiveLesson,
  readMessageArray,
  type LessonMetadata,
} from '@/lib/learn';
import { setCtaSource } from '@/lib/analytics/ctaAttribution';
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
import { TalkQuizFactory } from '@/components/Sections/TalkQuiz';
import { LucideIcon, ArrowLeft, ArrowRight } from '@/components/UI/LucideIcon';
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
  /**
   * Where the demoted waitlist CTA links to (Phase 2, F-3 education-first:
   * the primary CTA anchors to the Beat-3 tool; the waitlist is tertiary).
   */
  waitlistCtaHref?: string;
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
  waitlistCtaHref = '/#waitlist',
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

  // Phase 2 CTA order (F-3 education-first): primary anchors back to the
  // Beat-3 tool, the next-talk link renders only when the next talk is live
  // (D-2 drip), and the waitlist demotes to the tertiary slot with its honest
  // note kept verbatim. Wire names stay stable; `target` disambiguates.
  const handlePrimaryCta = () => {
    if (!enableAnalytics) return;
    analyticsService.track({
      name: LESSON_EVENTS.CTA_PRIMARY_CLICKED,
      parameters: { lessonId, locale, target: 'calculator', timestamp: Date.now() },
    });
  };

  const handleNextTalkCta = () => {
    if (!enableAnalytics) return;
    analyticsService.track({
      name: LESSON_EVENTS.CTA_SECONDARY_CLICKED,
      parameters: { lessonId, locale, target: 'next-talk', timestamp: Date.now() },
    });
  };

  const handleWaitlistCta = () => {
    // Phase 3 (RV-2): per-talk waitlist attribution through the existing
    // sessionStorage machinery (mirrors DemoLauncher). Runs regardless of
    // analytics consent: cta_source is first-party funnel context on the
    // signup itself, same as every other CTA source.
    setCtaSource(`learn-${lessonId}`);
    if (!enableAnalytics) return;
    analyticsService.track({
      name: LESSON_EVENTS.CTA_SECONDARY_CLICKED,
      parameters: { lessonId, locale, target: 'waitlist', timestamp: Date.now() },
    });
  };

  const handlePrevTalkCta = () => {
    if (!enableAnalytics) return;
    analyticsService.track({
      name: LESSON_EVENTS.CTA_SECONDARY_CLICKED,
      parameters: { lessonId, locale, target: 'prev-talk', timestamp: Date.now() },
    });
  };

  const handleToolsHubCta = () => {
    if (!enableAnalytics) return;
    analyticsService.track({
      name: LESSON_EVENTS.CTA_SECONDARY_CLICKED,
      parameters: { lessonId, locale, target: 'tools', timestamp: Date.now() },
    });
  };

  const handleAllTalksCta = () => {
    if (!enableAnalytics) return;
    analyticsService.track({
      name: LESSON_EVENTS.CTA_SECONDARY_CLICKED,
      parameters: { lessonId, locale, target: 'all-talks', timestamp: Date.now() },
    });
  };

  const nextTalk = getNextLiveLesson(lesson);
  const prevTalk = getPrevLiveLesson(lesson);

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
        youtubeVideoId={lesson.youtube?.[locale]}
        youtubeLessonId={lessonId}
        youtubeVideoLocale={locale}
        enableAnalytics={enableAnalytics}
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
                <p
                  className={styles.beatBody}
                  // V-4 (visual pass, 2026-07-16): this string carries the
                  // approved *repeat* emphasis; without the helper the
                  // asterisks rendered literally in all 4 locales.
                  dangerouslySetInnerHTML={renderInlineEmphasis(t('beat2.vignettesIntro'))}
                />
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

            {/* Phase 3 quiz (registry-gated). Placed BEFORE the CTA group so
             * the LESSON_COMPLETED sentinel keeps meaning "reached the end". */}
            {lesson.blocks.quiz ? (
              <TalkQuizFactory lesson={lesson} enableAnalytics={enableAnalytics} />
            ) : null}

            <div className={styles.ctaGroup} ref={ctaGroupRef}>
              {/* Hash-only href: CTAButtonLink wraps internal hrefs in plain
               * next/link, so `#beat3` scrolls same-page natively without
               * locale-prefix mangling (verified in the Phase-2 spec). */}
              <CTAButtonLink href="#beat3" variant="primary" onClick={handlePrimaryCta}>
                {t('beat3.cta.primary')}
              </CTAButtonLink>
              {!nextTalk && lesson.next ? (
                <p className={styles.ctaFallback}>{t('beat3.cta.secondary')}</p>
              ) : null}
              <LocaleLink
                href={waitlistCtaHref}
                className={styles.ctaTertiary}
                onClick={handleWaitlistCta}
                prefetch={false}
              >
                {t('beat3.cta.waitlist')}
              </LocaleLink>
              <p className={styles.ctaNote}>{t('beat3.cta.primaryNote')}</p>
            </div>

            {/* P-3 (talk-page polish): the two-slot spine navigation. Left =
             * previous live talk, or the Real Talk index on the first talk.
             * Right = next live talk (drip-gated), or the tools hub on the
             * last talk (D-P3-1). Sits BELOW the CTA group so the
             * education-first hierarchy is untouched. */}
            <nav
              className={styles.talkNav}
              aria-label={intl.formatMessage({ id: 'learn.talkNav.label' })}
            >
              {prevTalk ? (
                <LocaleLink
                  href={`/learn/${prevTalk.slug}`}
                  className={styles.talkNavLink}
                  onClick={handlePrevTalkCta}
                  prefetch={false}
                >
                  <LucideIcon icon={ArrowLeft} size="xs" />
                  {intl.formatMessage(
                    { id: `${ns}.beat3.cta.prev` },
                    { title: intl.formatMessage({ id: `learn.arc.${prevTalk.id}.title` }) }
                  )}
                </LocaleLink>
              ) : (
                <LocaleLink
                  href="/learn"
                  className={styles.talkNavLink}
                  onClick={handleAllTalksCta}
                  prefetch={false}
                >
                  <LucideIcon icon={ArrowLeft} size="xs" />
                  {intl.formatMessage({ id: 'learn.talkNav.allTalks' })}
                </LocaleLink>
              )}
              {nextTalk ? (
                <LocaleLink
                  href={`/learn/${nextTalk.slug}`}
                  className={styles.talkNavLink}
                  onClick={handleNextTalkCta}
                  prefetch={false}
                >
                  {intl.formatMessage(
                    { id: `${ns}.beat3.cta.next` },
                    { title: intl.formatMessage({ id: `learn.arc.${nextTalk.id}.title` }) }
                  )}
                  <LucideIcon icon={ArrowRight} size="xs" />
                </LocaleLink>
              ) : !lesson.next ? (
                <LocaleLink
                  href="/tools"
                  className={styles.talkNavLink}
                  onClick={handleToolsHubCta}
                  prefetch={false}
                >
                  {t('beat3.cta.toolsHub')}
                  <LucideIcon icon={ArrowRight} size="xs" />
                </LocaleLink>
              ) : (
                <span aria-hidden="true" />
              )}
            </nav>
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
