/**
 * TalkQuizDefault — render + behavior + analytics contract (Phase 3 Slice A).
 *
 * - Fieldset per graded question, options as native buttons, reflection as
 *   plain text (no input, never a data capture).
 * - One answer per question; feedback + correct option revealed; no retries.
 * - `learn_quiz_submitted` fires exactly once, when the LAST graded answer
 *   lands, with the aggregate correctCount only.
 * - Share: 7-platform icon row (P-4); copy path copies line + UTM URL with
 *   the platform param on the stable wire name; failure path is quiet.
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { analyticsService } from '@/lib/analytics';
import { LESSON_EVENTS, LESSONS } from '@/lib/learn';

// Inside the hoisted factory (vi.mock is hoisted above imports, so the
// catalog must live inside it, not in outer scope).
vi.mock('@diboas/i18n/client', () => {
  const CATALOG: Record<string, string> = {
    'learn-compound-interest.quiz.q1.options.0': 'q1-opt-a',
    'learn-compound-interest.quiz.q1.options.1': 'q1-opt-b',
    'learn-compound-interest.quiz.q1.options.2': 'q1-opt-c',
    'learn-compound-interest.quiz.q2.options.0': 'q2-opt-a',
    'learn-compound-interest.quiz.q2.options.1': 'q2-opt-b',
    'learn-compound-interest.quiz.q2.options.2': 'q2-opt-c',
  };
  return {
    useTranslation: () => ({
      locale: 'en',
      messages: CATALOG,
      // Catalog value when present (options), id-echo otherwise (chrome), and
      // id+values for ICU strings (score line) so assertions stay exact.
      formatMessage: ({ id }: { id: string }, values?: Record<string, unknown>) =>
        values ? `${id} ${JSON.stringify(values)}` : (CATALOG[id] ?? id),
    }),
  };
});
vi.mock('@/lib/analytics', () => ({ analyticsService: { track: vi.fn() } }));

import { TalkQuizDefault } from '../variants/TalkQuizDefault';
import { TalkQuizFactory } from '../TalkQuizFactory';

const mockTrack = vi.mocked(analyticsService.track);
const talk1 = LESSONS['compound-interest'];

// Registry contract this suite assumes (drift-guarded in registryHelpers too).
const CORRECT = talk1.blocks.quiz!.correctIndexes; // [1, 0]

function optionButton(label: string): HTMLButtonElement {
  return screen.getByText(label) as HTMLButtonElement;
}

describe('TalkQuizDefault', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('should render one fieldset per graded question, the reflection, and no inputs', () => {
    const { container } = render(<TalkQuizDefault lesson={talk1} enableAnalytics={false} />);
    expect(container.querySelectorAll('fieldset')).toHaveLength(CORRECT.length);
    expect(screen.getByText('learn-compound-interest.quiz.reflection')).toBeTruthy();
    expect(container.querySelectorAll('input, textarea, select')).toHaveLength(0);
  });

  it('should give correct feedback and reveal the right option, one answer per question', () => {
    render(<TalkQuizDefault lesson={talk1} enableAnalytics={false} />);
    fireEvent.click(optionButton('q1-opt-b')); // correct (index 1)
    expect(screen.getByText('learn.quiz.correct')).toBeTruthy();
    expect(optionButton('q1-opt-b').dataset.state).toBe('correct');
    expect(optionButton('q1-opt-a').disabled).toBe(true);
    // Second click on the same question is a no-op (buttons disabled).
    fireEvent.click(optionButton('q1-opt-a'));
    expect(optionButton('q1-opt-a').dataset.state).toBe('muted');
  });

  it('should mark a wrong choice incorrect AND still reveal the correct option', () => {
    render(<TalkQuizDefault lesson={talk1} enableAnalytics={false} />);
    fireEvent.click(optionButton('q1-opt-c')); // wrong
    expect(screen.getByText('learn.quiz.incorrect')).toBeTruthy();
    expect(optionButton('q1-opt-c').dataset.state).toBe('incorrect');
    expect(optionButton('q1-opt-b').dataset.state).toBe('correct');
  });

  it.each([
    [['q1-opt-b', 'q2-opt-a'], 2],
    [['q1-opt-b', 'q2-opt-c'], 1],
    [['q1-opt-a', 'q2-opt-b'], 0],
  ])('should fire learn_quiz_submitted once with correctCount (%s -> %i)', (clicks, expected) => {
    render(<TalkQuizDefault lesson={talk1} />);
    fireEvent.click(optionButton(clicks[0]));
    expect(mockTrack).not.toHaveBeenCalled(); // only 1 of 2 answered
    fireEvent.click(optionButton(clicks[1]));
    const calls = mockTrack.mock.calls.filter(([e]) => e.name === LESSON_EVENTS.QUIZ_SUBMITTED);
    expect(calls).toHaveLength(1);
    expect(calls[0][0].parameters?.correctCount).toBe(expected);
    // Score line renders with registry-driven total.
    expect(
      screen.getByText(`learn.quiz.score {"count":${expected},"total":${CORRECT.length}}`)
    ).toBeTruthy();
  });

  it('should render the 7-platform share icon row', () => {
    render(<TalkQuizDefault lesson={talk1} enableAnalytics={false} />);
    for (const label of [
      'common.accessibility.shareOnWhatsapp',
      'common.accessibility.shareOnX',
      'share.platform.facebook',
      'common.accessibility.shareOnLinkedin',
      'share.platform.instagram',
      'share.platform.substack',
      'common.accessibility.copyToClipboard',
    ]) {
      expect(screen.getByRole('button', { name: label })).toBeTruthy();
    }
  });

  it('should copy line + UTM talk URL on copy, swap feedback, and fire the platform param', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    render(<TalkQuizDefault lesson={talk1} />);
    fireEvent.click(screen.getByRole('button', { name: 'common.accessibility.copyToClipboard' }));
    await waitFor(() => expect(screen.getByText('learn.quiz.share.copied')).toBeTruthy());
    const payload = writeText.mock.calls[0][0] as string;
    expect(payload).toContain('learn-compound-interest.quiz.share.line');
    expect(payload).toContain('/learn/compound-interest');
    expect(payload).toContain('utm_campaign=real_talk');
    const calls = mockTrack.mock.calls.filter(([e]) => e.name === LESSON_EVENTS.SHARE_COPIED);
    expect(calls).toHaveLength(1);
    expect(calls[0][0].parameters?.platform).toBe('copy');
  });

  it('should open a share window (not copy) for window platforms', () => {
    const open = vi.fn();
    vi.stubGlobal('open', open);
    render(<TalkQuizDefault lesson={talk1} />);
    fireEvent.click(screen.getByRole('button', { name: 'common.accessibility.shareOnWhatsapp' }));
    expect(open).toHaveBeenCalledTimes(1);
    expect(String(open.mock.calls[0][0])).toContain('wa.me');
    const calls = mockTrack.mock.calls.filter(([e]) => e.name === LESSON_EVENTS.SHARE_COPIED);
    expect(calls[0][0].parameters?.platform).toBe('whatsapp');
  });

  it('should fail quietly when the clipboard is unavailable', async () => {
    vi.stubGlobal('navigator', {
      ...navigator,
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    render(<TalkQuizDefault lesson={talk1} />);
    fireEvent.click(screen.getByRole('button', { name: 'common.accessibility.copyToClipboard' }));
    await waitFor(() => expect(screen.getByText('learn.quiz.share.copyFailed')).toBeTruthy());
  });

  it('should fire nothing when analytics is disabled', () => {
    render(<TalkQuizDefault lesson={talk1} enableAnalytics={false} />);
    fireEvent.click(optionButton('q1-opt-b'));
    fireEvent.click(optionButton('q2-opt-a'));
    expect(mockTrack).not.toHaveBeenCalled();
  });

  it('Factory should render nothing for a talk without a quiz block', () => {
    const { container } = render(
      <TalkQuizFactory lesson={LESSONS['money-objective']} enableAnalytics={false} />
    );
    expect(container.innerHTML).toBe('');
  });
});
