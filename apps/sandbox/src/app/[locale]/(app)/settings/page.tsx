import { SettingsScreen } from '@/components/SettingsScreen';
import { isSandboxLocale } from '@/i18n/config';

/**
 * Settings — Privacy & Data (R4). Inside the app shell. Consent toggles persist
 * with the consent record (deferred); Language is wired; export/delete are
 * account-model actions (deferred).
 */
export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <SettingsScreen locale={isSandboxLocale(locale) ? locale : 'en'} />;
}
