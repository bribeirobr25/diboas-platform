import { describe, expect, it } from 'vitest';
import {
  isPracticeAccountsEnabled,
  isProductionDeployment,
  isRealParityInternal,
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
