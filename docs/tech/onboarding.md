# Developer Onboarding

New developer guide for the diBoaS platform. For the canonical architecture reference, see `CLAUDE.md` at the repository root -- it is the single source of truth for project standards, conventions, and architecture.

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Build shared packages (required before first dev run)
pnpm dev:fresh

# 3. Start the web app dev server (port 3000)
pnpm dev:web

# 4. Start Storybook (port 6006)
pnpm --filter web storybook
```

Verify at `http://localhost:3000/en` -- you should see the B2C landing page with waitlist signup.

## Project Overview

diBoaS is a fintech platform currently in **pre-launch/waitlist** phase. The web app is a Next.js 16 marketing site with waitlist functionality. No production banking features are live.

The monorepo uses Turborepo + pnpm workspaces:

| Workspace | Purpose |
|-----------|---------|
| `apps/web` | Next.js web application (the only app) |
| `packages/i18n` | Internationalization (react-intl, 4 locales) |
| `packages/ui` | Shared design system components |
| `packages/email` | Email service (Resend) |

For the full architecture diagram and App Router structure, see `CLAUDE.md` > Architecture.

## Key Architecture Decisions

- **App Router with route group**: `(landing)` organizes pages under `[locale]/`
- **i18n**: react-intl with 4 locales (en, pt-BR, es, de). Reference locale is `en`
- **Design tokens**: CSS custom properties in `apps/web/src/styles/design-tokens.css`
- **Component pattern**: Factory pattern with variant directories (see `CLAUDE.md` > Component Pattern)
- **Icons**: Always use the project `LucideIcon` component (`@/components/UI/LucideIcon`), never import `lucide-react` directly

## Development Workflow

1. Branch from `main` (or the current working branch like `pre-launch`)
2. Make changes following the conventions in `CLAUDE.md` > Coding Standards
3. Run the full validation pipeline before opening a PR:
   ```bash
   pnpm validate:all    # type-check -> lint -> test -> build -> tokens -> translations
   ```
4. Open a PR against `main`. Vercel auto-deploys from `main`.

## Where to Find Things

| What | Where |
|------|-------|
| Page routes | `apps/web/src/app/[locale]/` |
| Section components | `apps/web/src/components/Sections/` |
| UI primitives | `apps/web/src/components/UI/` |
| Page configs | `apps/web/src/config/` (e.g., `landing-b2c.ts`) |
| Translation files | `packages/i18n/translations/{locale}/` |
| Design tokens (CSS) | `apps/web/src/styles/design-tokens.css` |
| API routes | `apps/web/src/app/api/` |
| Hooks | `apps/web/src/hooks/` |
| Utilities | `apps/web/src/lib/` |

## Common Tasks

### Add a translation string

1. Add the key and English text to the relevant JSON file in `packages/i18n/translations/en/`
2. Add the same key with translated text to `pt-BR/`, `es/`, and `de/` files
3. Run `pnpm validate:translations` to verify parity across all locales
4. German text is ~30% longer than English -- verify components handle text expansion

### Create a new section component

Follow the Factory pattern:

```
apps/web/src/components/Sections/MySection/
  MySectionFactory.tsx      # Variant selector
  MySection.stories.tsx     # Storybook story
  index.ts                  # Barrel export
  variants/
    MySectionDefault/
      MySectionDefault.tsx
      index.ts
```

Register the component in `apps/web/src/components/Sections/index.ts`.

### Add an API route

Create a `route.ts` file under `apps/web/src/app/api/{endpoint}/`. All mutation endpoints require rate limiting (Upstash Redis) and CSRF protection. See existing routes in `api/waitlist/` for patterns.

## Testing

- **Framework**: Vitest + @testing-library/react
- **Run tests**: `pnpm test` (all workspaces) or `pnpm --filter web test:watch`
- **Coverage targets**: 80% for `lib/` and `hooks/`, 60% for components, 100% for security utils
- See `CLAUDE.md` > Testing Requirements for naming conventions and details

## Storybook

```bash
pnpm --filter web storybook          # Dev server on port 6006
pnpm --filter web build-storybook    # Build for deployment
```

Stories go alongside their component (e.g., `MySection.stories.tsx`). Use existing stories as templates.

## Quality Commands

| Command | Purpose |
|---------|---------|
| `pnpm type-check` | TypeScript strict mode check |
| `pnpm lint` | ESLint across all workspaces |
| `pnpm test` | Vitest across all workspaces |
| `pnpm build` | Production build |
| `pnpm format` | Prettier formatting |
| `pnpm validate:all` | Full pipeline (run before PRs) |

## Further Reading

- `CLAUDE.md` -- canonical project reference (architecture, conventions, all standards)
- `docs/tech/design-system.md` -- design tokens and component styling
- `docs/tech/internationalization.md` -- i18n patterns and locale management
- `docs/tech/security.md` -- security implementation details
- `docs/tech/asset-management.md` -- image assets and optimization
- `docs/tech/infrastructure.md` -- deployment and hosting
- `docs/tech/frontend.md` -- frontend patterns and performance
