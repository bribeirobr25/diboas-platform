/**
 * VideoFacadeDefault — the click-to-load contract (Phase 3 Slice B, D-1).
 *
 * The load-bearing assertion is the PERFORMANCE GUARANTEE: no iframe (and no
 * YouTube URL of any kind) exists in the DOM before the click. Then: click
 * swaps in the nocookie embed + fires learn_video_started; the error path is
 * the 4s load-timeout heuristic; the "Watch on YouTube" link is always
 * present once activated.
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, act } from '@testing-library/react';
import { analyticsService } from '@/lib/analytics';
import { LESSON_EVENTS } from '@/lib/learn';

vi.mock('@diboas/i18n/client', () => ({
  useTranslation: () => ({
    locale: 'en',
    formatMessage: ({ id }: { id: string }) => id,
  }),
}));
vi.mock('@/lib/analytics', () => ({ analyticsService: { track: vi.fn() } }));
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { fill: _fill, sizes: _sizes, src, alt, ...rest } = props;
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src as string} alt={alt as string} {...(rest as Record<string, never>)} />;
  },
}));

import { VideoFacadeDefault } from '../variants/VideoFacadeDefault';

const mockTrack = vi.mocked(analyticsService.track);

const PROPS = {
  videoId: 'abc123XYZ',
  title: 'How Money Really Grows',
  thumbnailSrc: '/assets/learn/talk-01-hero.avif',
  lessonId: 'compound-interest' as const,
  videoLocale: 'en',
};

describe('VideoFacadeDefault', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Hermeticity note (Phase-3 audit, 2026-07-16): happy-dom initiates a
    // real fetch for the iframe src on insert. `disableIframePageLoading` is
    // set in vitest.config.mts and verifiably reaches window.happyDOM, but
    // happy-dom 20.10.x iframes read settings from a DETACHED browser
    // context that does not inherit it (upstream quirk), so an aborted
    // "NetworkError" line may appear in output. It is cosmetic: NO assertion
    // here depends on the network (the load-path test fires fireEvent.load
    // synthetically; the timeout test advances fake timers synchronously
    // before any real response could land). Re-check when happy-dom updates.
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('should render NO iframe and NO YouTube URL before the click (the performance guarantee)', () => {
    const { container } = render(<VideoFacadeDefault {...PROPS} enableAnalytics={false} />);
    expect(container.querySelector('iframe')).toBeNull();
    expect(container.innerHTML).not.toContain('youtube');
    expect(screen.getByRole('button', { name: 'learn.video.playLabel' })).toBeTruthy();
    expect(screen.getByText('learn.video.privacyNote')).toBeTruthy();
  });

  it('should swap in the nocookie iframe on click and fire learn_video_started', () => {
    const { container } = render(<VideoFacadeDefault {...PROPS} />);
    fireEvent.click(screen.getByRole('button', { name: 'learn.video.playLabel' }));

    const iframe = container.querySelector('iframe');
    expect(iframe?.getAttribute('src')).toBe(
      'https://www.youtube-nocookie.com/embed/abc123XYZ?autoplay=1&rel=0'
    );
    expect(iframe?.getAttribute('title')).toBe(PROPS.title);
    expect(iframe?.getAttribute('referrerpolicy')).toBe('strict-origin-when-cross-origin');

    const started = mockTrack.mock.calls.filter(([e]) => e.name === LESSON_EVENTS.VIDEO_STARTED);
    expect(started).toHaveLength(1);
    expect(started[0][0].parameters?.videoLocale).toBe('en');
  });

  it('should always render the Watch-on-YouTube link once activated', () => {
    render(<VideoFacadeDefault {...PROPS} enableAnalytics={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'learn.video.playLabel' }));
    const link = screen.getByText('learn.video.watchOnYouTube');
    expect(link.getAttribute('href')).toBe('https://www.youtube.com/watch?v=abc123XYZ');
    expect(link.getAttribute('rel')).toContain('noopener');
  });

  it('should show the error fallback + fire learn_video_error when the iframe never loads', () => {
    const { container } = render(<VideoFacadeDefault {...PROPS} />);
    fireEvent.click(screen.getByRole('button', { name: 'learn.video.playLabel' }));
    act(() => {
      vi.advanceTimersByTime(4001);
    });
    expect(container.querySelector('iframe')).toBeNull();
    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.getByText('learn.video.watchOnYouTube')).toBeTruthy();
    expect(mockTrack.mock.calls.filter(([e]) => e.name === LESSON_EVENTS.VIDEO_ERROR)).toHaveLength(
      1
    );
  });

  it('should NOT error when the iframe load event fires in time', () => {
    const { container } = render(<VideoFacadeDefault {...PROPS} />);
    fireEvent.click(screen.getByRole('button', { name: 'learn.video.playLabel' }));
    fireEvent.load(container.querySelector('iframe')!);
    act(() => {
      vi.advanceTimersByTime(4001);
    });
    expect(container.querySelector('iframe')).toBeTruthy();
    expect(mockTrack.mock.calls.filter(([e]) => e.name === LESSON_EVENTS.VIDEO_ERROR)).toHaveLength(
      0
    );
  });

  it('should fire nothing when analytics is disabled', () => {
    render(<VideoFacadeDefault {...PROPS} enableAnalytics={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'learn.video.playLabel' }));
    act(() => {
      vi.advanceTimersByTime(4001);
    });
    expect(mockTrack).not.toHaveBeenCalled();
  });
});
