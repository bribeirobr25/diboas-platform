# Asset Management System

> **Centralized asset organization, type-safe path management, and zero duplication strategy**

## Overview

Complete asset management framework ensuring single source of truth, type safety, zero duplication, and optimized performance across the diBoaS platform.

## Core Principles

### Single Source of Truth

**Physical Files**: All assets stored in `/public/assets/` directory only
**Path Definitions**: TypeScript path definitions in `packages/shared/src/assets/index.ts`
**Zero Duplication**: No physical file copying, only TypeScript imports
**Type Safety**: Helper functions prevent invalid asset references

### Key Architecture Decisions

**Separation of Concerns**:
- Physical Assets: `/public/assets/` (actual files)
- TypeScript Definitions: `packages/shared/src/assets/` (ONLY code, NO files)
- Import Pattern: Import helpers, not paths directly

**Benefits**:
- Single change updates all references
- TypeScript catches broken references at compile time
- Consistent asset paths across all apps
- Simplified asset updates and maintenance

## Directory Structure

### Top-Level Organization

```
public/assets/
├── icons/          # UI elements (< 50KB)
├── images/         # Visual content (photos, illustrations)
    ├── mascots/    # Acqua, Mystic, Coral variants
    ├── logos/      # Primary, icon, B2B variants
    ├── landing/    # Hero graphics, feature visuals
    ├── navigation/ # Page banners and headers
    ├── socials/    # Real photos and drawings
    └── inspiration/ # Design reference (NOT in production)
```

### Icons Directory

**Purpose**: Small UI elements, decorative icons, interface components
**Size Guidelines**: < 50KB per icon
**Format Priority**: SVG (preferred), PNG (fallback)
**Examples**: Arrow icons, social media icons, payment method icons

### Images Directory

**Mascots Subdirectory**:
- Three mascots: Acqua (banking), Mystic (investing), Coral (DeFi)
- Variants: default, thinking, celebrating, explaining, happy, confused
- Format: AVIF (primary), WebP (fallback), PNG (legacy)

**Logos Subdirectory**:
- Types: primary (full logo), icon (compact), b2b (business)
- Variants: light theme, dark theme
- Format: SVG (scalable), PNG (raster fallback)

**Landing Subdirectory**:
- Hero section graphics
- Feature showcase visuals
- Product carousel images
- Marketing page assets

**Navigation Subdirectory**:
- Page-specific banners
- Domain headers (banking, investing, strategy)
- Contextual navigation visuals

**Socials Subdirectory**:
- Categories: real-photos, drawings
- Use cases: Testimonials, team photos, social proof
- Format: AVIF → WebP → JPG

**Inspiration Subdirectory** (NOT in production):
- Design references and mood boards
- Excluded from builds
- Development-only reference

## Path Definition System

### TypeScript-Only Approach

**Location**: `packages/shared/src/assets/index.ts`
**Contains**: ONLY TypeScript code, NO physical files
**Purpose**: Centralized path definitions and helper functions

### ASSET_PATHS Object Structure

**Icons Section**:
- arrow, back, forward
- social: instagram, twitter, linkedin, tiktok
- payments: pix, card, bank, crypto

**Images Section**:
- mascots: Object with Acqua/Mystic/Coral keys, variant arrays
- logos: Object with primary/icon/b2b keys, theme variants
- landing: Array of hero and feature image paths
- navigation: Object with page-specific banner paths
- socials: Object with real-photos and drawings arrays

## Helper Functions

### Core Asset Helpers

**getIconAsset(iconName: string)**:
- Returns path to icon asset
- Type-safe icon name validation
- Automatic format selection

**getMascotAsset(mascot: 'acqua' | 'mystic' | 'coral', variant: MascotVariant)**:
- Returns path to mascot image
- Validates mascot and variant
- Format priority: AVIF → WebP → PNG

**getLogoAsset(type: 'primary' | 'icon' | 'b2b', variant?: 'light' | 'dark')**:
- Returns path to logo asset
- Supports theme variants
- SVG format with PNG fallback

**getNavigationAsset(page: string)**:
- Returns page-specific navigation banner
- Domain-aware (banking, investing, strategy)

**getLandingAsset(assetName: string)**:
- Returns landing page visual asset
- Hero and feature image support

**getSocialAsset(category: 'real-photos' | 'drawings', assetName: string)**:
- Returns social proof image
- Category-based organization

### Advanced Helpers

**getMascotVariantPath**: Direct variant path access
**getAllMascotVariants**: List all available variants
**getAssetWithFormat**: Format-specific asset loading
**getResponsiveAsset**: Device-appropriate asset selection

## Development Workflow

### Adding New Assets (3-Step Process)

**Step 1: Add Physical File**:
- Place file in appropriate `/public/assets/` subdirectory
- Follow naming convention (kebab-case)
- Use optimal format (AVIF for images, SVG for icons)

**Step 2: Update TypeScript Definitions**:
- Add path to ASSET_PATHS object in `packages/shared/src/assets/index.ts`
- Create helper function if needed
- Update TypeScript types

**Step 3: Import and Use**:
- Import helper function
- Use helper in components
- TypeScript validates at compile time

### Naming Conventions

**Files**: kebab-case (e.g., `hero-banking.avif`)
**Directories**: lowercase, descriptive
**Variants**: Descriptive suffixes (`-light`, `-dark`, `-thinking`)
**Formats**: Explicit extensions (`.avif`, `.webp`, `.png`)

## Performance Optimization

### Format Priority Strategy

**Images**:
1. AVIF (best compression, modern browsers)
2. WebP (good compression, wide support)
3. PNG (lossless, universal support)
4. JPG (lossy, photography)

**Icons**:
1. SVG (scalable, small file size)
2. PNG (raster fallback)

### Size Guidelines

**Icons**: < 50KB
**Mascots**: < 200KB (AVIF), < 300KB (WebP)
**Logos**: < 100KB
**Hero Images**: < 500KB (AVIF), < 800KB (WebP)
**Social Photos**: < 300KB

### Loading Strategies

**Critical Assets**: Priority loading (logos, hero images)
**Above-the-Fold**: Eager loading with preload hints
**Below-the-Fold**: Lazy loading with Intersection Observer
**Background Images**: Deferred loading

## CDN Integration

### CDN Strategy

**Production**: Assets served via CDN for optimal performance
**Development**: Local serving for fast iteration
**Configuration**: Environment-based CDN prefix
**Cache Control**: Long-term caching with content hashing

### CDN Benefits

- Global distribution and low latency
- Automatic image optimization
- Responsive image variants
- Bandwidth cost reduction

## Asset Validation

### Build-Time Validation

**Checks**:
- All referenced assets exist
- File sizes within guidelines
- Format compatibility
- Path consistency

**Failure Handling**:
- Build fails on missing assets
- Warnings for oversized files
- TypeScript errors for invalid references

## Type Safety

### TypeScript Integration

**Benefits**:
- Compile-time validation of asset paths
- IDE autocomplete for asset names
- Refactoring safety (rename detection)
- Documentation through types

### Type Definitions

**MascotType**: 'acqua' | 'mystic' | 'coral'
**MascotVariant**: 'default' | 'thinking' | 'celebrating' | 'explaining' | 'happy' | 'confused'
**LogoType**: 'primary' | 'icon' | 'b2b'
**ThemeVariant**: 'light' | 'dark'

## Best Practices

### Asset Organization

1. Use appropriate subdirectories (icons vs images)
2. Follow naming conventions consistently
3. Store design references in inspiration/ (excluded from builds)
4. Update TypeScript definitions with every new asset
5. Use helper functions, not hardcoded paths

### Performance Guidelines

1. Optimize images before committing (use AVIF/WebP)
2. Keep file sizes within guidelines
3. Use lazy loading for non-critical assets
4. Implement responsive image variants
5. Leverage CDN caching strategies

### Development Workflow

1. Never duplicate physical files
2. Always update TypeScript definitions
3. Use type-safe helper functions
4. Test asset loading in all supported browsers
5. Validate builds before deployment

## Migration Strategy

### Existing Assets

**Audit**: Identify all asset references in codebase
**Consolidate**: Move all assets to `/public/assets/`
**Update Paths**: Update TypeScript definitions
**Replace References**: Use helper functions throughout codebase
**Validate**: Run build and test suite

### Legacy Support

**Gradual Migration**: Update components incrementally
**Backwards Compatibility**: Maintain old paths during transition
**Deprecation Warnings**: Log usage of old asset paths
**Complete Cutover**: Remove legacy paths after migration

## Summary

The diBoaS asset management system provides:

1. **Single Source of Truth**: All assets in `/public/assets/`, zero duplication
2. **Type Safety**: TypeScript validation prevents broken references
3. **Zero Duplication**: Path definitions only, no physical file copying
4. **Performance Optimization**: AVIF priority, lazy loading, CDN integration
5. **Developer Experience**: Helper functions, IDE autocomplete, refactoring safety
6. **Organized Structure**: Clear subdirectories (icons, mascots, logos, landing, navigation, socials)
7. **Mascot System**: Three mascots with six variants each
8. **Format Priority**: AVIF → WebP → PNG → JPG for images, SVG → PNG for icons
9. **Build-Time Validation**: Compile-time checks for missing or invalid assets
10. **CDN Integration**: Global distribution with automatic optimization
11. **Best Practices**: Naming conventions, size guidelines, loading strategies
12. **Migration Support**: Clear path from legacy to modern asset management

---

**For implementation details**: See frontend-condensed.md, design-system-condensed.md, and component-architecture-pattern-condensed.md
