import { describe, expect, it, vi } from 'vitest';

/**
 * 5.730 · the wiring: the page loader fills the scenario slots from THE constant, so a rate change
 * reaches every reader of a page's catalogue — components, search metadata, share cards. The
 * constant is replaced by 6/9/13 here; the real loader and the real metadata builder run.
 */
vi.mock('@/lib/compound-interest/scenarios', () => ({
  SCENARIO_RATES: { conservative: 6, historical: 9, optimistic: 13 },
}));

import { SUPPORTED_LOCALES } from '@diboas/i18n/server';
import { loadPageNamespaces } from '../pageNamespaceLoader';
import { toolMetadata } from '@/lib/tools/metadata';
import { TOOL_DESCRIPTORS } from '@/lib/tools/constants';
import type { ToolKey } from '@/lib/tools/types';
import { generateLessonMetadata } from '@/lib/learn/lessonMetadata';
import { LESSONS } from '@/lib/learn/registry';

describe('5.730 · the loader fills the scenario copy from the constant', () => {
  it('should hand pages the constant’s rates and figures, never a slot', async () => {
    const de = await loadPageNamespaces('de', ['tools-shared', 'learn-compound-interest']);
    expect(de['tools-shared.scenarios.conservative']).toBe('Konservativ (6%)');
    expect(de['learn-compound-interest.calculator.outputOptimistic']).toBe('Optimistisch (13%)');
    expect(de['learn-compound-interest.beat1.body.2']).toContain('vorsichtigen 6%');
    expect(de['learn-compound-interest.beat1.body.2']).not.toContain('2.252');
    for (const [id, text] of Object.entries(de)) expect(text, id).not.toMatch(/\{scenario/);
  });

  it('should give every tool’s search and share metadata the constant’s figures, with no slot (×4)', async () => {
    for (const locale of SUPPORTED_LOCALES)
      for (const key of Object.keys(TOOL_DESCRIPTORS) as ToolKey[]) {
        const meta = await toolMetadata(key)({ params: Promise.resolve({ locale }) } as never);
        const served = JSON.stringify(meta);
        expect(served, `${locale} ${key}`).not.toMatch(/\{scenario/);
        // The SEO gate measures the catalogue's template; what is SERVED must hold the bounds too.
        const d = String(meta.description);
        expect(d.length, `${locale} ${key} description length`).toBeGreaterThanOrEqual(50);
        expect(d.length, `${locale} ${key} description length`).toBeLessThanOrEqual(210);
        if (key === 'currency-depreciation') expect(d, `${locale} ${key}`).toContain('9%');
      }
  });

  it('should serve every Learn talk’s metadata with no slot: it reads its catalogue directly (×4)', async () => {
    for (const locale of SUPPORTED_LOCALES)
      for (const id of Object.keys(LESSONS)) {
        const meta = await generateLessonMetadata(id, locale);
        expect(JSON.stringify(meta), `${locale} ${id}`).not.toMatch(/\{scenario/);
      }
  });
});
