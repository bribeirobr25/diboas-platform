import { SimulatedEventScreen } from '@/components/SimulatedEventScreen';
import { isSandboxLocale } from '@/i18n/config';

/**
 * G11 — the simulated event (§4.11). Own route (Principle 6); entered from
 * the Home card, which appears only while an event is actually waiting.
 *
 * No instance id in the path: R1 schedules exactly one event, and its id is
 * derived (`dueSimulatedEvent`) rather than passed — a URL-supplied instance
 * would be a money-affecting input from an untrusted source.
 */
export default async function PracticeEventPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <SimulatedEventScreen locale={isSandboxLocale(locale) ? locale : 'en'} />;
}
