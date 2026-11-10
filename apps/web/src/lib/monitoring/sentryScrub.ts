/**
 * One scrubber for every Sentry event, on the client, the server and the edge (twelfth audit:
 * 5.862). Until 2026-11-10 only the client scrubbed, the server and edge configs sent events as
 * they came, and `instrumentation.ts` claimed otherwise; no runtime stripped query strings, so a
 * `?token=` or `?email=` reached Sentry in `request.url`, breadcrumbs and `extra.path`.
 *
 * The event keeps what an error needs (stack, route pattern, method, status) and loses:
 *   - the user's email, username and IP;
 *   - every query parameter outside the allowlist, and every fragment (`scrubUrl`);
 *   - cookies, the raw query string, and the authorization and cookie headers;
 *   - emails and IPs in messages, exception values, breadcrumb text and `extra` (`redactContext`).
 * Tags are left as they are: `correlationId` rides there to join the client and server doors.
 */
import type { Event } from '@sentry/nextjs';
import { scrubUrl } from '@/lib/utils/scrubUrl';
import { redactContext, redactText } from '@/lib/utils/redactContext';

const URL_KEYS = ['url', 'from', 'to', 'http.url', 'http.target', 'path'];
const DROP_HEADERS = ['cookie', 'authorization', 'x-forwarded-for', 'x-real-ip'];

/** A data bag with its URL-valued keys scrubbed and the rest redacted. */
function scrubData(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (key === 'http.query') continue;
    out[key] = URL_KEYS.includes(key) && typeof value === 'string' ? scrubUrl(value) : value;
  }
  // redactContext returns undefined only for an undefined bag; `out` is always an object.
  return redactContext(out) as Record<string, unknown>;
}

export function scrubSentryEvent<E extends Event>(event: E): E {
  if (event.user) {
    delete event.user.email;
    delete event.user.username;
    delete event.user.ip_address;
  }
  if (event.request) {
    if (event.request.url) event.request.url = scrubUrl(event.request.url);
    delete event.request.query_string;
    delete event.request.cookies;
    if (event.request.headers) {
      for (const name of Object.keys(event.request.headers)) {
        const lower = name.toLowerCase();
        if (DROP_HEADERS.includes(lower)) delete event.request.headers[name];
        else if (lower === 'referer')
          event.request.headers[name] = scrubUrl(event.request.headers[name]);
      }
    }
    if (typeof event.request.data === 'string') event.request.data = redactText(event.request.data);
    else if (event.request.data && typeof event.request.data === 'object')
      event.request.data = redactContext(event.request.data as Record<string, unknown>);
  }
  if (event.message) event.message = redactText(event.message);
  if (event.transaction) event.transaction = scrubUrl(event.transaction);
  for (const exception of event.exception?.values ?? []) {
    if (exception.value) exception.value = redactText(exception.value);
  }
  if (event.extra) event.extra = scrubData(event.extra);
  for (const crumb of event.breadcrumbs ?? []) {
    if (crumb.message) crumb.message = redactText(crumb.message);
    if (crumb.data) crumb.data = scrubData(crumb.data);
  }
  for (const span of event.spans ?? []) {
    if (span.data) span.data = scrubData(span.data) as typeof span.data;
  }
  return event;
}
