import { beforeEach, expect, onTestFinished, vi, type MockInstance } from 'vitest';

/**
 * EXPECTED failure-path logs, asserted — never silenced (2026-10-19 test cleanup).
 *
 * A test that drives a failure path makes the code LOG (R-14), and that output used to
 * land in the run as unexplained noise. Muting it globally would also mute a log nobody
 * expected. Instead, a file declares what it expects:
 *
 * ```text
 * every console.warn/error in the file must match a declared message, or the test FAILS
 * every test whose name matches `requiredIn` must have logged one, or the test FAILS
 * ```
 *
 * The check runs in `onTestFinished`, which fires AFTER every `afterEach` — the setup
 * file's RTL unmount cleanup included (measured 2026-10-19: file afterEach → unmount
 * cleanup → onTestFinished) — so a log fired while a component tears down is judged in
 * the test that caused it. Both spies are restored BEFORE anything is asserted, so a
 * failing assertion can never leave the console muted for the next test.
 *
 * Limit, stated: a log fired by async work that outlives its test lands after the spies
 * are restored, on the real console — visible as noise, never silently absorbed.
 *
 * Returns `calls(level)`, the current test's captured calls, for tests that assert WHAT
 * was logged.
 */
export function expectedLogs(spec: {
  warn?: string[];
  error?: string[];
  /** Tests (full name, describe path included) that MUST emit at least one declared log. */
  requiredIn?: RegExp;
  /**
   * STRICT (final review 2026-10-19): a declared log is allowed ONLY in a test matching
   * `requiredIn`, so a happy-path test that starts logging a failure fails too — the
   * allowlist alone checks presence, never absence.
   */
  strict?: boolean;
}): { calls: (level: 'warn' | 'error') => unknown[][] } {
  const spies: Partial<Record<'warn' | 'error', MockInstance>> = {};
  beforeEach(() => {
    spies.warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    spies.error = vi.spyOn(console, 'error').mockImplementation(() => {});
    onTestFinished(() => {
      const lines = {
        warn: spies.warn!.mock.calls.map((c) => c.map(String).join(' ')),
        error: spies.error!.mock.calls.map((c) => c.map(String).join(' ')),
      };
      spies.warn!.mockRestore();
      spies.error!.mockRestore();
      let declaredSeen = 0;
      for (const level of ['warn', 'error'] as const) {
        const allowed = spec[level] ?? [];
        for (const line of lines[level]) {
          const ok = allowed.some((m) => line.includes(m));
          expect(ok, `unexpected console.${level}: ${line.slice(0, 300)}`).toBe(true);
          if (ok) declaredSeen += 1;
        }
      }
      const name = expect.getState().currentTestName ?? '';
      const required = spec.requiredIn?.test(name) ?? false;
      if (required) expect(declaredSeen, `expected a declared log in: ${name}`).toBeGreaterThan(0);
      else if (spec.strict)
        expect(declaredSeen, `a declared log in a test not expecting one: ${name}`).toBe(0);
    });
  });
  return { calls: (level) => (spies[level]?.mock.calls ?? []) as unknown[][] };
}
