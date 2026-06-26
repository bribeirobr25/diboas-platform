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
  B2C_DE_HERO_CONFIG,
  B2C_DE_NEVERHOLD_CONFIG,
  B2C_DE_UPSIDE_CONFIG,
  B2C_DE_PICTUREFUTURE_CONFIG,
  B2C_DE_HOWITWORKS_CONFIG,
  B2C_DE_CATCH_CONFIG,
  B2C_DE_FOUNDER_CONFIG,
  B2C_DE_DEMO_CONFIG,
  B2C_DE_WAITLIST_CONFIG,
} from '@/config/landing-b2c-de';

/**
 * LandingDe — the /de landing composition (Draper restructure, EU twin).
 *
 * Fairness-led spine ("Es ist dein Geld. Der Gewinn auch."): pain -> "wir halten
 * dein Geld nie" (the hinge) -> "der Gewinn gehört dir" -> hope. dusk -> dawn
 * light journey. Reuses existing section components with de copy + on-brand
 * images (DRY). Reused-component ids stay (Hero/Wedge/Demo/Fees/Waitlist) for
 * analytics continuity; net-new beats use `-de` ids. Shared shell in page.tsx.
 */
export function LandingDe() {
  return (
    <div className="main-page-wrapper">
      {/* Hero — real-photo full-bleed, dawn light */}
      <SectionErrorBoundary
        sectionId="hero-section-b2c"
        sectionType="HeroSection"
        enableReporting={true}
        context={{ page: 'landing-b2c', variant: 'cinematic', locale: 'de' }}
      >
        <div data-section-id="hero-section-b2c">
          <HeroSection
            variant="cinematic"
            config={B2C_DE_HERO_CONFIG}
            enableAnalytics={true}
            priority={true}
          />
        </div>
      </SectionErrorBoundary>

      {/* §2 Die ehrliche Lücke (the pain, 2,3%) — darkest point */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId="wedge-section-b2c"
          sectionType="WedgeSection"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale: 'de' }}
        >
          <div data-section-id="wedge-section-b2c" style={{ backgroundColor: 'var(--section-bg-dark)' }}>
            <WedgeSection enableAnalytics={true} />
          </div>
        </SectionErrorBoundary>
      </ScrollReveal>

      {/* §3 Wir halten dein Geld nie (the hinge) — first dawn light */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId="neverhold-section-de"
          sectionType="ProseSection"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale: 'de' }}
        >
          <div id="wir-halten-nie" data-section-id="neverhold-section-de">
            <ProseSection config={B2C_DE_NEVERHOLD_CONFIG} enableAnalytics={true} />
          </div>
        </SectionErrorBoundary>
      </ScrollReveal>

      {/* §4 Der Gewinn gehört dir (fairness clincher) — morning building */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId="upside-section-de"
          sectionType="ProseSection"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale: 'de' }}
        >
          <div id="der-gewinn" data-section-id="upside-section-de">
            <ProseSection config={B2C_DE_UPSIDE_CONFIG} enableAnalytics={true} headingLevel="h2" />
          </div>
        </SectionErrorBoundary>
      </ScrollReveal>

      {/* §5 Stell dir ein paar Jahre vor (the peak) — full golden dawn */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId="picture-future-section-de"
          sectionType="ProseSection"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale: 'de' }}
        >
          <div id="stell-dir-vor" data-section-id="picture-future-section-de">
            <ProseSection config={B2C_DE_PICTUREFUTURE_CONFIG} enableAnalytics={true} headingLevel="h2" />
          </div>
        </SectionErrorBoundary>
      </ScrollReveal>

      {/* §6 So funktioniert es (3 Schritte + Ausstiegstür) — clear day. Hero CTA target. */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId="how-it-works-de"
          sectionType="ProseSection"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale: 'de' }}
        >
          <div id="so-funktioniert" data-section-id="how-it-works-de">
            <ProseSection config={B2C_DE_HOWITWORKS_CONFIG} enableAnalytics={true} headingLevel="h2" />
          </div>
        </SectionErrorBoundary>
      </ScrollReveal>

      {/* §7 Wo ist der Haken? (the honest letter) — paper-and-ink */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId="catch-section-de"
          sectionType="ProseSection"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale: 'de' }}
        >
          <div id="haken" data-section-id="catch-section-de">
            <ProseSection config={B2C_DE_CATCH_CONFIG} enableAnalytics={true} headingLevel="h2" />
          </div>
        </SectionErrorBoundary>
      </ScrollReveal>

      {/* §8 Glaub uns nicht einfach (Demo) — brand bg */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId="demo-section-b2c"
          sectionType="DemoLauncher"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale: 'de' }}
        >
          <div id="demo" data-section-id="demo-section-b2c" style={{ backgroundColor: 'var(--section-bg-brand)' }}>
            <DemoLauncher config={B2C_DE_DEMO_CONFIG} enableAnalytics={true} />
          </div>
        </SectionErrorBoundary>
      </ScrollReveal>

      {/* §9 Was es kostet — neutral bg. Lean mode: first 3 rows; expanding reveals
          the rest + the "See the numbers" comparison chart (FeeTable expandedSlot). */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId="fees-section-b2c"
          sectionType="FeeTable"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale: 'de' }}
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

      {/* §10 Gebaut von Bar (the founder story) — warm */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId="founder-section-de"
          sectionType="ProseSection"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale: 'de' }}
        >
          <div id="founder" data-section-id="founder-section-de">
            <ProseSection config={B2C_DE_FOUNDER_CONFIG} enableAnalytics={true} headingLevel="h2" />
          </div>
        </SectionErrorBoundary>
      </ScrollReveal>

      {/* §10b Mach mit (final CTA) — waitlist, placed ABOVE the FAQ */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId="waitlist-section-b2c"
          sectionType="WaitlistSection"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale: 'de' }}
        >
          <div id="waitlist" data-section-id="waitlist-section-b2c">
            <WaitlistSection enableAnalytics={true} config={B2C_DE_WAITLIST_CONFIG} />
          </div>
        </SectionErrorBoundary>
      </ScrollReveal>

      {/* §11 Objections — FAQ accordion (trailing reference, below the CTA) */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId="faq-section-b2c"
          sectionType="FAQAccordion"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale: 'de' }}
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
