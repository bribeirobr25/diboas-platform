import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getAuthProvider } from '@/lib/auth/factory';
import { isSandboxLocale } from '@/i18n/config';
import { can } from '@/lib/capabilities';
import { AppShellRoute } from '@/components/shell/AppShellRoute';

/**
 * The protected group: every screen behind the gate. Per-request cookie check
 * (fail-closed — the investor-room layout pattern); the gate page lives
 * outside this group.
 */
export default async function ProtectedLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Independent, so awaited together (the "Promise.all" rule).
  const [{ locale: localeRaw }, cookieStore] = await Promise.all([params, cookies()]);
  // Allow-listed before it reaches a redirect (2026-10-18 lane audit, P8).
  const locale = isSandboxLocale(localeRaw) ? localeRaw : 'en';
  // The "who may enter" seam (Principle 3): MVP-0 = the shared-password gate;
  // Stage-1 = Auth.js — same call site. Fail-closed. F22: data-producing routes
  // + server actions must run this check too, not rely on the layout alone.
  const auth = getAuthProvider();
  const cookieValue = cookieStore.get(auth.sessionCookieName)?.value;
  if (!auth.verifySession(cookieValue)) {
    redirect(`/${locale}/gate`);
  }
  // The mode PALETTE is a capability, resolved here (server) and passed down:
  // the mode truth always ships, the provisional practice/real re-tint waits
  // for the Mode × Appearance calibration review (register 5.282).
  return (
    <AppShellRoute locale={locale} paletteEnabled={can('modePalette')}>
      {children}
    </AppShellRoute>
  );
}
