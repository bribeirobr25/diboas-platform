# Project Structure Guide

> **Domain-driven monorepo architecture with shared services and centralized asset management**

## Overview

The diBoaS platform uses a domain-driven monorepo structure separating Banking, Investing, and DeFi domains with shared services, centralized assets, and multi-subdomain deployment support.

### Key Principles

**Domain-Driven Design**: Clear separation of business domains
**Single Source of Truth**: Centralized assets and configuration
**Code Reusability**: Shared packages across applications
**Type Safety**: TypeScript throughout the entire stack
**Zero Hard-Coding**: Configuration-driven development

## Directory Structure Overview

### Top-Level Organization

```
diboas-platform/
├── apps/                       # Application layer (3 subdomains)
│   ├── web/                    # Marketing site (diboas.com)
│   ├── app/                    # Main application (app.diboas.com)
│   └── business/               # Business portal (business.diboas.com)
│
├── packages/                   # Shared packages layer
│   ├── banking/                # Banking domain
│   ├── investing/              # Investing domain
│   ├── defi/                   # DeFi domain
│   ├── shared/                 # Shared utilities and asset definitions
│   ├── ui/                     # Design system components
│   ├── database/               # Prisma schema and migrations
│   └── config/                 # Configuration and content
│
├── public/assets/              # Shared assets (single source of truth)
│   ├── icons/                  # UI icons, symbols, small graphics
│   └── images/                 # Photos, illustrations, mascots, larger graphics
│       ├── mascots/            # Acqua, Mystic, Coral character assets
│       ├── logos/              # Brand logos and wordmarks
│       ├── landing/            # Landing page graphics
│       ├── navigation/         # Navigation banners
│       ├── socials/            # Social media assets
│       └── inspiration/        # Design inspiration (dev reference only)
│
├── docs/                       # Documentation
├── tools/                      # Build tools and scripts
├── configs/                    # Root configuration files
└── package.json                # Root package.json (workspace config)
```

### Application Structure

Each application (`apps/web/`, `apps/app/`, `apps/business/`) contains:
- `src/components/` - App-specific components
- `src/pages/` - Next.js pages
- `src/styles/` - App-specific styles
- `src/hooks/` - App-specific hooks
- `src/utils/` - App-specific utilities
- `public/` - App-specific static assets
- `package.json` - Dependencies
- `next.config.js` - Next.js configuration

### Package Structure

Each package contains:
- `src/services/` - Business logic and services
- `src/components/` - Domain-specific components
- `src/types/` - TypeScript type definitions
- `src/utils/` - Domain-specific utilities
- `package.json` - Package dependencies

## Application Architecture

### Multi-Subdomain Structure

**Marketing Site (apps/web/ → diboas.com)**:
- Landing pages and marketing content
- SEO-optimized static pages
- Lead generation and conversion
- Port: 3000 (development)

**Main Application (apps/app/ → app.diboas.com)**:
- Core financial platform
- User dashboard and transactions
- Mascot-guided experiences
- Port: 3001 (development)

**Business Portal (apps/business/ → business.diboas.com)**:
- B2B and enterprise features
- API documentation
- Partner integrations
- Port: 3002 (development)

### Component Reusability Strategy

**Pattern**: Shared UI components in `packages/ui/`, app-specific implementations in `apps/*/`
**Approach**: Pure UI logic in shared components, content and configuration via props
**Import**: Apps import from `@diboas/ui`, `@diboas/config`, `@diboas/shared`

## Package Organization

### Domain Packages

**Banking Package (packages/banking/)**:
- Traditional financial operations
- KYC/AML compliance logic
- Fiat currency handling
- Acqua mascot integration

**Investing Package (packages/investing/)**:
- Portfolio management
- Trading operations
- Market data integration
- Mystic mascot integration

**DeFi Package (packages/defi/)**:
- Yield strategies
- Smart contract interactions
- Protocol integrations
- Coral mascot integration

### Shared Packages

**UI Package (packages/ui/)**:
- Design system components
- Nubank-inspired styling
- Reusable UI patterns
- Mascot components

**Shared Package (packages/shared/)**:
- Common utilities
- Type definitions
- Asset management (path definitions only)
- Cross-cutting concerns

**Config Package (packages/config/)**:
- Content configuration
- Theme settings
- API configuration
- Environment constants

**Database Package (packages/database/)**:
- Prisma schema
- Migration files
- Seed data
- Database utilities

## Asset Management Strategy

### Centralized Asset Location

**Key Principle**: All physical assets stored ONLY in `/public/assets/`

**Structure**:
- `icons/` - UI icons, symbols, small graphics (< 50KB)
- `images/` - Photos, illustrations, mascots, larger graphics
  - `mascots/` - Acqua, Mystic, Coral character assets (6 variants each)
  - `logos/` - Brand logos and wordmarks
  - `landing/` - Landing page graphics
  - `navigation/` - Navigation banners
  - `socials/` - Social media assets (real-photos, drawings)
  - `inspiration/` - Design reference (NOT for production)

**Benefits**:
- Clear separation (icons vs images)
- No duplication (single source of truth)
- Type safety (TypeScript helpers prevent invalid references)
- Easy maintenance (change once, updates everywhere)

### Asset Path Management

**Path Definitions Location**: `packages/shared/src/assets/index.ts`
**Contains**: ONLY TypeScript path definitions (strings), NOT physical files
**Structure**: ASSET_PATHS object with icons, mascots, logos sections

**Helper Functions**:
- `getIconAsset(iconName)` - Type-safe icon retrieval
- `getMascotAsset(mascot, variant)` - Mascot image paths
- `getLogoAsset(type, variant)` - Logo asset paths
- `getNavigationAsset(page)` - Navigation banner paths
- `getLandingAsset(assetName)` - Landing page graphics
- `getSocialAsset(category, assetName)` - Social proof images

**No Physical Duplication**:
- Asset files exist **only once** in `/public/assets/`
- Path definitions are **just TypeScript strings**
- No files are copied or duplicated
- Changes to assets update across all apps automatically

**Usage Pattern**: Import helpers from `@diboas/shared/assets`, use in components with type safety

## Configuration Management

### Content Configuration

**Location**: `packages/config/src/content/`
**Approach**: No hard-coded values, all content in configuration files
**Structure**: Export const objects with content for hero sections, features, CTAs, etc.

### Domain Configuration

**Location**: `packages/config/src/constants/domains.ts`
**Contains**: Domain metadata (name, mascot, color, operations)
**Domains**: Banking (Acqua, #00D4AA), Investing (Mystic, #8B5CF6), DeFi (Coral, color)

## Development Workflow

### Getting Started

**Commands**:
- `npm install` - Install dependencies
- `npm run db:generate` - Generate database types
- `npm run dev` - Start all development servers
- `npm run dev:web` - Start marketing site (localhost:3000)
- `npm run dev:app` - Start main app (localhost:3001)
- `npm run dev:business` - Start business portal (localhost:3002)

### Package Development

**UI Components**: `cd packages/ui && npm run dev`
**Domain Logic**: `cd packages/banking && npm run build`
**Database Operations**: `npm run db:migrate`, `npm run db:studio`

### Import Structure

**Cross-Package Imports**:
- `@diboas/ui` - UI components
- `@diboas/shared/assets` - Asset helpers
- `@diboas/shared/types` - Type definitions
- `@diboas/config/content` - Content configuration
- `@diboas/banking` - Banking services
- `@diboas/investing` - Investing services
- `@diboas/defi` - DeFi services

## Build and Deployment

### Build Process

**Commands**:
- `npm run build:packages` - Build all packages first
- `npm run build:apps` - Build applications
- `npm run build` - Build everything

**Order**: Packages must be built before applications

### Deployment Strategy

**Multi-Subdomain Deployment**:
- `apps/web/` → diboas.com (Vercel/Netlify)
- `apps/app/` → app.diboas.com (Vercel/Railway)
- `apps/business/` → business.diboas.com (Vercel/Railway)

**Shared Assets**:
- `/public/assets/` deployed to CDN
- Asset URLs configured per environment
- Cache optimization for static assets

## Benefits of This Structure

1. **Clear Separation of Concerns**: Each domain owns its logic
2. **Maximum Reusability**: Shared components and utilities across all apps
3. **Type Safety**: TypeScript across the entire monorepo
4. **Asset Consistency**: Single source of truth for all assets
5. **Easy Maintenance**: Change once, update everywhere
6. **Independent Deployment**: Apps can be deployed separately
7. **Developer Experience**: Clear organization, tooling, and import structure
8. **Zero Duplication**: Assets and configuration centralized
9. **Configuration-Driven**: No hard-coded values, all content in config
10. **Domain-Driven Design**: Business logic organized by domain

## Summary

The diBoaS project structure provides:

1. **Domain-Driven Monorepo**: Clear separation of Banking, Investing, DeFi domains
2. **Three Applications**: Marketing (diboas.com), Main App (app.diboas.com), Business (business.diboas.com)
3. **Seven Shared Packages**: banking, investing, defi, shared, ui, database, config
4. **Centralized Asset Management**: All assets in `/public/assets/`, TypeScript path definitions only
5. **Type-Safe Asset Access**: Helper functions prevent invalid asset references
6. **Configuration-Driven Development**: All content in config packages, zero hard-coding
7. **Clear Import Structure**: `@diboas/*` aliases for cross-package imports
8. **Independent Development**: Apps and packages can be developed separately
9. **Multi-Subdomain Support**: Each app deployed to its own subdomain
10. **Build Optimization**: Packages built first, then applications

---

**For implementation details**: See architecture-condensed.md, asset-management-condensed.md, and frontend-condensed.md
