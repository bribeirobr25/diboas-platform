import { RulesBuilderScreen } from '@/components/RulesBuilderScreen';
import { isSandboxLocale } from '@/i18n/config';

/** G9 — the rules builder (§4.9). Its own route: a form this size does not
 *  belong inside another screen (Principle 6). */
export default async function RulesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <RulesBuilderScreen locale={isSandboxLocale(locale) ? locale : 'en'} />;
}
