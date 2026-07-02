/**
 * InvestorDocBody — render contract.
 *
 * Presentational mapping of generated `blocks[]` to semantic HTML. We assert
 * each block type (heading level, paragraph, list, table with header scope,
 * quote, callout) and the jump-to "On this page" nav (shown only for docs with
 * >= 3 sections, anchored to each section's stable slug id).
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InvestorDocBody, type InvestorDocContent } from '../InvestorDocBody';

const CONTENT: InvestorDocContent = {
  blocks: [
    { type: 'heading', level: 2, text: 'Section A' },
    { type: 'paragraph', text: 'A paragraph.' },
    { type: 'list', ordered: false, items: ['item x', 'item y'] },
    { type: 'table', headers: ['Action', 'Fee'], rows: [['Add money', '0.48%']] },
    { type: 'quote', text: 'A quote.' },
    { type: 'callout', lines: ['Trust first. Charge clearly.'] },
  ],
};

const LABELS = { onThisPageLabel: 'On this page' };

describe('InvestorDocBody', () => {
  it('should render each block type with correct semantics', () => {
    const { container } = render(<InvestorDocBody content={CONTENT} {...LABELS} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Section A' })).toBeTruthy();
    expect(screen.getByText('A paragraph.')).toBeTruthy();
    expect(screen.getByText('item x')).toBeTruthy();
    // table with a scoped header + a data cell
    expect(container.querySelector('th[scope="col"]')).toBeTruthy();
    expect(screen.getByText('Add money')).toBeTruthy();
    expect(container.querySelector('blockquote')).toBeTruthy();
    expect(screen.getByText('Trust first. Charge clearly.')).toBeTruthy();
  });

  it('should omit the jump-to nav when there are fewer than three sections', () => {
    // CONTENT has a single level-2 heading — below the ToC threshold.
    const { container } = render(<InvestorDocBody content={CONTENT} {...LABELS} />);
    expect(container.querySelector('nav')).toBeNull();
  });

  it('should render a jump-to nav with anchored links to each section', () => {
    const multi: InvestorDocContent = {
      blocks: [
        { type: 'heading', level: 2, text: 'What diBoaS is' },
        { type: 'heading', level: 2, text: 'The problem' },
        { type: 'heading', level: 2, text: 'How it makes money' },
      ],
    };
    const { container } = render(<InvestorDocBody content={multi} {...LABELS} />);
    const nav = container.querySelector('nav');
    expect(nav).toBeTruthy();
    // each section heading has a stable slug id that a ToC link targets
    const link = nav?.querySelector('a[href="#how-it-makes-money"]');
    expect(link?.textContent).toBe('How it makes money');
    expect(container.querySelector('h2#how-it-makes-money')).toBeTruthy();
  });
});
