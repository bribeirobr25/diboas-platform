/**
 * /tools shared layout — Phase 6C.1.
 *
 * Wraps all tools routes (landing + 4 sub-routes) with a slim
 * Adelaide-attributed header strip above the page content. The (landing)
 * parent layout still provides the main MinimalNavigation, cookie consent,
 * waitlist context, etc.
 */

import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/server';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import styles from './ToolsLayout.module.css';

interface ToolsLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function ToolsLayout({ children, params }: ToolsLayoutProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;
  if (!isValidLocale(locale)) {
    notFound();
  }

  const messages = await loadPageNamespaces(locale, ['tools-shared']);
  const adelaide = messages['tools-shared.footer.adelaideAttribution'] ?? 'Money tools by Adelaide';

  return (
    <>
      <div className={styles.attributionStrip} role="region" aria-label={adelaide}>
        <span className={styles.attributionText}>{adelaide}</span>
      </div>
      {children}
    </>
  );
}
