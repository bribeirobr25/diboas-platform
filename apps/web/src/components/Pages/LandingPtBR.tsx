import nextDynamic from 'next/dynamic';
import { HeroSection, WedgeSection, ProseSection } from '@/components/Sections';
import { HowItWorks } from '@/components/Sections/HowItWorks';
import { B2C_PTBR_HOW_IT_WORKS_VISUAL_CONFIG } from '@/config/howItWorks';

// Below-fold sections: code-split to keep the initial bundle lean.
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
  B2C_PTBR_HERO_CONFIG,
  B2C_PTBR_WHATIS_CONFIG,
  B2C_PTBR_IMAGINE_CONFIG,
  B2C_PTBR_TRUST_CONFIG,
  B2C_PTBR_ADELAIDE_CONFIG,
  B2C_PTBR_DEMO_CONFIG,
  B2C_PTBR_WAITLIST_CONFIG,
} from '@/config/landing-b2c-ptbr';

/**
 * LandingPtBR — the pt-BR landing composition (Draper restructure).
 *
 * Hope-led spine ("O seu trabalho merece um futuro"), a dusk -> dawn light
 * journey, and the lean section order from LANDING_CONTENT_RESTRUCTURE.md COPY
 * FINAL. Reuses the existing section components with pt-BR copy + on-brand
 * documentary images (DRY). Modified-but-same-meaning sections keep their base
 * `data-section-id` (Hero/Wedge/Demo/Fees/Waitlist) for analytics continuity;
 * net-new beats use `-ptbr` ids (per-locale disambiguation rides the event
 * `locale` dimension). The shared shell (providers, JSON-LD, footer, sticky CTA)
 * lives in page.tsx and wraps this composition.
 */
export function LandingPtBR() {
  return (
    <div className="main-page-wrapper">
      {/* Hero — real-photo full-bleed, dawn light (no WebGL). Above fold: no reveal. */}
      <SectionErrorBoundary
        sectionId="hero-section-b2c"
        sectionType="HeroSection"
        enableReporting={true}
        context={{ page: 'landing-b2c', variant: 'cinematic', locale: 'pt-BR' }}
      >
        <div data-section-id="hero-section-b2c">
          <HeroSection
            variant="cinematic"
            config={B2C_PTBR_HERO_CONFIG}
            enableAnalytics={true}
            priority={true}
          />
        </div>
      </SectionErrorBoundary>

      {/* §2 A verdade (the pain, 63%) — darkest point */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId="wedge-section-b2c"
          sectionType="WedgeSection"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale: 'pt-BR' }}
        >
          <div
            data-section-id="wedge-section-b2c"
            style={{ backgroundColor: 'var(--section-bg-dark)' }}
          >
            <WedgeSection enableAnalytics={true} />
          </div>
        </SectionErrorBoundary>
      </ScrollReveal>

      {/* §3 O que é o diBoaS (cofre) — first dawn light */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId="whatis-section-ptbr"
          sectionType="ProseSection"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale: 'pt-BR' }}
        >
          <div id="o-que-e" data-section-id="whatis-section-ptbr">
            <ProseSection config={B2C_PTBR_WHATIS_CONFIG} enableAnalytics={true} />
          </div>
        </SectionErrorBoundary>
      </ScrollReveal>

      {/* §4 Imagine o futuro (the peak) — full golden dawn */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId="imagine-section-ptbr"
          sectionType="ProseSection"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale: 'pt-BR' }}
        >
          <div id="imagine" data-section-id="imagine-section-ptbr">
            <ProseSection config={B2C_PTBR_IMAGINE_CONFIG} enableAnalytics={true} />
          </div>
        </SectionErrorBoundary>
      </ScrollReveal>

      {/* §5 Como funciona (3 passos + porta de saída) — clear day. Hero CTA target. */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId="how-it-works-ptbr"
          sectionType="HowItWorks"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale: 'pt-BR' }}
        >
          <div id="como-funciona" data-section-id="how-it-works-ptbr">
            <HowItWorks config={B2C_PTBR_HOW_IT_WORKS_VISUAL_CONFIG} enableAnalytics={true} />
          </div>
        </SectionErrorBoundary>
      </ScrollReveal>

      {/* §6 E se der errado? (the honest letter) — paper-and-ink */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId="trust-section-ptbr"
          sectionType="ProseSection"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale: 'pt-BR' }}
        >
          <div id="confianca" data-section-id="trust-section-ptbr">
            <ProseSection config={B2C_PTBR_TRUST_CONFIG} enableAnalytics={true} headingLevel="h2" />
          </div>
        </SectionErrorBoundary>
      </ScrollReveal>

      {/* §7 Veja com seus olhos (Demo) — brand bg */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId="demo-section-b2c"
          sectionType="DemoLauncher"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale: 'pt-BR' }}
        >
          <div
            id="demo"
            data-section-id="demo-section-b2c"
            style={{ backgroundColor: 'var(--section-bg-brand)' }}
          >
            <DemoLauncher config={B2C_PTBR_DEMO_CONFIG} enableAnalytics={true} />
          </div>
        </SectionErrorBoundary>
      </ScrollReveal>

      {/* §8 Quanto custa (recibo honesto) — neutral bg */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId="fees-section-b2c"
          sectionType="FeeTable"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale: 'pt-BR' }}
        >
          <div
            id="fees"
            data-section-id="fees-section-b2c"
            style={{ backgroundColor: 'var(--section-bg-neutral)' }}
          >
            {/* Lean mode: 3 primeiras linhas; ao expandir mostra o resto + o
                gráfico "Veja os números" (expandedSlot da FeeTable). */}
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

      {/* §9 A Adelaide (the founder story) — warm, intimate */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId="adelaide-section-ptbr"
          sectionType="ProseSection"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale: 'pt-BR' }}
        >
          <div id="adelaide" data-section-id="adelaide-section-ptbr">
            <ProseSection
              config={B2C_PTBR_ADELAIDE_CONFIG}
              enableAnalytics={true}
              headingLevel="h2"
            />
          </div>
        </SectionErrorBoundary>
      </ScrollReveal>

      {/* §9b Comece com R$10 (final CTA) — waitlist, ACIMA do FAQ */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId="waitlist-section-b2c"
          sectionType="WaitlistSection"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale: 'pt-BR' }}
        >
          <div id="waitlist" data-section-id="waitlist-section-b2c">
            <WaitlistSection enableAnalytics={true} config={B2C_PTBR_WAITLIST_CONFIG} />
          </div>
        </SectionErrorBoundary>
      </ScrollReveal>

      {/* §10 Objeções — FAQ em acordeão (referência final, abaixo do CTA) */}
      <ScrollReveal>
        <SectionErrorBoundary
          sectionId="faq-section-b2c"
          sectionType="FAQAccordion"
          enableReporting={true}
          context={{ page: 'landing-b2c', locale: 'pt-BR' }}
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
