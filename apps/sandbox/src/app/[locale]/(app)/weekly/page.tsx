import { WeeklyCycleScreen } from '@/components/WeeklyCycleScreen';
import { isSandboxLocale } from '@/i18n/config';

/** G10 — the weekly cycle (§4.10). Own route (Principle 6); entered from Home. */
export default async function WeeklyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <WeeklyCycleScreen locale={isSandboxLocale(locale) ? locale : 'en'} />;
}
