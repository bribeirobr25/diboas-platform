/**
 * Correlation ID propagation via AsyncLocalStorage.
 *
 * RUNTIME: NODE.JS ONLY.
 *
 * Do **not** import this module from:
 *   - `apps/web/middleware.ts` (Edge Runtime — `async_hooks` is not available)
 *   - `apps/web/src/components/**` (client bundle — `async_hooks` doesn't exist)
 *   - any file shared with `@diboas/i18n` or other Edge-compatible packages
 *
 * The middleware sets `x-request-id` on every request header (see
 * `apps/web/middleware.ts`). API routes read it via `getCorrelationId(req)`
 * (in `lib/api/routeHelpers.ts`) and may opt into wrapping their handler
 * body in `withCorrelationId(id, () => …)` so deep utility callers can
 * read the current correlation ID via `getCurrentCorrelationId()` without
 * the request object being passed through.
 *
 * Phase 2 M1 (audit/2026-05-08): added the helper but kept it opt-in. Most
 * call sites read the request header directly; this is the escape hatch for
 * deep utilities that don't have `request` access.
 */

import { AsyncLocalStorage } from 'async_hooks';

interface CorrelationStore {
  correlationId: string;
}

const storage = new AsyncLocalStorage<CorrelationStore>();

/**
 * Run `fn` with the given correlationId set in AsyncLocalStorage.
 * `getCurrentCorrelationId()` from anywhere inside `fn` (and its
 * async children) returns this id.
 */
export function withCorrelationId<T>(
  correlationId: string,
  fn: () => T | Promise<T>
): T | Promise<T> {
  return storage.run({ correlationId }, fn);
}

/**
 * Read the current correlationId. Returns `undefined` outside an
 * `withCorrelationId` context (e.g. on Edge Runtime, on the client,
 * or in API routes that haven't opted in).
 */
export function getCurrentCorrelationId(): string | undefined {
  return storage.getStore()?.correlationId;
}
