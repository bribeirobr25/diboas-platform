# diBoaS Platform - Web Application

The main web application for the diBoaS unified financial services platform.

## Tech Stack

- **Next.js 16.1.1** with App Router and Turbopack
- **React 19.0.0** with Server Components
- **TypeScript 5.2.2**
- **Tailwind CSS 4.1.8**
- **react-intl 7.1.9** for internationalization
- **Storybook 9.1.17** for component development
- **Sentry 10.32.1** for error monitoring

## Installation

This app is part of a monorepo. Install from the root:

```bash
# Navigate to project root
cd ../..

# Install all dependencies
pnpm install

# Generate design tokens
pnpm run generate:design-tokens
```

## Development

### Start Development Server

From the **root directory**:

```bash
pnpm run dev:web
```

Or from this directory:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Available Routes

The app uses locale-based routing:

- `/en` - English (default)
- `/pt-BR` - Portuguese (Brazil)
- `/es` - Spanish
- `/de` - German

Main pages:
- `/[locale]` - Home page (B2C landing)
- `/[locale]/business` - B2B landing page
- `/[locale]/about` - About page
- `/[locale]/strategies` - Investment strategies
- `/[locale]/future-you` - Financial future calculator
- `/[locale]/dream-mode` - Interactive dream simulator
- `/[locale]/share` - Social sharing page
- `/[locale]/benefits` - Benefits page
- `/[locale]/banking-services` - Banking services
- `/[locale]/investing` - Investment features
- `/[locale]/cryptocurrency` - Crypto trading
- `/[locale]/learn` - Educational content
- `/[locale]/rewards` - Rewards program

Legal pages:
- `/[locale]/privacy` - Privacy policy
- `/[locale]/terms` - Terms of service
- `/[locale]/cookies` - Cookie policy

## Project Structure

```
apps/web/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Root redirect
│   │   └── [locale]/           # Locale-based routing
│   │       └── (marketing)/    # Marketing pages group
│   ├── components/             # React components
│   │   ├── Sections/           # Page sections (Hero, Carousel, etc.)
│   │   ├── Layout/             # Navigation & Footer
│   │   ├── UI/                 # UI primitives
│   │   └── Performance/        # Performance tracking
│   ├── config/                 # Configuration files
│   ├── lib/                    # Utilities & services
│   │   ├── analytics/          # Analytics tracking
│   │   ├── monitoring/         # Performance monitoring
│   │   ├── seo/                # SEO utilities
│   │   └── errors/             # Error handling
│   ├── styles/                 # Global styles
│   │   ├── design-tokens.css   # Generated CSS variables
│   │   └── semantic-components.css
│   └── middleware.ts           # Next.js middleware
├── public/                     # Static assets
├── .storybook/                 # Storybook config
└── next.config.ts              # Next.js config
```

## Available Scripts

### Development

```bash
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Lint code
pnpm type-check       # Type check TypeScript
```

### Bundle Analysis

```bash
pnpm run analyze          # Full bundle analysis
pnpm run analyze-server   # Server bundle only
pnpm run analyze-browser  # Browser bundle only
pnpm run bundle-size      # Check bundle size
```

### Component Development

```bash
pnpm run storybook        # Start Storybook (port 6006)
pnpm run build-storybook  # Build Storybook
```

### Testing & Quality

```bash
pnpm run lighthouse       # Performance audit
pnpm run perf-test        # Performance testing
```

## Component Architecture

Components use the **Factory Pattern** with variants:

```typescript
// Components are organized by section
Sections/
├── HeroSection/
│   ├── HeroSectionFactory.tsx      # Dynamic variant loader
│   ├── HeroSection.stories.tsx     # Storybook stories
│   ├── index.ts                    # Public exports
│   └── variants/                   # Different implementations
│       ├── FullBackgroundVariant.tsx
│       └── SplitLayoutVariant.tsx
```

### Creating a New Section

1. Create section folder in `src/components/Sections/`
2. Add Factory component for variant loading
3. Create variants in `variants/` subfolder
4. Add configuration in `src/config/`
5. Create Storybook stories
6. Export from `src/components/Sections/index.ts`

Example:

```typescript
// src/components/Sections/MySection/MySectionFactory.tsx
import dynamic from 'next/dynamic';

const variants = {
  default: dynamic(() => import('./variants/DefaultVariant')),
  alternative: dynamic(() => import('./variants/AlternativeVariant')),
};

export function MySectionFactory({ variant = 'default', ...props }) {
  const Component = variants[variant];
  return <Component {...props} />;
}
```

## Design Tokens

This app uses a design token system for consistent styling:

### Using Design Tokens

```css
/* In your CSS files */
.my-component {
  color: var(--color-primary);
  font-size: var(--font-size-lg);
  spacing: var(--spacing-md);
}
```

### Updating Design Tokens

1. Edit `../../config/design-tokens.json`
2. Run `pnpm run generate:design-tokens` from root
3. Tokens are automatically available as CSS variables

## Internationalization

Using react-intl for translations:

```typescript
import { useIntl } from 'react-intl';

export function MyComponent() {
  const intl = useIntl();

  return (
    <h1>
      {intl.formatMessage({ id: 'home.hero.title' })}
    </h1>
  );
}
```

Translation files are in `../../packages/i18n/translations/`.

## Environment Variables

Copy the example file and configure:

```bash
cp .env.example .env.local
```

The `.env.example` file contains 50+ configuration options organized by category:

| Category | Description |
|----------|-------------|
| Application | Base URLs, domain, environment |
| Kit.com | Email marketing integration |
| Cal.com | Booking calendar integration |
| Waitlist | Storage path, API keys |
| Analytics | GA4, Sentry, PostHog |
| Security | Encryption, CSRF, rate limiting |
| Feature Flags | Toggle integrations on/off |
| Brand | Company name, tagline, social links |

See `.env.example` for detailed documentation of each variable.

## Performance Optimization

### Code Splitting

Variants are automatically code-split using `next/dynamic`:

```typescript
const HeroVariant = dynamic(() => import('./variants/FullBackground'));
```

### Image Optimization

Use Next.js Image component:

```typescript
import Image from 'next/image';

<Image
  src="/path/to/image.avif"
  alt="Description"
  width={800}
  height={600}
  priority={true} // For above-the-fold images
/>
```

### Font Optimization

Fonts are optimized using `next/font`:

```typescript
import { Geist } from 'next/font/google';

const geistSans = Geist({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});
```

## Storybook

View and develop components in isolation:

```bash
pnpm run storybook
```

Open [http://localhost:6006](http://localhost:6006)

Stories are co-located with components:
- `HeroSection.stories.tsx`
- `ProductCarousel.stories.tsx`
- etc.

## SEO

### Metadata

Configure metadata in page files:

```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  return {
    title: 'Page Title',
    description: 'Page description',
    openGraph: {
      title: 'OG Title',
      description: 'OG Description',
    },
  };
}
```

### Structured Data

Use the StructuredData component:

```typescript
import { StructuredData } from '@/components/SEO/StructuredData';

<StructuredData data={[organizationData, breadcrumbData]} />
```

## Error Handling

Components are wrapped in error boundaries:

```typescript
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';

<SectionErrorBoundary
  sectionId="hero-section"
  sectionType="HeroSection"
  enableReporting={true}
>
  <HeroSection />
</SectionErrorBoundary>
```

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Use different port
pnpm dev -- -p 3001
```

### Type Errors

```bash
# Rebuild workspace packages
cd ../..
pnpm run build

# Type check
pnpm run type-check
```

### Storybook Build Issues

```bash
# Clear Storybook cache
rm -rf .storybook-static node_modules/.cache

# Reinstall
pnpm install
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Storybook](https://storybook.js.org/docs)
- [react-intl](https://formatjs.io/docs/react-intl/)

## Deployment

See the [main README](../../README.md) for deployment instructions.

---

Part of the diBoaS Platform monorepo
