import { notFound } from 'next/navigation';
import { HandleClaim } from '@/components/HandleClaim';
import { isSandboxLocale } from '@/i18n/config';
import { isPracticeAccountsEnabled } from '@/lib/capabilities';

/**
 * @handle claim (R2; W-20). An in-app screen reached from Profile, inside the
 * (app) auth group (gated + the AppShell chrome, founder 2026-08-16).
 *
 * `5.201` — 404 unless `PRACTICE_ACCOUNTS_ENABLED`. The screen made four
 * statements that nothing behind it could keep: it told the user their handle
 * "is available" (asserted from FORMAT alone — no namespace exists), that it
 * "is permanent and cannot be changed" (nothing is stored), that it "will be
 * part of your public link" (there is no public link), and that "your public
 * page stays private until you switch it on" (no page, no switch) — all behind
 * a "Claim handle" button that only called `router.push('/profile')`.
 *
 * The capability is PRESERVED, not deleted (P-Q2: preserve capability, not
 * placement): the route renders as built the moment the account model and the
 * D-f handle namespace land behind the flag. Until then a visible affordance
 * would be a claim the product cannot honour — P01 §6.2 `P01-IA-03` states the
 * rule directly: *"A visible affordance is a claim."*
 */
export default async function HandleClaimPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isPracticeAccountsEnabled()) notFound();
  return <HandleClaim locale={isSandboxLocale(locale) ? locale : 'en'} />;
}
