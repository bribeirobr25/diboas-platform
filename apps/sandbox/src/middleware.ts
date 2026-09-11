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
function missingResponse(req: NextRequest): NextResponse {
  const url = req.nextUrl.clone();
  url.pathname = `/${localeFromPathname(req.nextUrl.pathname)}/${MISSING_SEGMENT}`;
  // A rewrite keeps the URL the visitor asked for; the status carries the truth.
  return NextResponse.rewrite(url, { status: 404 });
}

export function middleware(req: NextRequest): NextResponse {
  const enabled = process.env.SANDBOX_GEO_ENABLED !== 'false'; // D8 kill-switch (default on)
  if (shouldBlock(detectedCountry(req), enabled)) {
    const locale = localeFromPathname(req.nextUrl.pathname);
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/unavailable`;
    // 451 = Unavailable For Legal Reasons. A rewrite does not re-invoke
    // middleware, so rewriting the /unavailable path to itself is idempotent
    // (no loop).
    return NextResponse.rewrite(url, { status: 451 });
  }

  // Refused visitors never get here, so the redirect cannot precede the block.
  if (req.nextUrl.pathname === '/') return localeEntryRedirect(req);

  // An API path is a data contract: refuse it as data, never as a rendered page.
  if (isApiPath(req.nextUrl.pathname)) return NextResponse.next();

  const segment = lastSegment(req.nextUrl.pathname);

  const gated = CAPABILITY_GATED.find((entry) => entry.segment === segment);
  if (gated && !can(gated.capability)) return missingResponse(req);

  // Asked for directly: same page, honest status.
  if (segment === MISSING_SEGMENT) return missingResponse(req);

  return NextResponse.next();
}

export const config = {
  // All routes incl. /api, excluding _next internals + static asset files.
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpe?g|gif|svg|webp|ico|txt|xml|woff2?)$).*)',
  ],
};
