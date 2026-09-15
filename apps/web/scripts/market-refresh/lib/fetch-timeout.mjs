/**
 * fetchWithTimeout — a source fetch that cannot hang (PENDING_ALL 5.366).
 *
 * WHY THIS EXISTS. All four live providers called bare `fetch(url)`. Node's
 * `fetch` has NO default timeout: a server that accepts the connection and then
 * never answers leaves the request open indefinitely. The only backstop was the
 * workflow's `timeout-minutes: 20` on the whole job.
 *
 * That is bounded but wrong in a specific way. `withRetry` wraps each fetch with
 * two retries, so ONE unresponsive host can consume the entire weekly window
 * across three attempts, and the pipeline then fails for a reason that reads,
 * from the outside, exactly like the dropped scheduled run this lane keeps
 * investigating. A per-request deadline turns "the week was lost" into "one
 * source timed out, named, in the log".
 *
 * The timeout composes with `withRetry` deliberately: each ATTEMPT gets its own
 * deadline, so the worst case is bounded by (retries + 1) x timeout rather than
 * by the job cap. With the defaults that is 3 x 20s = 60s per source.
 *
 * `AbortSignal.timeout()` is used rather than a hand-rolled
 * `AbortController` + `setTimeout`: the manual form leaks the timer on the
 * success path unless it is explicitly cleared, which is the R-1 defect written
 * in a place no `useEffect` lint will ever look.
 */

/** Per-attempt deadline. Generous: these are weekly batch reads, not a UI. */
export const FETCH_TIMEOUT_MS = 20_000;

/**
 * `fetch` with a deadline, and an error that names the source.
 *
 * @param {string} url
 * @param {{headers?: Record<string,string>, timeoutMs?: number, label?: string}} [opts]
 * @returns {Promise<Response>}
 */
export async function fetchWithTimeout(url, opts = {}) {
  const { headers, timeoutMs = FETCH_TIMEOUT_MS, label } = opts;
  try {
    return await fetch(url, {
      ...(headers ? { headers } : {}),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    // A bare "This operation was aborted" in the weekly log is unactionable;
    // say which source and how long we waited.
    if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
      throw new Error(`${label ?? url}: no response within ${timeoutMs}ms (timed out)`);
    }
    throw err;
  }
}
