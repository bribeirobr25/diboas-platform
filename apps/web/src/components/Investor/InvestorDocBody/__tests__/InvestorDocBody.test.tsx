/**
 * InvestorDocBody — render contract.
 *
 * Presentational mapping of generated `blocks[]` to semantic HTML. We assert the
 * key-points callout, each block type (heading level, paragraph, list, table
 * with header scope, quote), and that an empty keyPoints list is omitted.
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InvestorDocBody, type InvestorDocContent } from '../InvestorDocBody';

const CONTENT: InvestorDocContent = {
  keyPoints: ['Point one', 'Point two'],
  blocks: [
    { type: 'heading', level: 2, text: 'Section A' },
    { type: 'paragraph', text: 'A paragraph.' },
    { type: 'list', ordered: false, items: ['item x', 'item y'] },
    { type: 'table', headers: ['Action', 'Fee'], rows: [['Add money', '0.48%']] },
    { type: 'quote', text: 'A quote.' },
    { type: 'callout', lines: ['Trust first. Charge clearly.'] },
  ],
};

describe('InvestorDocBody', () => {
  it('should render the key-points callout with each point', () => {
    render(<InvestorDocBody content={CONTENT} keyPointsLabel="Key points" />);
    expect(screen.getByText('Point one')).toBeTruthy();
    expect(screen.getByText('Point two')).toBeTruthy();
  });

  it('should render each block type with correct semantics', () => {
    const { container } = render(<InvestorDocBody content={CONTENT} keyPointsLabel="Key points" />);
    expect(screen.getByRole('heading', { level: 2, name: 'Section A' })).toBeTruthy();
    expect(screen.getByText('A paragraph.')).toBeTruthy();
    expect(screen.getByText('item x')).toBeTruthy();
    // table with a scoped header + a data cell
    expect(container.querySelector('th[scope="col"]')).toBeTruthy();
    expect(screen.getByText('Add money')).toBeTruthy();
    expect(container.querySelector('blockquote')).toBeTruthy();
    expect(screen.getByText('Trust first. Charge clearly.')).toBeTruthy();
  });

  it('should omit the callout when there are no key points', () => {
    const { container } = render(
      <InvestorDocBody content={{ keyPoints: [], blocks: [] }} keyPointsLabel="Key points" />
    );
    expect(container.querySelector('aside')).toBeNull();
  });
});
