/**
 * /protocols TVL (2026-10-21): every figure comes from ONE committed DeFiLlama
 * pull, the copy in four locales is rendered from it, and the headline shows
 * the localized figure (it used to show an English constant in de/pt-BR/es).
 *
 * @vitest-environment happy-dom
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TVL from '@/lib/market-data/data/protocolsTvl.json';
import { formatUsd, measureTvl, monthLabel } from '../../../../../scripts/protocols-tvl/render.mjs';
import { copyDrift } from '../../../../../scripts/protocols-tvl/refresh.mjs';
import { CARD_SOURCES } from '../../../../../scripts/protocols-tvl/sources.mjs';
import { PROTOCOL_DATA } from '../protocolsData';

vi.mock('@diboas/i18n/client', async () => {
  const de = (await import('../../../../../../../packages/i18n/translations/de/protocols.json'))
    .default as unknown as Record<string, Record<string, string>>;
  return {
    useTranslation: () => ({
      locale: 'de',
      formatMessage: ({ id }: { id: string }) => {
        const [, group, key] = id.split('.');
        return de[group]?.[key] ?? id;
      },
    }),
  };
});

import { ProtocolsTvlSection } from '../sections/ProtocolsTvlSection';

describe('formatUsd — the page’s number style in each locale', () => {
  it('should write billions whole from 10, with one decimal below, and the floor without "~"', () => {
    expect(formatUsd('en', 17_249_000_000)).toBe('~$17 billion');
    expect(formatUsd('de', 1_414_000_000)).toBe('~1,4 Milliarden USD');
    expect(formatUsd('pt-BR', 1_414_000_000)).toBe('~US$1,4 bilhão');
    expect(formatUsd('pt-BR', 2_000_000_000)).toBe('~US$2 bilhões');
    expect(formatUsd('es', 1_414_000_000)).toBe('~1.400 millones USD');
    expect(formatUsd('en', 9_960_000_000)).toBe('~$10 billion');
    expect(formatUsd('de', 1_000_000_000)).toBe('~1 Milliarde USD');
    expect(formatUsd('en', 25e9, false)).toBe('$25 billion');
    expect(formatUsd('de', 25e9, false)).toBe('25 Milliarden USD');
    expect(formatUsd('pt-BR', 25e9, false)).toBe('US$25 bilhões');
    expect(formatUsd('es', 25e9, false)).toBe('25.000 millones USD');
  });

  it('should write millions with two significant figures', () => {
    expect(formatUsd('en', 594_288_914)).toBe('~$590 million');
    expect(formatUsd('de', 44_000_000)).toBe('~44 Millionen USD');
    expect(formatUsd('pt-BR', 202_691_090)).toBe('~US$200 milhões');
    expect(formatUsd('es', 379_000_000)).toBe('~380 millones USD');
    expect(formatUsd('en', 999_700_000)).toBe('~$1 billion');
  });

  it('should refuse a value it cannot state', () => {
    expect(() => formatUsd('en', 0)).toThrow();
    expect(() => formatUsd('en', Number.NaN)).toThrow();
  });
});

describe('monthLabel', () => {
  it('should name the UTC month of the pull in each locale', () => {
    expect(monthLabel('en', '2026-10-31T23:59:59Z')).toBe('October 2026');
    expect(monthLabel('de', '2026-03-01T00:00:00Z')).toBe('März 2026');
    expect(monthLabel('pt-BR', '2026-10-21T12:00:00Z')).toBe('outubro de 2026');
    expect(monthLabel('es', '2026-10-21T12:00:00Z')).toBe('octubre de 2026');
  });
});

describe('measureTvl — from a DeFiLlama /protocols response', () => {
  type Entry = { slug: string; tvl: number | null; parentProtocol?: string };
  const list: Entry[] = Object.entries(CARD_SOURCES).flatMap(([id, src]): Entry[] =>
    'parent' in src
      ? [
          { slug: `${id}-a`, tvl: 1e9, parentProtocol: src.parent },
          { slug: `${id}-b`, tvl: null, parentProtocol: src.parent },
        ]
      : src.entries.map((slug) => ({ slug, tvl: 2e9 }))
  );
  const withCombined: Entry[] = [
    ...list,
    ...['aave', 'maker', 'jupiter', 'sanctum', 'compound-finance', 'jito'].map((p) => ({
      slug: `x-${p}`,
      tvl: 5e9,
      parentProtocol: `parent#${p}`,
    })),
  ];

  it('should total a parent’s entries and a product’s entries, and the six headline parents', () => {
    const d = measureTvl(withCombined, '2026-10-21T12:00:00Z');
    expect(d.cards.morpho.usd).toBe(1e9); // parent: 1e9 + a null entry
    expect(d.cards.gmxV2.usd).toBe(4e9); // two product entries
    expect(d.cards.aaveV3.usd).toBe(2e9);
    expect(d.combined.usd).toBeGreaterThanOrEqual(6 * 5e9);
    expect(d.combined.floor_usd).toBe(25e9);
  });

  it('should mark a card "not reported" when its entries report nothing, never keep a number', () => {
    const d = measureTvl(
      withCombined.map((e) =>
        e.parentProtocol === 'parent#ondo-finance' ? { ...e, tvl: null } : e
      ),
      '2026-10-21T12:00:00Z'
    );
    expect(d.cards.ondo.usd).toBeNull();
  });

  it('should refuse when a configured DeFiLlama entry no longer exists', () => {
    expect(() =>
      measureTvl(
        withCombined.filter((e) => e.slug !== 'aave-v3'),
        '2026-10-21T12:00:00Z'
      )
    ).toThrow(/aave-v3/);
    expect(() =>
      measureTvl(
        withCombined.filter((e) => e.parentProtocol !== 'parent#morpho'),
        '2026-10-21T12:00:00Z'
      )
    ).toThrow(/morpho/);
  });
});

describe('the committed data, the copy and the page agree', () => {
  it('should have copy in all four locales that is exactly a render of the committed data', () => {
    expect(copyDrift()).toEqual([]);
  });

  it('should state a floor the measured total supports', () => {
    expect(TVL.combined.usd).toBeGreaterThanOrEqual(TVL.combined.floor_usd);
    expect(Number.isFinite(Date.parse(TVL.pulled_at))).toBe(true);
  });

  it('should source every card, and link each "Verify on DeFiLlama" to the entry its figure comes from', () => {
    const cards = PROTOCOL_DATA.flatMap((c) => c.protocols);
    expect(cards.map((p) => p.id).sort()).toEqual(Object.keys(CARD_SOURCES).sort());
    for (const p of cards) {
      if (p.defiLlamaUrl) {
        expect(p.defiLlamaUrl).toBe(`https://defillama.com/protocol/${CARD_SOURCES[p.id].page}`);
      }
    }
  });

  it('should render the localized headline figure and its dated source (German page)', () => {
    render(<ProtocolsTvlSection />);
    expect(screen.getByText('25 Milliarden USD')).toBeTruthy();
    expect(screen.queryByText(/\$25 billion/)).toBeNull();
    expect(screen.getByText(/laut DeFiLlama, Stand Oktober 2026/)).toBeTruthy();
  });
});
