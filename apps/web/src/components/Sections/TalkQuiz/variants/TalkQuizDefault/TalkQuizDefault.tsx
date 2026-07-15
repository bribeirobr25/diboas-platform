'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/config';
import { analyticsService } from '@/lib/analytics';
import { LESSON_EVENTS, readMessageArray, type LessonMetadata } from '@/lib/learn';
import styles from './TalkQuizDefault.module.css';

interface TalkQuizDefaultProps {
  lesson: LessonMetadata;
  enableAnalytics?: boolean;
}

type ShareState = 'idle' | 'copied' | 'failed';

/**
 * The talk quiz: N graded multiple-choice questions (N = the registry's
 * correctIndexes length) + an ungraded reflection + a copy-to-share line.
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

  const handleShare = async () => {
    const url = `${window.location.origin}${window.location.pathname}`;
    try {
      await navigator.clipboard.writeText(`${t('quiz.share.line')} ${url}`);
      setShareState('copied');
      if (enableAnalytics) {
        analyticsService.track({
          name: LESSON_EVENTS.SHARE_COPIED,
          parameters: { lessonId, locale, timestamp: Date.now() },
        });
      }
    } catch {
      setShareState('failed');
    }
    if (shareTimerRef.current) clearTimeout(shareTimerRef.current);
    shareTimerRef.current = setTimeout(() => setShareState('idle'), 2000);
  };

  const shareLabel =
    shareState === 'copied'
      ? chrome('share.copied')
      : shareState === 'failed'
        ? chrome('share.copyFailed')
        : chrome('share.button');

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
        <button type="button" className={styles.shareButton} onClick={handleShare}>
          {shareLabel}
        </button>
      </div>
    </section>
  );
}
