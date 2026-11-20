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
    'should give an old calculator link the default title and image in %s',
    async (locale) => {
      const fallback = await meta(locale, {});
      const old = await meta(locale, { type: 'calculator', amount: '1500000', years: '10' });
      expect(old.title).not.toBe('');
      expect(old).toEqual(fallback);
      expect(old.image).not.toMatch(/calculator|amount=/);
    }
  );

  it('should draw the default card for an old calculator link', async () => {
    const fallback = await card('locale=en');
    expect(fallback).not.toBe('');
    expect(await card('type=calculator&amount=1500000&years=10&locale=en')).toBe(fallback);
  });

  it.each(LOCALES)('should title a waitlist share with its position in %s', async (locale) => {
    const fallback = await meta(locale, {});
    const shared = await meta(locale, { type: 'waitlist', position: '247' });
    expect(shared.title).toContain('247');
    expect(shared.title).not.toBe(fallback.title);
    expect(shared.image).toContain('type=waitlist');
  });
});

describe('5.802 · a share in the visitor locale (the Money Tools result)', () => {
  it.each(Object.entries(AMOUNT_IN))(
    'should title the share page with the amount as %s writes it (%s)',
    async (locale, expected) => {
      const shared = await meta(locale, TOOL);
      expect(shared.title).toContain(expected);
      expect(shared.image).toContain('type=tool-result');
    }
  );

  it.each(Object.entries(AMOUNT_IN))(
    'should draw the card with the amount as %s writes it (%s)',
    async (locale, expected) => {
      expect(
        await card(`type=tool-result&tool=money-jobs&value=2400000&currency=USD&locale=${locale}`)
      ).toContain(expected);
    }
  );

  it('should give an invalid amount the default title, never NaN or a negative amount', async () => {
    const fallback = await meta('en', {});
    for (const bad of ['junk', '-5000', '1000000000000', '0']) {
      const shared = await meta('en', { ...TOOL, value: bad });
      expect(shared.title, bad).toBe(fallback.title);
      expect(shared.title, bad).not.toMatch(/NaN|-\$|\$-/);
    }
  });

  it('should give a tool outside the allowlist the default title, as the card is the default', async () => {
    const fallback = await meta('en', {});
    const shared = await meta('en', { ...TOOL, tool: 'not-a-tool' });
    expect(shared.title).toBe(fallback.title);
    expect(
      await card('type=tool-result&tool=not-a-tool&value=2400000&currency=USD&locale=en')
    ).toBe(await card('locale=en'));
  });
});
