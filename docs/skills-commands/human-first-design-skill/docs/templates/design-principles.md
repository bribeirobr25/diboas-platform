# Design Principles

These are the concrete implementation rules for UI work in this project.
When `CLAUDE.md` needs specifics about how to implement a visual decision, it defers to this file.

---

## Product feeling

- **Primary emotional outcome:**
- **Secondary emotional outcome:**
- **What it must NOT feel like:**
- **The "one thing" someone should remember about this interface:**

## Audience and context

- **Primary user:**
- **Their context of use:** (mobile on the go? desktop at work? evening on couch?)
- **Their pressure or pain:**
- **Their technical comfort level:**
- **What they are comparing us to:**

## Visual direction

- **Chosen aesthetic direction:** (e.g., "warm minimal", "editorial clean", "analog-digital hybrid")
- **What to borrow from references:**
- **What to avoid copying:**
- **Distinctive visual hook if any:**
- **2026 trend positioning:** (e.g., lean human-touch over tech-bro gradient, prefer grounded
  colors over neon, texture over flat)

## Typography rules

- **Display font:** (for headings and large text)
- **Body font:** (for paragraphs, labels, UI copy)
- **Numeric/data font:** (for prices, stats, percentages — monospace recommended)
- **Type scale:** (list your heading and body sizes)
- **Heading weight:**
- **Body weight:**
- **Letter-spacing rules:**
  - Large headings: (tighter, e.g., -0.02em)
  - Body text: (normal or slightly wider)
  - Small text / labels: (wider, e.g., 0.02-0.05em)
  - All-caps text: (always wider)
- **Line-height rules:**
  - Headings: (tighter, e.g., 1.2-1.3)
  - Body: (looser, e.g., 1.5-1.6)
- **Font feature settings:** (tabular-nums for data columns, ligatures for body)
- **Explicit font bans:** (e.g., "never use Inter, Roboto, Arial, or system-ui as primary")

## Color rules

- **Primary:**
- **Secondary:**
- **Accent:**
- **Neutral system:** (derived from dominant hue — warm neutrals for warm brands, cool for cool)
- **Semantic colors:**
  - Success:
  - Warning:
  - Error:
  - Info:
- **Chart/data visualization colors:**
- **Dark mode notes:**
- **Opacity rules for hierarchy:** (e.g., headings at 100%, body at 85%, secondary at 60%)
- **Explicit bans:**
  - Never use pure black (#000000) — use darkest palette color instead
  - Never use pure white (#FFFFFF) — use lightest palette color instead
  - Never use purple/blue/teal gradient orbs or spheres
  - (add project-specific bans here)

## Layout rules

- **Density:** (spacious? compact? depends on context?)
- **Preferred whitespace level:** (generous / moderate / tight)
- **Card usage rules:** (when to use cards, when to use flat sections, max cards per view)
- **Sidebar / nav rules:**
- **Table rules:**
- **Chart usage rules:** (when charts are needed, chart types preferred, chart color system)
- **Repetition to avoid:** (e.g., "never show the same KPI in multiple places on one page")
- **Maximum sections per page:** (optional — prevents endless scrolling)
- **Responsive priorities:**
  - Mobile breakpoint:
  - Tablet breakpoint:
  - Desktop breakpoint:
  - What changes between breakpoints (layout, not just scaling):
- **Platform conventions:** (iOS conventions? Material Design? web-specific?)

## Interaction rules

- **Motion philosophy:** (purposeful only / subtle delight / energetic / minimal)
- **Required motion:**
  - Page transitions: (slide, fade, none — specify duration)
  - Loading states: (contextual message + indicator, skeleton screen, spinner)
  - Button press feedback: (scale, color shift, ripple)
  - Hover states: (every interactive element must respond)
  - Focus rings: (styled to match design system, not browser default)
- **Recommended motion:**
  - Staggered reveals on page load
  - Number/value transitions (animate between values)
  - Modal appearance (scale + fade)
  - Scroll-triggered reveals for long content
- **Motion duration guidelines:**
  - Micro-interactions: (150-300ms recommended)
  - Page transitions: (300-500ms recommended)
  - Easing: (ease-out for entrances, ease-in for exits)
- **Motion bans:**
  - Never use linear easing
  - Never exceed 500ms for a single transition
  - Never animate purely for decoration
  - Never add sound without user opt-in
- **Empty state expectations:** (illustration + helpful message? minimal text? suggested action?)
- **Success / error expectations:** (toast? inline? modal? duration?)
- **Fine-tuning approach:** (use Leva/Tweakpane control panels for interactive parameter
  tuning? build effects in isolation playgrounds before integrating?)

## Content rules

- **Tone of UI copy:** (first person? friendly? direct? warm? professional?)
- **Voice example:** (write a sample button label, error message, and empty state in the voice)
- **Sample data realism rules:** (must feel believable for the domain)
- **What must never be fabricated:** (features, pricing, metrics, testimonials, regulatory claims)
- **Labels / terminology conventions:** (domain-specific terms, what to call things)
- **Edge-case content to account for:**
  - Long names / titles:
  - Empty data:
  - Single-item lists:
  - Extreme numerical values:
  - Multi-locale text expansion:

## Accessibility rules

- **Contrast expectations:** (4.5:1 minimum for normal text, 3:1 for large text and UI)
- **Tap target / spacing expectations:** (44x44px minimum on touch devices)
- **Focus visibility expectations:** (visible focus ring on every interactive element)
- **Keyboard navigation notes:**
- **Screen reader considerations:**
- **Inclusive imagery / language notes:**
- **Regulatory accessibility requirements if any:**

## Human touch rules

Include at least 2-3 of these per major page to signal craft:

- **Texture:** (noise/grain on backgrounds? paper-like surfaces? soft shadows?)
- **Imperfection:** (hand-drawn accents? slightly organic shapes? not-quite-perfect alignment?)
- **Warmth:** (off-white instead of white? warm shadows? rounded but not over-rounded?)
- **Typography craft:** (optical alignment on large text? pull quotes with subtle styling?)
- **Detail:** (custom scrollbars? brand-colored selection highlights? thoughtful empty states?)
- **Project-specific human touches:**

## Build rules

- **Existing components to prefer:**
- **When new components are allowed:**
- **Refactor expectations for ad-hoc UI:** (always refactor back into the system)
- **Token / system source reference:** (file path to design tokens)
- **Component documentation location:** (file path or URL)
