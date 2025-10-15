# diBoaS Platform

Unified Financial Services Platform - A comprehensive solution for banking, investing, and DeFi management.

## Overview

diBoaS Platform is a modern financial services application built with Next.js 15, React 18, and TypeScript. It provides an integrated experience for users to manage traditional banking, investments, and decentralized finance (DeFi) in one place.

## Features

- **Multi-language Support**: English, Portuguese (BR), Spanish, and German
- **Banking Services**: Traditional banking features and account management
- **Investment Tools**: Stock trading, portfolio management, and investment strategies
- **Cryptocurrency & DeFi**: Crypto trading and DeFi strategy management
- **Educational Content**: Financial literacy and learning resources
- **Rewards Program**: User engagement and loyalty rewards
- **Business Solutions**: B2B financial services

## Tech Stack

- **Framework**: Next.js 15.5.3 (App Router)
- **UI Library**: React 18.3.1
- **Language**: TypeScript 5.2.2
- **Styling**: Tailwind CSS 3.4.17, CSS Custom Properties
- **Monorepo**: Turborepo 2.5.8
- **Package Manager**: pnpm 8.15.0
- **Internationalization**: react-intl 6.4.7
- **Component Development**: Storybook 9.1.10
- **UI Components**: Radix UI, React Aria

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: >= 18.0.0 ([Download](https://nodejs.org/))
- **pnpm**: >= 8.0.0

### Installing pnpm

If you don't have pnpm installed:

```bash
# Using npm
npm install -g pnpm

# Using Homebrew (macOS)
brew install pnpm

# Using Corepack (recommended)
corepack enable
corepack prepare pnpm@8.15.0 --activate
```

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd diboas-platform
```

### 2. Install Dependencies

Install all dependencies for the monorepo:

```bash
pnpm install
```

This will install dependencies for:
- The root workspace
- The web application (`apps/web`)
- Shared packages (`@diboas/i18n`, `@diboas/ui`)

### 3. Generate Design Tokens

Generate CSS variables from design tokens:

```bash
pnpm run generate:design-tokens
```

## Development

### Start Development Server

Run the entire monorepo in development mode:

```bash
pnpm run dev
```

Or run specific applications:

```bash
# Web application only
pnpm run dev:web

# Web app on specific port
cd apps/web
pnpm dev
```

The application will be available at:
- **Local**: http://localhost:3000
- **Default locale**: http://localhost:3000/en

### Available Locales

- `/en` - English
- `/pt-BR` - Portuguese (Brazil)
- `/es` - Spanish
- `/de` - German

## Project Structure

```
diboas-platform/
├── apps/
│   └── web/                 # Next.js web application
│       ├── src/
│       │   ├── app/         # Next.js App Router
│       │   ├── components/  # React components
│       │   ├── config/      # Configuration files
│       │   ├── lib/         # Utilities and services
│       │   └── styles/      # Global styles
│       └── public/          # Static assets
├── packages/
│   ├── i18n/               # Internationalization package
│   └── ui/                 # Design system components
├── config/
│   └── design-tokens.json  # Design token definitions
├── images/                 # Image assets
├── docs/                   # Documentation
└── scripts/                # Build scripts
```

## Available Scripts

### Root Level

```bash
# Development
pnpm run dev              # Start all apps in dev mode
pnpm run dev:web          # Start web app only
pnpm run dev:app          # Start mobile app (future)
pnpm run dev:business     # Start business app (future)

# Building
pnpm run build            # Build all apps
pnpm run type-check       # Type check all packages

# Linting & Testing
pnpm run lint             # Lint all packages
pnpm run test             # Run tests

# Design Tokens
pnpm run validate:design-tokens   # Validate token schema
pnpm run generate:design-tokens   # Generate CSS from tokens

# Quality Assurance
pnpm run performance:audit        # Run Lighthouse audits
pnpm run accessibility:audit      # Run accessibility tests
pnpm run security:audit          # Run security audit
```

### Web Application

```bash
cd apps/web

# Development
pnpm dev                  # Start dev server
pnpm build                # Build for production
pnpm start                # Start production server

# Code Quality
pnpm lint                 # Lint code
pnpm type-check           # Type check

# Bundle Analysis
pnpm run analyze          # Analyze bundle size
pnpm run analyze-server   # Analyze server bundle
pnpm run analyze-browser  # Analyze browser bundle

# Component Development
pnpm run storybook        # Start Storybook
pnpm run build-storybook  # Build Storybook
```

## Environment Variables

Create a `.env.local` file in `apps/web/`:

```bash
# Optional: Set environment
NODE_ENV=development

# Optional: Enable bundle analysis
ANALYZE=false

# Optional: Bundle analysis target
BUNDLE_ANALYZE=browser
```

## Component Development

This project uses Storybook for component development:

```bash
cd apps/web
pnpm run storybook
```

Open http://localhost:6006 to view the component library.

## Design System

The project uses a design token system for consistent styling:

1. **Define tokens**: Edit `config/design-tokens.json`
2. **Validate tokens**: `pnpm run validate:design-tokens`
3. **Generate CSS**: `pnpm run generate:design-tokens`
4. **Use tokens**: CSS variables are available in `apps/web/src/styles/design-tokens.css`

## Architecture

### Monorepo Structure

This is a Turborepo monorepo with workspace packages:

- **apps/web**: Main Next.js application
- **packages/i18n**: Shared internationalization utilities
- **packages/ui**: Shared UI component library

### Component Patterns

Components follow the **Factory Pattern** with variants:

```
HeroSection/
├── HeroSectionFactory.tsx    # Factory for dynamic loading
├── HeroSection.stories.tsx   # Storybook stories
├── index.ts                  # Public API
└── variants/                 # Different implementations
    ├── FullBackgroundVariant.tsx
    └── SplitLayoutVariant.tsx
```

### Routing

The app uses Next.js App Router with internationalization:

- **Root redirect**: `/` → `/en`
- **Locale routes**: `/[locale]/(marketing)/...`
- **Route groups**: `(marketing)` groups pages without affecting URLs

## Testing

```bash
# Run all tests
pnpm run test

# Type checking
pnpm run type-check

# Accessibility audit
pnpm run accessibility:audit

# Performance audit
pnpm run performance:audit
```

## Deployment

### Build for Production

```bash
pnpm run build
```

### Deploy to Vercel

The easiest deployment option:

1. Push your code to GitHub
2. Import project to [Vercel](https://vercel.com)
3. Vercel auto-detects Next.js and configures build settings

### Manual Deployment

```bash
# Build
cd apps/web
pnpm build

# Start production server
pnpm start
```

## Troubleshooting

### Port Already in Use

If port 3000 is already in use:

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
cd apps/web
pnpm dev -- -p 3001
```

### pnpm Install Issues

```bash
# Clear pnpm cache
pnpm store prune

# Remove node_modules and reinstall
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install
```

### Type Errors

```bash
# Rebuild packages
pnpm run build

# Check types
pnpm run type-check
```

## Documentation

Comprehensive documentation is available in the `/docs` directory:

- [Architecture](docs/architecture.md)
- [Component Patterns](docs/component-architecture-pattern.md)
- [Design System](docs/design-system.md)
- [Coding Standards](docs/coding-standards.md)
- [Security](docs/security.md)

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

### Code Standards

- Use TypeScript for type safety
- Follow ESLint configuration
- Write meaningful commit messages
- Add Storybook stories for new components
- Update documentation as needed

## License

[Your License Here]

## Support

For issues and questions:
- Create an issue in the repository
- Contact the development team

---

Built with ❤️ using Next.js and React
