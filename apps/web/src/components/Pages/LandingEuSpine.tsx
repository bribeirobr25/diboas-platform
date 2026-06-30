import nextDynamic from 'next/dynamic';
import { HeroSection, ProseSection } from '@/components/Sections';

const DemoLauncher = nextDynamic(() =>
  import('@/components/Sections/DemoLauncher').then((m) => ({ default: m.DemoLauncher }))
);
const FeeTable = nextDynamic(() =>
  import('@/components/Sections/FeeTable').then((m) => ({ default: m.FeeTable }))
);
const WaitlistSection = nextDynamic(() =>
  import('@/components/Sections/WaitlistSection').then((m) => ({ default: m.WaitlistSection }))
);
const ComparisonTable = nextDynamic(() =>
  import('@/components/Sections/ComparisonTable').then((m) => ({ default: m.ComparisonTable }))
);
const FAQAccordion = nextDynamic(() =>
  import('@/components/Sections/FAQAccordion/FAQAccordionFactory').then((m) => ({
    default: m.FAQAccordion,
  }))
);
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import { ScrollReveal } from '@/components/UI';
import { B2C_FEES_CONFIG, B2C_FAQ_CONFIG } from '@/config/landing-b2c';
import { makeEuLandingConfig, EU_SHARED_ANCHORS, type EuLocale } from '@/config/landing-b2c-eu';

/**
 * LandingEuSpine — the shared en/de/es landing composition (Draper restructure).
 *
 * One renderer for the three EU locales, which share an identical fairness-led
 * spine ("It's your money. The upside should be too."): pain -> "we never hold
 * your money" (the hinge) -> "the upside goes to you" -> hope, on a dusk->dawn
 * light journey. Per-locale copy resolves from the shared `draper.*` i18n keys;
 * the only divergences (hero CTA target, the 6 locale-suffixed section-ids, the
 * 5 translated scroll anchors, the rotating-CTA set) come from
 * `makeEuLandingConfig(locale)`. Reused-component ids (hero/wedge/demo/fees/
 * comparison/waitlist/faq) stay shared for analytics continuity. pt-BR has its
 * own composition (LandingPtBR). Shared shell in page.tsx.
 */
export function LandingEuSpine({ locale }: { locale: EuLocale }) {
  const cfg = makeEuLandingConfig(locale);

  return (
    <div className="main-page-wrapper">
      {/* Hero — real-photo full-bleed, dawn light */}
      <SectionErrorBoundary
        sectionId="hero-section-b2c"
        sectionType="HeroSection"
        enableReporting={true}
        context={{ page: 'landing-b2c', variant: 'cinematic', locale }}
      >
        <div data-section-id="hero-section-b2c">
          <HeroSection
            variant="cinematic"
            config={cfg.hero}
            enableAnalytics={true}
            priority={true}
          />
        </div>
      </SectionErrorBoundary>

      {/* §2 What is this money for? (the tension) — darkest point */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId={cfg.ids.tension}
          sectionType="ProseSection"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale }}
        >
          <div id={cfg.anchors.tension} data-section-id={cfg.ids.tension}>
            <ProseSection config={cfg.tension} enableAnalytics={true} headingLevel="h2" />
          </div>
        </SectionErrorBoundary>
      </ScrollReveal>

      {/* §2b A place of its own (the side-pocket) — the brand's defining metaphor */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId={cfg.ids.sidePocket}
          sectionType="ProseSection"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale }}
        >
          <div id={cfg.anchors.sidePocket} data-section-id={cfg.ids.sidePocket}>
            <ProseSection config={cfg.sidePocket} enableAnalytics={true} headingLevel="h2" />
          </div>
        </SectionErrorBoundary>
      </ScrollReveal>

      {/* §3 We never hold your money (the hinge) — first dawn light */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId={cfg.ids.neverHold}
          sectionType="ProseSection"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale }}
        >
          <div id={cfg.anchors.neverHold} data-section-id={cfg.ids.neverHold}>
            <ProseSection config={cfg.neverHold} enableAnalytics={true} />
          </div>
        </SectionErrorBoundary>
      </ScrollReveal>

      {/* §4 The upside goes to you (fairness clincher) — morning building */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId={cfg.ids.upside}
          sectionType="ProseSection"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale }}
        >
          <div id={cfg.anchors.upside} data-section-id={cfg.ids.upside}>
            <ProseSection config={cfg.upside} enableAnalytics={true} headingLevel="h2" />
          </div>
        </SectionErrorBoundary>
      </ScrollReveal>

      {/* §5 Picture a few years out (the peak) — full golden dawn */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId={cfg.ids.pictureFuture}
          sectionType="ProseSection"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale }}
        >
          <div id={cfg.anchors.pictureFuture} data-section-id={cfg.ids.pictureFuture}>
            <ProseSection config={cfg.pictureFuture} enableAnalytics={true} headingLevel="h2" />
          </div>
        </SectionErrorBoundary>
      </ScrollReveal>

      {/* §6 How it works (3 steps + the exit door) — clear day. Hero CTA target. */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId={cfg.ids.howItWorks}
          sectionType="ProseSection"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale }}
        >
          <div id={cfg.anchors.howItWorks} data-section-id={cfg.ids.howItWorks}>
            <ProseSection config={cfg.howItWorks} enableAnalytics={true} headingLevel="h2" />
          </div>
        </SectionErrorBoundary>
      </ScrollReveal>

      {/* §7 What's the catch? (the honest answer) — paper-and-ink */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId={cfg.ids.catch}
          sectionType="ProseSection"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale }}
        >
          <div id={cfg.anchors.catch} data-section-id={cfg.ids.catch}>
            <ProseSection config={cfg.catch} enableAnalytics={true} headingLevel="h2" />
          </div>
        </SectionErrorBoundary>
      </ScrollReveal>

      {/* §8 See it yourself (Demo) — brand bg */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId="demo-section-b2c"
          sectionType="DemoLauncher"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale }}
        >
          <div
            id={EU_SHARED_ANCHORS.demo}
            data-section-id="demo-section-b2c"
            style={{ backgroundColor: 'var(--section-bg-brand)' }}
          >
            <DemoLauncher config={cfg.demo} enableAnalytics={true} />
          </div>
        </SectionErrorBoundary>
      </ScrollReveal>

      {/* §9 What it costs — neutral bg. Lean mode: first 3 rows; expanding reveals
          the rest + the "See the numbers" comparison chart (FeeTable expandedSlot). */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId="fees-section-b2c"
          sectionType="FeeTable"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale }}
        >
          <div
            id={EU_SHARED_ANCHORS.fees}
            data-section-id="fees-section-b2c"
            style={{ backgroundColor: 'var(--section-bg-neutral)' }}
          >
            <FeeTable
              config={B2C_FEES_CONFIG}
              enableAnalytics={true}
              expandedSlot={
                <div id={EU_SHARED_ANCHORS.comparison} data-section-id="comparison-section-b2c">
                  <ComparisonTable enableAnalytics={true} embedded />
                </div>
              }
            />
          </div>
        </SectionErrorBoundary>
      </ScrollReveal>

      {/* §10 Built by Bar (the founder story) — warm. Anchor `#founder` is shared
          across locales even though the section-id is locale-suffixed. */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId={cfg.ids.founder}
          sectionType="ProseSection"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale }}
        >
          <div id={EU_SHARED_ANCHORS.founder} data-section-id={cfg.ids.founder}>
            <ProseSection config={cfg.founder} enableAnalytics={true} headingLevel="h2" />
          </div>
        </SectionErrorBoundary>
      </ScrollReveal>

      {/* §10b Join (final CTA) — waitlist, placed ABOVE the FAQ */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId="waitlist-section-b2c"
          sectionType="WaitlistSection"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale }}
        >
          <div id={EU_SHARED_ANCHORS.waitlist} data-section-id="waitlist-section-b2c">
            <WaitlistSection enableAnalytics={true} config={cfg.waitlist} />
          </div>
        </SectionErrorBoundary>
      </ScrollReveal>

      {/* §11 Objections — FAQ accordion (trailing reference, below the CTA) */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId="faq-section-b2c"
          sectionType="FAQAccordion"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale }}
        >
          <div
            id={EU_SHARED_ANCHORS.faq}
            data-section-id="faq-section-b2c"
            style={{ backgroundColor: 'var(--section-bg-white)' }}
          >
            <FAQAccordion config={B2C_FAQ_CONFIG} />
          </div>
        </SectionErrorBoundary>
      </ScrollReveal>
    </div>
  );
}
