import { TimeMachineScreen } from '@/components/TimeMachineScreen';
import { isSandboxLocale } from '@/i18n/config';

/**
 * G8 — the time machine (§4.8). Its OWN route rather than a section of the goal
 * detail: that host is already 725 lines with an extraction pending, and this
 * surface answers a portfolio-wide question, not a per-goal one (Principle 6).
 */
export default async function TimeMachinePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <TimeMachineScreen locale={isSandboxLocale(locale) ? locale : 'en'} />;
}
