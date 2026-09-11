import type { Metadata } from 'next';
import { BrandMark } from '@/components/BrandMark';
import { getMessages } from '@/i18n/loadMessages';
import { isSandboxLocale, DEFAULT_LOCALE } from '@/i18n/config';
import styles from './Missing.module.css';

/**
 * The localized not-found surface (`5.267`), reached only by a middleware
 * REWRITE — so the address bar keeps the URL the visitor actually asked for.
 *
 * ## Why a real route instead of `not-found.tsx`
 *
 * Measured, not assumed. With `[locale]` as the root segment (`1c`), a
 * `[locale]/not-found.tsx` renders OUTSIDE its own layout: Next replaces the
 * whole segment tree, so there is no `<html lang>` and no way to read the
 * locale from `params` (not-found receives none). It also never fires for a
 * path that matches no route at all. A real page under `[locale]` has none of
 * those problems — it gets the document shell, the correct `lang`, and its
 * locale from `params` like every other screen.
 *
 * This is the geofence's own pattern: `middleware.ts` already rewrites a
 * refused country to `/{locale}/unavailable` with a 451. Same shape, 404.
 *
 * ## Why the segment is `missing` and not `not-found`
 *
 * `not-found` would sit beside Next's reserved `not-found.tsx` in the same
 * segment and read as the same thing while behaving differently. The name is
 * never user-visible: a rewrite does not change the URL.
 *
 * ## Copy
 *
 * `notFound.title` is founder-approved verbatim (2026-09-10) in all four
 * locales. `notFound.backHome` is the phrase that already existed as
 * `simEvent.backHome`, moved here rather than duplicated — one string, one key.
 *
 * No R-4 play-money disclaimer: it rides with balances and results, and this
 * page renders neither. It sits outside the `(app)` group, so it is reachable
 * without a session — the same posture as `/unavailable`.
 *
 * ## The mark is there for a reason
 *
 * The first cut was a title and a link on an empty field, and the honest read
 * of the screenshot was *"this looks broken, not calm."* **UX-58** governs
 * exactly that: a designed empty state must feel *"inviting rather than
 * broken"* and end in one clear action. So the page carries the identity mark
 * (an existing approved asset — no new copy, no new image) and centres in the
 * viewport, which reads as deliberate rather than as a page that failed to
 * finish loading. `BrandMark` is a client component; it renders here because
 * `[locale]/layout.tsx` supplies the `IntlProvider` above it.
 */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function MissingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = getMessages(isSandboxLocale(locale) ? locale : DEFAULT_LOCALE);
  const home = `/${isSandboxLocale(locale) ? locale : DEFAULT_LOCALE}`;
  return (
    <main id="main" className={styles.wrap}>
      <div className={styles.card}>
        <BrandMark size="2.25rem" />
        <h1 className={styles.title}>{t['notFound.title']}</h1>
        <a className={styles.link} href={home}>
          {t['notFound.backHome']}
        </a>
      </div>
    </main>
  );
}
