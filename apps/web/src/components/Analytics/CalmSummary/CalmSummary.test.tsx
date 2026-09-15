// @vitest-environment happy-dom
/**
 * The memo must render the paragraphs it was written in (PENDING_ALL 5.304 / 5.372).
 *
 * Measured on production 2026-09-15: the published memo rendered as ONE <p> of
 * 1,403 characters with zero <br>. The `\n\n` was present in the text node;
 * `white-space: normal` collapsed it. No gate saw anything wrong because every
 * figure reconciled and every locale was present — the only casualty was the
 * reading.
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CalmSummary } from './CalmSummary';
import type { RegimeSummary } from '@/lib/analytics-sdk/types';

const summary = (over: Partial<RegimeSummary> = {}): RegimeSummary =>
  ({
    short: 'One short line.',
    detailed: 'First paragraph.\n\nSecond paragraph.',
    plain: 'A plain line.',
    confidence_level: 'HIGH',
    mixed_signals: false,
    key_supportive_factors: [],
    key_headwinds: [],
    ...over,
  }) as RegimeSummary;

const paras = (c: HTMLElement) => [...c.querySelectorAll('p')];

describe('CalmSummary — multi-paragraph memos', () => {
  it('should render one <p> per authored paragraph, not one block', () => {
    const { container } = render(<CalmSummary data={summary()} length="detailed" />);
    expect(paras(container)).toHaveLength(2);
    expect(paras(container)[0].textContent).toBe('First paragraph.');
    expect(paras(container)[1].textContent).toBe('Second paragraph.');
  });

  it('should not leave the break as literal whitespace inside one element', () => {
    // The defect's exact signature: the text present, the structure not.
    const { container } = render(<CalmSummary data={summary()} length="detailed" />);
    const single = paras(container).find((p) => p.textContent?.includes('\n\n'));
    expect(single, 'a paragraph still carries a raw \\n\\n').toBeUndefined();
  });

  it('should break on a BLANK LINE only, never on a single newline', () => {
    // A single \n inside a paragraph is a soft wrap in the source, not a
    // paragraph break. Splitting on /\n/ would shred one paragraph into
    // sentence fragments, each in its own <p> — and every other assertion here
    // still passes, because the text is all still present. This is the case
    // that discriminates the two regexes.
    const { container } = render(
      <CalmSummary data={summary({ detailed: 'One.\nStill one.\n\nTwo.' })} length="detailed" />
    );
    expect(paras(container), 'split on single \\n shreds the paragraph').toHaveLength(2);
    expect(paras(container)[0].textContent).toContain('Still one.');
  });

  it('should treat three or more newlines as one break, not an empty paragraph', () => {
    const { container } = render(
      <CalmSummary data={summary({ detailed: 'A.\n\n\n\nB.' })} length="detailed" />
    );
    expect(paras(container)).toHaveLength(2);
    expect(paras(container).every((p) => (p.textContent ?? '').trim().length > 0)).toBe(true);
  });
});

describe('CalmSummary — the single-paragraph DOM is unchanged', () => {
  // The fix must not restructure the 99% case. A wrapper appearing around every
  // short summary would be a layout change nobody asked for.
  it('should render a bare <p> for a one-paragraph memo', () => {
    const { container } = render(
      <CalmSummary data={summary({ detailed: 'Only one.' })} length="detailed" />
    );
    expect(container.querySelector('div')).toBeNull();
    expect(paras(container)).toHaveLength(1);
  });

  it('should render a bare <p> for short and for plain', () => {
    const a = render(<CalmSummary data={summary()} length="short" />);
    expect(a.container.querySelector('div')).toBeNull();
    expect(paras(a.container)).toHaveLength(1);

    const b = render(<CalmSummary data={summary()} length="plain" />);
    expect(b.container.querySelector('div')).toBeNull();
    expect(paras(b.container)).toHaveLength(1);
  });

  it('should still render nothing when the plain layer is absent (P3 back-compat)', () => {
    const { container } = render(
      <CalmSummary data={summary({ plain: undefined })} length="plain" />
    );
    expect(container.innerHTML).toBe('');
  });

  it('should keep the caller className on the outer element in both shapes', () => {
    const one = render(
      <CalmSummary data={summary({ detailed: 'Only one.' })} length="detailed" className="x" />
    );
    expect(one.container.firstElementChild?.className).toContain('x');
    const two = render(<CalmSummary data={summary()} length="detailed" className="y" />);
    expect(two.container.firstElementChild?.className).toContain('y');
  });
});

describe('the real published memo', () => {
  it('should render as more than one paragraph this cycle', async () => {
    const regime = (await import('@/../data/market/shared/regime.json')).default as unknown as {
      summary: Record<string, RegimeSummary>;
    };
    const { container } = render(<CalmSummary data={regime.summary.en} length="detailed" />);
    expect(
      paras(container).length,
      'the committed memo is authored in paragraphs; if this is 1, the break was lost again'
    ).toBeGreaterThan(1);
  });
});
