import { GoalNewScreen } from '@/components/GoalNewScreen';
import { isSandboxLocale } from '@/i18n/config';

export default async function GoalNewPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <GoalNewScreen locale={isSandboxLocale(locale) ? locale : 'en'} />;
}
