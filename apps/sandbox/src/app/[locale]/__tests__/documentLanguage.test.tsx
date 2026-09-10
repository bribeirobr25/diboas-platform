import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ReactElement } from 'react';
import LocaleRootLayout, { generateStaticParams } from '../layout';
import { SANDBOX_LOCALES } from '@/i18n/config';

/**
 * `next/font/google` is a build-time transform with no runtime implementation,
 * so it cannot load here. The typeface is not what this file tests — the `lang`
 * attribute is — so it is stubbed rather than worked around.
 */
vi.mock('next/font/google', () => ({
  Fraunces: () => ({ variable: 'stub-serif-variable' }),
}));

/**
 * `5.203` — every locale used to serve `<html lang="en">`.
 *
 * **WCAG 2.1 SC 3.1.1 (Level A).** Verified in production before this fix:
 * `/de/welcome`, `/pt-BR/welcome` and `/es/welcome` all declared English. A
 * screen reader therefore spoke German, Portuguese and Spanish copy in an
 * English voice, browser translation was never offered, and hyphenation and
 * locale font selection fell back to English rules.
 *
 * The cause was structural, not a typo: `<html>` lived in `app/layout.tsx`,
 * which never receives the locale param, and in the App Router only the ROOT
 * layout may render `<html>` — so no nested layout could correct it. The fix
 * makes `[locale]` the root segment, which is why this asserts on the layout's
 * own returned element: that element IS the document, and its `lang` is the
 * whole finding.
 */
describe('the document declares the language it is actually written in (5.203)', () => {
  it.each(SANDBOX_LOCALES)('should render <html lang="%s"> for that locale', async (locale) => {
    const element = (await LocaleRootLayout({
      children: null,
      params: Promise.resolve({ locale }),
    })) as ReactElement<{ lang: string }>;

    expect(element.type).toBe('html');
    expect(element.props.lang).toBe(locale);
  });

  it('should never fall back to a hardcoded language for a non-English locale', () => {
    // The defect's signature: a literal `lang="en"` in the layout source. A
    // regression would most plausibly arrive as someone "simplifying" the prop
    // back to a constant, which the per-locale assertions above would catch —
    // this one names the shape so the reason survives in the file.
    const source = readFileSync(join(process.cwd(), 'src/app/[locale]/layout.tsx'), 'utf8');
    // Comments stripped first: this file's own docstring quotes the defect
    // (`<html lang="en">`) to explain it, and that prose must not trip the rule
    // it documents — the same reason `chartFillDarkMode` reads declarations only.
    const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    expect(code).toContain('lang={locale}');
    expect(code).not.toMatch(/lang="[a-z]/);
  });

  it('should REFUSE an unknown locale rather than declaring a bogus language', async () => {
    // `<html lang="goals">` would be worse than the original defect: an invalid
    // language tag is not merely wrong, it is unparseable by assistive tech.
    await expect(
      LocaleRootLayout({ children: null, params: Promise.resolve({ locale: 'goals' }) })
    ).rejects.toThrowError(/NEXT_HTTP_ERROR_FALLBACK|NEXT_NOT_FOUND/);
  });

  it('should prerender the shell for every supported locale, and only those', () => {
    // The four locales are a closed set (`SANDBOX_LOCALES`), so the params list
    // must be derived from it — never a hand-kept copy that can drift.
    expect(generateStaticParams()).toEqual(SANDBOX_LOCALES.map((locale) => ({ locale })));
  });
});
