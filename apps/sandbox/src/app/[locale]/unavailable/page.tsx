import type { Metadata } from 'next';
import { getMessages } from '@/i18n/loadMessages';
import { isSandboxLocale, DEFAULT_LOCALE } from '@/i18n/config';
import styles from './Unavailable.module.css';

/**
 * The geofence block page (M1). Rendered when the edge middleware refuses a
 * request from a denylisted country (CN/RU/KP). Sits OUTSIDE the `(app)` gate
 * group, so it is reachable without a session/gate cookie. Honest, tokenized,
 * accessible, i18n ×4 — an empty state with a next step (UX-58), not a bare 403.
 */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function UnavailablePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = getMessages(isSandboxLocale(locale) ? locale : DEFAULT_LOCALE);
  return (
    <main id="main" className={styles.wrap}>
      <div className={styles.card}>
        <p className={styles.badge}>{t['geofence.badge']}</p>
        <h1 className={styles.title}>{t['geofence.title']}</h1>
        <p className={styles.body}>{t['geofence.body']}</p>
        <a className={styles.link} href="https://diboas.com">
          {t['geofence.link']}
        </a>
      </div>
    </main>
  );
}
