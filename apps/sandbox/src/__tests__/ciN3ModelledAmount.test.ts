import { describe, expect, it } from 'vitest';
import type { setRecurring } from '@/lib/ledger/journey';
import type { ModelledAmount } from '@/view/projection';

/**
 * ⚙ `CI-N3` (b) · A MODELLED AMOUNT CANNOT BE BOOKED — PROVEN BY THE COMPILER.
 *
 * PR 2, P3 §6 guard 6(b). The block's money is a `ModelledAmount`. The check that it can never
 * become the amount of a ledger command is a TYPE fact, so it is asserted where types are
 * checked: this file is in the app's `tsc` scope (`pnpm type-check`). Each `@ts-expect-error`
 * below states an assignment that MUST NOT compile; if `ModelledAmount` ever became a number
 * (or a branded number), the assignment would compile, the directive would be unused, and
 * `tsc` FAILS. The vitest run only proves the file loads — the guard is `tsc`.
 */

type RecurringInput = Parameters<typeof setRecurring>[0];

export function plannedAmountsAreNotBookable(m: ModelledAmount): void {
  // @ts-expect-error — a modelled amount is not a recurring command's monthly amount.
  const asMonthly: RecurringInput['monthlyAmount'] = m;
  // @ts-expect-error — nor a number anywhere a command takes one.
  const asNumber: number = m;
  // @ts-expect-error — nor a ledger money string (fixed-2dp amounts are strings).
  const asMoneyString: string = m;
  void asMonthly;
  void asNumber;
  void asMoneyString;
}

describe('CI-N3 (b) · the type guard file loads (the guard itself is tsc)', () => {
  it('should export the compile-time check', () => {
    expect(typeof plannedAmountsAreNotBookable).toBe('function');
  });
});
