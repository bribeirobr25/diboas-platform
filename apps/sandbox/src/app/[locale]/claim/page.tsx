import { ClaimCeremony } from '@/components/ClaimCeremony';
import { isSandboxLocale } from '@/i18n/config';

/**
 * The claim ceremony (A3.2; W-5a). The tap calls the claimGrant action, which
 * advances into the app home; the real PlayMoneyGranted emit is deferred +
 * registered (DEFERRED_BACKEND_LEDGER CL-B1). Wired, not a preview.
 */
export default async function ClaimPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <ClaimCeremony locale={isSandboxLocale(locale) ? locale : 'en'} />;
}
