import { ClaimCeremony } from '@/components/ClaimCeremony';
import { isSandboxLocale } from '@/i18n/config';

/**
 * The claim ceremony (A3.2; W-5a). Ungated preview route (outside `(app)`). The
 * tap fires the claim seam; the real PlayMoneyGranted emit is wired at the end.
 */
export default async function ClaimPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <ClaimCeremony locale={isSandboxLocale(locale) ? locale : 'en'} />;
}
