import { describe, expect, it } from 'vitest';
import type { ReactElement } from 'react';
import MissingPage from '../page';
import { SANDBOX_LOCALES } from '@/i18n/config';
import { getMessages } from '@/i18n/loadMessages';

/**
 * `5.267` — the localized not-found surface.
 *
 * The four titles are FOUNDER-APPROVED VERBATIM (2026-09-10). They are asserted
 * as literals here on purpose: this is the one place in the app where a
 * translation drifting would silently replace approved copy, and the register
 * row records the exact wording that was approved.
 */
const APPROVED_TITLE: Record<string, string> = {
  en: "This page isn't here.",
  de: 'Diese Seite gibt es nicht.',
  es: 'Esta página no existe.',
  'pt-BR': 'Esta página não existe.',
};

const render = async (locale: string) =>
  (await MissingPage({ params: Promise.resolve({ locale }) })) as ReactElement;

/** Depth-first text of a React element tree — no DOM needed. */
function text(node: unknown): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(text).join(' ');
  const el = node as ReactElement<{ children?: unknown }>;
  return el.props ? text(el.props.children) : '';
}

describe('the not-found surface says the approved thing, in the right language', () => {
  it.each(SANDBOX_LOCALES)('should render the approved %s title', async (locale) => {
    expect(text(await render(locale))).toContain(APPROVED_TITLE[locale]);
  });

  it.each(SANDBOX_LOCALES)('should offer the way back, in %s', async (locale) => {
    // `notFound.backHome` is the phrase that already existed as
    // `simEvent.backHome` — moved, not duplicated, so one string has one key.
    expect(text(await render(locale))).toContain(getMessages(locale)['notFound.backHome']);
  });

  it("should link home WITHIN the visitor's own language", async () => {
    // A German 404 that sends you to the English home is a second wrong turn.
    for (const locale of SANDBOX_LOCALES) {
      const el = await render(locale);
      const json = JSON.stringify(el, (_k, v) => (typeof v === 'function' ? undefined : v));
      expect(json).toContain(`"href":"/${locale}"`);
    }
  });

  it('should fall back to the default language for an unknown locale, never crash', async () => {
    // Reached by rewrite, so the segment is normally sound — but a 404 page
    // that throws would turn a wrong turn into an error page.
    const el = await render('zz');
    expect(text(el)).toContain(APPROVED_TITLE.en);
    expect(JSON.stringify(el)).toContain('"href":"/en"');
  });

  it('should stay noindex, like every other sandbox surface', async () => {
    const { metadata } = await import('../page');
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it('should keep the approved wording present in every catalogue', () => {
    // Guards the catalogues directly, not just this component: a translation
    // pass that "improves" approved copy has to change this test to do it.
    for (const locale of SANDBOX_LOCALES) {
      expect(getMessages(locale)['notFound.title']).toBe(APPROVED_TITLE[locale]);
    }
  });
});
