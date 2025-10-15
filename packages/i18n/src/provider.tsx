/**
 * Internationalization Provider
 *
 * Domain-Driven Design: Centralized i18n provider with react-intl
 * Code Reusability: Single provider for all applications
 * No Hardcoded Values: All translations from JSON files
 */

'use client';

import { IntlProvider as ReactIntlProvider } from 'react-intl';
import type { ReactNode } from 'react';
import type { SupportedLocale } from './config';

export interface I18nProviderProps {
  locale: SupportedLocale;
  messages: Record<string, any>;
  children: ReactNode;
  onError?: (err: Error) => void;
}

/**
 * Internationalization Provider
 * Wraps react-intl's IntlProvider with our configuration
 */
export function I18nProvider({
  locale,
  messages,
  children,
  onError
}: I18nProviderProps) {
  // Default error handler that doesn't throw in production
  const defaultOnError = (err: Error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('I18n Error:', err);
    }
  };

  return (
    <ReactIntlProvider
      locale={locale}
      messages={messages}
      onError={onError || defaultOnError}
      defaultLocale="en"
    >
      {children}
    </ReactIntlProvider>
  );
}
