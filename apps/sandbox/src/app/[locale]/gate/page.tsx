import { redirect } from 'next/navigation';
import { isPublicAccess } from '@/lib/gate';
import { GateForm } from './GateForm';

/**
 * The shared-password gate (MVP-0). When the app is public
 * (`SANDBOX_PUBLIC_ACCESS=true`) this route has nothing to ask for, so it sends
 * the visitor to the real front door instead of showing a password field that
 * grants nothing — a form that does not gate anything is a fake control.
 */
/**
 * Rendered per request, DECLARED rather than inherited (`5.401`).
 *
 * This route decides whether to exist by reading an environment variable
 * (`isPublicAccess()`), so a prerender freezes that decision at build time —
 * when the variable is absent. Production proved it: the deployed build serves
 * this page's password form, and its pre-rename heading, with
 * `x-vercel-cache: HIT` and an age in hours, while every per-request route in
 * the same app correctly lets the public in.
 *
 * On this branch the route is ALREADY dynamic, but only as a side effect: the
 * locale layout reads `headers()` for the CSP nonce (`cd9c0d87`), which opts the
 * whole tree out of prerendering. Nothing states that this page REQUIRES it, so
 * removing that read later would silently restore the stale-gate defect with no
 * guard to catch it. A correctness property that holds by accident is the class
 * of thing that regresses quietly, so it is declared here.
 */
export const dynamic = 'force-dynamic';

export default async function GatePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (isPublicAccess()) redirect(`/${locale}/welcome`);
  return <GateForm />;
}
