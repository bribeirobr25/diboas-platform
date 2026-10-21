// @vitest-environment happy-dom
import { render, screen, fireEvent } from '@testing-library/react';
import { StrictMode, useEffect } from 'react';
import { renderToString } from 'react-dom/server';
import { IntlProvider } from 'react-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SANDBOX_LOCALES } from '@/i18n/config';
import { getMessages } from '@/i18n/loadMessages';
import { __drainReportedErrors, reportError, reportedErrors } from '@/lib/monitoring/reportError';
import GlobalError from '../global-error';
import AppError from '../[locale]/(app)/error';

/**
 * `5.206` · A CRASH ON A LIVE PUBLIC APP LEAVES A RECORD.
 *
 * Measured before this landed: one boundary (`(app)/error.tsx`) calling bare
 * `console.error`, no root boundary at all, and **zero error-sink dependency**
 * on an app that has been LIVE and PUBLIC since 2026-08-22.
 *
 * ⚑ THESE ASSERT THE REPORTED RECORD, never a spy on `console`. A boundary
 * that renders is only half the requirement; the other half is that somebody
 * can read what happened afterwards.
 */

beforeEach(() => {
  __drainReportedErrors();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
  window.history.pushState({}, '', '/');
});

const boom = Object.assign(new Error('render exploded'), { digest: '2338785109' });

describe('5.206 · the root boundary exists and reports', () => {
  it('should render the existing error copy and report to the sink', () => {
    render(<GlobalError error={boom} reset={() => {}} />);
    const t = getMessages('en');
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByRole('heading', { name: t['error.title']! })).toBeTruthy();
    expect(screen.getByText(t['error.body']!)).toBeTruthy();

    const seen = reportedErrors();
    expect(seen, 'the root boundary rendered but reported nothing').toHaveLength(1);
    expect(seen[0]!.surface).toBe('root');
    expect(seen[0]!.name).toBe('Error');
    expect(seen[0]!.digest, 'the only join key to a server log was dropped').toBe('2338785109');
  });

  it('should keep <main> a landmark, with the alert inside it (PB-4)', () => {
    /* role="alert" on <main> replaced the main landmark a screen-reader user jumps to. */
    render(<GlobalError error={boom} reset={() => {}} />);
    const main = screen.getByRole('main');
    expect(main.contains(screen.getByRole('alert'))).toBe(true);
  });

  it("should render the URL's locale on the client (PB-4)", () => {
    /** Requirement: the root boundary speaks the user's language (all four
     *  locales carry the keys). A de user must not get the English page. */
    window.history.pushState({}, '', '/de/goals');
    render(<GlobalError error={boom} reset={() => {}} />);
    expect(screen.getByRole('heading', { name: getMessages('de')['error.title']! })).toBeTruthy();
  });

  it('should NOT read the URL during the server render — a mismatch on any server-rendered path (PB-4)', () => {
    /**
     * Requirement: server and first client render agree (R-4 hydration rule).
     * The server snapshot is the default locale; reading `window.location`
     * during render would make the server and the hydrating client disagree.
     * (A production root-layout crash renders this screen client-only — measured
     * 2026-10-15 — so this guards the server-rendered path, not an observed bug.)
     */
    window.history.pushState({}, '', '/de/goals');
    const html = renderToString(<GlobalError error={boom} reset={() => {}} />);
    expect(html).toContain(getMessages('en')['error.title']!);
    expect(html).not.toContain(getMessages('de')['error.title']!);
  });

  it('should recover with retry() — re-fetch, not just re-render — when Next provides it', () => {
    /** Requirement: "Try again" must be able to recover from a server-render
     *  error. Next ≥ 16.3 documents `retry()` for that; `reset()` re-renders the
     *  same children without re-fetching, so it would usually fail again. */
    const reset = vi.fn();
    const retry = vi.fn();
    render(<GlobalError error={boom} reset={reset} retry={retry} />);
    fireEvent.click(screen.getByRole('button'));
    expect(retry).toHaveBeenCalledTimes(1);
    expect(reset).not.toHaveBeenCalled();
  });

  it('should fall back to reset() when retry is absent', () => {
    const reset = vi.fn();
    render(<GlobalError error={boom} reset={reset} />);
    fireEvent.click(screen.getByRole('button'));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('should recover the APP boundary with retry() too', () => {
    const reset = vi.fn();
    const retry = vi.fn();
    render(
      <IntlProvider locale="en" messages={getMessages('en')}>
        <AppError error={boom} reset={reset} retry={retry} />
      </IntlProvider>
    );
    fireEvent.click(screen.getByRole('button'));
    expect(retry).toHaveBeenCalledTimes(1);
    expect(reset).not.toHaveBeenCalled();
  });

  it('should invent NO copy — every string it renders exists in all four locales', () => {
    /**
     * The root boundary cannot use `FormattedMessage` (it replaces the root
     * layout, so there is no provider). That is exactly the situation in which
     * someone hardcodes English. These three keys are the ones `(app)/error.tsx`
     * already uses.
     */
    for (const locale of SANDBOX_LOCALES) {
      const t = getMessages(locale);
      for (const key of ['error.title', 'error.body', 'error.retry']) {
        expect(t[key], `${locale} is missing ${key}`).toBeTruthy();
      }
    }
  });
});

describe('5.206 · the app boundary reports through the same sink', () => {
  it('should report with surface "app", not bare console.error', () => {
    render(
      <IntlProvider locale="en" messages={getMessages('en')}>
        <AppError error={boom} reset={() => {}} />
      </IntlProvider>
    );
    const seen = reportedErrors();
    expect(seen, 'the app boundary reported nothing').toHaveLength(1);
    expect(seen[0]!.surface).toBe('app');
  });
});

describe('5.206 · R-4 · a one-shot effect reports ONCE under StrictMode', () => {
  /**
   * ⛑ THE FIRST VERSION OF THIS TEST PROVED NOTHING, and its own sabotage said
   * so: it used `rerender` with the SAME error, but an effect whose deps are
   * unchanged is not re-run, so the double-invocation never happened and
   * removing the guard still passed. StrictMode is the real shape —
   * mount → effect → cleanup → effect — and `next.config.mjs` sets
   * `reactStrictMode: true`, so this is production configuration, not a
   * hypothetical.
   */
  it('should report a crash exactly once when the effect is double-invoked', () => {
    render(
      <StrictMode>
        <GlobalError error={boom} reset={() => {}} />
      </StrictMode>
    );
    expect(reportedErrors(), 'the crash was reported more than once').toHaveLength(1);
  });

  it('should still report a genuinely NEW error', () => {
    /* The guard must not degrade into "report only the first crash ever". */
    const { rerender } = render(<GlobalError error={boom} reset={() => {}} />);
    const second = Object.assign(new Error('a different failure'), { digest: '1029384756' });
    rerender(<GlobalError error={second} reset={() => {}} />);
    expect(reportedErrors()).toHaveLength(2);
    expect(reportedErrors()[1]!.digest).toBe('1029384756');
  });

  it('should double-invoke at all under StrictMode — or the case above is vacuous', () => {
    /**
     * The instrument's own self-test. If this harness ever stops double-running
     * effects, the guard test above would pass for the wrong reason and the
     * R-4 claim would be unearned.
     */
    let runs = 0;
    function Probe() {
      useEffect(() => {
        runs += 1;
      }, []);
      return null;
    }
    render(
      <StrictMode>
        <Probe />
      </StrictMode>
    );
    expect(runs, 'StrictMode did not double-invoke — the guard test proves nothing').toBe(2);
  });
});

describe('5.206 · the sink is safe and carries no PII', () => {
  it('should never throw, whatever it is handed', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    for (const nasty of [null, undefined, 'a string', 42, circular, Symbol('x')]) {
      expect(() => reportError('app', nasty)).not.toThrow();
    }
  });

  it('should carry ONLY the declared fields — no user, handle, ownerKey or URL', () => {
    /**
     * ⚑ An exact-key assertion, like the evidence ring's. It is the guard that
     * stops a user id being bolted onto a report — `Logger.ts` raises exactly
     * that as an open CLO question for the day an EXTERNAL sink is attached.
     */
    const entry = reportError('app', boom);
    expect(Object.keys(entry).sort()).toEqual(['digest', 'name', 'surface']);
    const withoutDigest = reportError('app', new Error('no digest here'));
    expect(Object.keys(withoutDigest).sort()).toEqual(['name', 'surface']);
  });

  it('should never carry free text that can hold Goal content (PB-4)', () => {
    /**
     * Requirement: the record claims "No PII, ever". `project()` serialises the
     * offending event into its message, and an event can carry a Goal's
     * free-text name — so a message field cannot keep that claim.
     */
    const leaky = new Error(
      'project: unhandled ledger event {"type":"GoalCreated","name":"Divorce lawyer fund"}'
    );
    const entry = reportError('app', leaky);
    expect(JSON.stringify(entry)).not.toContain('Divorce lawyer fund');
    const named = Object.assign(new Error('x'), { name: 'Goal: Divorce lawyer fund' });
    expect(JSON.stringify(reportError('app', named))).not.toContain('Divorce');
  });

  it('should stay BOUNDED and drop the OLDEST first', () => {
    for (let i = 0; i < 80; i += 1) {
      reportError('app', Object.assign(new Error('x'), { name: `E${i}` }));
    }
    expect(reportedErrors()).toHaveLength(50);
    expect(reportedErrors()[0]!.name, 'the buffer dropped the wrong end').toBe('E30');
    expect(reportedErrors()[49]!.name).toBe('E79');
  });

  it('should drain, and draining should empty it', () => {
    reportError('root', boom);
    expect(__drainReportedErrors()).toHaveLength(1);
    expect(reportedErrors()).toHaveLength(0);
  });
});

describe('R4-14 · each reported field is stored only in its expected shape', () => {
  it('should store a NON-STRING name as "Error", never the object itself', () => {
    let calls = 0;
    const shifty = new Error('x');
    Object.defineProperty(shifty, 'name', {
      value: { toString: () => (calls++ ? 'Goal: a private goal name' : 'TypeError') },
    });
    const entry = reportError('app', shifty);
    expect(typeof entry.name).toBe('string');
    expect(entry.name).toBe('Error');
    expect(JSON.stringify(reportedErrors())).not.toContain('private goal');
    const arrayName = Object.assign(new Error('x'), { name: ['Goal'] as unknown as string });
    expect(reportError('app', arrayName).name).toBe('Error');
  });

  it('should DROP a digest that is free text or too long, and keep a real one', () => {
    const leaky = Object.assign(new Error('x'), {
      digest: `Goal: a private goal name${'x'.repeat(10_000)}`,
    });
    expect(reportError('app', leaky).digest).toBeUndefined();
    expect(reportError('app', Object.assign(new Error('x'), { digest: '2338785109' })).digest).toBe(
      '2338785109'
    );
    expect(
      reportError('app', Object.assign(new Error('x'), { digest: 'a b c' })).digest
    ).toBeUndefined();
    /* A one-word data token is not a digest either. */
    expect(
      reportError('app', Object.assign(new Error('x'), { digest: 'Vacation_fund' })).digest
    ).toBeUndefined();
    expect(
      reportError('app', Object.assign(new Error('x'), { digest: 'NEXT_HTTP_ERROR_FALLBACK;404' }))
        .digest
    ).toBe('NEXT_HTTP_ERROR_FALLBACK;404');
    expect(
      reportError('app', Object.assign(new Error('x'), { digest: 'a b c' })).digest
    ).toBeUndefined();
  });

  it('should keep a valid name when the digest getter throws', () => {
    const e = new TypeError('x');
    Object.defineProperty(e, 'digest', {
      get() {
        throw new Error('hostile getter');
      },
    });
    const entry = reportError('app', e);
    expect(entry.name).toBe('TypeError');
    expect(entry.digest).toBeUndefined();
  });
});
