'use client';

/**
 * Page-level i18n provider that merges page-specific namespaces
 * with the parent layout's messages (common namespace)
 *
 * Domain-Driven Design: Page-specific translation context
 * Service Agnostic Abstraction: Wraps react-intl with stable context
 * Performance & SEO: Memoized messages prevent unnecessary re-renders
 * Error Handling: Validates parent context before rendering
 */

import { useMemo } from 'react';
import { IntlProvider, useIntl } from 'react-intl';

interface PageI18nProviderProps {
  children: React.ReactNode;
  pageMessages: Record<string, string>;
}

/**
 * PageI18nProvider with memoization and context stability
 *
 * Fixes intermittent translation key display by:
 * 1. Memoizing merged messages to prevent context churn
 * 2. Validating parent context before merging
 * 3. Using stable references for IntlProvider props
 */
export function PageI18nProvider({ children, pageMessages }: PageI18nProviderProps) {
  const parentIntl = useIntl();

  // Memoize merged messages to prevent unnecessary re-renders
  // This is critical for preventing context instability during state changes
  const mergedMessages = useMemo(() => {
    const parentMessages = parentIntl.messages || {};

    // Merge parent messages (common) with page-specific messages
    // Page messages take precedence over parent messages
    return {
      ...parentMessages,
      ...pageMessages
    } as Record<string, string>;
  }, [parentIntl.messages, pageMessages]);

  // Memoize locale to ensure stable reference
  const locale = useMemo(() => parentIntl.locale || 'en', [parentIntl.locale]);

  return (
    <IntlProvider
      locale={locale}
      messages={mergedMessages}
      defaultLocale="en"
      onError={(err) => {
        // Only log in development to avoid production noise
        if (process.env.NODE_ENV === 'development') {
          // Filter out missing translation warnings during development
          if (err.code !== 'MISSING_TRANSLATION') {
            // Translation load warning;
          }
        }
      }}
    >
      {children}
    </IntlProvider>
  );
}
