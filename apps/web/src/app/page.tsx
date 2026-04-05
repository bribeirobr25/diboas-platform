import { redirect } from 'next/navigation';
import { DEFAULT_LOCALE } from '@diboas/i18n/server';

/**
 * Root Page - Redirect to Localized Route
 *
 * This is the SOLE handler for root "/" redirects.
 * Middleware does NOT handle "/" (Next.js routes to this page component first).
 *
 * Preserves query params (ref, UTM, etc.) across the redirect.
 */
export default async function RootPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      query.set(key, value);
    } else if (Array.isArray(value)) {
      for (const v of value) query.append(key, v);
    }
  }
  const search = query.toString();
  redirect(`/${DEFAULT_LOCALE}${search ? `?${search}` : ''}`);
}
