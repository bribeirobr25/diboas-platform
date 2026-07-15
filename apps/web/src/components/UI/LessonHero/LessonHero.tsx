'use client';

import Image from 'next/image';
import { VideoPlayer } from '@/components/UI/VideoPlayer';
import { VideoFacadeFactory } from '@/components/UI/VideoFacade';
import type { LessonId, VideoSourceConfig } from '@/lib/learn';
import type { SupportedLocale } from '@diboas/i18n/config';
import styles from './LessonHero.module.css';

interface LessonHeroProps {
  /** Lesson H1 — already translated by the caller. */
  title: string;
  /** Read-time estimate (already translated). */
  readTime?: string;
  /** Pulled from the lesson registry; if undefined, hero falls back to text + illustration. */
  video?: VideoSourceConfig;
  /** Locale used to pick the right caption track when video is present. */
  locale: SupportedLocale;
  /** Illustration AVIF — used when video is absent. Defaults to learn-banner.avif. */
  illustrationSrc?: string;
  illustrationAlt?: string;
  /** A11y label passed through to the video player. */
  videoAriaLabel?: string;
  /**
   * YouTube-nocookie facade (Phase 3 Slice B, D-1). Rendered only when no
   * self-hosted `video` is set (RV-6 precedence: self-hosted > youtube >
   * illustration). Callers resolve the id per locale from the registry.
   */
  youtubeVideoId?: string;
  /** Required alongside youtubeVideoId (facade analytics payloads). */
  youtubeLessonId?: LessonId;
  /** The recording's locale (may differ from the UI locale). */
  youtubeVideoLocale?: string;
  enableAnalytics?: boolean;
}

const DEFAULT_ILLUSTRATION = '/assets/navigation/learn-banner.avif';

export function LessonHero({
  title,
  readTime,
  video,
  locale,
  illustrationSrc = DEFAULT_ILLUSTRATION,
  illustrationAlt = '',
  videoAriaLabel = '',
  youtubeVideoId,
  youtubeLessonId,
  youtubeVideoLocale,
  enableAnalytics,
}: LessonHeroProps) {
  const hasVideo = Boolean(video?.sources?.length);
  const hasYoutube = Boolean(youtubeVideoId && youtubeLessonId);

  return (
    <header className={styles.hero}>
      <div className={styles.text}>
        <h1 className={styles.title}>{title}</h1>
        {readTime && <p className={styles.readTime}>{readTime}</p>}
      </div>
      <div className={styles.media}>
        {hasVideo ? (
          <VideoPlayer
            sources={video!.sources}
            poster={video!.poster}
            captions={video!.captions
              .filter((c) => c.locale === locale)
              .map((c) => ({
                src: c.src,
                srcLang: c.srcLang,
                label: c.label,
                default: true,
              }))}
            ariaLabel={videoAriaLabel || title}
            contextId="lesson-hero"
          />
        ) : hasYoutube ? (
          <VideoFacadeFactory
            videoId={youtubeVideoId!}
            title={title}
            thumbnailSrc={illustrationSrc}
            lessonId={youtubeLessonId!}
            videoLocale={youtubeVideoLocale ?? locale}
            enableAnalytics={enableAnalytics}
          />
        ) : (
          <div className={styles.illustration}>
            <Image
              src={illustrationSrc}
              alt={illustrationAlt}
              width={1200}
              height={675}
              priority
              sizes="(max-width: 768px) 100vw, 1200px"
              className={styles.illustrationImg}
            />
          </div>
        )}
      </div>
    </header>
  );
}
