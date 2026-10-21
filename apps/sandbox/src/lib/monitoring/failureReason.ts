/**
 * Bounded failure reasons for client-side logs (2026-10-19 review, P12 + P8).
 *
 * A caught error's MESSAGE is arbitrary text: from a provider, a parser or our own code, it
 * can carry whatever reached it. A log line should say WHY in a small, known vocabulary,
 * so a client failure is diagnosable without the error object travelling into the log.
 *
 * ```text
 * BoundedFailure     the reason it was built with (code-chosen words + a field PATH)
 * TimeoutError       'timeout'          (AbortSignal.timeout)
 * TypeError          'type-error'       (fetch's network failure — or a coding error)
 * any other Error    'unexpected:<Name>' when the name is a plain identifier
 * anything else      'unexpected'
 * ```
 */
export class BoundedFailure extends Error {
  constructor(readonly reason: string) {
    super(reason);
    this.name = 'BoundedFailure';
  }
}

const PLAIN_NAME = /^[A-Za-z]{1,40}$/;

export function failureReason(error: unknown): string {
  if (error instanceof BoundedFailure) return error.reason;
  if (error instanceof Error) {
    if (error.name === 'TimeoutError') return 'timeout';
    if (error.name === 'TypeError') return 'type-error';
    return PLAIN_NAME.test(error.name) ? `unexpected:${error.name}` : 'unexpected';
  }
  return 'unexpected';
}
