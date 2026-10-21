import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { can } from '@/lib/capabilities';
import { SHELL_SURFACES, SHELL_SURFACE_IDS } from '@/lib/shell/family';
import { stripComments } from '@/test/stripComments';

/**
 * ⚙ `CI-N1` · NO AUTOMATIC PRACTICE → KYC / FUNDING / REAL TRANSITION.
 *
 * **Requirement:** traced to `LC-RR-01-10` and `LC-RR-01-07` (the authority
 * texts live in the private canon). The engineering invariants enforced:
 *
 *   1. No automatic path leads from Practice into KYC, funding or Real.
 *   2. The anonymous Practice app collects no identity document and no date of
 *      birth.
 *
 * ⚑ PREVENTIVE, NOT REMEDIAL. Measured 2026-09-25 across **222 non-test
 * `.ts`/`.tsx` files** in the webapp-reachable surface: **zero** matches in
 * every class below. Nothing here describes a defect — what was missing is the
 * assertion that keeps the absence true, which is the same shape as `CI-N3`.
 *
 * ⚑ THE WORD SCAN IS THE WEAKER HALF AND IS NOT ALONE. A transition needs a
 * SEAM, so the two mechanism assertions below guard the seams that would have
 * to move: the shell registry that makes a surface navigable, and the
 * capability registry that decides whether Real may exist in production.
 */

/* ── 1 · the navigable surface registry ───────────────────────────────────── */

describe('CI-N1 · no Real surface is reachable through the shell', () => {
  it('should declare no shell surface in Real mode', () => {
    /**
     * `SHELL_SURFACES` is what makes a surface navigable and what stamps
     * `data-mode`. A Real destination cannot appear without an entry here, so
     * an entry is the earliest mechanical moment a Practice→Real path exists.
     * `SHELL-3` guards mode MUTATION from the shell; this guards mode
     * DECLARATION in the registry — two different doors.
     */
    const real = SHELL_SURFACE_IDS.filter((id) => SHELL_SURFACES[id].mode === 'real');
    expect(SHELL_SURFACE_IDS.length, 'the registry scan was empty').toBeGreaterThan(10);
    expect(real, `Real-mode shell surface(s) declared: ${real.join(', ')}`).toEqual([]);
  });

  it('should keep every registered surface in a non-value-bearing mode', () => {
    for (const id of SHELL_SURFACE_IDS) {
      expect(['neutral', 'practice'], id).toContain(SHELL_SURFACES[id].mode);
    }
  });
});

/* ── 2 · the capability registry — the deliberate gate ────────────────────── */

describe('CI-N1 · Real parity stays refused in production, flag or no flag', () => {
  it('should REFUSE realParityInternal on a production deployment even when set', () => {
    /**
     * This is the "deliberate gate" the invariant names. `REAL_PARITY_INTERNAL`
     * is `REFUSED_IN_PRODUCTION`: setting the flag on production must not be
     * sufficient. I-8 / Real is NOT AUTHORIZED under current authority.
     */
    expect(
      can('realParityInternal', { REAL_PARITY_INTERNAL: 'true', VERCEL_ENV: 'production' })
    ).toBe(false);
  });

  it('should refuse it for every truthy-looking value that is not exactly "true"', () => {
    for (const value of ['TRUE', '1', ' true', 'yes', 'True']) {
      expect(can('realParityInternal', { REAL_PARITY_INTERNAL: value }), value).toBe(false);
    }
  });

  it('should still ALLOW it on preview — an internal parity build is what preview is for', () => {
    /**
     * The negative control. A gate that refused everywhere would be trivially
     * satisfiable and would also contradict the registry's stated policy, so
     * the test pins the boundary rather than the direction.
     */
    expect(can('realParityInternal', { REAL_PARITY_INTERNAL: 'true', VERCEL_ENV: 'preview' })).toBe(
      true
    );
  });
});

/* ── 3 · the corpus scan ──────────────────────────────────────────────────── */

const ROOTS = [
  join(__dirname, '..'),
  join(__dirname, '../../../../packages/banking/src'),
  join(__dirname, '../../../../packages/defi/src'),
  join(__dirname, '../../../../packages/investing/src'),
];

/**
 * ⚑ COMMENTS ARE STRIPPED, AND THAT DECISION WAS MEASURED, NOT ASSUMED.
 * Against raw text the scan reports two hits, BOTH in prose: a comment
 * explaining that pausing must stop Practice auto-deposits, and `Toggle.tsx`
 * describing *"a real `<button role='switch'>`"*. Neither is a transition.
 * A gate that fires on its own documentation gets disabled.
 *
 * ⛑ BY THE PARSER, NOT BY REGEX (PB-3) — see `@/test/stripComments`.
 *
 * ⛑ PARSED ONCE PER FILE (`5.578`). Each prohibited class is its own test, and
 * each used to re-read and re-parse every file: 6 classes × 235 files = 1,410
 * TypeScript parses for 235 distinct results, enough to push the first class
 * past the 5 s budget under full-workspace load. The stripped text does not
 * depend on the class, so it is cached; every class still scans every file.
 */
const stripped = new Map<string, string>();
function strippedSource(file: string): string {
  let text = stripped.get(file);
  if (text === undefined) {
    text = stripComments(readFileSync(file, 'utf8'), file);
    stripped.set(file, text);
  }
  return text;
}

function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === '__tests__' || entry === 'node_modules') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) sourceFiles(full, acc);
    else if (/\.tsx?$/.test(entry)) acc.push(full);
  }
  return acc;
}

/**
 * ⚑ SCOPE LIMITS (stated, PB-3): the scan covers `.ts`/`.tsx` source outside
 * `__tests__`. Catalogue COPY that promises a transition is a copy rule and
 * belongs to `CI-N4`; each pattern is single-line, so a transition spelled
 * across several lines is not seen here — the mechanism assertions above are
 * the guard for that.
 */
const FILES = ROOTS.flatMap((r) => sourceFiles(r));

/**
 * ⚑ EACH CLASS CARRIES ITS OWN PLANTED POSITIVE, and that is not ceremony.
 * The first draft put the whole identity family in ONE regex opening with
 * `\bkyc\b` — which **cannot match `kycStatus` or `verifyKyc`**, the camelCase
 * forms it would actually appear as in code. The combined pattern still looked
 * healthy because its other members matched, so the per-class control is what
 * exposed it. One pattern, one control, asserted below.
 */
interface ProhibitedClass {
  readonly name: string;
  readonly pattern: RegExp;
  /** A line this pattern MUST match, or the zero it reports means nothing. */
  readonly control: string;
}

const PROHIBITED: readonly ProhibitedClass[] = [
  {
    name: 'KYC / identity verification (LC-RR-01-10)',
    pattern: /kyc|know.your.customer/i,
    control: 'const kycStatus = await verifyKyc(user);',
  },
  {
    name: 'date-of-birth collection (LC-RR-01-07)',
    pattern: /\bdob\b|dateOfBirth|date.of.birth|birthDate|geburtsdatum/i,
    control: 'user.dateOfBirth = value;',
  },
  {
    name: 'identity-document collection (LC-RR-01-07)',
    pattern: /passport|national\s*id\b|\bssn\b|social.security|tax\s*id\b|govern?ment.issued/i,
    control: 'const passportNumber = form.passport;',
  },
  {
    name: 'an automatic onboarding-to-funding path',
    pattern:
      /onboard\w*[^.\n]{0,40}fund|fund\w*[^.\n]{0,40}onboard|auto\w*[^.\n]{0,20}(fund|deposit)/i,
    control: 'function autoFundOnOnboard() {}',
  },
  {
    name: 'custody / wallet provisioning',
    pattern:
      /provision\w*[^.\n]{0,30}wallet|wallet[^.\n]{0,30}provision|custod\w*[^.\n]{0,30}(create|provision)/i,
    control: 'await provisionWallet(custodyClient);',
  },
  {
    name: 'an explicit Practice → Real money transition',
    pattern:
      /(upgrade|switch|convert|graduate|transition)\w*[^.\n]{0,30}real\s*(money|funds|mode)/i,
    control: 'function upgradeToRealMoney() {}',
  },
];

describe('CI-N1 · the reachable source carries no transition path', () => {
  it('should have actually read the corpus — an empty scan proves nothing', () => {
    expect(FILES.length, 'the source scan was empty').toBeGreaterThan(150);
  });

  it.each(PROHIBITED.map((c) => [c.name, c] as const))('should contain no %s', (name, klass) => {
    const hits: string[] = [];
    for (const file of FILES) {
      strippedSource(file)
        .split('\n')
        .forEach((line, i) => {
          if (klass.pattern.test(line)) {
            hits.push(`${file.split('/').slice(-3).join('/')}:${i + 1}: ${line.trim()}`);
          }
        });
    }
    expect(hits, `${name}\n${hits.join('\n')}`).toEqual([]);
  });

  it('should strip real comments and keep code that follows a URL, a template or a regex (PB-3)', () => {
    const kyc = PROHIBITED[0]!.pattern;
    for (const kept of [
      'fetch("https://api.example/kyc"); const kycStatus = verifyKyc(u);',
      'const u = `https://x.example/${id}`; const kycStatus = verifyKyc(u);',
      'const ok = /https?:\\/\\//.test(u); const kycStatus = verifyKyc(u);',
      "const a = 'a /* not a comment */ b'; const kycStatus = verifyKyc(u);",
    ]) {
      expect(kyc.test(stripComments(kept)), `code after a literal was dropped: ${kept}`).toBe(true);
    }
    for (const gone of ['// const kycStatus = verifyKyc(u);', '/* verifyKyc(u) */ const a = 1;']) {
      expect(kyc.test(stripComments(gone)), `a comment survived: ${gone}`).toBe(false);
    }
    const lines = stripComments('const a = 1;\n// kyc\nconst b = 2;').split('\n');
    expect(lines, 'line structure must be preserved').toHaveLength(3);
  });

  it('should keep code that follows comment-like JSX text, and still strip JSX comments', () => {
    /* `<p> // docs</p>` is visible text, not a comment (independent review). */
    const kyc = PROHIBITED[0]!.pattern;
    const tsx = 'const A = () => <p> // docs</p>; const kycStatus = verifyKyc(u);';
    expect(kyc.test(stripComments(tsx, 'x.tsx')), 'code after JSX text was dropped').toBe(true);
    const jsxComment = 'const A = () => <p>{/* verifyKyc(u) */}</p>;';
    expect(kyc.test(stripComments(jsxComment, 'x.tsx')), 'a JSX comment survived').toBe(false);
  });

  it('should still MATCH the prohibited shapes when they are present (non-vacuity)', () => {
    /**
     * Every pattern above reports zero. A zero is only trustworthy if the
     * pattern can still fire — this lane has produced six instrument failures
     * where an empty result meant a broken query, not a clean repository.
     */
    for (const { name, pattern, control } of PROHIBITED) {
      expect(pattern.test(control), `${name} cannot match its own defect`).toBe(true);
    }
    /* And the inverse — no pattern may fire on ordinary Practice vocabulary. */
    for (const benign of [
      'const weeklyCredit = grantPlayMoney(amount);',
      "advanceTime(toSettle, histories, 'real', priceHistories);",
      'return <button role="switch" aria-checked={on} />;',
    ]) {
      for (const { name, pattern } of PROHIBITED) {
        expect(pattern.test(benign), `${name} fires on benign code: ${benign}`).toBe(false);
      }
    }
  });
});
