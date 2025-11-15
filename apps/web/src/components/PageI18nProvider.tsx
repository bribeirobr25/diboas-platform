'use client';

/**
 * Page-level i18n provider that merges page-specific namespaces
 * with the parent layout's messages (common namespace)
 * 
 * This enables per-page namespace loading for optimal performance
 */

import { IntlProvider, useIntl } from 'react-intl';

interface PageI18nProviderProps {
  children: React.ReactNode;
  pageMessages: Record<string, string>;
}

export function PageI18nProvider({ children, pageMessages }: PageI18nProviderProps) {
  const parentIntl = useIntl();

  // Merge parent messages (common) with page-specific messages
  const mergedMessages = {
    ...parentIntl.messages,
    ...pageMessages
  } as Record<string, string>;

  return (
    <IntlProvider
      locale={parentIntl.locale}
      messages={mergedMessages}
      defaultLocale="en"
    >
      {children}
    </IntlProvider>
  );
}
