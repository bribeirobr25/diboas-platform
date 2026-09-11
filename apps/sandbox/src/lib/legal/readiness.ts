/**
 * Legal readiness — the four separate concepts LC-TD-02 §4 requires before a
 * persistent Practice account completes (implementation plan r2, I-0b):
 *
 *   LEGAL-TERMS      required · unchecked · contract acceptance
 *   LEGAL-PRIVACY    displayed + accessible · information, NOT consent
 *   LEGAL-AGE        required · unchecked · its own control, never bundled
 *   LEGAL-ANALYTICS  optional · off · consent where consent is relied upon
 *
 * Pure module: no React, no env reads except through `capabilities.ts`.
 * The evidence record (§4.3) is persisted device-locally until I-7 moves it
 * server-side (decision D-01). The exact user-facing strings live in the
 * catalogs, copied byte-for-byte from `docs/sandbox-app/legal-current/
 * PRACTICE_UI_LEGAL_STRINGS.md` (Legal-approved, four locales); this module
 * never carries copy.
 *
 * Public-deployment boundary (Strategy Canon correction, F-1): the Terms
 * acceptance control is NOT publicly exposed while its destination lacks the
 * required Practice coverage — the route is reachable only behind
 * `PRACTICE_ACCOUNTS_ENABLED` (production OFF), see `isReadinessAvailable`.
 */

import { isPracticeAccountsEnabled, type Env } from '@/lib/capabilities';
import { Logger } from '@/lib/monitoring/Logger';
import { LEGAL_READINESS_LOCALES, legalUrl } from '@/i18n/config';

export const LEGAL_CONTROLS = [
  'LEGAL-TERMS',
  'LEGAL-PRIVACY',
  'LEGAL-AGE',
  'LEGAL-ANALYTICS',
] as const;
export type LegalControlId = (typeof LEGAL_CONTROLS)[number];

/**
 * Document identity for the evidence record. The VERSION is the Legal SOURCE
 * version (LC-TD-02 v1.0 clauses, variables unresolved) — `[NOTICE_VERSION]`
 * is itself an unresolved Legal variable and must never be invented here.
 */
export const LEGAL_DOCUMENTS = {
  terms: { id: 'practice-terms', version: 'LC-TD-02_v1.0_2026-09-07_SOURCE' },
  privacy: { id: 'practice-privacy', version: 'LC-TD-02_v1.0_2026-09-07_SOURCE' },
} as const;

export const LEGAL_CHOICES_STORAGE_KEY = 'diboas.practice.legalChoices.v1';

export interface ReadinessChoices {
  terms: boolean;
  age: boolean;
  analytics: boolean;
}

/** Defaults are the LC-TD-02 §4.1 defaults: nothing pre-selected. */
export const READINESS_DEFAULTS: ReadinessChoices = { terms: false, age: false, analytics: false };

/** Continue needs BOTH required declarations; analytics never gates (§4.1). */
export function canContinue(c: ReadinessChoices): boolean {
  return c.terms === true && c.age === true;
}

/** LC-TD-02 §4.3 evidence fields. */
export interface LegalChoiceRecord {
  controlId: LegalControlId;
  documentId: string;
  documentVersion: string;
  locale: string;
  timestamp: string;
  state: 'accepted' | 'declared' | 'allowed' | 'refused';
  /** Analytics only: purpose/category + the change timestamp of the current state. */
  purpose?: 'product_analytics';
  changedAt?: string;
}

export function buildRecords(
  choices: ReadinessChoices,
  locale: string,
  now: Date = new Date()
): LegalChoiceRecord[] {
  if (!canContinue(choices))
    throw new Error('legal readiness: both required declarations must be affirmative');
  const timestamp = now.toISOString();
  return [
    {
      controlId: 'LEGAL-TERMS',
      documentId: LEGAL_DOCUMENTS.terms.id,
      documentVersion: LEGAL_DOCUMENTS.terms.version,
      locale,
      timestamp,
      state: 'accepted',
    },
    {
      controlId: 'LEGAL-AGE',
      documentId: LEGAL_DOCUMENTS.terms.id,
      documentVersion: LEGAL_DOCUMENTS.terms.version,
      locale,
      timestamp,
      state: 'declared',
    },
    {
      controlId: 'LEGAL-ANALYTICS',
      documentId: LEGAL_DOCUMENTS.privacy.id,
      documentVersion: LEGAL_DOCUMENTS.privacy.version,
      locale,
      timestamp,
      state: choices.analytics ? 'allowed' : 'refused',
      purpose: 'product_analytics',
      changedAt: timestamp,
    },
  ];
}

/**
 * Device-local persistence (D-01). Returns whether the evidence record was
 * actually written.
 *
 * `setItem` throws in private mode and on a full quota (R-9). Unguarded, that
 * exception escaped the Continue handler: nothing was logged, and the user was
 * left on a button that did nothing with no reason given. The boolean keeps the
 * caller's behaviour exactly as it effectively was — no evidence record, no
 * account step — while making the failure observable (Principle 12). Whether an
 * unsavable record should instead proceed, or say something to the user, is a
 * Legal/Product question, not a storage one, and is left to them.
 */
export function saveLegalChoices(records: LegalChoiceRecord[]): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    localStorage.setItem(LEGAL_CHOICES_STORAGE_KEY, JSON.stringify({ version: 1, records }));
    return true;
  } catch (error) {
    Logger.error('legal choice record could not be persisted', {}, error);
    return false;
  }
}

export function readLegalChoices(): LegalChoiceRecord[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LEGAL_CHOICES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { version?: number; records?: LegalChoiceRecord[] };
    return parsed.version === 1 && Array.isArray(parsed.records) ? parsed.records : [];
  } catch {
    return [];
  }
}

/**
 * Where the Privacy Notice / Terms rows point. TODAY: the website's general
 * pages — which LC-TD-02 §3.1 says do NOT provide Practice coverage by
 * themselves. That is exactly why this screen is internal-only. Rendering the
 * `legal-current/` source documents in-app needs a decision on committing the
 * (unfilled) Legal source text to the public repository — raised to the
 * founder as F-7; until then this seam keeps one call site.
 */
export function practiceLegalHref(locale: string, page: 'terms' | 'privacy'): string {
  return legalUrl(locale, page);
}

/**
 * The route may render only (a) behind the accounts capability and (b) in a
 * locale whose chrome wording is authority-approved (F-6 locale completeness;
 * the four Legal control strings themselves are approved in all four locales).
 */
export function isReadinessAvailable(locale: string, env: Env = process.env): boolean {
  return (
    isPracticeAccountsEnabled(env) &&
    (LEGAL_READINESS_LOCALES as readonly string[]).includes(locale)
  );
}
