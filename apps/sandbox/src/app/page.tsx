import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { detectSandboxLocale, LOCALE_COOKIE } from '@/i18n/config';

/**
 * Locale entry point. `/` picks the language the way the marketing site does —
 * saved choice (NEXT_LOCALE cookie) → browser Accept-Language → default (en) —
 * then redirects into the localized app. The LocaleSwitcher writes the cookie,
 * so a returning visitor lands in their chosen language.
 */
export default async function RootPage() {
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()]);
  const locale = detectSandboxLocale(
    cookieStore.get(LOCALE_COOKIE)?.value,
    headerList.get('Accept-Language')
  );
  redirect(`/${locale}`);
}
