# Design System Notes

This is the technical reference for the design system implementation.
It tells the AI where tokens live, what components exist, and what tools to use.

---

## System source of truth

- **Token source file(s):** (e.g., `tailwind.config.ts`, `globals.css`, `tokens.ts`)
- **CSS framework:** (e.g., Tailwind CSS, vanilla CSS, CSS modules)
- **Component library:** (e.g., shadcn/ui, Radix, MUI, custom)
- **Icon set:** (e.g., Lucide, Hero Icons, Phosphor — ONE set only)
- **Icon weight/style:** (e.g., lined 1.5px stroke, filled, duotone)
- **Chart library:** (e.g., Recharts, Chart.js, D3, Plotly)
- **Motion library if any:** (e.g., Framer Motion, CSS transitions only, GSAP)
- **Breakpoint / responsive system:**
  - Mobile: (e.g., < 768px)
  - Tablet: (e.g., 768px - 1024px)
  - Desktop: (e.g., > 1024px)

## Token categories to maintain

Verify these are all defined in the token source. If any are missing, flag them.

- [ ] Color palette with tonal scales (5-7 shades per primary)
- [ ] Semantic colors (success, warning, error, info)
- [ ] Chart/data visualization colors
- [ ] Typography scale (heading sizes, body sizes, caption, overline)
- [ ] Font weights (heading weight, body weight, bold, light)
- [ ] Spacing scale (e.g., 4/8/12/16/24/32/48/64/96)
- [ ] Border radius values
- [ ] Shadow definitions (sm, md, lg, xl)
- [ ] Dark mode variant tokens
- [ ] Z-index scale

## Reuse rules

- **Components that should always be reused:** (list the ones already built)
- **Components that are still missing:** (list known gaps)
- **Ad-hoc styling patterns to avoid:** (e.g., "never use inline styles", "never hardcode colors")
- **When new components are allowed:** (only when no existing component fits AND after checking
  the component library MCP)

## MCP integrations

- [ ] **shadcn MCP:** (installed? yes/no — if using shadcn/ui, this should be installed)
- [ ] **Playwright MCP:** (installed? yes/no — required for visual verification)
- [ ] **Figma MCP:** (installed? yes/no — useful if designing in Figma first)
- [ ] **Context7 MCP:** (installed? yes/no — useful for framework documentation)

## Implementation notes

- **Dark mode strategy:** (CSS variables? Tailwind dark: prefix? class-based toggle?)
- **Theming / multi-brand notes if any:**
- **Platform-specific UI conventions if any:**
- **Build tool:** (Vite? Next.js? CRA? Remix?)
- **Deployment target:** (Vercel? Netlify? self-hosted?)
- **Testing approach for UI:** (visual regression? snapshot? manual?)

## Component showcase

If component showcase/documentation pages exist, list their location:
- **Showcase page URL or route:**
- **Component documentation location:**

If they don't exist yet, consider creating them — they serve as both human reference
and AI context for future build sessions.

## Design reference collection (optional)

Collect URLs, CodePens, articles, and tweet threads from designers whose craft you admire.
These can be fed to Claude Code to analyze techniques and apply them to your project, or
used to build a custom taste-audit agent.

- **Reference designers:** (names and what you admire about their work)
- **Collected technique URLs:** (CodePens, articles, tweet threads — specific techniques
  like shadow layering, animation patterns, typography tricks)
- **Custom taste agent:** (if you've built one — what references it draws from and where
  the agent file lives)
