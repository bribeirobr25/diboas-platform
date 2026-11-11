/**
 * One scrubber for every Sentry event, on the client, the server and the edge (5.862).
 *
 * The event keeps what an error needs (stack, route, method, status) and loses:
 *   - the user's email, username and IP;
 *   - every query parameter outside the allowlist, and every fragment (`scrubUrl`), wherever a URL
 *     sits: request, headers, breadcrumbs, `extra`, spans, `contexts` (a transaction's root span
 *     data travels in `contexts.trace.data`: Next sets `http.target` to the raw request URL),
 *     span descriptions ("GET /x?t=…"), stack frames, messages and exception values;
 *   - cookies, the raw query string and the request body (bodies carry the deletion and
 *     unsubscribe tokens);
 *   - every request header outside an allowlist, both as `request.headers` and as the
 *     `http.request.header.*` attributes of the trace data (Vercel adds geolocation, a client IPv6
 *     in `x-vercel-proxied-for`, an OIDC token, and Next the router state with the page's query);
 *   - emails (Unicode included), IPv4 and IPv6 addresses and bare token pairs in text, and
 *     sensitive keys in data (`redactContext`).
 * Tags are left as they are: `correlationId` rides there to join the client and server doors. The
 * SDK's own diagnostic contexts (`runtime`, `os`, `browser`) keep their names: they describe the
 * machine, not a person.
 *
 * Thirteenth audit: the first version read only top-level URL keys, so performance samples sent
 * the token in `contexts.trace.data`, span descriptions and `url.full`. Fourteenth audit: headers
 * were a blocklist of four, and request bodies passed with only emails and IPs redacted.
 */
import type { Event } from '@sentry/nextjs';
import { scrubUrl } from '@/lib/utils/scrubUrl';
import { redactContext, redactText } from '@/lib/utils/redactContext';

/** Keys whose values are whole URLs or paths. */
const URL_KEYS = [
  'url',
  'from',
  'to',
  'path',
  'url.full',
  'url.path',
  'http.url',
  'http.target',
  'http.request.header.referer',
];
/** Keys that hold only a query string or fragment, or the router state with the page's query. */
const DROP_KEYS = [
  'http.query',
  'url.query',
  'http.fragment',
  'url.fragment',
  'next.rsc.state_tree',
];
/** Request and response bodies, under any attribute name (`http.request.body.data`, …). */
const BODY_KEY = /^http\.(?:request|response)\.body(?!\.size$)/;
/**
 * The only request headers an event keeps (lower-case, `-` and `_` alike). Everything else, from
 * cookies and IP headers to whatever a platform adds tomorrow, is dropped: an allowlist, as for
 * query parameters.
 */
const SAFE_HEADERS = [
  'host',
  'user-agent',
  'accept',
  'accept-language',
  'content-type',
  'content-length',
  'referer',
];
const HEADER_ATTRIBUTE = /^http\.(?:request|response)\.header\.(.+)$/;
/** The SDK's descriptions of the machine: their `name` keys are not a person's name. */
const DIAGNOSTIC_CONTEXTS = ['runtime', 'os', 'browser'];

const normaliseHeader = (name: string): string => name.toLowerCase().replace(/_/g, '-');

/** Text with every embedded URL scrubbed and every email, IP and token pair redacted. */
const scrubText = (text: string): string => redactText(text);

/** A data bag, at any depth: URL keys scrubbed, query-only keys dropped, other text scrubbed. */
function scrubValue(value: unknown, depth: number): unknown {
  if (depth > 5) return '[DEPTH_LIMIT]';
  if (typeof value === 'string') return scrubText(value);
  if (Array.isArray(value)) return value.map((v) => scrubValue(v, depth + 1));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value)) {
      if (DROP_KEYS.includes(key) || BODY_KEY.test(key)) continue;
      const header = HEADER_ATTRIBUTE.exec(key)?.[1];
      if (header !== undefined && !SAFE_HEADERS.includes(normaliseHeader(header))) continue;
      out[key] =
        URL_KEYS.includes(key) && typeof v === 'string' ? scrubUrl(v) : scrubValue(v, depth + 1);
    }
    return out;
  }
  return value;
}

function scrubData(data: Record<string, unknown>): Record<string, unknown> {
  // redactContext returns undefined only for an undefined bag; this one is always an object.
  return redactContext(scrubValue(data, 0) as Record<string, unknown>) as Record<string, unknown>;
}

/** Contexts: the machine descriptions keep their keys; every other context is fully scrubbed. */
function scrubContexts(contexts: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [name, context] of Object.entries(contexts)) {
    out[name] = DIAGNOSTIC_CONTEXTS.includes(name)
      ? scrubValue(context, 0)
      : scrubData({ [name]: context })[name];
  }
  return out;
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
        const header = normaliseHeader(name);
        if (!SAFE_HEADERS.includes(header)) delete event.request.headers[name];
        else if (header === 'referer')
          event.request.headers[name] = scrubUrl(event.request.headers[name]);
      }
    }
    delete event.request.data;
  }
  if (event.message) event.message = scrubText(event.message);
  if (event.logentry?.message) event.logentry.message = scrubText(event.logentry.message);
  if (event.logentry?.params)
    event.logentry.params = event.logentry.params.map((p) => scrubValue(p, 0));
  if (event.transaction) event.transaction = scrubUrl(event.transaction);
  for (const exception of event.exception?.values ?? []) {
    if (exception.value) exception.value = scrubText(exception.value);
    for (const frame of exception.stacktrace?.frames ?? []) {
      if (frame.abs_path) frame.abs_path = scrubUrl(frame.abs_path);
      if (frame.filename) frame.filename = scrubUrl(frame.filename);
    }
  }
  if (event.extra) event.extra = scrubData(event.extra);
  if (event.contexts) event.contexts = scrubContexts(event.contexts) as E['contexts'];
  for (const crumb of event.breadcrumbs ?? []) {
    if (crumb.message) crumb.message = scrubText(crumb.message);
    if (crumb.data) crumb.data = scrubData(crumb.data);
  }
  for (const span of event.spans ?? []) {
    if (span.description) span.description = scrubText(span.description);
    if (span.data) span.data = scrubData(span.data) as typeof span.data;
  }
  return event;
}
