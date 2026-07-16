'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/config';
import { analyticsService } from '@/lib/analytics';
import { LESSON_EVENTS, readMessageArray, type LessonMetadata } from '@/lib/learn';
import { getShareUrl, type SharePlatform } from '@/lib/share';
import {
  copyToClipboard,
  getFacebookShareUrl,
  getLinkedInShareUrl,
  getTwitterShareUrl,
  getWhatsAppShareUrl,
  openShareWindow,
} from '@/lib/share/platformUrls';
import {
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  SubstackIcon,
  TwitterIcon,
  WhatsAppIcon,
} from '@/components/WaitingList/ReferralIcons';
import { LucideIcon, Check, Link2 } from '@/components/UI/LucideIcon';
import styles from './TalkQuizDefault.module.css';

interface TalkQuizDefaultProps {
  lesson: LessonMetadata;
  enableAnalytics?: boolean;
}

type ShareState = 'idle' | 'copied' | 'failed';

/**
 * The talk quiz: N graded multiple-choice questions (N = the registry's
 * correctIndexes length) + an ungraded reflection + the platform share-icon
 * row (P-4: same lib/share + ReferralIcons stack as the preDream results and
 * the waitlist success; the approved share line is the payload, never
 * share-to-unlock).
 *
 * One answer per question (retrieval practice: changing after seeing the
 * answer is noise). Feedback is announced via aria-live. The single
 * `learn_quiz_submitted` event fires when the last graded answer lands and
 * carries only the aggregate correctCount (never per-question answers).
 */
export function TalkQuizDefault({ lesson, enableAnalytics = true }: TalkQuizDefaultProps) {
  const intl = useTranslation();
  const locale: SupportedLocale = isValidLocale(intl.locale) ? intl.locale : 'en';

  const ns = lesson.namespace;
  const lessonId = lesson.id;
  const correctIndexes = lesson.blocks.quiz?.correctIndexes ?? [];

  const t = (key: string) => intl.formatMessage({ id: `${ns}.${key}` });
  const chrome = (key: string, values?: Record<string, string | number>) =>
    intl.formatMessage({ id: `learn.quiz.${key}` }, values);
  const tArray = (key: string): string[] =>
    readMessageArray(intl.messages as Record<string, unknown>, `${ns}.${key}`, (id) =>
      intl.formatMessage({ id })
    );

  const [answers, setAnswers] = useState<ReadonlyArray<number | null>>(() =>
    correctIndexes.map(() => null)
  );
  const [shareState, setShareState] = useState<ShareState>('idle');

  const submittedRef = useRef(false);
  const shareTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (shareTimerRef.current) clearTimeout(shareTimerRef.current);
    };
  }, []);

  const allAnswered = answers.every((a) => a !== null);
  const correctCount = answers.filter((a, i) => a === correctIndexes[i]).length;

  const handleAnswer = (questionIndex: number, optionIndex: number) => {
    setAnswers((prev) => {
      if (prev[questionIndex] !== null) return prev;
      const next = prev.map((a, i) => (i === questionIndex ? optionIndex : a));

      if (enableAnalytics && !submittedRef.current && next.every((a) => a !== null)) {
        submittedRef.current = true;
        analyticsService.track({
          name: LESSON_EVENTS.QUIZ_SUBMITTED,
          parameters: {
            lessonId,
            locale,
            correctCount: next.filter((a, i) => a === correctIndexes[i]).length,
            timestamp: Date.now(),
          },
        });
      }
      return next;
    });
  };

  // P-4: one handler for all platforms, mirroring ShareDreamSection. The
  // share URL is the talk's own page + the learn UTM config (registry slug,
  // never window parsing). Copy-type platforms (instagram/substack/copy)
  // copy text+link; the rest open the platform's share window.
  const handleShare = async (platform: SharePlatform) => {
    const shareText = t('quiz.share.line');
    const shareUrl = getShareUrl('learn', platform, undefined, locale, `/learn/${lesson.slug}`);
    if (enableAnalytics) {
      analyticsService.track({
        // Historical wire name (pre-icons, when copy was the only path);
        // covers ALL platforms via the `platform` param. Keep stable.
        name: LESSON_EVENTS.SHARE_COPIED,
        parameters: { lessonId, locale, platform, timestamp: Date.now() },
      });
    }
    try {
      switch (platform) {
        case 'whatsapp':
          openShareWindow(getWhatsAppShareUrl(shareText, shareUrl));
          break;
        case 'twitter':
          openShareWindow(getTwitterShareUrl(shareText, shareUrl));
          break;
        case 'facebook':
          openShareWindow(getFacebookShareUrl(shareText, shareUrl));
          break;
        case 'linkedin':
          await copyToClipboard(shareText);
          openShareWindow(getLinkedInShareUrl(shareUrl));
          break;
        case 'instagram':
        case 'substack':
        case 'copy': {
          const ok = await copyToClipboard(`${shareText} ${shareUrl}`);
          setShareState(ok ? 'copied' : 'failed');
          if (shareTimerRef.current) clearTimeout(shareTimerRef.current);
          shareTimerRef.current = setTimeout(() => setShareState('idle'), 2000);
          break;
        }
      }
    } catch {
      setShareState('failed');
      if (shareTimerRef.current) clearTimeout(shareTimerRef.current);
      shareTimerRef.current = setTimeout(() => setShareState('idle'), 2000);
    }
  };

  const a11y = (key: string) => intl.formatMessage({ id: key });

  return (
    <section className={styles.quiz} aria-labelledby="talk-quiz-title">
      <h2 id="talk-quiz-title" className={styles.title}>
        {chrome('title')}
      </h2>

      {correctIndexes.map((correctIndex, questionIndex) => {
        const qKey = `q${questionIndex + 1}`;
        const options = tArray(`quiz.${qKey}.options`);
        const chosen = answers[questionIndex];
        const answered = chosen !== null;

        return (
          <fieldset key={qKey} className={styles.question}>
            <legend className={styles.legend}>{t(`quiz.${qKey}.question`)}</legend>
            <div className={styles.options}>
              {options.map((option, optionIndex) => (
                <button
                  key={option}
                  type="button"
                  className={styles.option}
                  disabled={answered}
                  data-state={
                    answered
                      ? optionIndex === correctIndex
                        ? 'correct'
                        : optionIndex === chosen
                          ? 'incorrect'
                          : 'muted'
                      : 'idle'
                  }
                  onClick={() => handleAnswer(questionIndex, optionIndex)}
                >
                  {option}
                </button>
              ))}
            </div>
            <p className={styles.feedback} aria-live="polite">
              {answered ? (chosen === correctIndex ? chrome('correct') : chrome('incorrect')) : ''}
            </p>
          </fieldset>
        );
      })}

      {allAnswered ? (
        <p className={styles.score}>
          {chrome('score', { count: correctCount, total: correctIndexes.length })}
        </p>
      ) : null}

      <p className={styles.reflection}>{t('quiz.reflection')}</p>

      <div className={styles.share}>
        <p className={styles.shareLine}>{t('quiz.share.line')}</p>
        <div className={styles.shareButtons}>
          <button
            type="button"
            onClick={() => handleShare('whatsapp')}
            className={styles.shareIconButton}
            title="WhatsApp"
            aria-label={a11y('common.accessibility.shareOnWhatsapp')}
          >
            <WhatsAppIcon />
          </button>
          <button
            type="button"
            onClick={() => handleShare('twitter')}
            className={styles.shareIconButton}
            title="X / Twitter"
            aria-label={a11y('common.accessibility.shareOnX')}
          >
            <TwitterIcon />
          </button>
          <button
            type="button"
            onClick={() => handleShare('facebook')}
            className={styles.shareIconButton}
            title="Facebook"
            aria-label={a11y('share.platform.facebook')}
          >
            <FacebookIcon />
          </button>
          <button
            type="button"
            onClick={() => handleShare('linkedin')}
            className={styles.shareIconButton}
            title="LinkedIn"
            aria-label={a11y('common.accessibility.shareOnLinkedin')}
          >
            <LinkedInIcon />
          </button>
          <button
            type="button"
            onClick={() => handleShare('instagram')}
            className={styles.shareIconButton}
            title="Instagram"
            aria-label={a11y('share.platform.instagram')}
          >
            <InstagramIcon />
          </button>
          <button
            type="button"
            onClick={() => handleShare('substack')}
            className={styles.shareIconButton}
            title="Substack"
            aria-label={a11y('share.platform.substack')}
          >
            <SubstackIcon />
          </button>
          <button
            type="button"
            onClick={() => handleShare('copy')}
            className={styles.shareIconButton}
            data-state={shareState}
            title={
              shareState === 'copied'
                ? chrome('share.copied')
                : a11y('common.accessibility.copyToClipboard')
            }
            aria-label={a11y('common.accessibility.copyToClipboard')}
          >
            <LucideIcon icon={shareState === 'copied' ? Check : Link2} size="sm" />
          </button>
        </div>
        <p className={styles.shareFeedback} aria-live="polite">
          {shareState === 'copied'
            ? chrome('share.copied')
            : shareState === 'failed'
              ? chrome('share.copyFailed')
              : ''}
        </p>
      </div>
    </section>
  );
}
