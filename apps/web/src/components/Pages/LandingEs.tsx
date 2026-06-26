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
  B2C_ES_HERO_CONFIG,
  B2C_ES_NEVERHOLD_CONFIG,
  B2C_ES_UPSIDE_CONFIG,
  B2C_ES_PICTUREFUTURE_CONFIG,
  B2C_ES_HOWITWORKS_CONFIG,
  B2C_ES_CATCH_CONFIG,
  B2C_ES_FOUNDER_CONFIG,
  B2C_ES_DEMO_CONFIG,
  B2C_ES_WAITLIST_CONFIG,
} from '@/config/landing-b2c-es';

/**
 * LandingEs — the /es landing composition (Draper restructure, EU twin, Spain).
 *
 * Fairness-led spine ("Es tu dinero. El rendimiento también."): pain (2%) ->
 * "nunca guardamos tu dinero" (the hinge) -> "el rendimiento es para ti" -> hope.
 * dusk -> dawn light journey. Reuses existing section components with es copy +
 * on-brand images (DRY). Reused-component ids stay; net-new beats use `-es` ids.
 * The §2 wedge is reframed to the 2% bank gap (metric switched, "moneda más
 * fuerte" dropped). Shared shell in page.tsx.
 */
export function LandingEs() {
  return (
    <div className="main-page-wrapper">
      {/* Hero — real-photo full-bleed, dawn light */}
      <SectionErrorBoundary
        sectionId="hero-section-b2c"
        sectionType="HeroSection"
        enableReporting={true}
        context={{ page: 'landing-b2c', variant: 'cinematic', locale: 'es' }}
      >
        <div data-section-id="hero-section-b2c">
          <HeroSection
            variant="cinematic"
            config={B2C_ES_HERO_CONFIG}
            enableAnalytics={true}
            priority={true}
          />
        </div>
      </SectionErrorBoundary>

      {/* §2 La brecha honesta (the pain, 2%) — darkest point. Reframed wedge. */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId="wedge-section-b2c"
          sectionType="WedgeSection"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale: 'es' }}
        >
          <div data-section-id="wedge-section-b2c" style={{ backgroundColor: 'var(--section-bg-dark)' }}>
            <WedgeSection enableAnalytics={true} />
          </div>
        </SectionErrorBoundary>
      </ScrollReveal>

      {/* §3 Nunca guardamos tu dinero (the hinge) — first dawn light */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId="neverhold-section-es"
          sectionType="ProseSection"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale: 'es' }}
        >
          <div id="nunca-guardamos" data-section-id="neverhold-section-es">
            <ProseSection config={B2C_ES_NEVERHOLD_CONFIG} enableAnalytics={true} />
          </div>
        </SectionErrorBoundary>
      </ScrollReveal>

      {/* §4 El rendimiento es para ti (fairness clincher) — morning building */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId="upside-section-es"
          sectionType="ProseSection"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale: 'es' }}
        >
          <div id="el-rendimiento" data-section-id="upside-section-es">
            <ProseSection config={B2C_ES_UPSIDE_CONFIG} enableAnalytics={true} headingLevel="h2" />
          </div>
        </SectionErrorBoundary>
      </ScrollReveal>

      {/* §5 Imagina unos años (the peak) — full golden dawn */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId="picture-future-section-es"
          sectionType="ProseSection"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale: 'es' }}
        >
          <div id="imagina" data-section-id="picture-future-section-es">
            <ProseSection config={B2C_ES_PICTUREFUTURE_CONFIG} enableAnalytics={true} headingLevel="h2" />
          </div>
        </SectionErrorBoundary>
      </ScrollReveal>

      {/* §6 Cómo funciona (3 pasos + puerta de salida) — clear day. Hero CTA target. */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId="how-it-works-es"
          sectionType="ProseSection"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale: 'es' }}
        >
          <div id="como-funciona" data-section-id="how-it-works-es">
            <ProseSection config={B2C_ES_HOWITWORKS_CONFIG} enableAnalytics={true} headingLevel="h2" />
          </div>
        </SectionErrorBoundary>
      </ScrollReveal>

      {/* §7 ¿Cuál es la trampa? (the honest letter) — paper-and-ink */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId="catch-section-es"
          sectionType="ProseSection"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale: 'es' }}
        >
          <div id="la-trampa" data-section-id="catch-section-es">
            <ProseSection config={B2C_ES_CATCH_CONFIG} enableAnalytics={true} headingLevel="h2" />
          </div>
        </SectionErrorBoundary>
      </ScrollReveal>

      {/* §8 No te fíes solo de nuestra palabra (Demo) — brand bg */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId="demo-section-b2c"
          sectionType="DemoLauncher"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale: 'es' }}
        >
          <div id="demo" data-section-id="demo-section-b2c" style={{ backgroundColor: 'var(--section-bg-brand)' }}>
            <DemoLauncher config={B2C_ES_DEMO_CONFIG} enableAnalytics={true} />
          </div>
        </SectionErrorBoundary>
      </ScrollReveal>

      {/* §9 Lo que cuesta — neutral bg. Lean mode: first 3 rows; expanding reveals
          the rest + the "See the numbers" comparison chart (FeeTable expandedSlot). */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId="fees-section-b2c"
          sectionType="FeeTable"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale: 'es' }}
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

      {/* §10 Construido por Bar (the founder story) — warm */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId="founder-section-es"
          sectionType="ProseSection"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale: 'es' }}
        >
          <div id="founder" data-section-id="founder-section-es">
            <ProseSection config={B2C_ES_FOUNDER_CONFIG} enableAnalytics={true} headingLevel="h2" />
          </div>
        </SectionErrorBoundary>
      </ScrollReveal>

      {/* §10b Únete (final CTA) — waitlist, placed ABOVE the FAQ */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId="waitlist-section-b2c"
          sectionType="WaitlistSection"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale: 'es' }}
        >
          <div id="waitlist" data-section-id="waitlist-section-b2c">
            <WaitlistSection enableAnalytics={true} config={B2C_ES_WAITLIST_CONFIG} />
          </div>
        </SectionErrorBoundary>
      </ScrollReveal>

      {/* §11 Objeciones — FAQ accordion (trailing reference, below the CTA) */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId="faq-section-b2c"
          sectionType="FAQAccordion"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale: 'es' }}
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
