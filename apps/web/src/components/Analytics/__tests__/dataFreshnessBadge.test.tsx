// @vitest-environment happy-dom
/**
 * The freshness badge never shows the pipeline's internal English notes
 * (2026-10-21, 12-principle review gate of the market lane): they were a hover
 * title in every locale and could contradict the read-time status label.
 */
import fs from 'node:fs';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DataFreshnessBadge } from '../DataFreshnessBadge';

const LABELS = {
  FRESH: 'Aktuell',
  DELAYED: 'Verzögert',
  STALE: 'Veraltet',
  UNAVAILABLE: 'Nicht verfügbar',
};

describe('DataFreshnessBadge — no internal note reaches the reader', () => {
  it('should render the localized label and status, with no tooltip, and keep the source id as an attribute', () => {
    const html = renderToStaticMarkup(
      <DataFreshnessBadge
        status="DELAYED"
        source="FRED:M2SL"
        label="Geldmenge M2"
        labels={LABELS}
      />
    );
    expect(html).toContain('Geldmenge M2');
    expect(html).toContain('Verzögert');
    expect(html).not.toContain('title=');
    expect(html).toContain('data-source="FRED:M2SL"');
  });

  it('should not be handed the pipeline message by the market view', () => {
    const shell = fs.readFileSync(
      path.join(__dirname, '../../../app/[locale]/(landing)/market/MarketViewShell.tsx'),
      'utf8'
    );
    expect(shell).not.toMatch(/message=\{src\.message\}/);
  });
});
