/**
 * TalkArcDefault — render + a11y + analytics contract (Phase 2, learn
 * redesign plan 2026-07-15).
 *
 * - All 7 talks render in spine order with derived Talk-N-of-7 numbering.
 * - Live talks are links to /learn/<slug>; announced talks carry NO
 *   interactive semantics (Phase-0 B-2: no fake buttons).
 * - Announced impressions fire the stable `learn_roadmap_card_viewed` wire
 *   name once per card at >=50% visibility.
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { analyticsService } from '@/lib/analytics';
import { LESSON_EVENTS, getSeriesLessons } from '@/lib/learn';

vi.mock('@diboas/i18n/client', () => ({
  useTranslation: () => ({
    locale: 'en',
    formatMessage: ({ id }: { id: string }, values?: Record<string, unknown>) =>
      values ? `${id} ${JSON.stringify(values)}` : id,
  }),
}));
vi.mock('@/lib/analytics', () => ({ analyticsService: { track: vi.fn() } }));
vi.mock('@/components/UI/LocaleLink', () => ({
  // Explicit props only (no spread): `prefetch` is not a DOM attribute, and a
  // spread would hide the link contract from jsx-a11y/security lint rules.
  LocaleLink: ({
    href,
    children,
    className,
    onClick,
  }: React.PropsWithChildren<{
    href: string;
    className?: string;
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
    prefetch?: boolean;
  }>) => (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  ),
}));

import { TalkArcDefault } from '../variants/TalkArcDefault';

const mockTrack = vi.mocked(analyticsService.track);

/** IntersectionObserver stub that immediately reports full visibility. */
class ImmediateIO {
  private cb: IntersectionObserverCallback;
  constructor(cb: IntersectionObserverCallback) {
    this.cb = cb;
  }
  observe(el: Element) {
    this.cb(
      [{ isIntersecting: true, target: el } as unknown as IntersectionObserverEntry],
      this as unknown as IntersectionObserver
    );
  }
  disconnect() {}
  unobserve() {}
}

describe('TalkArcDefault', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('IntersectionObserver', ImmediateIO);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should render all 7 talks as list items in spine order', () => {
    render(<TalkArcDefault enableAnalytics={false} />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(7);
    const expectedOrder = getSeriesLessons().map((l) => `learn.arc.${l.id}.title`);
    const renderedTitles = items.map(
      (li) => expectedOrder.find((key) => li.textContent?.includes(key)) ?? 'MISSING'
    );
    expect(renderedTitles).toEqual(expectedOrder);
  });

  it('should derive Talk-N numbering from spine position', () => {
    render(<TalkArcDefault enableAnalytics={false} />);
    const items = screen.getAllByRole('listitem');
    items.forEach((li, index) => {
      expect(li.textContent).toContain(`learn.arc.badge {"n":${index + 1}}`);
    });
  });

  it('should link live talks to /learn/<slug> and render read time + CTA', () => {
    render(<TalkArcDefault enableAnalytics={false} />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(getSeriesLessons().filter((l) => l.status === 'live').length);
    const talk1 = links[0];
    expect(talk1.getAttribute('href')).toBe('/learn/compound-interest');
    expect(talk1.textContent).toContain('learn.arc.readTime {"minutes":5}');
    expect(talk1.textContent).toContain('learn.arc.cardCta');
  });

  it('should give announced talks no interactive semantics and a coming-soon badge', () => {
    render(<TalkArcDefault enableAnalytics={false} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    const announced = document.querySelectorAll('[data-status="announced"]');
    expect(announced).toHaveLength(getSeriesLessons().filter((l) => l.status !== 'live').length);
    for (const card of announced) {
      expect(card.getAttribute('role')).toBeNull();
      expect(card.getAttribute('tabindex')).toBeNull();
      expect(card.textContent).toContain('learn.arc.comingSoon');
    }
  });

  it('should fire one impression event per announced card with the stable wire name', () => {
    render(<TalkArcDefault />);
    const announcedIds = getSeriesLessons()
      .filter((l) => l.status !== 'live')
      .map((l) => l.id);
    const impressionCalls = mockTrack.mock.calls.filter(
      ([event]) => event.name === LESSON_EVENTS.ROADMAP_CARD_VIEWED
    );
    expect(impressionCalls).toHaveLength(announcedIds.length);
    expect(impressionCalls.map(([event]) => event.parameters?.lessonId).sort()).toEqual(
      [...announcedIds].sort()
    );
  });

  it('should fire no analytics when disabled', () => {
    render(<TalkArcDefault enableAnalytics={false} />);
    expect(mockTrack).not.toHaveBeenCalled();
  });
});
