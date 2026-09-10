import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  can,
  CAPABILITIES,
  isPracticeAccountsEnabled,
  isProductionDeployment,
  isRealParityInternal,
  type Capability,
} from '../capabilities';

/**
 * Capability flags (I-0b; founder decision F-4). Strict `=== 'true'` like
 * SANDBOX_PUBLIC_ACCESS; the two flags differ in production semantics on purpose.
 */
describe('capability flags — explicit opt-in, strict', () => {
  it.each(['', 'false', 'TRUE', 'True', '1', 'yes', ' true'])(
    'should keep PRACTICE_ACCOUNTS_ENABLED shut for %j',
    (v) => {
      expect(isPracticeAccountsEnabled({ PRACTICE_ACCOUNTS_ENABLED: v })).toBe(false);
    }
  );

  it('should open PRACTICE_ACCOUNTS_ENABLED only for the exact string true', () => {
    expect(isPracticeAccountsEnabled({ PRACTICE_ACCOUNTS_ENABLED: 'true' })).toBe(true);
    expect(isPracticeAccountsEnabled({})).toBe(false);
  });

  it('should treat only VERCEL_ENV=production as a production deployment', () => {
    expect(isProductionDeployment({ VERCEL_ENV: 'production' })).toBe(true);
    expect(isProductionDeployment({ VERCEL_ENV: 'preview' })).toBe(false);
    expect(isProductionDeployment({ NODE_ENV: 'production' })).toBe(false); // local `next start`
  });

  it('should ALLOW accounts in production when explicitly cleared later (F-4: OFF until clearance, not never)', () => {
    // Sabotage the other way: a permanent production ban here would contradict
    // F-4 / LC-TD-02 §9.3 — activation stays possible, it is simply not default.
    expect(
      isPracticeAccountsEnabled({ PRACTICE_ACCOUNTS_ENABLED: 'true', VERCEL_ENV: 'production' })
    ).toBe(true);
  });

  it('should REFUSE REAL_PARITY_INTERNAL in production regardless of the flag (Legal: Real public = WAIT)', () => {
    expect(isRealParityInternal({ REAL_PARITY_INTERNAL: 'true', VERCEL_ENV: 'preview' })).toBe(
      true
    );
    expect(isRealParityInternal({ REAL_PARITY_INTERNAL: 'true', VERCEL_ENV: 'production' })).toBe(
      false
    );
    expect(isRealParityInternal({ REAL_PARITY_INTERNAL: 'TRUE' })).toBe(false);
    expect(isRealParityInternal({})).toBe(false);
  });
});

/**
 * The registry (I-1 sub-phase `1b`, register `5.228`).
 *
 * The registry exists because a raw `process.env.X === 'true'` read is
 * invisible to any table of production semantics — which is exactly how
 * `SANDBOX_GATE_ALLOW_INSECURE` came to drop the `secure` cookie flag with
 * nothing but a docstring saying "NEVER set it in a deployed env".
 */
describe('the capability registry', () => {
  it('should refuse every capability whose flag is absent (explicit opt-in, nothing inferred)', () => {
    for (const capability of Object.keys(CAPABILITIES) as Capability[]) {
      expect(can(capability, {})).toBe(false);
    }
  });

  it('should accept only the exact string true, for every capability', () => {
    // The `SANDBOX_PUBLIC_ACCESS` rule, applied uniformly rather than per flag.
    for (const capability of Object.keys(CAPABILITIES) as Capability[]) {
      const { env } = CAPABILITIES[capability];
      for (const value of ['TRUE', 'True', '1', ' true', 'yes', '']) {
        expect(can(capability, { [env]: value })).toBe(false);
      }
      expect(can(capability, { [env]: 'true' })).toBe(true);
    }
  });

  it('should REFUSE the insecure gate cookie in production (5.228 — the genuinely unguarded hatch)', () => {
    // It drops the `secure` flag so the Docker MCP browser can reach the app
    // over plain http on a LAN IP. There is no lawful production use.
    expect(can('insecureGateCookie', { SANDBOX_GATE_ALLOW_INSECURE: 'true' })).toBe(true);
    expect(
      can('insecureGateCookie', { SANDBOX_GATE_ALLOW_INSECURE: 'true', VERCEL_ENV: 'production' })
    ).toBe(false);
  });

  it('should REFUSE real parity in production (Legal: Real public availability = WAIT)', () => {
    expect(can('realParityInternal', { REAL_PARITY_INTERNAL: 'true' })).toBe(true);
    expect(
      can('realParityInternal', { REAL_PARITY_INTERNAL: 'true', VERCEL_ENV: 'production' })
    ).toBe(false);
  });

  it('should still ALLOW practice accounts in production, because F-4 says OFF until clearance not never', () => {
    // The half of `5.228` that was WRONG. A permanent refusal here would
    // foreclose an activation that LC-TD-02 §9.3 explicitly contemplates.
    expect(CAPABILITIES.practiceAccounts.production).toBe('REQUIRES_CLEARANCE');
    expect(
      can('practiceAccounts', { PRACTICE_ACCOUNTS_ENABLED: 'true', VERCEL_ENV: 'production' })
    ).toBe(true);
  });

  it('should state an authority for every capability, so no policy is a bare assertion', () => {
    // A policy without a reason is folklore; the next reader cannot check it.
    for (const capability of Object.keys(CAPABILITIES) as Capability[]) {
      const spec = CAPABILITIES[capability];
      expect(spec.env).toMatch(/^[A-Z][A-Z0-9_]+$/);
      expect(spec.because.length).toBeGreaterThan(40);
    }
  });

  it('should keep every registered flag out of raw process.env reads in app code', () => {
    // The registry only helps while it is the ONLY door. A new raw read would
    // reintroduce a flag with no stated production policy.
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== '__tests__') walk(full);
          continue;
        }
        if (!/\.tsx?$/.test(entry.name)) continue;
        if (full.endsWith(join('lib', 'capabilities.ts'))) continue; // the registry itself
        const src = readFileSync(full, 'utf8');
        for (const capability of Object.keys(CAPABILITIES) as Capability[]) {
          if (src.includes(`process.env.${CAPABILITIES[capability].env}`)) {
            offenders.push(`${full} reads ${CAPABILITIES[capability].env} directly`);
          }
        }
      }
    };
    walk(join(process.cwd(), 'src'));
    expect(offenders).toEqual([]);
  });
});
