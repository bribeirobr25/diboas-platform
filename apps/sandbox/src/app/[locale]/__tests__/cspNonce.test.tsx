// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import type { ReactElement } from 'react';
import LocaleRootLayout from '../layout';

/**
 * The CSP nonce reaches the one inline script that needs it (`5.212`).
 *
 * REQUIREMENT: `middleware.ts` sets `script-src 'self' 'nonce-…'` with no
 * `'unsafe-inline'` (CLAUDE.md § Security prohibits it for scripts). `ThemeScript`
 * is inline and runs pre-paint, so without the nonce the browser blocks it and
 * every visit flashes the wrong theme before hydration — a silent regression,
 * because nothing errors and the page still renders.
 *
 * `ThemeScript.tsx` predicted this exact dependency in its own comment before the
 * CSP existed; this file is the guard that makes the prediction enforceable.
 *
 * Kept SEPARATE from `documentLanguage.test.tsx` on purpose: that file guards a
 * WCAG language defect, this one guards a CSP defect, and a shared file could not
 * tell you which one broke.
 */
vi.mock('next/font/google', () => ({
  Fraunces: () => ({ variable: 'stub-serif-variable' }),
}));

const NONCE = 'Zm9vYmFyYmF6cXV1eA==';
vi.mock('next/headers', () => ({
  headers: () => Promise.resolve(new Map([['x-nonce', 'Zm9vYmFyYmF6cXV1eA==']])),
}));

/**
 * Find the `ThemeScript` element in the returned tree.
 *
 * ⚑ It is an UNRENDERED component element here, not a `<script>`. Calling the
 * layout as a plain function (which is how the document's own shape is tested —
 * see `documentLanguage.test.tsx`) returns React elements without invoking their
 * components, so `element.type` is the `ThemeScript` FUNCTION. `ThemeScript`
 * only returns the real `<script nonce=…>` once React renders it.
 *
 * A first draft of this file searched for `type === 'script'` and could never
 * match — the code was right and the assertion was looking for the wrong thing.
 * Matching on the component's name keeps the test honest about what this layer
 * actually owns: passing the nonce DOWN. That the component then puts it on the
 * script tag is `ThemeScript`'s own contract, asserted in its own file.
 */
function findThemeScript(node: unknown): { nonce?: string } | null {
  if (!node || typeof node !== 'object') return null;
  const el = node as { type?: unknown; props?: Record<string, unknown> };
  const name = typeof el.type === 'function' ? (el.type as { name?: string }).name : undefined;
  if (name === 'ThemeScript') return (el.props ?? {}) as { nonce?: string };
  const kids = el.props?.children;
  for (const child of Array.isArray(kids) ? kids : [kids]) {
    const hit = findThemeScript(child);
    if (hit) return hit;
  }
  return null;
}

describe('the CSP nonce reaches the pre-paint theme script (5.212)', () => {
  it('should pass the request nonce to the inline script, not leave it undefined', async () => {
    const element = (await LocaleRootLayout({
      children: null,
      params: Promise.resolve({ locale: 'en' }),
    })) as ReactElement<Record<string, unknown>>;

    const script = findThemeScript(element);
    expect(script).not.toBeNull();
    // The RESOLVED value, not merely "a nonce prop exists" — the standing lesson
    // that a flag is not the value it is supposed to produce.
    expect(script?.nonce).toBe(NONCE);
  });

  it('should read the nonce from the x-nonce request header, which middleware sets', async () => {
    // Names the contract between the two files: middleware mints and forwards,
    // the layout reads. If either half is renamed, this fails rather than
    // silently degrading to an unnonced script.
    const source = await import('node:fs').then((fs) =>
      fs.readFileSync('src/app/[locale]/layout.tsx', 'utf8')
    );
    expect(source).toContain("get('x-nonce')");
    expect(source).toContain('<ThemeScript nonce={nonce} />');
  });
});
