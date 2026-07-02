/**
 * Unified Sections Barrel Export
 *
 * File Decoupling & Organization: Centralized section component exports
 * Code Reusability & DRY: Easy imports for all reusable sections
 *
 * Marketing-only components removed 2026-04-04:
 * FeatureShowcase, ProductCarousel, OneFeature, StickyFeaturesNav, BgHighlight, StepGuide
 */

// Core sections
export { HeroSection } from './HeroSection';
export { CinematicHeroFactory } from './CinematicHero';
export type { CinematicHeroProps, CinematicHeroCta, SceneKind, HeroTheme } from './CinematicHero';
export { AppFeaturesCarousel } from './AppFeaturesCarousel';
export { FAQAccordion } from './FAQAccordion/FAQAccordionFactory';
export { SectionContainer } from './SectionContainer';

// B2C Landing Page Sections
export { ProseSection } from './ProseSection';
export { FeeTable } from './FeeTable';
export { DemoLauncher } from './DemoLauncher';
export { ExpandableSection } from './ExpandableSection';
export { FounderSection } from './FounderSection';
// ComparisonTable is intentionally NOT re-exported here: its only barrel consumer
// (the B2B page) moved to StartupTreasurySection. The component still exists and
// is imported directly (dynamic) by the B2C spine pages (LandingEuSpine/PtBR).
export { StartupTreasurySection } from './StartupTreasurySection';
export { GoalExampleCards } from './GoalExampleCards';
export { SidePocketStrip } from './SidePocketStrip';
export { FoundingMembersSection } from './FoundingMembersSection';
export { HowItWorksGrid } from './HowItWorksGrid';

// Per-market wedge (Phase 4 redesign)
export { WedgeSection } from './WedgeSection';

// B2B Landing Page Sections
export { ScenarioCards } from './ScenarioCards';

export { TwoWorldsSection } from './TwoWorldsSection';
// HowItWorks (the visual 3-up) is intentionally NOT re-exported from this barrel
// until it is wired into a page: re-exporting a client component from the
// app-imported Sections barrel pulls its chunk into the bundle even when unused.
// Import it directly when wiring: `from '@/components/Sections/HowItWorks'`.

// Page-level Sections
export { PageHeroSection, type PageHeroSectionProps } from './PageHeroSection';

// Types
export type {
  HeroConfig,
  HeroVariantConfig,
  HeroContent,
  HeroVisualAssets,
  HeroBackgroundAssets,
  HeroSEO,
  HeroVariant,
} from './HeroSection';

export type {
  AppFeaturesCarouselConfig,
  AppFeaturesCarouselVariantConfig,
  AppFeatureCard,
  AppFeatureContent,
  AppFeatureAssets,
  AppFeatureSEO,
  AppFeaturesCarouselVariant,
} from './AppFeaturesCarousel';

export type { FAQAccordionVariantProps } from './FAQAccordion/FAQAccordionFactory';

export type {
  FAQAccordionConfig,
  FAQAccordionVariantConfig,
  FAQAccordionContent,
  FAQItem,
  FAQAccordionSettings,
  FAQAccordionSEO,
  FAQAccordionVariant,
} from '@/config/faqAccordion';

export type {
  SectionContainerProps,
  ContainerVariant,
  PaddingVariant,
  SectionElement,
} from './SectionContainer';
