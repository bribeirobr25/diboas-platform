import { GoalDetailScreen } from '@/components/GoalDetailScreen';
import { isSandboxLocale } from '@/i18n/config';

export default async function GoalDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  return <GoalDetailScreen locale={isSandboxLocale(locale) ? locale : 'en'} goalId={id} />;
}
