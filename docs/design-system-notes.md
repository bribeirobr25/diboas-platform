# Design System Notes — diBoaS

## System source of truth

- **Token source file(s):**
  - `apps/web/src/styles/design-tokens.css` — canonical CSS source (manually maintained, v1.1.0)
  - `config/design-tokens.json` — JSON subset (schema-validated)
  - `config/design-tokens.schema.json` — validation schema
  - Validate: `pnpm validate:design-tokens`
  - Generate: `pnpm generate:design-tokens`
- **CSS framework:** Tailwind CSS 3 + CSS custom properties from design-tokens.css
- **Component library:** Custom React components using Factory pattern with variants (in `apps/web/src/components/`). No shadcn/ui currently. Components organized as `ComponentName/ComponentNameFactory.tsx` with `variants/` subdirectory.
- **Icon set:** Custom SVG icon system — 25 icons across 5 domain themes (banking/turquoise, crypto/coral, DeFi/purple, investing/purple, neutral/currentColor). 24x24 viewBox, stroke-width 2, `currentColor` for theming. Use `@/components/UI/Icon` component — NEVER import Lucide, Hero Icons, or other external icon libraries.
- **Chart library:** Not yet standardized. Recharts available as a dependency.
- **Motion library:** CSS transitions and animations via design tokens (`--animation-duration-*`, easing curves). No Framer Motion or GSAP currently.
- **Breakpoint / responsive system:**
  - sm: 640px (mobile)
  - md: 768px (tablet)
  - lg: 1024px (laptop)
  - xl: 1280px (desktop)
  - 2xl: 1536px (large desktop)
  - Mobile-first approach — design for small screens first, scale up

## Token categories (current coverage)

- [x] Brand colors (logo, primary, primary-dark)
- [x] Accessible text colors (teal-700, emerald-600, red-600 — all WCAG AA on white)
- [x] Unified text color tokens (heading, body, secondary, on-dark, on-dark-muted)
- [x] Social platform colors
- [x] CTA button colors and dimensions
- [x] Semantic colors (via alert-* and error/success/warning overlays)
- [x] Overlay and glass effect colors
- [x] Opacity variants for text on dark backgrounds
- [x] Typography scale (desktop, tablet, mobile)
- [x] Font weights (normal, medium, semibold, bold)
- [x] Line heights (title, subtitle, description, text, prose)
- [x] Letter spacing (tight, normal, wide, wider)
- [x] Section padding (desktop, tablet, mobile + hero exceptions)
- [x] Component padding (button, card, panel)
- [x] CTA button dimensions (min-width, min-height per viewport)
- [x] Animation durations (fast 0.15s, normal 0.3s, slow 0.6s)
- [x] Animation easing curves (easeOut, easeInOut, bounce)
- [x] Z-index scale (dropdown 40, mobileMenu 50, modal 60, toast 70)
- [x] Breakpoints (sm through 2xl)
- [x] Focus ring tokens (width, color, offset)
- [x] Border radius scale (none through full — 9 stops, aligned with Tailwind xl/2xl/3xl)
- [x] Shadow scale (xs through 2xl + text shadows)
- [x] Chart/data visualization color tokens (--chart-1 through --chart-8, teal/purple/coral/amber)
- [ ] Dark mode variant tokens — NOT YET DEFINED (demo uses glass effects, not a full dark mode system)
- [x] Spacing scale (xs 4px through 8xl 96px + negative variants)
- [x] Color palette scales (teal, slate, gray, amber, purple, coral — all 50-900)
- [x] Heading scale tokens (h1-h6 desktop + mobile variants)
- [x] Small text variants (small, overline, caption)
- [x] Font family mono (JetBrains Mono)

## Reuse rules

- **Components that should always be reused:** Button (primary, secondary, outline, ghost variants with xs-xl sizes), Card (default, elevated, gradient, accent variants), Icon (with theme + size props), Badge, and all Factory-pattern components in `apps/web/src/components/`
- **Components that are still missing (need to be built):**
  - Help page components
  - Security page components
  - Goal wizard components (strategy cards, stepper, contribution calculator)
  - Formal table component (for fee comparison, billing history)
- **Ad-hoc styling patterns to avoid:**
  - Never hardcode hex colors — always reference CSS custom properties from design-tokens.css
  - Never hardcode font sizes — use the typography scale tokens
  - Never hardcode spacing — use section/component padding tokens or Tailwind utilities
  - Never import external icon libraries — use the project's Icon component
  - Never create one-off components that bypass the Factory pattern

## MCP integrations

- [ ] **shadcn MCP:** Not applicable — project uses custom component library, not shadcn/ui
- [ ] **Playwright MCP:** Recommended for visual verification. Install: `claude mcp add playwright -- npx @anthropic-ai/playwright-mcp@latest`
- [ ] **Figma MCP:** Optional — useful if designing in Figma before building. Install via Figma Dev Mode.
- [ ] **Context7 MCP:** Recommended for Next.js/Tailwind/React documentation access.

## Implementation notes

- **Dark mode strategy:** Not yet implemented for production. Demo/Dream Mode uses dark theme via glass effect tokens (`--glass-*`, `--overlay-*`). Full dark mode system is post-launch scope.
- **Theming / multi-brand notes:** Three subdomains planned: marketing (diboas.com), consumer app (app.diboas.com), business app (business.diboas.com). Marketing uses full brand spectrum; app uses functional teal-focused palette; business uses muted/professional variant.
- **Platform-specific UI conventions:** Web-first. Mobile-responsive, not mobile-native. Touch targets 44px minimum. No platform-specific patterns (no iOS/Android conventions needed until native app phase).
- **Build tool:** Next.js 16 (App Router, Turbopack)
- **Deployment target:** Vercel
- **Testing approach for UI:** Vitest + @testing-library/react for unit/integration. pa11y for WCAG AA accessibility. Lighthouse CI for performance. No visual regression testing yet (Playwright MCP would enable this).

## Component showcase

- **Showcase page URL or route:** `pnpm run storybook` (localhost:6006)
- **Component documentation location:** Storybook 9 with 34 `.stories.tsx` files covering 100% of UI components and 89% of Section components. Stories follow the pattern `ComponentName.stories.tsx` inside each component directory.

## Design reference collection

- **Reference designers:** Nubank (approachability), Linear (craft), Stripe (credibility)
- **Collected technique URLs:** None yet — collect shadow techniques, animation patterns, and typography tricks as the project evolves
- **Custom taste agent:** Not yet built — consider creating one from collected references as the design system matures
