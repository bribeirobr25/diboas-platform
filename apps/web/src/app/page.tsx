import { redirect } from 'next/navigation';
import { DEFAULT_LOCALE } from '@diboas/i18n';

/**
 * Root Page - Redirect to Localized Route
 * 
 * SEO: Redirect to default locale to avoid duplicate content
 * i18n: Ensure all pages are accessed through locale-specific URLs
 */
export default function RootPage() {
  redirect(`/${DEFAULT_LOCALE}`);
}
