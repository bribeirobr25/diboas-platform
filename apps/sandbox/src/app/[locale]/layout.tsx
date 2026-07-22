import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { isSandboxLocale } from '@/i18n/config';
import { IntlProviderClient } from '@/components/IntlProviderClient';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isSandboxLocale(locale)) notFound();
  return <IntlProviderClient locale={locale}>{children}</IntlProviderClient>;
}
