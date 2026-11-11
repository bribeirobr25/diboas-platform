/**
 * URL scrubbing for error reports and analytics (twelfth audit: 5.862, 5.864).
 *
 * Two pages carry a bearer token in their address: `/delete-confirm?token=` (deletes a person's
 * data) and `/email-preferences?t=` (unsubscribes them). A query string reaches Sentry
 * (`request.url`, breadcrumbs, `extra.path`), PostHog (`$current_url`) and GA4 (`page_location`
 * on every event). `scrubUrl` keeps only an ALLOWLIST of query parameters, drops the fragment and
 * redacts email addresses in the path. An allowlist, not a blocklist: a parameter added tomorrow
 * is dropped until someone decides it is safe to record.
 */

/** Query parameters a record may keep: campaign tags and two public, non-identifying switches. */
export const SAFE_QUERY_PARAMS: readonly string[] = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'ref', // a public referral code (`?ref=REF…`), shown on the referrer's share link
  'for', // `/tools/money-jobs?for=business`
];

const EMAIL = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

/** The path with `%40` (an encoded `@`) decoded, so an encoded email is found too. */
const decodePath = (path: string): string => path.replace(/%40/gi, '@');

/** An absolute URL, or a path that carries a query or fragment, inside free text. */
const URL_IN_TEXT = /(?:[a-z][a-z0-9+.-]*:\/\/[^\s"'<>]+|\/[^\s"'<>?#]*[?#][^\s"'<>]*)/gi;

/** A percent-encoded absolute URL inside text (`https%3A%2F%2F…%3Ftoken%3D…`, e.g. a `next=`). */
const ENCODED_URL_IN_TEXT = /[a-z][a-z0-9+.-]*%3A%2F%2F[^\s"'<>&]+/gi;

/**
 * Free text (a span description, an error message) with every URL in it scrubbed, percent-encoded
 * ones included (fourteenth audit: an encoded `?token=` passed untouched).
 */
export function scrubUrlsInText(text: string): string {
  return text
    .replace(ENCODED_URL_IN_TEXT, (match) => {
      try {
        return encodeURIComponent(scrubUrl(decodeURIComponent(match)));
      } catch {
        return '[URL_REDACTED]';
      }
    })
    .replace(URL_IN_TEXT, (match) => scrubUrl(match));
}
const ABSOLUTE = /^[a-z][a-z0-9+.-]*:\/\//i;

/** The URL with only allowlisted query parameters, no fragment and no email in its path. */
export function scrubUrl(url: string): string {
  if (!url || !/[?#@]|%40/i.test(url)) return url;
  let parsed: URL;
  try {
    parsed = new URL(url, 'https://scrub.invalid');
  } catch {
    return url.split(/[?#]/)[0].replace(EMAIL, '[EMAIL_REDACTED]');
  }
  const kept = new URLSearchParams();
  parsed.searchParams.forEach((value, key) => {
    if (SAFE_QUERY_PARAMS.includes(key)) kept.append(key, value.replace(EMAIL, '[EMAIL_REDACTED]'));
  });
  const path = decodePath(parsed.pathname).replace(EMAIL, '[EMAIL_REDACTED]');
  const base = ABSOLUTE.test(url) ? `${parsed.origin}${path}` : path;
  const query = kept.toString();
  return query ? `${base}?${query}` : base;
}

/**
 * The same function as browser JavaScript, for GA4's inline bootstrap, which runs before any
 * module loads (`GoogleAnalyticsLoader`). Built from `SAFE_QUERY_PARAMS`, so the allowlist has one
 * home; `scrubUrl.test.ts` runs both implementations over the same cases.
 */
export const SCRUB_URL_INLINE_JS = `function(u){if(!u||!/[?#@]|%40/i.test(u))return u;var E=/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g,S=${JSON.stringify(SAFE_QUERY_PARAMS)},p;try{p=new URL(u,'https://scrub.invalid')}catch(e){return u.split(/[?#]/)[0].replace(E,'[EMAIL_REDACTED]')}var k=new URLSearchParams();p.searchParams.forEach(function(v,n){if(S.indexOf(n)>=0)k.append(n,v.replace(E,'[EMAIL_REDACTED]'))});var h=p.pathname.replace(/%40/gi,'@').replace(E,'[EMAIL_REDACTED]'),b=/^[a-z][a-z0-9+.-]*:\\/\\//i.test(u)?p.origin+h:h,q=k.toString();return q?b+'?'+q:b}`;
