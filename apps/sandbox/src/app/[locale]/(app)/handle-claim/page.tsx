import { HandleClaim } from '@/components/HandleClaim';
import { isSandboxLocale } from '@/i18n/config';

/**
 * @handle claim (R2; W-20). An in-app screen reached from Profile, inside the
 * (app) auth group (gated + AppChrome, founder 2026-08-16). The real uniqueness
 * check + claim are deferred (D-2 account model + handle namespace).
 */
export default async function HandleClaimPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <HandleClaim locale={isSandboxLocale(locale) ? locale : 'en'} />;
}
