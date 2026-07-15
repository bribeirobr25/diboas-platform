'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useTranslation } from '@diboas/i18n/client';
import { analyticsService } from '@/lib/analytics';
import { LESSON_EVENTS, type LessonId } from '@/lib/learn';
import { LucideIcon, Play } from '@/components/UI/LucideIcon';
import styles from './VideoFacadeDefault.module.css';

export interface VideoFacadeProps {
  /** YouTube video id (already resolved per locale by the caller). */
  videoId: string;
  /** Talk h1; becomes the iframe title (a11y) and the thumbnail alt context. */
  title: string;
  /** Thumbnail; the talk illustration until optimized thumbs land (RV-5). */
  thumbnailSrc: string;
  /** For analytics payloads. */
  lessonId: LessonId;
  /** The locale whose recording this is (may differ from the UI locale). */
  videoLocale: string;
  enableAnalytics?: boolean;
}

type FacadeState = 'idle' | 'playing' | 'error';

/**
 * Click-to-load YouTube-nocookie facade (D-1).
 *
 * Idle: own thumbnail + native play button + privacy note. No YouTube
 * request of any kind happens before the click (asserted in tests).
 *
 * Click: swaps in the nocookie iframe. Browsers do not always propagate
 * user activation into a new cross-origin iframe, so some users see
 * YouTube's own play button and click twice: the standard facade tradeoff,
 * accepted (spec accuracy note). Cross-origin iframes do not reliably fire
 * onError, so the error path is a load-timeout heuristic, plus an
 * always-present "Watch on YouTube" link as the honest path for ad-blocker
 * users regardless of detection.
 */
export function VideoFacadeDefault({
  videoId,
  title,
  thumbnailSrc,
  lessonId,
  videoLocale,
  enableAnalytics = true,
}: VideoFacadeProps) {
  const intl = useTranslation();
  const locale = intl.locale;
  const chrome = (key: string) => intl.formatMessage({ id: `learn.video.${key}` });

  const [state, setState] = useState<FacadeState>('idle');
  const loadedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;

  const handlePlay = () => {
    setState('playing');
    if (enableAnalytics) {
      analyticsService.track({
        name: LESSON_EVENTS.VIDEO_STARTED,
        parameters: { lessonId, locale, videoLocale, timestamp: Date.now() },
      });
    }
    // Error heuristic: if the iframe hasn't fired `load` within 4s, assume
    // blocked (ad-blocker / offline) and surface the fallback.
    timeoutRef.current = setTimeout(() => {
      if (loadedRef.current) return;
      setState('error');
      if (enableAnalytics) {
        analyticsService.track({
          name: LESSON_EVENTS.VIDEO_ERROR,
          parameters: { lessonId, locale, videoLocale, timestamp: Date.now() },
        });
      }
    }, 4000);
  };

  return (
    <div className={styles.facade}>
      {state === 'idle' ? (
        <>
          <button
            type="button"
            className={styles.playButton}
            aria-label={chrome('playLabel')}
            onClick={handlePlay}
          >
            <Image
              src={thumbnailSrc}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 720px"
              className={styles.thumbnail}
            />
            <span className={styles.playBadge} aria-hidden="true">
              <LucideIcon icon={Play} size="lg" />
            </span>
          </button>
          <p className={styles.privacyNote}>{chrome('privacyNote')}</p>
        </>
      ) : (
        <>
          {state === 'error' ? (
            <div className={styles.errorBox} role="status">
              <p className={styles.errorText}>{chrome('privacyNote')}</p>
            </div>
          ) : (
            <div className={styles.playerBox}>
              <iframe
                className={styles.iframe}
                src={embedUrl}
                title={title}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                onLoad={() => {
                  loadedRef.current = true;
                }}
              />
            </div>
          )}
          {/* The honest path for ad-blocker users, present whenever the
           * facade has been activated, regardless of error detection. */}
          <a className={styles.watchLink} href={watchUrl} target="_blank" rel="noopener noreferrer">
            {chrome('watchOnYouTube')}
          </a>
        </>
      )}
    </div>
  );
}
