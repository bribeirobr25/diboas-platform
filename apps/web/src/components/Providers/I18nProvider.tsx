/**
 * Web App I18n Provider
 *
 * Domain-Driven Design: Application-specific i18n provider
 * Code Reusability: Uses @diboas/i18n package
 * No Hardcoded Values: All translations from JSON files
 */

'use client';

import type { ReactNode } from 'react';
import { I18nProvider as DiBoaSI18nProvider } from '@diboas/i18n/client';
import type { SupportedLocale } from '@diboas/i18n/server';

interface I18nProviderProps {
  locale: SupportedLocale;
  messages: Record<string, string>;
  children: ReactNode;
}

/**
 * I18n Provider Component
 * Wraps app with IntlProvider using pre-loaded messages from server
 */
export function I18nProvider({ locale, messages, children }: I18nProviderProps) {
  return (
    <DiBoaSI18nProvider locale={locale} messages={messages}>
      {children}
    </DiBoaSI18nProvider>
  );
}
