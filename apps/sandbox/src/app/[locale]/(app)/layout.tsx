import type { ReactNode } from 'react';
import { requireAdmission } from '@/lib/auth/admission';
import { isSandboxLocale } from '@/i18n/config';
import { can } from '@/lib/capabilities';
import { AppShellRoute } from '@/components/shell/AppShellRoute';

/**
 * The protected group: every screen behind the gate. Per-request cookie check
 * (fail-closed: no valid grant, no screen); the gate page lives
 * outside this group.
 */
export default async function ProtectedLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeRaw } = await params;
  // Allow-listed before it reaches a redirect (2026-10-18 lane audit, P8).
  const locale = isSandboxLocale(localeRaw) ? localeRaw : 'en';
  // The "who may enter" seam (Principle 3): MVP-0 = the shared-password gate;
  // Stage-1 = Auth.js — same call site. Fail-closed; one owner (`requireAdmission`), shared with
  // the gated onboarding pages and their actions (F22, B15).
  await requireAdmission(locale);
  // The mode PALETTE is a capability, resolved here (server) and passed down:
  // the mode truth always ships, the provisional practice/real re-tint waits
  // for the Mode × Appearance calibration review (register 5.282).
  return (
    <AppShellRoute locale={locale} paletteEnabled={can('modePalette')}>
      {children}
    </AppShellRoute>
  );
}
