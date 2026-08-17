import { ProfileScreen } from '@/components/ProfileScreen';
import { isSandboxLocale } from '@/i18n/config';

/**
 * Profile (R1). Inside the app shell. Values + Edit wiring live on the account
 * model (deferred, D-2); new-user empty states show until then.
 */
export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <ProfileScreen locale={isSandboxLocale(locale) ? locale : 'en'} />;
}
