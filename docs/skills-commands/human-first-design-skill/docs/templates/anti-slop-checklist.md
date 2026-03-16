# Anti-Slop Checklist

This is the canonical anti-pattern and review list for the project.
If `CLAUDE.md` and this file differ on anti-patterns, this file wins.

Run this checklist after every UI build or modification. Reject or refine if you see any
of these patterns. Check each item — leave unchecked items as known issues to address.

---

## Visual slop

- [ ] Default purple/blue startup gradients or shiny AI orbs
- [ ] Gradient profile circles with initials used as decoration
- [ ] Pure black (#000) or pure white (#FFF) used instead of palette-derived neutrals
- [ ] Repeated KPI strips showing the same data in multiple places
- [ ] Card soup — too many cards with equal visual weight and no hierarchy
- [ ] Mixed icon families or inconsistent icon weights within the same view
- [ ] Emoji used as core UI icons or visual language
- [ ] Empty charts or decorative analytics that communicate nothing real
- [ ] Too much border-radius on everything with no variation
- [ ] Hierarchy created only by colored boxes instead of typography + spacing
- [ ] One generic layout template repeated across screens with different content
- [ ] Floating action buttons or modals where inline action would be clearer
- [ ] Five pricing tiers when three or four would suffice
- [ ] Landing page icon grids where product screenshots would be more convincing
- [ ] "Welcome to [App Name]" as a heading
- [ ] Excessive padding/whitespace that wastes space without improving readability
- [ ] Over-saturated, evenly-distributed color palette with no dominant/accent hierarchy
- [ ] Tech-bro gradients (purple-blue-teal sphere fading to edges) on any surface

## Typography slop

- [ ] Inter, Roboto, Arial, or system-ui used as the primary font
- [ ] Same font size used for headings and body text
- [ ] No letter-spacing adjustments (large text too loose, small text too tight)
- [ ] No line-height variation between headings and body
- [ ] Proportional fonts used for numerical data columns (should be tabular-nums or mono)
- [ ] Generic sans-serif with no character or distinctiveness

## Interaction slop

- [ ] Motion with no communicative purpose — decoration-only animation
- [ ] Missing hover states on interactive elements
- [ ] Missing focus states (or using browser default focus ring without styling)
- [ ] Missing active/pressed states on buttons
- [ ] Missing disabled states
- [ ] Instant page transitions where subtle slide or fade would feel better
- [ ] Generic spinner where a contextual loading message would help
- [ ] Blank screen during data loading instead of skeleton screen
- [ ] No feedback for success or error actions
- [ ] No mobile or tablet responsive consideration
- [ ] Sound effects without user opt-in
- [ ] Linear easing on animations (feels robotic)
- [ ] Animations longer than 500ms (feels sluggish)

## Content slop

- [ ] Lorem ipsum, "Acme Inc", or obvious placeholder copy
- [ ] Fake metrics, fake workflows, fake pricing, or hallucinated features
- [ ] Labels or terminology that don't match the actual product domain
- [ ] Repeated information with no added value across the page
- [ ] Sparse modals or forms that waste available space
- [ ] Long content, extreme values, or edge cases that obviously break the layout
- [ ] Invented product capabilities or claims not supported by the brand brief
- [ ] Content presented as fact when it should be labeled "illustrative"

## Quality and trust issues

- [ ] Text contrast below 4.5:1 ratio
- [ ] Large text or UI component contrast below 3:1 ratio
- [ ] Tap targets smaller than 44x44px on touch devices
- [ ] Ambiguous CTA hierarchy (unclear what the primary action is)
- [ ] Ad-hoc styling instead of design system token/component reuse
- [ ] Design choices that feel directly copied rather than referenced
- [ ] Platform conventions ignored for the target platform
- [ ] UI that implies product capabilities not actually supported
- [ ] Missing semantic heading hierarchy
- [ ] Interactive elements not keyboard-reachable

---

## State audit for this project

Fill these in as you build. Each major page or component should account for these states.

- **Empty state notes:**
- **Loading state notes:**
- **Error state notes:**
- **Success state notes:**
- **Disabled state notes:**
- **Content edge case notes:** (long text, one item, zero items, extreme values)
- **Locale/i18n notes:** (text expansion, RTL, character sets)

## Collapse-and-elevate notes for this project

Update these as you review pages.

- **What should be collapsed:** (busy elements that need simplification)
- **What should be elevated:** (hidden or under-emphasized useful information)
- **What should be removed:** (decorative elements with no utility)
- **What should be consolidated:** (duplicated information)

## Human touch audit for this project

Track which craft details have been applied.

- [ ] Textured or off-white backgrounds (not pure flat white)
- [ ] Soft, natural shadows (not flat or harsh)
- [ ] Custom focus rings in brand color
- [ ] Custom selection highlight color
- [ ] Contextual loading messages (not just spinners)
- [ ] Thoughtful empty states (not just "No data")
- [ ] Helpful error messages (not just "Error occurred")
- [ ] Staggered reveal on page load
- [ ] Subtle page transition animation
- [ ] Button press feedback animation
- [ ] Typography fine-tuning (letter-spacing, line-height, font-features)

## Project-specific notes

Add any project-specific anti-patterns or review criteria here:

-
-
-
