/** @vitest-environment happy-dom */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ConfidenceBadge } from '@/components/Analytics/ConfidenceBadge/ConfidenceBadge';
import { DataFreshnessBadge } from '@/components/Analytics/DataFreshnessBadge/DataFreshnessBadge';
import { locales } from './fixtures/experimentalAudit';

const catalog = (locale: string) =>
  JSON.parse(
    fs.readFileSync(
      path.join(__dirname, `../../../../../../packages/i18n/translations/${locale}/market.json`),
      'utf8'
    )
  ).dashboard;
const dom = (html: string) => {
  const el = document.createElement('div');
  el.innerHTML = html;
  return el;
};
describe.each(locales)('C: rendered critical states in %s', (locale) => {
  const labels = catalog(locale);
  it('C02 renders all confidence and freshness states with localized text', () => {
    for (const level of ['HIGH', 'MODERATE', 'LOW'] as const) {
      const el = dom(
        renderToStaticMarkup(<ConfidenceBadge level={level} labels={labels.confidence} />)
      );
      expect(el.querySelector(`[data-confidence="${level.toLowerCase()}"]`)?.textContent).toBe(
        labels.confidence[level]
      );
    }
    for (const status of ['FRESH', 'DELAYED', 'STALE', 'UNAVAILABLE'] as const) {
      const el = dom(
        renderToStaticMarkup(
          <DataFreshnessBadge
            status={status}
            source="synthetic"
            labels={labels.freshness}
            label={labels.sources.btcEtf}
          />
        )
      );
      expect(el.textContent).toContain(labels.freshness[status]);
      expect(el.querySelector(`[data-status="${status.toLowerCase()}"]`)).not.toBeNull();
    }
  });
  it('C03 treats malicious source/message text as text rather than executable markup', () => {
    const payload = '<img src=x onerror="alert(1)"><script>alert(1)</script>';
    const el = dom(
      renderToStaticMarkup(
        <DataFreshnessBadge status="UNAVAILABLE" source={payload} labels={labels.freshness} />
      )
    );
    expect(el.querySelectorAll('script,img,[onerror]')).toHaveLength(0);
    expect(el.textContent).toContain(payload);
    // The badge carries no tooltip any more (2026-10-21); the raw source is an
    // attribute, still inert text.
    expect(el.querySelector('[data-source]')?.getAttribute('data-source')).toBe(payload);
  });
  // K07/K08: ordinary canonical regressions in marketAccessibleText.test.tsx,
  // with regimeLabels/dateLabels supplied through the current component API.
});
