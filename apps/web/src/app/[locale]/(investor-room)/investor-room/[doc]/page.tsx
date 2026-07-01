import { notFound } from 'next/navigation';
import { isValidLocale, loadMessages, type SupportedLocale } from '@diboas/i18n/server';
import styles from '@/components/Investor/investor.module.css';

interface DocPageProps {
  params: Promise<{ locale: string; doc: string }>;
}

interface DocEntry {
  slug: string;
  num: string;
  title: string;
  summary: string;
  status: 'available' | 'in-preparation';
}
interface DocMessages {
  room: {
    materials: { docs: DocEntry[] };
    docPage: {
      backToRoom: string;
      statusAvailable: string;
      statusInPrep: string;
      covers: string;
      inPrepBody: string;
      requestCta: string;
    };
  };
}

/**
 * Gated investor-room document page. Lives under the room layout, so it
 * inherits the password gate (a direct hit without the cookie is blocked).
 * PR1 renders the document overview + status; full long-form bodies are a
 * content follow-up.
 */
export default async function InvestorDocPage({ params }: DocPageProps) {
  const { locale: localeParam, doc: docSlug } = await params;
  const locale = localeParam as SupportedLocale;
  if (!isValidLocale(locale)) notFound();

  const messages = (await loadMessages(locale, 'investor')) as unknown as DocMessages;
  const { docs } = messages.room.materials;
  const dp = messages.room.docPage;
  const entry = docs.find((d) => d.slug === docSlug);
  if (!entry) notFound();

  const inPrep = entry.status === 'in-preparation';

  return (
    <article className={`${styles.section} ${styles.toneWhite}`}>
      <div className={styles.inner}>
        <a href={`/${locale}/investor-room`} className={styles.backLink}>
          {dp.backToRoom}
        </a>
        <p className={styles.eyebrow}>
          {entry.num} · {inPrep ? dp.statusInPrep : dp.statusAvailable}
        </p>
        <h1 className={styles.header}>{entry.title}</h1>

        {inPrep ? (
          <p className={styles.paragraph}>{dp.inPrepBody}</p>
        ) : (
          <>
            <p className={styles.paragraph}>{entry.summary}</p>
            <p className={styles.eyebrow}>{dp.covers}</p>
            <a href={`/${locale}/investors#request`} className={styles.ctaPrimary}>
              {dp.requestCta}
            </a>
          </>
        )}
      </div>
    </article>
  );
}
