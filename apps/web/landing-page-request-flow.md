# Landing Page Request Flow - Next.js Fintech Application

## Overview
This document traces the complete request flow for the landing page in the diBoaS fintech platform, from initial HTTP request to final rendered page.

## Flow Diagram

```mermaid
graph TD
    A[User Request: example.com] --> B[Next.js Server]
    
    B --> C{Middleware<br/>src/middleware.ts}
    
    C --> D[Security Validation<br/>- Path traversal check<br/>- XSS prevention<br/>- Parameter validation]
    
    D --> E{Locale Detection}
    
    E -->|No locale in URL| F[Detect from Accept-Language<br/>Default: 'en']
    E -->|Has locale| G[Validate Locale<br/>['en', 'pt-BR', 'es', 'de']]
    
    F --> H[Redirect to /{locale}]
    G --> I[Add Security Headers<br/>CSP, X-Frame-Options, etc.]
    H --> I
    
    I --> J[Next.js App Router<br/>File-based routing]
    
    J --> K[Root Layout<br/>app/layout.tsx]
    
    K --> L[Load Fonts<br/>- Geist Sans<br/>- Geist Mono]
    
    L --> M[Set HTML Structure<br/>- suppressHydrationWarning<br/>- Font CSS variables]
    
    M --> N[Locale Layout<br/>app/[locale]/(marketing)/layout.tsx]
    
    N --> O[Validate Locale Parameter<br/>isValidLocale check]
    
    O -->|Invalid| P[404 Not Found]
    O -->|Valid| Q[LocaleProvider Context<br/>Hydration tracking]
    
    Q --> R[Navigation Component<br/>Client-side]
    
    R --> S[Load Navigation Config<br/>src/config/navigation.ts]
    
    S --> T[Render Navigation<br/>- Desktop Nav<br/>- Mobile Nav]
    
    T --> U[Page Component<br/>app/[locale]/(marketing)/page.tsx]
    
    U --> V[Server Component<br/>Async data fetching]
    
    V --> W[Render Hero Section<br/>- SectionWrapper<br/>- TwoColumnGrid<br/>- SectionHeader]
    
    W --> X[Load Images<br/>- Mascot: mascot-acqua-hello.avif<br/>- Phone: phone-account.avif]
    
    X --> Y[Render Buttons<br/>- Get Started Free<br/>- Learn More]
    
    Y --> Z[Client Hydration<br/>React components become interactive]
    
    Z --> AA[Asset Loading<br/>CSS, Images, Fonts]
    
    AA --> AB[Final Rendered Page]
    
    style C fill:#f9f,stroke:#333,stroke-width:2px
    style I fill:#9f9,stroke:#333,stroke-width:2px
    style N fill:#bbf,stroke:#333,stroke-width:2px
    style U fill:#fbf,stroke:#333,stroke-width:2px
```

## Detailed Component Flow

### 1. Initial Request Processing

```
User Request → Next.js Server → Middleware
```

**Middleware (`src/middleware.ts`):**
- **Matcher**: Excludes static files, API routes, and assets
- **Security Validation**: 
  - Blocks suspicious patterns (directory traversal, XSS attempts)
  - Validates parameter length (max 1000 chars)
- **Locale Detection**:
  - Checks URL for existing locale
  - Falls back to Accept-Language header
  - Default: 'en'
- **Security Headers Added**:
  - Content-Security-Policy
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - Strict-Transport-Security (production only)

### 2. Routing & Layout Structure

```
App Router → Root Layout → Locale Layout → Page
```

**Root Layout (`app/layout.tsx`):**
- Server Component
- Loads Google Fonts (Geist Sans & Mono)
- Sets up base HTML structure
- Applies global CSS (`globals.css`)

**Locale Layout (`app/[locale]/(marketing)/layout.tsx`):**
- Server Component with async params
- Validates locale parameter
- Wraps content in `LocaleProvider`
- Renders `Navigation` component
- Static generation with `generateStaticParams`

### 3. Client-Side Components

```
LocaleProvider → Navigation → Page Content
```

**LocaleProvider (`components/LocaleProvider.tsx`):**
- Client Component ('use client')
- Creates React Context for locale
- Tracks hydration state
- Provides `useLocale` hook

**Navigation (`components/Layout/Navigation/Navigation.tsx`):**
- Client Component
- Uses `useNavigation` hook for state
- Loads navigation config
- Renders Desktop & Mobile variants
- Tracks analytics events
- Manages body scroll on mobile

### 4. Page Rendering

```
Page Component → UI Components → Assets
```

**Page Component (`app/[locale]/(marketing)/page.tsx`):**
- Server Component with async params
- Validates locale
- Renders static content structure
- No dynamic data fetching (simplified version)

**UI Components Used:**
- `SectionWrapper` (background gradient)
- `TwoColumnGrid` (layout)
- `SectionHeader` (hero title/description)
- `Button` (CTAs)
- `Image` (Next.js optimized)

### 5. Asset Loading Flow

```
CSS → Fonts → Images → JavaScript
```

**CSS Loading:**
1. `globals.css` imported in root layout
2. Tailwind CSS layers (base, components, utilities)
3. Semantic component styles imported
4. CSS-in-JS from UI components

**Font Loading:**
- Geist Sans & Geist Mono via next/font/google
- Preloaded and optimized by Next.js
- CSS variables set for font families

**Image Loading:**
- Next.js Image component with optimization
- AVIF format for better compression
- Lazy loading by default
- Responsive sizing

**JavaScript Loading:**
- Server Components: No JS sent to client
- Client Components: Bundled and code-split
- React hydration after initial HTML

## Performance Optimizations

1. **Static Generation**: Pages pre-rendered at build time
2. **Server Components**: Reduced client-side JavaScript
3. **Image Optimization**: AVIF format, lazy loading
4. **Font Optimization**: Preloaded via next/font
5. **Code Splitting**: Automatic by Next.js
6. **Middleware Caching**: 15-minute cache for repeat requests

## Security Features

1. **Request Validation**: Pattern matching for malicious requests
2. **CSP Headers**: Strict content security policy
3. **XSS Protection**: Header and input validation
4. **CSRF Protection**: Same-origin policy
5. **HSTS**: Enforced HTTPS in production

## Internationalization (i18n) Flow

1. **Supported Locales**: en, pt-BR, es, de
2. **Detection Order**:
   - URL path segment
   - Accept-Language header
   - Default fallback (en)
3. **Redirect Logic**: Non-localized URLs → /{locale}/path
4. **Static Paths**: Pre-generated for all locales

## Key File Responsibilities

- **middleware.ts**: Request validation, locale detection, security headers
- **app/layout.tsx**: Root HTML structure, fonts, global styles
- **[locale]/layout.tsx**: Locale validation, navigation, context providers
- **[locale]/page.tsx**: Page-specific content and components
- **LocaleProvider.tsx**: Client-side locale context
- **Navigation.tsx**: Main navigation orchestration
- **navigation.ts**: Navigation configuration data

This architecture ensures a secure, performant, and internationalized landing page experience with clear separation of concerns and optimized asset loading.