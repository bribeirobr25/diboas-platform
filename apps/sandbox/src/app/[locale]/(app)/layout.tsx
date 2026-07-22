import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getAuthProvider } from '@/lib/auth/factory';
import { AppChrome } from '@/components/AppChrome';

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
  const { locale } = await params;
  const cookieStore = await cookies();
  // The "who may enter" seam (Principle 3): MVP-0 = the shared-password gate;
  // Stage-1 = Auth.js — same call site. Fail-closed. F22: data-producing routes
  // + server actions must run this check too, not rely on the layout alone.
  const auth = getAuthProvider();
  const cookieValue = cookieStore.get(auth.sessionCookieName)?.value;
  if (!auth.verifySession(cookieValue)) {
    redirect(`/${locale}/gate`);
  }
  return <AppChrome locale={locale}>{children}</AppChrome>;
}
