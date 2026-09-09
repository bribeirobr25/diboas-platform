// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildRecords,
  canContinue,
  isReadinessAvailable,
  LEGAL_CHOICES_STORAGE_KEY,
  LEGAL_CONTROLS,
  LEGAL_DOCUMENTS,
  READINESS_DEFAULTS,
  readLegalChoices,
  saveLegalChoices,
} from '../legal/readiness';

/** LC-TD-02 §4 — the four separate concepts and their evidence (I-0b). */
describe('legal readiness — four separate concepts (LC-TD-02 §4.1)', () => {
  it('should define exactly the four Legal control ids, distinct', () => {
    expect([...LEGAL_CONTROLS]).toEqual([
      'LEGAL-TERMS',
      'LEGAL-PRIVACY',
      'LEGAL-AGE',
      'LEGAL-ANALYTICS',
    ]);
    expect(new Set(LEGAL_CONTROLS).size).toBe(4);
  });

  it('should default every choice to unselected (nothing pre-checked — LB-04)', () => {
    // Sabotage: set terms or age to true here and this fails.
    expect(READINESS_DEFAULTS).toEqual({ terms: false, age: false, analytics: false });
  });

  it.each([
    [{ terms: false, age: false, analytics: false }, false],
    [{ terms: true, age: false, analytics: false }, false],
    [{ terms: false, age: true, analytics: false }, false],
    [{ terms: true, age: true, analytics: false }, true],
    [{ terms: true, age: true, analytics: true }, true],
    [{ terms: false, age: false, analytics: true }, false],
  ])('should gate Continue on BOTH required declarations, never on analytics: %j → %s', (c, ok) => {
    expect(canContinue(c)).toBe(ok);
  });

  it('should refuse to build records without both required declarations', () => {
    expect(() => buildRecords({ terms: true, age: false, analytics: false }, 'en')).toThrow();
  });

  it('should evidence Terms and age as SEPARATE records with every §4.3 field (LB-06)', () => {
    const now = new Date('2026-09-08T00:00:00Z');
    const records = buildRecords({ terms: true, age: true, analytics: false }, 'de', now);
    const terms = records.find((r) => r.controlId === 'LEGAL-TERMS');
    const age = records.find((r) => r.controlId === 'LEGAL-AGE');
    expect(terms).toBeTruthy();
    expect(age).toBeTruthy();
    for (const r of [terms!, age!]) {
      expect(r.documentId).toBe(LEGAL_DOCUMENTS.terms.id);
      expect(r.documentVersion).toBe(LEGAL_DOCUMENTS.terms.version);
      expect(r.locale).toBe('de');
      expect(r.timestamp).toBe(now.toISOString());
    }
    expect(terms!.state).toBe('accepted');
    expect(age!.state).toBe('declared');
  });

  it('should evidence analytics with purpose, the choice and its change timestamp (§4.3)', () => {
    const now = new Date('2026-09-08T00:00:00Z');
    const refused = buildRecords({ terms: true, age: true, analytics: false }, 'en', now).find(
      (r) => r.controlId === 'LEGAL-ANALYTICS'
    )!;
    const allowed = buildRecords({ terms: true, age: true, analytics: true }, 'en', now).find(
      (r) => r.controlId === 'LEGAL-ANALYTICS'
    )!;
    expect(refused).toMatchObject({
      state: 'refused',
      purpose: 'product_analytics',
      changedAt: now.toISOString(),
    });
    expect(allowed).toMatchObject({ state: 'allowed', purpose: 'product_analytics' });
    expect(refused.documentId).toBe(LEGAL_DOCUMENTS.privacy.id);
  });

  it('should never record LEGAL-PRIVACY as a choice (information, not consent)', () => {
    const records = buildRecords({ terms: true, age: true, analytics: true }, 'en');
    expect(records.some((r) => r.controlId === 'LEGAL-PRIVACY')).toBe(false);
  });

  it('should carry the Legal SOURCE version, never an invented notice version', () => {
    expect(LEGAL_DOCUMENTS.terms.version).toMatch(/LC-TD-02_v1\.0_2026-09-07_SOURCE/);
    expect(LEGAL_DOCUMENTS.terms.version).not.toMatch(/\[NOTICE_VERSION\]/);
  });
});

describe('legal readiness — device-local evidence (D-01) until accounts', () => {
  beforeEach(() => localStorage.clear());

  it('should round-trip records through the versioned storage key', () => {
    const records = buildRecords({ terms: true, age: true, analytics: false }, 'en');
    saveLegalChoices(records);
    expect(localStorage.getItem(LEGAL_CHOICES_STORAGE_KEY)).toBeTruthy();
    expect(readLegalChoices()).toEqual(records);
  });

  it('should read an empty list for missing, malformed or wrong-version storage', () => {
    expect(readLegalChoices()).toEqual([]);
    localStorage.setItem(LEGAL_CHOICES_STORAGE_KEY, '{not json');
    expect(readLegalChoices()).toEqual([]);
    localStorage.setItem(LEGAL_CHOICES_STORAGE_KEY, JSON.stringify({ version: 2, records: [] }));
    expect(readLegalChoices()).toEqual([]);
  });
});

describe('legal readiness — route availability (internal build only)', () => {
  it('should be unavailable unless PRACTICE_ACCOUNTS_ENABLED is exactly true', () => {
    for (const v of [undefined, '', 'TRUE', '1', ' true']) {
      expect(isReadinessAvailable('en', { PRACTICE_ACCOUNTS_ENABLED: v })).toBe(false);
    }
    expect(isReadinessAvailable('en', { PRACTICE_ACCOUNTS_ENABLED: 'true' })).toBe(true);
  });

  it('should serve only locales whose chrome wording is approved (F-6)', () => {
    // Sabotage: add 'de' to LEGAL_READINESS_LOCALES while de.json still carries the
    // English chrome and untranslated.test.ts fails; this row documents the gate.
    expect(isReadinessAvailable('de', { PRACTICE_ACCOUNTS_ENABLED: 'true' })).toBe(false);
    expect(isReadinessAvailable('en', { PRACTICE_ACCOUNTS_ENABLED: 'true' })).toBe(true);
  });
});
