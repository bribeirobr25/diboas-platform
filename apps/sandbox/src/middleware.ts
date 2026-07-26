import { NextResponse, type NextRequest } from 'next/server';
import { shouldBlock, localeFromPathname } from '@/config/geofence';

/**
 * Sandbox geofence middleware (M1). Runs at the EDGE, before routing/auth, so a
 * blocked country (CN/RU/KP) never reaches the gate page, the interior, or the
 * API. Scope is `apps/sandbox` ONLY — `apps/web` (diboas.com) is a separate app
 * and is never touched by this. Edge-safe: imports only the pure geofence
 * helpers (never `@/lib/gate`, which pulls node:crypto).
 */
function detectedCountry(req: NextRequest): string | null {
  // Non-production testing override (D6) — NEVER trusted in production; the
  // Vercel edge sets `x-vercel-ip-country` and strips any client-supplied copy.
  if (process.env.NODE_ENV !== 'production' && process.env.SANDBOX_GEO_OVERRIDE) {
    return process.env.SANDBOX_GEO_OVERRIDE;
  }
  return req.headers.get('x-vercel-ip-country');
}

export function middleware(req: NextRequest): NextResponse {
  const enabled = process.env.SANDBOX_GEO_ENABLED !== 'false'; // D8 kill-switch (default on)
  if (!shouldBlock(detectedCountry(req), enabled)) return NextResponse.next();

  const locale = localeFromPathname(req.nextUrl.pathname);
  const url = req.nextUrl.clone();
  url.pathname = `/${locale}/unavailable`;
  // 451 = Unavailable For Legal Reasons. A rewrite does not re-invoke middleware,
  // so rewriting the /unavailable path to itself is idempotent (no loop).
  return NextResponse.rewrite(url, { status: 451 });
}

export const config = {
  // All routes incl. /api, excluding _next internals + static asset files.
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpe?g|gif|svg|webp|ico|txt|xml|woff2?)$).*)',
  ],
};
