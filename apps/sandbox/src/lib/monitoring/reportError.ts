/**
 * The error sink seam (`5.206`, Principle 12).
 *
 * **What was measured 2026-09-25, before this existed:** the sandbox is LIVE
 * and PUBLIC at `app.diboas.com` and had exactly ONE error boundary
 * (`[locale]/(app)/error.tsx`) which called bare `console.error`. A crash in
 * the ROOT layout had no boundary at all, and **no error anywhere reached
 * anything a person could read after the fact**. On a live public app an
 * unreported crash is the same class of risk as an unpriceable commit.
 *
 * ## One entry point, on purpose
 *
 * Every boundary calls `reportError()` and nothing else. That is what makes an
 * external sink a ONE-LINE change later instead of an audit of every `catch`.
 * `apps/web` learned this the hard way — its `MonitoringService` exists because
 * global handlers had been registered in several places.
 *
 * ## ⚑ WHY NO EXTERNAL SINK IS WIRED HERE, AND WHY THAT IS NOT AN OVERSIGHT
 *
 * `Logger.ts` carries a standing CLO flag, written before this file existed:
 *
 *   > **the moment Phase 2 routes logs to an external sink (Sentry/PostHog/etc.),
 *   > `ownerKey` handling is a CLO question** (redact or hash it).
 *
 * `ownerKey` is the account `users.id` — pseudonymous personal data. Attaching
 * Sentry today would send it to a third-party processor while that question is
 * open, so the sink stays LOCAL and the question is registered rather than
 * answered by implementation. **This seam is the thing that makes answering it
 * cheap.** It is not a claim that errors reach a dashboard: they do not.
 *
 * ## What it does NOT carry
 *
 * No PII, ever — no name, email, handle or `ownerKey`. A boundary reports a
 * SURFACE and an error, never a user. Guarded by `5.206`'s own test.
 *
 * ⚑ AND NO FREE-TEXT MESSAGE (P0 review, PB-4). An error's message is not a
 * controlled field: `project()` throws with the offending event serialised into
 * it, and an event can carry a Goal's free-text name — user-written text, which
 * this sink never stores. No pattern can redact free text reliably,
 * so the record carries the error's NAME and DIGEST only, by construction.
 * The full error still reaches the LOCAL console through `Logger` (the user's
 * own device, no processor), which is where it is useful for debugging today.
 */

import { Logger } from './Logger';

/** Where the error was caught — a route-group-level name, never a user or a URL. */
type ErrorSurface = 'root' | 'app';

interface ReportedError {
  surface: ErrorSurface;
  /** The error's class name (`TypeError`, …) — a code identifier, never user text. */
  name: string;
  /** Next.js supplies this on a server-render error; it is the only join key. */
  digest?: string;
}

/** Test seam — the module owns a process-wide buffer, so a suite must reset it. */
const reported: ReportedError[] = [];
const MAX_REPORTED = 50;

export function __drainReportedErrors(): ReportedError[] {
  return reported.splice(0, reported.length);
}

export function reportedErrors(): readonly ReportedError[] {
  return reported;
}

/**
 * Report a caught error. **Never throws** — a reporter that can throw inside an
 * error boundary turns a recoverable screen into a blank page, which is the
 * exact failure this exists to prevent.
 */
export function reportError(surface: ErrorSurface, error: unknown): ReportedError {
  /**
   * ⛑ EACH FIELD IS READ ON ITS OWN AND KEPT ONLY IN ITS EXPECTED SHAPE (R4-14,
   * independent review 2026-10-16). The identifier check ran on the value
   * turned into a STRING while the ORIGINAL value was stored, so an object
   * `name` whose `toString` changed could later read as Goal text; `digest` was
   * stored at any length, free text included; and one throwing getter wiped
   * the whole entry. A field that is not a string of its shape is dropped.
   */
  let name = 'UnreportableError';
  try {
    const raw: unknown = error instanceof Error ? error.name : 'NonErrorThrown';
    /* A class name is a code identifier — but a custom `name` can be set from data. */
    name = typeof raw === 'string' && /^[A-Za-z_$][\w$]{0,63}$/.test(raw) ? raw : 'Error';
  } catch {
    name = 'UnreportableError';
  }
  let digest: string | undefined;
  try {
    const raw = (error as { digest?: unknown } | null)?.digest;
    /* Next.js digests are numeric hashes (`2338785109`) or a framework code with an optional
       status (`NEXT_HTTP_ERROR_FALLBACK;404`). Anything else — a word, a sentence, a path — is
       not a join key and could be data, so it is dropped (R4 correction: `^[\w;:-]` let
       `Vacation_fund` through). */
    if (
      typeof raw === 'string' &&
      /^(?:\d{1,20}|NEXT_[A-Z_]{1,40}(?:;\d{3})?|DYNAMIC_SERVER_USAGE)$/.test(raw)
    )
      digest = raw;
  } catch {
    digest = undefined;
  }
  const entry: ReportedError = { surface, name, ...(digest !== undefined ? { digest } : {}) };

  try {
    if (reported.length >= MAX_REPORTED) reported.shift();
    reported.push(entry);
    Logger.error(
      'boundary caught an error',
      { surface: entry.surface, digest: entry.digest },
      error
    );
  } catch {
    /* A sink that fails must not take the boundary down with it. */
  }
  return entry;
}
