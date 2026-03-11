# Design System

> **diBoaS brand design system - colors, components, and patterns**

## Brand Colors

### Primary (Turquoise/Aqua)
- Main: `#14b8a6` (primary-500)
- Light: `#ccfbf1` (primary-100)
- Dark: `#0d9488` (primary-600)
- Use for: primary buttons, links, brand elements, progress

### Secondary Colors
- **Purple** (Mystic): `#a855f7` - Investing & strategy contexts
- **Coral**: `#ef4444` - DeFi & innovation elements

### Neutral Grays
- Text primary: `neutral-900`
- Text secondary: `neutral-600`
- Text muted: `neutral-400`
- Backgrounds: `neutral-50` (page), `white` (cards)
- Borders: `neutral-200` (default)

### Semantic Colors
- Success: `#10b981`
- Warning: `#f59e0b`
- Error: `#ef4444`
- Info: `#3b82f6`

## Mascot System

### Acqua (Beginner - Aqua)
**Usage**: Banking, basic investing, onboarding, welcome
- Emotions: waving, happy, explaining, celebrating
- Contexts: Homepage hero, banking operations, beginner help

### Mystic (Intermediate - Purple)
**Usage**: Advanced investing, strategy, portfolio management
- Emotions: analytical, focused, successful, contemplative
- Contexts: Investment pages, market insights, DeFi strategy

### Coral (Advanced - Coral)
**Usage**: Advanced DeFi, complex strategies, curated content
- Emotions: innovative, adventurous, tech-forward, pioneering
- Contexts: Advanced DeFi, expert features, community curation

## Typography

### Font Stack
- Sans: `'Inter', sans-serif`
- Mono: `'JetBrains Mono', monospace`

### Scale
- `text-6xl`: 60px - Hero headings
- `text-5xl`: 48px - Display headings
- `text-4xl`: 36px - Large headings
- `text-3xl`: 30px - Section headings
- `text-2xl`: 24px - Medium headings
- `text-xl`: 20px - Small headings
- `text-lg`: 18px - Large body
- `text-base`: 16px - Body text
- `text-sm`: 14px - Small text
- `text-xs`: 12px - Captions

### Weights
- Light: 300
- Normal: 400
- Medium: 500
- Semibold: 600
- Bold: 700
- Extrabold: 800

## Component Reusability Hierarchy

### Level 1: Primitives (95% reuse)
Shared across all apps: Button, Input, Card, Typography, Badge
- Variants: primary, secondary, outline, ghost
- Sizes: xs, sm, md, lg, xl
- States: default, hover, active, disabled, loading

### Level 2: Patterns (85% reuse)
Cross-domain patterns: Modal, Navigation, Footer, Breadcrumbs
- Adaptable sizing and density
- Customizable interactions
- Responsive breakpoints

### Level 3: Marketing UI (80% reuse)
Marketing components: Hero, FeaturePromotion, TrustBuilder
- Content customization
- CTA targeting
- Trust signal selection

### Level 4: App-Specific (70% reuse)
App components: Dashboard, TransactionWizard, BalanceCards
- Domain-specific data
- Workflow customization
- Business logic integration

## Button System

### Variants
- **Primary**: `bg-primary-500 text-white` - Main actions
- **Secondary**: `bg-purple-500 text-white` - Secondary actions
- **Outline**: `border-2 border-primary-500 text-primary-600` - Alternative actions
- **Ghost**: `text-primary-600 bg-transparent` - Tertiary actions

### Sizes
- xs: `px-2 py-1 text-xs`
- sm: `px-3 py-1.5 text-sm`
- md: `px-4 py-2 text-base`
- lg: `px-6 py-3 text-lg`
- xl: `px-8 py-4 text-xl`

## Card System

### Variants
- **Default**: Subtle border, minimal shadow
- **Elevated**: Enhanced shadow for prominence
- **Gradient**: Colored background for emphasis
- **Accent**: Light background with colored border

### Usage
- Balance cards: Large numbers, domain colors
- Transaction cards: Timeline with status indicators
- Feature cards: Illustrations with CTAs

## Responsive Breakpoints

- `sm`: 640px - Mobile
- `md`: 768px - Tablet
- `lg`: 1024px - Laptop
- `xl`: 1280px - Desktop
- `2xl`: 1536px - Large desktop

## Animation Principles

### Duration
- Fast: 150ms - Hover, focus
- Medium: 200ms - Standard transitions
- Slow: 300ms - Complex animations
- Slower: 500ms - Modals, pages

### Easing
- `easeOut`: Default for most transitions
- `easeIn`: Closing/exiting animations
- `easeInOut`: Complex state changes
- `bounce`: Playful interactions

### Common Animations
- **fadeIn**: Opacity 0 → 1
- **slideUp**: translateY 20px → 0
- **scaleIn**: Scale 0.95 → 1
- **float**: Gentle up/down for mascots
- **pulse**: Subtle scale for attention

## Subdomain-Specific Adaptations

### Marketing (diboas.com)
- Emphasis: Trust-building, brand recognition
- Colors: Full spectrum, primary aqua emphasis
- Typography: Expansive scale, varied weights
- Components: Prominent CTAs, elevated cards

### Consumer App (app.diboas.com)
- Emphasis: Functionality, information density
- Colors: Aqua-focused, functional accents
- Typography: Compact scale, data-focused
- Components: Functional buttons, informative cards

### Business App (business.diboas.com)
- Emphasis: Professional, enterprise
- Colors: Muted brand colors, neutral emphasis
- Typography: Professional scale, readable
- Components: Conservative styling, complex data tables

## Accessibility

### Color Contrast
- Normal text: 4.5:1 minimum (WCAG AA)
- Large text: 3:1 minimum
- UI elements: 3:1 minimum
- Never rely on color alone

### Interaction
- Focus indicators on all interactive elements
- Minimum 44px touch targets
- Keyboard navigation support
- Screen reader labels

### Semantic Usage
- Success: Green + checkmark
- Error: Red + X icon
- Warning: Amber + warning icon
- Info: Blue + info icon

## Package Structure

```
@diboas/design-system     # Primitives (95% reuse)
@diboas/shared-patterns   # Patterns (85% reuse)
@diboas/marketing-ui      # Marketing (80% reuse)
@diboas/app-ui            # Consumer app (70% reuse)
@diboas/business-ui       # Business app (70% reuse)
```

## Consistency Framework

### Must Be Consistent
- Logo placement and sizing
- Primary brand colors (exact hex)
- Mascot personalities
- Core typography (font families)
- Icon library and style

### Can Be Adapted
- Color emphasis per subdomain
- Component sizing
- Layout density
- Interaction complexity
- Content strategy

### Should Vary
- CTA prominence
- Trust signals
- Navigation depth
- Information hierarchy
- Performance optimization

## Key Guidelines

1. **Mobile-first** - Design for small screens first
2. **Accessibility** - WCAG 2.1 AA compliance
3. **Performance** - Optimize images and fonts
4. **Consistency** - Use design tokens
5. **Simplicity** - Clear, Nubank-inspired UI
6. **Personality** - Mascots add warmth
7. **Trust** - Professional yet approachable

---

**For implementation details**: See component documentation and Storybook
