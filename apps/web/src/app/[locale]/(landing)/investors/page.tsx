import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isValidLocale, loadMessages, type SupportedLocale } from '@diboas/i18n/server';
import { InvestorProse } from '@/components/Investor/InvestorProse';
import { InvestorRequestForm } from '@/components/Investor/InvestorRequestForm';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import styles from '@/components/Investor/investor.module.css';

interface PageProps {
  params: Promise<{ locale: string }>;
}

interface InvestorPageMessages {
  page: {
    seo: { title: string; description: string; ogTitle: string; ogDescription: string };
    hero: {
      eyebrow: string;
      headline: string;
      subheadline: string;
      supporting: string;
      ctaPrimary: string;
      ctaSecondary: string;
      trustNote: string;
    };
    thesis: { label: string; headline: string; body: string[]; pullQuote: string };
    building: { label: string; headline: string; body: string[]; productLine: string };
    whyNow: { label: string; headline: string; body: string[] };
    marketSequence: {
      label: string;
      headline: string;
      body: string;
      markets: string[];
      note: string;
    };
    businessModel: { label: string; headline: string; body: string[]; supporting: string };
    status: { label: string; headline: string; body: string[]; items: string[] };
    founder: { label: string; headline: string; body: string[] };
    raise: { label: string; headline: string; body: string[]; privateNote: string };
    materials: { label: string; headline: string; body: string[]; items: string[]; cta: string };
    request: {
      title: string;
      intro: string;
      labels: Record<string, string>;
      typeOptions: Record<string, string>;
      submit: string;
      submitting: string;
      success: string;
      error: string;
      privacyNote: string;
    };
    riskNote: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const messages = (await loadMessages(
    locale as SupportedLocale,
    'investor'
  )) as unknown as InvestorPageMessages;
  const seo = messages.page.seo;
  return {
    title: seo.title,
    description: seo.description,
    openGraph: { title: seo.ogTitle, description: seo.ogDescription },
    robots: { index: true, follow: true },
  };
}

export default async function InvestorsPage({ params }: PageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;
  if (!isValidLocale(locale)) notFound();

  const messages = (await loadMessages(locale, 'investor')) as unknown as InvestorPageMessages;
  const p = messages.page;

  return (
    <div className="main-page-wrapper">
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>{p.hero.eyebrow}</p>
          <h1 className={styles.heroHeadline}>{p.hero.headline}</h1>
          <p className={styles.heroSub}>{p.hero.subheadline}</p>
          <p className={styles.heroSupport}>{p.hero.supporting}</p>
          <div className={styles.ctaRow}>
            <a href="#request" className={styles.ctaPrimary}>
              {p.hero.ctaPrimary}
            </a>
            <a href="#thesis" className={styles.ctaSecondary}>
              {p.hero.ctaSecondary}
            </a>
          </div>
          <p className={styles.trustNote}>{p.hero.trustNote}</p>
        </div>
      </section>

      <SectionErrorBoundary
        sectionId="investor-thesis"
        sectionType="ProseSection"
        enableReporting
        context={{ page: 'investors', locale }}
      >
        <InvestorProse
          id="thesis"
          tone="neutral"
          eyebrow={p.thesis.label}
          header={p.thesis.headline}
          paragraphs={p.thesis.body}
        >
          <p className={styles.pullQuote}>{p.thesis.pullQuote}</p>
        </InvestorProse>
      </SectionErrorBoundary>

      <SectionErrorBoundary
        sectionId="investor-building"
        sectionType="ProseSection"
        enableReporting
        context={{ page: 'investors', locale }}
      >
        <InvestorProse
          eyebrow={p.building.label}
          header={p.building.headline}
          paragraphs={[...p.building.body, p.building.productLine]}
        />
      </SectionErrorBoundary>

      <SectionErrorBoundary
        sectionId="investor-why-now"
        sectionType="ProseSection"
        enableReporting
        context={{ page: 'investors', locale }}
      >
        <InvestorProse
          tone="neutral"
          eyebrow={p.whyNow.label}
          header={p.whyNow.headline}
          paragraphs={p.whyNow.body}
        />
      </SectionErrorBoundary>

      <SectionErrorBoundary
        sectionId="investor-market-sequence"
        sectionType="ProseSection"
        enableReporting
        context={{ page: 'investors', locale }}
      >
        <InvestorProse
          eyebrow={p.marketSequence.label}
          header={p.marketSequence.headline}
          paragraphs={[p.marketSequence.body]}
        >
          <ul className={styles.list}>
            {p.marketSequence.markets.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
          <p className={styles.paragraph}>{p.marketSequence.note}</p>
        </InvestorProse>
      </SectionErrorBoundary>

      <SectionErrorBoundary
        sectionId="investor-business-model"
        sectionType="ProseSection"
        enableReporting
        context={{ page: 'investors', locale }}
      >
        <InvestorProse
          tone="neutral"
          eyebrow={p.businessModel.label}
          header={p.businessModel.headline}
          paragraphs={[...p.businessModel.body, p.businessModel.supporting]}
        />
      </SectionErrorBoundary>

      <SectionErrorBoundary
        sectionId="investor-status"
        sectionType="ProseSection"
        enableReporting
        context={{ page: 'investors', locale }}
      >
        <InvestorProse
          eyebrow={p.status.label}
          header={p.status.headline}
          paragraphs={p.status.body}
        >
          <ul className={styles.list}>
            {p.status.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </InvestorProse>
      </SectionErrorBoundary>

      <SectionErrorBoundary
        sectionId="investor-founder"
        sectionType="ProseSection"
        enableReporting
        context={{ page: 'investors', locale }}
      >
        <InvestorProse
          tone="neutral"
          eyebrow={p.founder.label}
          header={p.founder.headline}
          paragraphs={p.founder.body}
        />
      </SectionErrorBoundary>

      <SectionErrorBoundary
        sectionId="investor-raise"
        sectionType="ProseSection"
        enableReporting
        context={{ page: 'investors', locale }}
      >
        <InvestorProse
          eyebrow={p.raise.label}
          header={p.raise.headline}
          paragraphs={[...p.raise.body, p.raise.privateNote]}
        />
      </SectionErrorBoundary>

      <SectionErrorBoundary
        sectionId="investor-materials"
        sectionType="ProseSection"
        enableReporting
        context={{ page: 'investors', locale }}
      >
        <InvestorProse
          tone="neutral"
          eyebrow={p.materials.label}
          header={p.materials.headline}
          paragraphs={p.materials.body}
        >
          <ul className={styles.list}>
            {p.materials.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </InvestorProse>
      </SectionErrorBoundary>

      {/* Request form */}
      <section id="request" className={`${styles.section} ${styles.toneWhite}`}>
        <SectionErrorBoundary
          sectionId="investor-request"
          sectionType="InvestorRequestForm"
          enableReporting
          context={{ page: 'investors', locale }}
        >
          <InvestorRequestForm
            locale={locale}
            title={p.request.title}
            intro={p.request.intro}
            labels={p.request.labels as never}
            typeOptions={p.request.typeOptions}
            submit={p.request.submit}
            submitting={p.request.submitting}
            success={p.request.success}
            error={p.request.error}
            privacyNote={p.request.privacyNote}
          />
        </SectionErrorBoundary>
      </section>

      <p className={styles.footerNote}>{p.riskNote}</p>
    </div>
  );
}
