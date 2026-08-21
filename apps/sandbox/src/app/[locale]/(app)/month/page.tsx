import { MonthReportScreen } from '@/components/MonthReportScreen';
import { isSandboxLocale } from '@/i18n/config';

/** G12 — the month report (§4.12). Own route (Principle 6); read-only. */
export default async function MonthReportPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <MonthReportScreen locale={isSandboxLocale(locale) ? locale : 'en'} />;
}
