/**
 * The share page and its card, through the real page metadata and the real image route.
 *
 * Replaces `shareCalculator.test.tsx` (plan P13 PR-2, §15): the Dream Mode calculator card was
 * retired with Dream Mode, but the page's other branches (a waitlist position, a Money Tools
 * result, the default) still serve links already shared, and that file was their only test.
 *
 *   * D10 · an old `?type=calculator` link gets the default title and the default card, never a
 *     half-rendered calculator.
 *   * 5.802 · a share title and card state the amount in the visitor's locale (German "Mio.",
 *     Portuguese "mi"), never one English compact form for every language.
 *   * 5.1024 · a link the image route refuses (invalid amount, unknown tool) gets the default
 *     title, as it gets the default card; the title once stated a zero amount.
 *   * 5.1025 · a parameter given twice reads its first value, as the image route does; the
 *     metadata step used to throw and the link lost its preview.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const drawn: { element: ReactElement | null } = { element: null };
vi.mock('next/og', () => ({
  ImageResponse: class {
    constructor(element: ReactElement) {
      drawn.element = element;
    }
  },
}));
vi.mock('@/lib/security/rateLimiter', () => ({
  checkRateLimit: vi.fn(async () => ({ success: true })),
  getClientIP: vi.fn(() => '127.0.0.1'),
  createRateLimitHeaders: vi.fn(() => ({})),
}));

import { GET } from '../route';
import { generateMetadata } from '@/app/[locale]/(landing)/share/page';

const LOCALES = ['en', 'pt-BR', 'es', 'de'] as const;
const nbsp = (s: string) => s.replace(/[\u00a0\u202f]/g, ' ');

async function meta(locale: string, search: Record<string, string>) {
  const m = await generateMetadata({
    params: Promise.resolve({ locale }),
    searchParams: Promise.resolve(search),
  } as never);
  const og = m.openGraph as { title?: string; images?: Array<{ url: string }> } | undefined;
  return {
    title: nbsp(String(og?.title ?? '')),
    image: String(og?.images?.[0]?.url ?? ''),
  };
}

async function card(query: string): Promise<string> {
  drawn.element = null;
  await GET(new NextRequest(`https://diboas.test/api/og/share?${query}`));
  return nbsp(renderToStaticMarkup(drawn.element as unknown as ReactElement));
}

const AMOUNT_IN = { en: '$2M', 'pt-BR': 'US$ 2 mi', es: '2 M US$', de: '2 Mio. $' };
const TOOL = { type: 'tool-result', tool: 'money-jobs', value: '2400000', currency: 'USD' };

describe('the share page after the calculator card (P13 · D10)', () => {
  it.each(LOCALES)(
    'should give the default title and image when an old calculator link is opened in %s',
    async (locale) => {
      const fallback = await meta(locale, {});
      const old = await meta(locale, { type: 'calculator', amount: '1500000', years: '10' });
      expect(old.title).not.toBe('');
      expect(old).toEqual(fallback);
      expect(old.image).not.toMatch(/calculator|amount=/);
    }
  );

  it('should draw the default card when an old calculator link is opened', async () => {
    const fallback = await card('locale=en');
    expect(fallback).not.toBe('');
    expect(await card('type=calculator&amount=1500000&years=10&locale=en')).toBe(fallback);
  });

  it.each(LOCALES)(
    'should put the position in the title when a waitlist share is opened in %s',
    async (locale) => {
      const fallback = await meta(locale, {});
      const shared = await meta(locale, { type: 'waitlist', position: '247' });
      expect(shared.title).toContain('247');
      expect(shared.title).not.toBe(fallback.title);
      expect(shared.image).toContain('type=waitlist');
    }
  );
});

describe('5.802 · a share in the visitor locale (the Money Tools result)', () => {
  it.each(Object.entries(AMOUNT_IN))(
    'should write the amount as %s writes it (%s) when the share title is built',
    async (locale, expected) => {
      const shared = await meta(locale, TOOL);
      expect(shared.title).toContain(expected);
      expect(shared.image).toContain('type=tool-result');
    }
  );

  it.each(Object.entries(AMOUNT_IN))(
    'should write the amount as %s writes it (%s) when the card is drawn',
    async (locale, expected) => {
      expect(
        await card(`type=tool-result&tool=money-jobs&value=2400000&currency=USD&locale=${locale}`)
      ).toContain(expected);
    }
  );

  it('should give the default title, never NaN or a negative amount, when the amount is invalid', async () => {
    const fallback = await meta('en', {});
    for (const bad of ['junk', '-5000', '1000000000000', '0']) {
      const shared = await meta('en', { ...TOOL, value: bad });
      expect(shared.title, bad).toBe(fallback.title);
      expect(shared.title, bad).not.toMatch(/NaN|-\$|\$-/);
    }
  });

  it('should give the default title, as the card is the default, when the tool is not allowlisted', async () => {
    const fallback = await meta('en', {});
    for (const tool of ['not-a-tool', 'constructor', '__proto__', 'toString']) {
      const shared = await meta('en', { ...TOOL, tool });
      expect(shared.title, tool).toBe(fallback.title);
    }
    expect(
      await card('type=tool-result&tool=not-a-tool&value=2400000&currency=USD&locale=en')
    ).toBe(await card('locale=en'));
  });
});

describe('5.1025 · a parameter given twice', () => {
  it('should read the first value, as the image route does, when a parameter is repeated', async () => {
    const once = await meta('en', TOOL);
    const twice = await meta('en', {
      ...TOOL,
      currency: ['USD', 'EUR'],
      value: ['2400000', '5'],
    } as never);
    expect(twice.title).toBe(once.title);
    expect(twice.image).toContain('type=tool-result');
    const waitlist = await meta('en', {
      type: ['waitlist', 'tool-result'],
      position: ['247', '9'],
    } as never);
    expect(waitlist.title).toContain('247');
  });
});
