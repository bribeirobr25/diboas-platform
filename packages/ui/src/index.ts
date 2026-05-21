// @diboas/ui - Design System Exports
// Export all primitives
export { Button, type ButtonProps, buttonVariants } from './primitives/Button';
export { Select, type SelectProps, selectVariants } from './primitives/Select';

// Export utilities
export { cn } from './utils/cn';

// TODO: Candidates for promotion from apps/web/src/components/UI/ to @diboas/ui:
//
// High-priority (used across 10+ files):
//   - LucideIcon (icon wrapper + named re-exports) — used in 20+ components
//   - Container — layout primitive used in navigation, pages
//   - FlexBetween — layout primitive used in navigation, headers
//   - LocaleLink — locale-aware link used in navigation, footer, CTAs
//   - CTAButtonLink — CTA button used across sections
//   - CarouselDots — reusable carousel indicator used in 4+ carousels
//
// Medium-priority (used across 3-5 files):
//   - ContentCard — card layout for legal/info content
//   - CurrencyInput — formatted currency input field
//   - SocialIcons — social media icon components (Instagram, X, YouTube, LinkedIn)
//   - ScrollReveal — intersection-observer reveal animation wrapper
//
// Low-priority (page-specific or recently added):
//   - StrategyCard — strategy display card
//   - StickyMobileCTA — sticky mobile call-to-action bar