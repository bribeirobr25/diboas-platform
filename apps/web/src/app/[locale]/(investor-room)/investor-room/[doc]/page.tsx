import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { isValidLocale, loadMessages, type SupportedLocale } from '@diboas/i18n/server';
import { verifyInvestorGate, INVESTOR_GATE_COOKIE } from '@/lib/security/investorGate';
import { InvestorDocBody, type InvestorDocContent } from '@/components/Investor/InvestorDocBody';
import { InvestorDocNav } from '@/components/Investor/InvestorDocNav';
import { InvestorReadingProgress } from '@/components/Investor/InvestorReadingProgress';
import { PrintDocButton } from '@/components/Investor/PrintDocButton';
import { roomContentLocale } from '@/lib/i18n/roomContentLocale';
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
      onThisPage: string;
      prev: string;
      next: string;
      docOf: string;
      footerPrompt: string;
      docNavAria: string;
    };
  };
}
interface DocsContent {
  docs: Record<string, InvestorDocContent>;
}

/**
 * Gated investor-room document page. Renders the full document body (generated
 * `blocks[]` from the `investor-docs` namespace) with a "Download PDF" (print)
 * action; the in-preparation doc keeps its request fallback.
 *
 * SECURITY: the page MUST verify the gate itself. The room layout's
 * `granted ? children : <InvestorRoomAccess/>` only controls what is PLACED in
 * the tree — pages render in parallel with layouts, so without this check the
 * full document content ships in the RSC flight payload of the password screen
 * (found + fixed 2026-07-06). When not granted, the page contributes nothing.
 */
export default async function InvestorDocPage({ params }: DocPageProps) {
  const { locale: localeParam, doc: docSlug } = await params;
  const locale = localeParam as SupportedLocale;
  if (!isValidLocale(locale)) notFound();

  const cookieStore = await cookies();
  if (!verifyInvestorGate(cookieStore.get(INVESTOR_GATE_COOKIE)?.value)) return null;

  // Room is EN + pt-BR only; de/es read English. Chrome + body both use the content locale.
  const contentLocale = roomContentLocale(locale);
  const [messages, docsContent] = await Promise.all([
    loadMessages(contentLocale, 'investor') as unknown as Promise<DocMessages>,
    loadMessages(contentLocale, 'investor-docs') as unknown as Promise<DocsContent>,
  ]);
  const { docs } = messages.room.materials;
  const dp = messages.room.docPage;
  const entry = docs.find((d) => d.slug === docSlug);
  if (!entry) notFound();

  const inPrep = entry.status === 'in-preparation';
  const content = docsContent?.docs?.[docSlug];
  const hasBody = !inPrep && !!content && content.blocks.length > 0;
  const docOf = dp.docOf.replace('{num}', entry.num).replace('{total}', String(docs.length));

  return (
    <>
      <InvestorReadingProgress />
      <article className={`${styles.section} ${styles.toneNeutral}`}>
        <div className={styles.docFrame}>
          <div className={styles.docTopBar}>
            <a href={`/${locale}/investor-room`} className={styles.backLink}>
              {dp.backToRoom}
            </a>
            {hasBody ? <PrintDocButton label={dp.downloadPdf} docSlug={docSlug} /> : null}
          </div>

          <p className={styles.eyebrow}>
            {docOf} · {inPrep ? dp.statusInPrep : dp.statusAvailable}
          </p>
          <h1 className={styles.header}>{entry.title}</h1>
          <p className={styles.paragraph}>{inPrep ? dp.inPrepBody : entry.summary}</p>

          {hasBody ? (
            <InvestorDocBody
              content={content}
              onThisPageLabel={dp.onThisPage}
              layout={docSlug === 'pitch-deck' ? 'slides' : 'doc'}
            />
          ) : !inPrep ? (
            <>
              <p className={styles.eyebrow}>{dp.covers}</p>
              <a href={`/${locale}/investors#request`} className={styles.ctaPrimary}>
                {dp.requestCta}
              </a>
            </>
          ) : null}

          <InvestorDocNav
            docs={docs}
            currentSlug={docSlug}
            hrefBase={`/${locale}/investor-room/`}
            roomHref={`/${locale}/investor-room`}
            labels={{
              prev: dp.prev,
              next: dp.next,
              backToRoom: dp.backToRoom,
              navAria: dp.docNavAria,
            }}
          />
          <p className={styles.docFooterPrompt}>{dp.footerPrompt}</p>
        </div>
      </article>
    </>
  );
}
