import { GoalsListScreen } from '@/components/GoalsListScreen';
import { isSandboxLocale } from '@/i18n/config';

export default async function GoalsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <GoalsListScreen locale={isSandboxLocale(locale) ? locale : 'en'} />;
}
