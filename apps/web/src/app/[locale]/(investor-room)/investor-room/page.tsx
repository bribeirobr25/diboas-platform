import { notFound } from 'next/navigation';
import { isValidLocale, loadMessages, type SupportedLocale } from '@diboas/i18n/server';
import { InvestorProse } from '@/components/Investor/InvestorProse';
import styles from '@/components/Investor/investor.module.css';

interface RoomPageProps {
  params: Promise<{ locale: string }>;
}

interface DocEntry {
  slug: string;
  num: string;
  title: string;
  summary: string;
  status: 'available' | 'in-preparation';
}
interface RoomMessages {
  room: {
    accessNote: string;
    hero: { eyebrow: string; headline: string; subheadline: string; supporting: string };
    startHere: { headline: string; body: string[] };
    materials: { headline: string; intro: string; docs: DocEntry[] };
    snapshot: { headline: string; rows: { label: string; value: string }[] };
    builtNotBuilt: { headline: string; built: string[]; notBuilt: string[]; closing: string };
    raiseProves: { headline: string; body: string[] };
    openRisks: { headline: string; intro: string; items: string[]; closing: string };
    regulatory: { headline: string; body: string[] };
    contact: {
      headline: string;
      body: string;
      founderLabel: string;
      emailLabel: string;
      linkedinLabel: string;
      locationLabel: string;
      location: string;
      cta: string;
    };
    footerNote: string;
    docPage: { statusAvailable: string; statusInPrep: string };
  };
}

export default async function InvestorRoomPage({ params }: RoomPageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;
  if (!isValidLocale(locale)) notFound();

  const messages = (await loadMessages(locale, 'investor')) as unknown as RoomMessages;
  const r = messages.room;

  // Founder contact renders from env (filled by the founder); falls back to a dash.
  const contactName = process.env.INVESTOR_CONTACT_NAME || '—';
  const contactEmail = process.env.INVESTOR_CONTACT_EMAIL || '';
  const contactLinkedin = process.env.INVESTOR_CONTACT_LINKEDIN || '';

  return (
    <>
      <InvestorProse
        tone="dark"
        headingLevel="h1"
        eyebrow={r.hero.eyebrow}
        header={r.hero.headline}
        paragraphs={[r.hero.subheadline, r.hero.supporting]}
      />

      <InvestorProse header={r.startHere.headline} paragraphs={r.startHere.body}>
        <div className={styles.ctaRow}>
          <a href={`/${locale}/investor-room/business-plan`} className={styles.ctaPrimary}>
            {r.materials.docs[0]?.title}
          </a>
          <a href={`/${locale}/investor-room/investor-faq`} className={styles.ctaSecondary}>
            {r.materials.docs[1]?.title}
          </a>
        </div>
      </InvestorProse>

      <InvestorProse tone="neutral" header={r.materials.headline} paragraphs={[r.materials.intro]}>
        <div className={styles.docGrid}>
          {r.materials.docs.map((doc) => (
            <a
              key={doc.slug}
              href={`/${locale}/investor-room/${doc.slug}`}
              className={styles.docCard}
            >
              <span className={styles.docNum}>{doc.num}</span>
              <h3 className={styles.docTitle}>{doc.title}</h3>
              <p className={styles.docSummary}>{doc.summary}</p>
              <span
                className={`${styles.docStatus} ${doc.status === 'in-preparation' ? styles.docStatusPrep : ''}`}
              >
                {doc.status === 'in-preparation'
                  ? r.docPage.statusInPrep
                  : r.docPage.statusAvailable}
              </span>
            </a>
          ))}
        </div>
      </InvestorProse>

      <InvestorProse header={r.snapshot.headline}>
        <table className={styles.snapshot}>
          <tbody>
            {r.snapshot.rows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                <td>{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </InvestorProse>

      <InvestorProse tone="neutral" header={r.builtNotBuilt.headline} paragraphs={[r.builtNotBuilt.closing]}>
        <div className={styles.twoCol}>
          <div>
            <p className={styles.colTitle}>Built</p>
            <ul className={styles.list}>
              {r.builtNotBuilt.built.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className={styles.colTitle}>Not yet built</p>
            <ul className={styles.list}>
              {r.builtNotBuilt.notBuilt.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </InvestorProse>

      <InvestorProse header={r.raiseProves.headline} paragraphs={r.raiseProves.body} />

      <InvestorProse tone="neutral" header={r.openRisks.headline} paragraphs={[r.openRisks.intro]}>
        <ol className={styles.list}>
          {r.openRisks.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
        <p className={styles.paragraph}>{r.openRisks.closing}</p>
      </InvestorProse>

      <InvestorProse header={r.regulatory.headline} paragraphs={r.regulatory.body} />

      <InvestorProse tone="neutral" header={r.contact.headline} paragraphs={[r.contact.body]}>
        <dl className={styles.contactBlock}>
          <dt>{r.contact.founderLabel}</dt>
          <dd>{contactName}</dd>
          {contactEmail ? (
            <>
              <dt>{r.contact.emailLabel}</dt>
              <dd>
                <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
              </dd>
            </>
          ) : null}
          {contactLinkedin ? (
            <>
              <dt>{r.contact.linkedinLabel}</dt>
              <dd>
                <a href={contactLinkedin} target="_blank" rel="noopener noreferrer">
                  {contactLinkedin}
                </a>
              </dd>
            </>
          ) : null}
          <dt>{r.contact.locationLabel}</dt>
          <dd>{r.contact.location}</dd>
        </dl>
      </InvestorProse>

      <p className={styles.footerNote}>{r.footerNote}</p>
    </>
  );
}
