import nextDynamic from 'next/dynamic';
import { HeroSection, WedgeSection, ProseSection } from '@/components/Sections';

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
import {
  B2C_EN_HERO_CONFIG,
  B2C_EN_NEVERHOLD_CONFIG,
  B2C_EN_UPSIDE_CONFIG,
  B2C_EN_PICTUREFUTURE_CONFIG,
  B2C_EN_HOWITWORKS_CONFIG,
  B2C_EN_CATCH_CONFIG,
  B2C_EN_FOUNDER_CONFIG,
  B2C_EN_DEMO_CONFIG,
  B2C_EN_WAITLIST_CONFIG,
} from '@/config/landing-b2c-en';

/**
 * LandingEn — the /en landing composition (Draper restructure, US audience).
 *
 * Fairness-led spine ("It's your money. The upside should be too."): pain (0.38%)
 * -> "we never hold your money" (the hinge) -> "the upside goes to you" -> hope.
 * dusk -> dawn light journey. Reuses existing section components with en copy
 * (the reference-locale `draper.*` keys) + on-brand images (DRY). Reused-component
 * ids stay; net-new beats use `-en` ids. Shared shell in page.tsx.
 */
export function LandingEn() {
  return (
    <div className="main-page-wrapper">
      {/* Hero — real-photo full-bleed, dawn light */}
      <SectionErrorBoundary
        sectionId="hero-section-b2c"
        sectionType="HeroSection"
        enableReporting={true}
        context={{ page: 'landing-b2c', variant: 'cinematic', locale: 'en' }}
      >
        <div data-section-id="hero-section-b2c">
          <HeroSection
            variant="cinematic"
            config={B2C_EN_HERO_CONFIG}
            enableAnalytics={true}
            priority={true}
          />
        </div>
      </SectionErrorBoundary>

      {/* §2 The honest gap (the pain, 0.38%) — darkest point */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId="wedge-section-b2c"
          sectionType="WedgeSection"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale: 'en' }}
        >
          <div data-section-id="wedge-section-b2c" style={{ backgroundColor: 'var(--section-bg-dark)' }}>
            <WedgeSection enableAnalytics={true} />
          </div>
        </SectionErrorBoundary>
      </ScrollReveal>

      {/* §3 We never hold your money (the hinge) — first dawn light */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId="neverhold-section-en"
          sectionType="ProseSection"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale: 'en' }}
        >
          <div id="we-never-hold" data-section-id="neverhold-section-en">
            <ProseSection config={B2C_EN_NEVERHOLD_CONFIG} enableAnalytics={true} />
          </div>
        </SectionErrorBoundary>
      </ScrollReveal>

      {/* §4 The upside goes to you (fairness clincher) — morning building */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId="upside-section-en"
          sectionType="ProseSection"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale: 'en' }}
        >
          <div id="the-upside" data-section-id="upside-section-en">
            <ProseSection config={B2C_EN_UPSIDE_CONFIG} enableAnalytics={true} headingLevel="h2" />
          </div>
        </SectionErrorBoundary>
      </ScrollReveal>

      {/* §5 Picture a few years out (the peak) — full golden dawn */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId="picture-future-section-en"
          sectionType="ProseSection"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale: 'en' }}
        >
          <div id="picture" data-section-id="picture-future-section-en">
            <ProseSection config={B2C_EN_PICTUREFUTURE_CONFIG} enableAnalytics={true} headingLevel="h2" />
          </div>
        </SectionErrorBoundary>
      </ScrollReveal>

      {/* §6 How it works (3 steps + the exit door) — clear day. Hero CTA target. */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId="how-it-works-en"
          sectionType="ProseSection"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale: 'en' }}
        >
          <div id="how-it-works" data-section-id="how-it-works-en">
            <ProseSection config={B2C_EN_HOWITWORKS_CONFIG} enableAnalytics={true} headingLevel="h2" />
          </div>
        </SectionErrorBoundary>
      </ScrollReveal>

      {/* §7 What's the catch? (the honest answer) — paper-and-ink */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId="catch-section-en"
          sectionType="ProseSection"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale: 'en' }}
        >
          <div id="the-catch" data-section-id="catch-section-en">
            <ProseSection config={B2C_EN_CATCH_CONFIG} enableAnalytics={true} headingLevel="h2" />
          </div>
        </SectionErrorBoundary>
      </ScrollReveal>

      {/* §8 See it yourself (Demo) — brand bg */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId="demo-section-b2c"
          sectionType="DemoLauncher"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale: 'en' }}
        >
          <div id="demo" data-section-id="demo-section-b2c" style={{ backgroundColor: 'var(--section-bg-brand)' }}>
            <DemoLauncher config={B2C_EN_DEMO_CONFIG} enableAnalytics={true} />
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
          context={{ page: 'landing-b2c', locale: 'en' }}
        >
          <div id="fees" data-section-id="fees-section-b2c" style={{ backgroundColor: 'var(--section-bg-neutral)' }}>
            <FeeTable
              config={B2C_FEES_CONFIG}
              enableAnalytics={true}
              expandedSlot={
                <div id="comparison" data-section-id="comparison-section-b2c">
                  <ComparisonTable enableAnalytics={true} embedded />
                </div>
              }
            />
          </div>
        </SectionErrorBoundary>
      </ScrollReveal>

      {/* §10 Built by Bar (the founder story) — warm */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId="founder-section-en"
          sectionType="ProseSection"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale: 'en' }}
        >
          <div id="founder" data-section-id="founder-section-en">
            <ProseSection config={B2C_EN_FOUNDER_CONFIG} enableAnalytics={true} headingLevel="h2" />
          </div>
        </SectionErrorBoundary>
      </ScrollReveal>

      {/* §10b Join (final CTA) — waitlist, placed ABOVE the FAQ */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId="waitlist-section-b2c"
          sectionType="WaitlistSection"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale: 'en' }}
        >
          <div id="waitlist" data-section-id="waitlist-section-b2c">
            <WaitlistSection enableAnalytics={true} config={B2C_EN_WAITLIST_CONFIG} />
          </div>
        </SectionErrorBoundary>
      </ScrollReveal>

      {/* §11 Objections — FAQ accordion (trailing reference, below the CTA) */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId="faq-section-b2c"
          sectionType="FAQAccordion"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale: 'en' }}
        >
          <div
            id="faq"
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
