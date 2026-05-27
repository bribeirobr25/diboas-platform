import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { detectPreferredLocale } from '@diboas/i18n/config';

/**
 * Root Page - Redirect to Localized Route
 *
 * Detects user's preferred locale via: cookie → Accept-Language → default.
 * Preserves query params (ref, UTM, etc.) across the redirect.
 *
 * This is the sole handler for root "/" redirects — middleware does not
 * intercept "/" in Next.js 16 App Router.
 */
export default async function RootPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  const [cookieStore, headersList, params] = await Promise.all([
    cookies(),
    headers(),
    searchParams,
  ]);

  const locale = detectPreferredLocale(
    cookieStore.get('NEXT_LOCALE')?.value,
    headersList.get('Accept-Language')
  );

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      query.set(key, value);
    } else if (Array.isArray(value)) {
      for (const v of value) query.append(key, v);
    }
  }
  const search = query.toString();
  redirect(`/${locale}${search ? `?${search}` : ''}`);
}
