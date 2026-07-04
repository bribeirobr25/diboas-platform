import { notFound } from 'next/navigation';
import { isValidLocale, loadMessages, type SupportedLocale } from '@diboas/i18n/server';
import { InvestorProse } from '@/components/Investor/InvestorProse';
import { InvestorDocCards } from '@/components/Investor/InvestorDocCards';
import { InvestorSplitList } from '@/components/Investor/InvestorSplitList';
import { InvestorGlance } from '@/components/Investor/InvestorGlance';
import { roomContentLocale } from '@/lib/i18n/roomContentLocale';
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
    glance: { ariaLabel: string; items: { value: string; label: string }[] };
    startHere: { headline: string; body: string[] };
    materials: { headline: string; intro: string; docs: DocEntry[] };
    snapshot: { headline: string; rows: { label: string; value: string }[] };
    builtNotBuilt: {
      headline: string;
      builtLabel: string;
      notBuiltLabel: string;
      built: string[];
      notBuilt: string[];
      closing: string;
    };
    raiseProves: { headline: string; pullQuote: string; body: string[] };
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

  const messages = (await loadMessages(
    roomContentLocale(locale),
    'investor'
  )) as unknown as RoomMessages;
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

      <InvestorGlance items={r.glance.items} ariaLabel={r.glance.ariaLabel} />

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
        <InvestorDocCards
          docs={r.materials.docs}
          hrefBase={`/${locale}/investor-room/`}
          statusLabels={{ available: r.docPage.statusAvailable, inPrep: r.docPage.statusInPrep }}
        />
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

      <InvestorProse
        tone="neutral"
        header={r.builtNotBuilt.headline}
        paragraphs={[r.builtNotBuilt.closing]}
      >
        <InvestorSplitList
          left={{ title: r.builtNotBuilt.builtLabel, items: r.builtNotBuilt.built }}
          right={{ title: r.builtNotBuilt.notBuiltLabel, items: r.builtNotBuilt.notBuilt }}
        />
      </InvestorProse>

      <InvestorProse header={r.raiseProves.headline} paragraphs={r.raiseProves.body}>
        <p className={styles.pullQuote}>{r.raiseProves.pullQuote}</p>
      </InvestorProse>

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
        {contactEmail ? (
          <div className={styles.ctaRow}>
            <a href={`mailto:${contactEmail}`} className={styles.ctaPrimary}>
              {r.contact.cta}
            </a>
          </div>
        ) : null}
      </InvestorProse>

      <p className={styles.footerNote}>{r.footerNote}</p>
    </>
  );
}
