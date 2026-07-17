# Robustness Checklist (R-rows) — the mandatory review gate for resilience

> **What this is:** the review-time enforcement of principles 7 (Error Handling & Recovery) and 11 (Concurrency & Race Conditions), converted from CLAUDE.md prose into citable rows — the anti-slop Part-3 model applied to engineering. **Any PR touching effects, timers, listeners, async flows, service classes, or error paths cites the applicable rows (PASS/N-A per row) in its self-check.** Judgment stays human; citation makes it unskippable.
> **Registry:** `docs/tech/engineering-gates.md`. The machine-checkable subset lives in the react-hooks ESLint rules (currently `warn` with 20 standing violations — promotion tracked in PENDING_ALL 5.69); these rows apply regardless of lint level.

## Concurrency & lifecycle (principle 11)

| #   | Rule                                                                                                                                                                                     | The failure it prevents                                                 |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| R-1 | Every `setTimeout`/`setInterval` in a component stores its id in a ref and clears it in cleanup (and before re-arming)                                                                   | Timers firing after unmount; setState-on-unmounted; double-armed timers |
| R-2 | Every `useEffect` with async work uses an `AbortController` or a `mounted` flag consumed by every `await` continuation                                                                   | Stale responses writing state; races between out-of-order responses     |
| R-3 | Every `addEventListener` (window, document, bus, observer) has its symmetric removal in the same effect's cleanup; service classes store bound references and remove them in `destroy()` | Leaked listeners; duplicate handlers after remount; memory growth       |
| R-4 | One-shot analytics/effects guard with a ref (`firedRef`), not state — and survive StrictMode double-invocation                                                                           | Duplicate events; dev/prod behavioral drift                             |
| R-5 | Values that must not trigger re-renders (mouse positions, interval ids, in-flight flags) live in refs, not state                                                                         | Render storms; feedback loops                                           |
| R-6 | No effect includes state it sets in its own dependency array (the self-triggering loop); user-triggered side effects run in event handlers, not effects                                  | Infinite loops; cascading renders                                       |
| R-7 | Shared mutable flows (submissions, unlocks, position counters) are idempotent or locked: double-click, double-submit, and concurrent-tab safe                                            | Duplicate signups/charges; corrupted local state                        |

## Error handling & recovery (principle 7)

| #    | Rule                                                                                                                                                                                                    | The failure it prevents                                           |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| R-8  | User-facing fetches go through `fetchWithRetry` (2 retries, backoff); background/analytics calls fail silently but log                                                                                  | Transient network errors surfacing as broken UX                   |
| R-9  | Every browser API that can be absent or throw (clipboard, storage, IntersectionObserver, matchMedia) is guarded with existence checks or try/catch, with a QUIET fallback state the UI actually renders | Hard crashes on Safari/embedded/private-mode; silent dead buttons |
| R-10 | New page-level sections render inside an error boundary (route `error.tsx` layers or `SectionErrorBoundary`); a section failing must not blank the page                                                 | One widget taking down a whole page                               |
| R-11 | Third-party scripts load via dynamic `import()` behind consent/need, never static — with the failure path rendering the page fully without them                                                         | Analytics outages breaking the product; consent violations        |
| R-12 | Cross-origin embeds (iframes) never rely on `onError`; detection uses load-timeout heuristics, and an always-present honest fallback link exists regardless of detection                                | Undetectable blocked embeds; ad-blocker dead-ends                 |
| R-13 | Every error path is TESTED per the testing policy (error handlers, rejected promises, failure branches) — a fallback that has never run in a test does not exist                                        | Fallbacks that crash when finally exercised                       |
| R-14 | Failures are observable: errors reach Sentry through the single-coordinator pattern (never a second global handler); background jobs fail closed, not silent                                            | Invisible breakage; competing error handlers                      |
| R-15 | Every route group ships a `loading.tsx` (Suspense shell) and async sections show explicit loading states — no blank flash while data resolves                                                           | Perceived crashes; CLS regressions on slow networks               |

## How to cite

In the PR self-check: `Robustness: R-1 PASS (share timer ref+cleanup), R-2 N/A (no async effects), R-9 PASS (clipboard try/catch + copyFailed state), R-13 PASS (failure-path test added)`. Rows not applicable are listed as N/A, not omitted — the reviewer sees that they were considered.
