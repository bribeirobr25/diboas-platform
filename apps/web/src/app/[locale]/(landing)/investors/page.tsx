import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isValidLocale, loadMessages, type SupportedLocale } from '@diboas/i18n/server';
import { InvestorProse } from '@/components/Investor/InvestorProse';
import { InvestorGlance } from '@/components/Investor/InvestorGlance';
import { InvestorDocCards } from '@/components/Investor/InvestorDocCards';
import { InvestorSplitList } from '@/components/Investor/InvestorSplitList';
import { InvestorRequestForm } from '@/components/Investor/InvestorRequestForm';
import { StickyMobileCTA } from '@/components/UI';
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
    glance: { ariaLabel: string; items: { value: string; label: string }[] };
    thesis: { label: string; headline: string; body: string[]; pullQuote: string };
    building: {
      label: string;
      headline: string;
      body: string[];
      pullQuote: string;
      productLine: string;
    };
    marketSequence: {
      label: string;
      headline: string;
      body: string;
      markets: { name: string; line: string }[];
      note: string;
    };
    businessModel: {
      label: string;
      headline: string;
      body: string[];
      supporting: string;
      statCallout: { value: string; label: string };
    };
    status: {
      label: string;
      headline: string;
      body: string[];
      builtLabel: string;
      built: string[];
      plannedLabel: string;
      planned: string[];
    };
    founder: { label: string; headline: string; body: string[] };
    raise: { label: string; headline: string; body: string[]; privateNote: string };
    materials: {
      label: string;
      headline: string;
      body: string[];
      gatedNote: string;
      statusLabels: { available: string; inPrep: string };
      docs: {
        num: string;
        title: string;
        summary: string;
        status: 'available' | 'in-preparation';
      }[];
      cta: string;
    };
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
      <section className={styles.hero} data-section-id="investor-hero">
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

      {/* At a glance */}
      <SectionErrorBoundary
        sectionId="investor-glance"
        sectionType="ProseSection"
        enableReporting
        context={{ page: 'investors', locale }}
      >
        <InvestorGlance items={p.glance.items} ariaLabel={p.glance.ariaLabel} />
      </SectionErrorBoundary>

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

      {/* What we're building — and why now (merged) */}
      <SectionErrorBoundary
        sectionId="investor-building"
        sectionType="ProseSection"
        enableReporting
        context={{ page: 'investors', locale }}
      >
        <InvestorProse eyebrow={p.building.label} header={p.building.headline} paragraphs={p.building.body}>
          <p className={styles.pullQuote}>{p.building.pullQuote}</p>
          <p className={styles.paragraph}>{p.building.productLine}</p>
        </InvestorProse>
      </SectionErrorBoundary>

      <SectionErrorBoundary
        sectionId="investor-market-sequence"
        sectionType="ProseSection"
        enableReporting
        context={{ page: 'investors', locale }}
      >
        <InvestorProse
          tone="neutral"
          eyebrow={p.marketSequence.label}
          header={p.marketSequence.headline}
          paragraphs={[p.marketSequence.body]}
        >
          <div className={styles.marketGrid}>
            {p.marketSequence.markets.map((m) => (
              <div key={m.name} className={styles.docCard}>
                <h3 className={styles.marketName}>{m.name}</h3>
                <p className={styles.marketLine}>{m.line}</p>
              </div>
            ))}
          </div>
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
          eyebrow={p.businessModel.label}
          header={p.businessModel.headline}
          paragraphs={p.businessModel.body}
        >
          <div className={styles.statCallout}>
            <span className={styles.statValue}>{p.businessModel.statCallout.value}</span>
            <span className={styles.statLabel}>{p.businessModel.statCallout.label}</span>
          </div>
        </InvestorProse>
      </SectionErrorBoundary>

      {/* Current status — Live / Planned split */}
      <SectionErrorBoundary
        sectionId="investor-status"
        sectionType="ProseSection"
        enableReporting
        context={{ page: 'investors', locale }}
      >
        <InvestorProse
          tone="neutral"
          eyebrow={p.status.label}
          header={p.status.headline}
          paragraphs={p.status.body}
        >
          <InvestorSplitList
            left={{ title: p.status.builtLabel, items: p.status.built }}
            right={{ title: p.status.plannedLabel, items: p.status.planned }}
          />
        </InvestorProse>
      </SectionErrorBoundary>

      <SectionErrorBoundary
        sectionId="investor-founder"
        sectionType="ProseSection"
        enableReporting
        context={{ page: 'investors', locale }}
      >
        <InvestorProse
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
          tone="neutral"
          eyebrow={p.raise.label}
          header={p.raise.headline}
          paragraphs={[...p.raise.body, p.raise.privateNote]}
        />
      </SectionErrorBoundary>

      {/* Investor materials — data-room card grid */}
      <SectionErrorBoundary
        sectionId="investor-materials"
        sectionType="ProseSection"
        enableReporting
        context={{ page: 'investors', locale }}
      >
        <InvestorProse eyebrow={p.materials.label} header={p.materials.headline} paragraphs={p.materials.body}>
          <p className={styles.gatedNote}>{p.materials.gatedNote}</p>
          <InvestorDocCards docs={p.materials.docs} statusLabels={p.materials.statusLabels} />
          <div className={styles.ctaRow}>
            <a href="#request" className={styles.ctaPrimary}>
              {p.materials.cta}
            </a>
          </div>
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

      {/* Persistent mobile CTA → the request form */}
      <StickyMobileCTA
        appearAfterSelector='[data-section-id="investor-hero"]'
        hideNearId="request"
        targetId="request"
        ctaText={p.hero.ctaPrimary}
      />
    </div>
  );
}
