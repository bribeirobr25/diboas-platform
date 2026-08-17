import { ComprehensionCheck } from '@/components/ComprehensionCheck';
import { isSandboxLocale } from '@/i18n/config';

/**
 * Comprehension micro-check (R7; mockup 29). A light, non-blocking check that
 * the C-P0 idea (practice credits never convert) landed. In-app chrome; the
 * trigger after a Learn lesson is a deferred Learn-integration seam.
 */
export default async function ComprehensionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <ComprehensionCheck locale={isSandboxLocale(locale) ? locale : 'en'} />;
}
