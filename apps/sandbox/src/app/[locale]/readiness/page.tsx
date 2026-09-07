import { notFound } from 'next/navigation';
import { LegalReadiness } from '@/components/LegalReadiness';
import { isReadinessAvailable } from '@/lib/legal/readiness';

/**
 * Legal readiness (I-0b, internal build). 404 unless `PRACTICE_ACCOUNTS_ENABLED`
 * is on AND the locale's chrome wording is approved — the Terms acceptance
 * control is never publicly exposed while its destination lacks Practice
 * coverage (Strategy Canon amendment 1 · LC-TD-02 §3.1). Production keeps the
 * existing anonymous doorway untouched.
 */
export default async function ReadinessPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isReadinessAvailable(locale)) notFound();
  return <LegalReadiness locale={locale} />;
}
