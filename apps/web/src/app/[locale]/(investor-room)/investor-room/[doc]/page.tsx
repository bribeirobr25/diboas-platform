import { notFound } from 'next/navigation';
import { isValidLocale, loadMessages, type SupportedLocale } from '@diboas/i18n/server';
import { InvestorDocBody, type InvestorDocContent } from '@/components/Investor/InvestorDocBody';
import { PrintDocButton } from '@/components/Investor/PrintDocButton';
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
      downloadPdf: string;
      keyPointsLabel: string;
    };
  };
}
interface DocsContent {
  docs: Record<string, InvestorDocContent>;
}

/**
 * Gated investor-room document page. Lives under the room layout, so it inherits
 * the password gate. Renders the full document body (generated `blocks[]` from
 * the `investor-docs` namespace) with a "Download PDF" (print) action; the
 * in-preparation doc keeps its request fallback.
 */
export default async function InvestorDocPage({ params }: DocPageProps) {
  const { locale: localeParam, doc: docSlug } = await params;
  const locale = localeParam as SupportedLocale;
  if (!isValidLocale(locale)) notFound();

  const [messages, docsContent] = await Promise.all([
    loadMessages(locale, 'investor') as unknown as Promise<DocMessages>,
    loadMessages(locale, 'investor-docs') as unknown as Promise<DocsContent>,
  ]);
  const { docs } = messages.room.materials;
  const dp = messages.room.docPage;
  const entry = docs.find((d) => d.slug === docSlug);
  if (!entry) notFound();

  const inPrep = entry.status === 'in-preparation';
  const content = docsContent?.docs?.[docSlug];
  const hasBody = !inPrep && !!content && content.blocks.length > 0;

  return (
    <article className={`${styles.section} ${styles.toneWhite}`}>
      <div className={styles.inner}>
        <div className={styles.docTopBar}>
          <a href={`/${locale}/investor-room`} className={styles.backLink}>
            {dp.backToRoom}
          </a>
          {hasBody ? <PrintDocButton label={dp.downloadPdf} /> : null}
        </div>

        <p className={styles.eyebrow}>
          {entry.num} · {inPrep ? dp.statusInPrep : dp.statusAvailable}
        </p>
        <h1 className={styles.header}>{entry.title}</h1>
        <p className={styles.paragraph}>{inPrep ? dp.inPrepBody : entry.summary}</p>

        {hasBody ? (
          <InvestorDocBody content={content} keyPointsLabel={dp.keyPointsLabel} />
        ) : !inPrep ? (
          <>
            <p className={styles.eyebrow}>{dp.covers}</p>
            <a href={`/${locale}/investors#request`} className={styles.ctaPrimary}>
              {dp.requestCta}
            </a>
          </>
        ) : null}
      </div>
    </article>
  );
}
