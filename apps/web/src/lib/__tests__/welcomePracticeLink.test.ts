/**
 * ⛑ RETIRED-SURFACES-1 guard 7 · the welcome email opens Practice (plan P13, D4).
 *
 * The email's button linked `${BRAND.url}/${locale}/demo?utm_…` ("Try the Interactive Demo").
 * The demo is retired; the button now links Practice's fixed address with no parameters. The
 * site origin is stubbed so a link still built from it would show. `packages/email` has no test
 * runner of its own (adding one would break `coverageGate`'s six-workspace pin), so the guard
 * lives here and reads the package's build: a change to the package needs
 * `pnpm --filter @diboas/email build` before this runs (turbo's `^build` does it in CI).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

const LABELS = {
  en: 'Try Practice',
  'pt-BR': 'Experimente o Practice',
  es: 'Prueba Practice',
  de: 'Practice ausprobieren',
} as const;

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function welcome(locale: string): Promise<string> {
  vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://site.test');
  vi.resetModules();
  const { renderWelcome } = await import('@diboas/email');
  return renderWelcome({
    position: 12,
    referralCode: 'ABC123',
    referralUrl: 'https://site.test/r/ABC123',
    locale,
    tier: 'standard',
    unsubscribeUrl: 'https://site.test/email-preferences',
  }).html;
}

describe('the welcome email opens Practice (P13 · D4)', () => {
  it.each(Object.entries(LABELS))(
    'should link Practice, labelled in %s, with no parameters',
    async (locale, label) => {
      const html = await welcome(locale);
      const button = html.match(/<a href="([^"]*)"[^>]*>([^<]*)<\/a>/g) ?? [];
      const practice = button.filter((a) => a.includes('app.diboas.com'));
      expect(practice).toHaveLength(1);
      expect(practice[0]).toContain('href="https://app.diboas.com"');
      expect(practice[0]).toContain(`>${label}</a>`);
      expect(html).not.toMatch(/\/demo\b/);
      expect(html).not.toMatch(
        /Interactive Demo|Demo Interativa|Demo Interactiva|Interaktive Demo/
      );
      // the stub is live: the footer's legal links, built from the site origin, follow it
      expect(html).toContain(`https://site.test/${locale}/legal/privacy`);
    }
  );
});
