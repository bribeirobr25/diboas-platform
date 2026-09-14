import { NextResponse, type NextRequest } from 'next/server';
import { can, type Capability } from '@/lib/capabilities';
import { shouldBlock, localeFromPathname } from '@/config/geofence';
import { detectSandboxLocale, LOCALE_COOKIE } from '@/i18n/config';

/**
 * Sandbox edge middleware. Two duties, in this order:
 *
 * 1. **Geofence (M1)** — runs before routing/auth, so a blocked country
 *    (CN/RU/KP) never reaches the gate page, the interior, or the API.
 * 2. **Bare-path locale entry (`1c`, `5.203`)** — `/` picks a language and
 *    redirects into it.
 * 3. **Capability refusal (`5.270`)** — a route whose capability is off is
 *    refused HERE, before anything renders.
 *
 * The order is load-bearing: the geofence must decide first, or a blocked
 * visitor would be handed a redirect into the app before being refused.
 *
 * Scope is `apps/sandbox` ONLY — `apps/web` (diboas.com) is a separate app and
 * is never touched by this. Edge-safe: imports only pure helpers (never
 * `@/lib/gate`, which pulls node:crypto).
 */
function detectedCountry(req: NextRequest): string | null {
  // Non-production testing override (D6) — NEVER trusted in production; the
  // Vercel edge sets `x-vercel-ip-country` and strips any client-supplied copy.
  if (process.env.NODE_ENV !== 'production' && process.env.SANDBOX_GEO_OVERRIDE) {
    return process.env.SANDBOX_GEO_OVERRIDE;
  }
  return req.headers.get('x-vercel-ip-country');
}

/**
 * The locale entry point, moved out of the deleted `app/page.tsx` (`1c`).
 *
 * `[locale]` is now the ROOT layout — the only place `<html lang>` can be
 * correct — which leaves nothing above it to serve `/`. So the choice happens
 * here instead: the saved language (`NEXT_LOCALE`, written by the
 * LocaleSwitcher and shared with the marketing site) wins, then the browser's
 * `Accept-Language`, then `en`. Same chain as before; a returning visitor still
 * lands in the language they chose.
 */
function localeEntryRedirect(req: NextRequest): NextResponse {
  const locale = detectSandboxLocale(
    req.cookies.get(LOCALE_COOKIE)?.value,
    req.headers.get('accept-language')
  );
  const url = req.nextUrl.clone();
  url.pathname = `/${locale}`;
  return NextResponse.redirect(url);
}

/**
 * Routes whose capability refusal must be decided BEFORE the response starts.
 *
 * `5.270`: the page-level `if (!isPracticeAccountsEnabled()) notFound()` works —
 * the screen never renders — but `(app)/layout.tsx` is `async` and `await
 * cookies()`, so the document has already begun streaming by the time the page
 * throws. Headers are sent; the status stays **200**. A soft 404 tells crawlers
 * and uptime monitors the page exists.
 *
 * Middleware is the only layer that is structurally earlier than a layout, so
 * the refusal lands here as a real 404 — rewritten to the localized surface, the
 * same shape the geofence already uses for its 451.
 *
 * The page-level check STAYS. Two enforcement points at different altitudes is
 * defence in depth, not duplication: both ask the ONE registry, and the page
 * check is what the existing tests exercise directly.
 */
const CAPABILITY_GATED: ReadonlyArray<{ segment: string; capability: Capability }> = [
  { segment: 'handle-claim', capability: 'practiceAccounts' },
  { segment: 'practice-record', capability: 'practiceAccounts' },
];

/** The last path segment, so `/de/handle-claim` and `/handle-claim` both match. */
function lastSegment(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean);
  return parts[parts.length - 1] ?? '';
}

/**
 * The localized not-found surface. It has to be a real route to get a document
 * shell and a correct `<html lang>` (see `missing/page.tsx` for why
 * `not-found.tsx` cannot), which leaves it directly addressable — and a URL
 * that returns `200` while saying *"this page isn't here"* denies its own
 * existence. So a direct request is answered with the same page and a real
 * `404`: the content is right either way, and the status stops lying.
 *
 * Self-rewriting is safe for the same reason the geofence's is: a rewrite does
 * not re-invoke middleware, so this cannot loop.
 */
const MISSING_SEGMENT = 'missing';

/** `/api/*` must never resolve to an HTML page. */
function isApiPath(pathname: string): boolean {
  return pathname === '/api' || pathname.startsWith('/api/');
}

/** The localized not-found surface with a truthful 404, in the asked-for language. */
function missingResponse(req: NextRequest, requestHeaders: Headers): NextResponse {
  const url = req.nextUrl.clone();
  url.pathname = `/${localeFromPathname(req.nextUrl.pathname)}/${MISSING_SEGMENT}`;
  // A rewrite keeps the URL the visitor asked for; the status carries the truth.
  // The request headers ride along so the rewritten DOCUMENT can read `x-nonce`
  // — this surface renders a real page, theme script and all.
  return NextResponse.rewrite(url, { status: 404, request: { headers: requestHeaders } });
}

/**
 * The Content-Security-Policy (register `5.212`).
 *
 * Until now the sandbox shipped NO CSP — an MVP-0 posture recorded in
 * `next.config.mjs` and in `ThemeScript.tsx`, which predicted this exact change
 * ("STAGE-1 CSP DEPENDENCY… this ONE inline script must carry the per-request
 * nonce or the pre-paint theme will silently regress"). Production confirmed the
 * gap: `app.diboas.com` served HSTS, `X-Frame-Options`, `nosniff`,
 * Referrer-Policy and Permissions-Policy, but zero `content-security-policy`,
 * while `diboas.com` served a full nonce-based one.
 *
 * ## Why this policy is TIGHTER than the marketing site's
 *
 * It is deliberately not a copy of `apps/web`'s. Measured, not assumed:
 *
 * - **`connect-src 'self'`** — the market providers (`DefiLlamaApyProvider`,
 *   `CoinGeckoPriceProvider`) are instantiated ONLY in `app/api/market/route.ts`
 *   and `app/api/market/history/route.ts`. Every external call is server-side, so
 *   the browser never contacts `yields.llama.fi` or `api.coingecko.com`. Granting
 *   them would widen the policy for traffic that does not exist.
 * - **`font-src 'self'`** — `next/font/google` self-hosts `Fraunces` at build
 *   time; the served document contains no `fonts.googleapis.com` or
 *   `fonts.gstatic.com` reference. Verified against production HTML.
 * - **no analytics hosts** — the app ships none (`INSTRUMENTATION_CONTRACT.md`
 *   is documentation-only; nothing fires).
 * - **`frame-src 'none'` + `frame-ancestors 'none'`** — the sandbox embeds
 *   nothing and may not be embedded.
 *
 * ## Why a nonce, and why it reaches Next's own bootstrap
 *
 * `'unsafe-inline'` is prohibited for scripts (CLAUDE.md § Security). The
 * document carries three inline scripts: `ThemeScript`, and two of Next's own
 * RSC bootstrap (`self.__next_f`). Next nonces the latter automatically when
 * middleware sets `x-nonce` on the REQUEST — proven on live `diboas.com`, where
 * 32 script tags share one per-request nonce and no inline script lacks it. So
 * the nonce rides on the request for every path that renders a document,
 * including the two rewrites (the 451 and the 404 surfaces render real pages).
 *
 * `'unsafe-eval'` is dev-only (React refresh), never production.
 */
function buildCsp(nonce: string, isDev: boolean): string {
  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-eval'" : ''}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob:`,
    `font-src 'self'`,
    `connect-src 'self'${isDev ? ' ws: wss:' : ''}`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-src 'none'`,
    `frame-ancestors 'none'`,
    // ⚑ NO `upgrade-insecure-requests`, and that omission is deliberate.
    //
    // I added it, and the visual pass caught it: it rewrites every subresource
    // URL to `https://`, so on a plain-HTTP origin EVERY subresource fails with
    // `ERR_SSL_PROTOCOL_ERROR` (20 on the Home document; 24 across the four
    // screens walked) and the app loads with no CSS, no fonts and no JS chunks. Those same assets return 200 over HTTP — nothing was blocked
    // by policy; the directive broke the origin. It made local preview
    // (`next start -H 0.0.0.0`) and any HTTP origin unusable while buying
    // nothing in production, where HSTS (`strict-transport-security`) already
    // forces HTTPS before a request is made.
    //
    // The live `diboas.com` policy omits it too — 13 directives, none of them
    // this one — so the proven precedent agrees.
  ].join('; ');
}

export function middleware(req: NextRequest): NextResponse {
  // The CSP nonce, minted per request. 16 random bytes, base64 — the CSP Level 3
  // charset (same shape as `apps/web`, F4). Built BEFORE any branch so every
  // response below carries the same policy.
  let nonce = '';
  let csp = '';
  try {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    nonce = btoa(String.fromCharCode(...bytes));
    csp = buildCsp(nonce, process.env.NODE_ENV !== 'production');
  } catch {
    // FAIL OPEN ON THE HEADER, NEVER ON THE CONTROLS — and note there is
    // deliberately NO early `return` here.
    //
    // An earlier revision of this block returned `NextResponse.next()` from
    // this catch, and that return sat ABOVE the geofence: a thrown
    // `getRandomValues` would have served a refused country and skipped every
    // capability refusal too — a defence-in-depth HEADER taking a compliance
    // COVENANT down with it. Found by reading the diff, not by a test, which is
    // why the test now exists.
    //
    // Leaving both strings empty degrades ONLY the header: `secured()` then
    // attaches nothing, and the geofence → locale → capability decisions below
    // all still run. The CSP is best-effort; they are not.
    nonce = '';
    csp = '';
  }

  // Rides on the REQUEST so the rendered document can read it (`headers()` in
  // the `[locale]` layout) and so Next nonces its own RSC bootstrap.
  const requestHeaders = new Headers(req.headers);
  // An empty nonce is worse than none — `<script nonce="">` matches no policy.
  if (nonce) requestHeaders.set('x-nonce', nonce);

  /** Every response leaves through here: one policy, no path forgotten. */
  const secured = (res: NextResponse): NextResponse => {
    // No policy at all, rather than a broken one: `script-src 'nonce-'` with an
    // empty value matches nothing and would block EVERY inline script —
    // including Next's own RSC bootstrap, i.e. a blank page.
    if (!csp) return res;
    res.headers.set('Content-Security-Policy', csp);
    res.headers.set('x-nonce', nonce);
    return res;
  };

  // ⚠️ The ORDER BELOW IS UNCHANGED and load-bearing: geofence → locale entry →
  // capability refusal. Adding headers must not reorder security decisions.
  const enabled = process.env.SANDBOX_GEO_ENABLED !== 'false'; // D8 kill-switch (default on)
  if (shouldBlock(detectedCountry(req), enabled)) {
    const locale = localeFromPathname(req.nextUrl.pathname);
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/unavailable`;
    // 451 = Unavailable For Legal Reasons. A rewrite does not re-invoke
    // middleware, so rewriting the /unavailable path to itself is idempotent
    // (no loop).
    return secured(
      NextResponse.rewrite(url, { status: 451, request: { headers: requestHeaders } })
    );
  }

  // Refused visitors never get here, so the redirect cannot precede the block.
  if (req.nextUrl.pathname === '/') return secured(localeEntryRedirect(req));

  // An API path is a data contract: refuse it as data, never as a rendered page.
  if (isApiPath(req.nextUrl.pathname))
    return secured(NextResponse.next({ request: { headers: requestHeaders } }));

  const segment = lastSegment(req.nextUrl.pathname);

  const gated = CAPABILITY_GATED.find((entry) => entry.segment === segment);
  if (gated && !can(gated.capability)) return secured(missingResponse(req, requestHeaders));

  // Asked for directly: same page, honest status.
  if (segment === MISSING_SEGMENT) return secured(missingResponse(req, requestHeaders));

  return secured(NextResponse.next({ request: { headers: requestHeaders } }));
}

export const config = {
  // All routes incl. /api, excluding _next internals + static asset files.
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpe?g|gif|svg|webp|ico|txt|xml|woff2?)$).*)',
  ],
};
