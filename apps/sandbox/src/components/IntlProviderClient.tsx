'use client';

import type { ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import type { SandboxLocale } from '@/i18n/config';
import { getMessages } from '@/i18n/loadMessages';

export function IntlProviderClient({
  locale,
  children,
}: {
  locale: SandboxLocale;
  children: ReactNode;
}) {
  return (
    <IntlProvider locale={locale} messages={getMessages(locale)} defaultLocale="en">
      {children}
    </IntlProvider>
  );
}
