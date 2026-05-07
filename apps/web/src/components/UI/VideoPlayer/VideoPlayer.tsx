'use client';

/**
 * VideoPlayer — idle-by-default, lazy-loaded, captioned.
 *
 * Phase A.3 of the Learn Center MVP.
 *
 * Behavior:
 *   - If `sources` is empty/undefined, the component renders nothing.
 *     Callers (e.g. LessonHero) display a text-and-illustration fallback.
 *   - If `sources` is present, render an AVIF poster + Play button.
 *     The <video> element only mounts after the user clicks Play.
 *   - Captions are mandatory (WCAG AA) — when present, a <track> per
 *     locale is mounted alongside <source>.
 *   - prefers-reduced-motion suppresses any auto-anything; user must
 *     click Play explicitly.
 *
 * The video host (cdn.diboas.com) is allow-listed in the CSP media-src
 * directive added in Phase A.0.5.
 */

import { useRef, useState } from 'react';
import Image from 'next/image';
import { analyticsService } from '@/lib/analytics';
import { LucideIcon, Play } from '@/components/UI/LucideIcon';
import styles from './VideoPlayer.module.css';

interface VideoSource {
  src: string;
  type: 'video/mp4' | 'application/x-mpegURL';
}

interface VideoCaptionTrack {
  src: string;
  srcLang: string;
  label: string;
  default?: boolean;
}

interface VideoPlayerProps {
  sources?: VideoSource[];
  poster?: string;
  captions?: VideoCaptionTrack[];
  /** Visible transcript fallback — toggleable below the player. */
  transcript?: React.ReactNode;
  ariaLabel: string;
  /** Used as the analytics event metadata.context. */
  contextId?: string;
  className?: string;
}

const VIDEO_EVENTS = {
  PLAY: 'video_play',
  PAUSE: 'video_pause',
  PROGRESS_25: 'video_25',
  PROGRESS_50: 'video_50',
  PROGRESS_75: 'video_75',
  COMPLETE: 'video_100',
} as const;

export function VideoPlayer({
  sources,
  poster,
  captions,
  transcript,
  ariaLabel,
  contextId,
  className,
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  // Fire-once tracker for milestone events. Persists across renders, resets per mount.
  const firedRef = useRef<Record<string, boolean>>({});

  // Idle state: no sources → render nothing. Lesson hero handles the fallback.
  if (!sources || sources.length === 0) {
    return null;
  }

  const handlePlayClick = () => {
    setIsPlaying(true);
    analyticsService.track({
      name: VIDEO_EVENTS.PLAY,
      parameters: { contextId, timestamp: Date.now() },
    });
  };

  const handleProgress = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (!video.duration || !Number.isFinite(video.duration)) return;
    const pct = (video.currentTime / video.duration) * 100;
    const milestones = [
      { event: VIDEO_EVENTS.PROGRESS_25, threshold: 25 },
      { event: VIDEO_EVENTS.PROGRESS_50, threshold: 50 },
      { event: VIDEO_EVENTS.PROGRESS_75, threshold: 75 },
      { event: VIDEO_EVENTS.COMPLETE, threshold: 99 },
    ];
    for (const m of milestones) {
      if (pct >= m.threshold && !firedRef.current[m.event]) {
        firedRef.current[m.event] = true;
        analyticsService.track({
          name: m.event,
          parameters: { contextId, timestamp: Date.now() },
        });
      }
    }
  };

  const handlePause = () =>
    analyticsService.track({
      name: VIDEO_EVENTS.PAUSE,
      parameters: { contextId, timestamp: Date.now() },
    });

  return (
    <div className={`${styles.container} ${className ?? ''}`}>
      {!isPlaying ? (
        <button
          type="button"
          className={styles.playButton}
          onClick={handlePlayClick}
          aria-label={ariaLabel}
        >
          {poster && (
            <Image
              src={poster}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 1200px"
              className={styles.poster}
              aria-hidden="true"
            />
          )}
          <span className={styles.playIcon} aria-hidden="true">
            <LucideIcon icon={Play} size="xl" />
          </span>
        </button>
      ) : (
        <video
          className={styles.video}
          controls
          autoPlay
          poster={poster}
          aria-label={ariaLabel}
          onPlay={handlePlayClick}
          onPause={handlePause}
          onTimeUpdate={handleProgress}
        >
          {sources.map((s) => (
            <source key={s.src} src={s.src} type={s.type} />
          ))}
          {captions?.map((c) => (
            <track
              key={c.srcLang}
              src={c.src}
              srcLang={c.srcLang}
              label={c.label}
              kind="captions"
              default={c.default}
            />
          ))}
        </video>
      )}

      {transcript && (
        <details
          className={styles.transcript}
          open={showTranscript}
          onToggle={(e) => setShowTranscript((e.target as HTMLDetailsElement).open)}
        >
          <summary className={styles.transcriptSummary}>Transcript</summary>
          <div className={styles.transcriptContent}>{transcript}</div>
        </details>
      )}
    </div>
  );
}
