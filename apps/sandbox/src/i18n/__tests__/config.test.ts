import { describe, expect, it } from 'vitest';
import { detectSandboxLocale, LOCALE_ENDONYM, SANDBOX_LOCALES } from '../config';

describe('detectSandboxLocale — cookie → Accept-Language → default', () => {
  it('should prefer a valid saved cookie over the browser header', () => {
    expect(detectSandboxLocale('de', 'pt-BR,pt;q=0.9')).toBe('de');
  });

  it('should ignore an invalid cookie and fall through to the header', () => {
    expect(detectSandboxLocale('fr', 'pt-BR,pt;q=0.9')).toBe('pt-BR');
  });

  it('should match an exact locale tag from Accept-Language', () => {
    expect(detectSandboxLocale(null, 'pt-BR,en;q=0.8')).toBe('pt-BR');
  });

  it('should match on the primary subtag (de-DE, de-AT -> de)', () => {
    expect(detectSandboxLocale(null, 'de-AT,de;q=0.9,en;q=0.5')).toBe('de');
  });

  it('should honor q-weighting, not header order', () => {
    expect(detectSandboxLocale(null, 'en;q=0.5,de;q=0.9')).toBe('de');
  });

  it('should default to en when nothing matches', () => {
    expect(detectSandboxLocale(null, 'fr-FR,fr;q=0.9')).toBe('en');
    expect(detectSandboxLocale(null, null)).toBe('en');
    expect(detectSandboxLocale(undefined, undefined)).toBe('en');
  });

  it('should have an endonym for every supported locale (never a flag)', () => {
    for (const l of SANDBOX_LOCALES) {
      expect(LOCALE_ENDONYM[l]).toBeTruthy();
    }
    expect(LOCALE_ENDONYM.de).toBe('Deutsch');
  });
});
