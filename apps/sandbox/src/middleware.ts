import { NextResponse, type NextRequest } from 'next/server';
import { shouldBlock, localeFromPathname } from '@/config/geofence';
import { detectSandboxLocale, LOCALE_COOKIE } from '@/i18n/config';

/**
 * Sandbox edge middleware. Two duties, in this order:
 *
 * 1. **Geofence (M1)** — runs before routing/auth, so a blocked country
 *    (CN/RU/KP) never reaches the gate page, the interior, or the API.
 * 2. **Bare-path locale entry (`1c`, `5.203`)** — `/` picks a language and
 *    redirects into it.
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

  return NextResponse.next();
}

export const config = {
  // All routes incl. /api, excluding _next internals + static asset files.
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpe?g|gif|svg|webp|ico|txt|xml|woff2?)$).*)',
  ],
};
