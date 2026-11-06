/**
 * 5.802 · the calculator share TITLE and CARD state the amount in the visitor's locale — tested
 * through the real page metadata and the real image route, not one spelling of a formatter
 * (8th audit: an English formatter written differently, or the card hard-coded to `en`, passed).
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

const nbsp = (s: string) => s.replace(/[\u00a0\u202f]/g, ' ');
const AMOUNT_IN = { en: '$1.5M', 'pt-BR': 'US$ 1,5 mi', es: '1,5 M US$', de: '1,5 Mio. $' };

async function shareTitle(locale: string, amount: string): Promise<string> {
  const meta = await generateMetadata({
    params: Promise.resolve({ locale }),
    searchParams: Promise.resolve({ type: 'calculator', amount, years: '10' }),
  } as never);
  return nbsp(String((meta.openGraph as { title?: string })?.title ?? ''));
}

async function card(query: string): Promise<string> {
  drawn.element = null;
  await GET(new NextRequest(`https://diboas.test/api/og/share?${query}`));
  return nbsp(renderToStaticMarkup(drawn.element as unknown as ReactElement));
}

describe('5.802 · the calculator share in the visitor locale', () => {
  it.each(Object.entries(AMOUNT_IN))(
    'should title the share page with the amount as %s writes it (%s)',
    async (locale, expected) => {
      expect(await shareTitle(locale, '1500000')).toContain(expected);
    }
  );

  it.each(Object.entries(AMOUNT_IN))(
    'should draw the card with the amount as %s writes it (%s)',
    async (locale, expected) => {
      expect(await card(`type=calculator&amount=1500000&years=10&locale=${locale}`)).toContain(
        expected
      );
    }
  );

  it('should draw an unsupported locale entirely in English, numbers included', async () => {
    for (const tag of ['ja', 'en-u-nu-arab', 'pt'])
      expect(await card(`type=calculator&amount=1500000&years=10&locale=${tag}`), tag).toContain(
        '$1.5M'
      );
  });

  it('should give an invalid amount the default title, never "$NaN" or "-$5K"', async () => {
    const fallback = await shareTitle('en', '0');
    for (const bad of ['junk', '-5000', '1000000000000', '2000000000']) {
      const title = await shareTitle('en', bad);
      expect(title, bad).toBe(fallback);
      expect(title, bad).not.toMatch(/NaN|-\$|\$-/);
    }
  });
});
