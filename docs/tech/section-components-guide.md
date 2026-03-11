# Section Components Guide

Complete reference guide for all Section components in the diBoaS platform.

**Location:** `/apps/web/src/components/Sections/`
**Last Updated:** December 2025

---

## Table of Contents

1. [AppFeaturesCarousel](#1-appfeaturescarousel)
2. [BenefitsCards](#2-benefitscards)
3. [BgHighlight](#3-bghighlight)
4. [FAQAccordion](#4-faqaccordion)
5. [FeatureShowcase](#5-featureshowcase)
6. [HeroSection](#6-herosection)
7. [OneFeature](#7-onefeature)
8. [ProductCarousel](#8-productcarousel)
9. [SectionContainer](#9-sectioncontainer)
10. [StepGuide](#10-stepguide)
11. [StickyFeaturesNav](#11-stickyfeaturesnav)
12. [Cross-Component Patterns](#cross-component-patterns)
13. [Summary Statistics](#summary-statistics)

---

## 1. AppFeaturesCarousel

### Component Name
**AppFeaturesCarousel** - Interactive carousel showcasing application features with image cards

### Available Variants
- **AppFeaturesCarouselDefault** (default variant)

### Capabilities

#### Images
- **Multiple images**: Displays multiple app feature mockups/screenshots
- **Priority loading**: Supported via `priority` prop (first image gets priority)
- **Responsive sizing**:
  - Mobile: 90vw width, 3:4 aspect ratio
  - Tablet: 490px width, 500px height
  - Desktop: Active card 416px, Inactive cards 195px, 500px height
- **Format**: Optimized for AVIF/WebP with Next.js Image component

#### Text Elements
- **Section title**: Main carousel heading (h2)
- **Card descriptions**: Each card has a description (shown only when active)
- **CTA text**: Optional call-to-action link per card

#### Icons
- **Lucide icons**: ChevronRight (for CTA links), Play, Pause (for carousel controls)
- **No custom icon assets**

#### Interactive Elements
- **Carousel controls**: Dot navigation, Play/Pause button
- **Card navigation**: Click cards to switch, touch swipe gestures
- **CTA links**: Per-card call-to-action buttons (supports internal Link or external anchor)
- **Auto-play**: Configurable auto-rotation with pause on hover

### Layout Structure

#### Grid/Flexbox Organization
- **Desktop**: Flexbox with horizontal card arrangement, gap between cards
- **Mobile/Tablet**: Centered single card display
- **Cards grid**: Horizontal flex layout with transitions

#### Number of Columns
- **Mobile**: 1 card (full width, 90%)
- **Tablet**: 1 card (490px)
- **Desktop**: 4 cards visible (1 active at 416px, 3 inactive at 195px each)

#### Card-based or Continuous Layout
- **Card-based**: Individual feature cards
- **Active/Inactive states**: Visual distinction with opacity and size

#### Background Options
- Configurable via `backgroundColor` prop or SectionContainer
- Uses standard section background from design tokens

### Animations

#### Auto-play/Rotation
- **Auto-play**: Configurable, default 4000ms interval
- **Pause on hover**: Supported
- **Play/Pause control**: Manual toggle button

#### Transitions
- **Duration**: 500ms with easing
- **Properties**: Transform, opacity, filter
- **Timing function**: Cubic-bezier easing from design tokens

#### Hover Effects
- **Inactive cards**: Opacity increases on hover (60% to 80%)
- **CTA links**: Color change and translateX transform
- **Active card**: Enhanced box-shadow

#### Scroll-triggered Animations
- Not implemented (manual carousel navigation only)

### Special Features

#### Keyboard Navigation
- **Not enabled** for AppFeaturesCarousel (enableKeyboard: false)

#### Touch Gestures
- **Swipe support**: Left/right swipe to navigate (threshold: 50px, velocity: 0.3)
- **Touch events**: handleTouchStart, handleTouchEnd

#### Accessibility Features
- **ARIA labels**: aria-label for buttons, aria-labelledby for section
- **Role attributes**: role="button" for clickable cards
- **Tab navigation**: tabIndex on interactive elements
- **Focus indicators**: Focus-visible outlines
- **Reduced motion support**: Disables animations when prefers-reduced-motion
- **High contrast mode**: Enhanced borders and colors

#### Internationalization Support
- Not directly visible (text comes from config)
- Uses centralized config system for content

---

## 2. BenefitsCards

### Component Name
**BenefitsCards** - Grid-based benefits display with icon cards

### Available Variants
- **BenefitsCardsDefault** (default variant)

### Capabilities

#### Images
- **Icon images**: Single icon per card (64x64px)
- **Priority loading**: First 3 cards get priority (top row on desktop)
- **Responsive sizing**:
  - Mobile: 48px
  - Tablet: 56px
  - Desktop: 64px
- **Format**: AVIF with Next.js Image, fallback emoji on error
- **Error handling**: Icon fallback with emoji (💡)

#### Text Elements
- **Section title**: Optional main heading (h2)
- **Section description**: Optional subtitle
- **Card title**: Benefit heading (h3)
- **Card description**: Benefit explanation text

#### Icons
- **Icon images**: Static image assets per card
- **Fallback icons**: Emoji fallback on load error

#### Interactive Elements
- **No buttons/links**: Static display cards
- **Hover effects**: Card lift and shadow enhancement

### Layout Structure

#### Grid/Flexbox Organization
- **CSS Grid**: Responsive grid layout
- **6-column grid system** on desktop for flexible card positioning

#### Number of Columns
- **Mobile**: 1 column (single card)
- **Tablet**: 2 columns
- **Desktop**: Adaptive layout based on card count:
  - 2 cards: 1 row, 2 cards centered
  - 3 cards: 1 row, 3 cards evenly distributed
  - 4 cards: 2 rows, 2 cards per row
  - 5 cards: 3+2 staggered layout (original design)
  - 6 cards: 2 rows, 3 cards per row
  - 7+ cards: Continuous 3-column layout

#### Card-based or Continuous Layout
- **Card-based**: Individual benefit cards with rounded borders and shadows

#### Background Options
- **Three variants**:
  - `light-purple` (default)
  - `white`
  - `neutral`
- Configurable per section

### Animations

#### Auto-play/Rotation
- **None**: Static display

#### Transitions
- **Transform and box-shadow**: On hover
- **Duration/Easing**: From design tokens

#### Hover Effects
- **Card lift**: translateY transform
- **Enhanced shadow**: Box-shadow transition

#### Scroll-triggered Animations
- Not implemented

### Special Features

#### Keyboard Navigation
- **Focus styles**: Focus-visible outlines on cards
- **Keyboard accessible**: Tab navigation support

#### Touch Gestures
- **None**: Static cards

#### Accessibility Features
- **Semantic HTML**: article elements for cards
- **ARIA labels**: Section aria-label and aria-labelledby
- **Heading hierarchy**: Proper h2/h3 structure
- **Alt text**: Internationalized alt text for icons
- **Reduced motion support**: Disables transitions
- **High contrast mode**: Enhanced borders and text colors
- **Focus indicators**: Visible focus outlines

#### Internationalization Support
- **Full i18n support**: Uses @diboas/i18n/client
- **formatMessage**: All text content internationalized
- **Icon alt text**: Translated via i18n keys

---

## 3. BgHighlight

### Component Name
**BgHighlight** - Full-width background image section with overlay text

### Available Variants
- **BgHighlightDefault** (default variant)

### Capabilities

#### Images
- **Background image**: Single full-width background (fill mode)
- **Priority loading**: Supported via `priority` prop for LCP optimization
- **Responsive sizing**: 100vw with object-fit cover
- **Format**: AVIF/WebP via Next.js Image
- **Error handling**: Loading and error state indicators

#### Text Elements
- **Title**: Main heading (configurable h1/h2/h3)
- **Description**: Subtitle text
- **Gradient overlay**: For text readability (10% opacity - recently reduced from 95%)

#### Icons
- **None**: No icon assets

#### Interactive Elements
- **None**: Static display section

### Layout Structure

#### Grid/Flexbox Organization
- **Layered structure**: Background layer + overlay + content layer
- **Flexbox**: Content positioning

#### Number of Columns
- **Single column**: Full-width background with bottom-left text positioning

#### Card-based or Continuous Layout
- **Continuous**: Full-width background section

#### Background Options
- **Full background image**: Primary feature
- **Gradient overlay**: Semi-transparent overlay for text contrast

### Animations

#### Auto-play/Rotation
- **None**: Static background

#### Transitions
- **Image fade-in**: On load
- **Opacity transitions**: For loading states

#### Hover Effects
- **None**: Static display

#### Scroll-triggered Animations
- Not implemented

### Special Features

#### Keyboard Navigation
- **Not applicable**: Static display

#### Touch Gestures
- **None**: Static section

#### Accessibility Features
- **ARIA labels**: Section aria-label
- **Semantic HTML**: Proper heading hierarchy
- **Alt text**: Internationalized image alt text
- **Loading states**: Accessible loading indicators
- **Reduced motion support**: Can be added

#### Internationalization Support
- **Full i18n support**: Uses @diboas/i18n/client
- **All text translated**: Title, description, alt text

---

## 4. FAQAccordion

### Component Name
**FAQAccordion** - Expandable FAQ accordion with two-column layout

### Available Variants
- **FAQAccordionDefault** (default variant)

### Capabilities

#### Images
- **None**: Text-only component

#### Text Elements
- **Section title**: Main FAQ heading (h2)
- **Section description**: Intro text
- **Question text**: Accordion header (h3)
- **Answer text**: Expandable content
- **CTA button**: Link to full FAQ page

#### Icons
- **SVG icons**: Plus/minus expand/collapse indicator
- **Inline SVG**: Custom plus icon that rotates on expand

#### Interactive Elements
- **Accordion buttons**: Expand/collapse FAQ items
- **CTA link**: Navigate to full FAQ page
- **Keyboard navigation**: Arrow keys, Home, End
- **Click handlers**: onExpand, onCollapse, onCTAClick callbacks

### Layout Structure

#### Grid/Flexbox Organization
- **Two-column layout** (desktop):
  - Left panel: Intro content (title, description)
  - Right panel: Accordion items
- **Single column** (mobile/tablet)

#### Number of Columns
- **Mobile/Tablet**: 1 column (stacked)
- **Desktop**: 2 columns (intro + accordion)

#### Card-based or Continuous Layout
- **Continuous**: Accordion list structure

#### Background Options
- Configurable via `backgroundColor` prop
- Uses SectionContainer with wide variant

### Animations

#### Auto-play/Rotation
- **None**: User-triggered expansion

#### Transitions
- **Accordion expansion**: Height transition with max-height
- **Icon rotation**: 45deg rotation on expand
- **Smooth scrolling**: scrollIntoView on expand (if enabled)

#### Hover Effects
- **Button hover**: Background color change
- **Focus states**: Visible outlines

#### Scroll-triggered Animations
- **Scroll into view**: Optional, scrolls to active item on expand

### Special Features

#### Keyboard Navigation
- **Full keyboard support** (configurable):
  - ArrowDown: Next item
  - ArrowUp: Previous item
  - Home: First item
  - End: Last item
  - Enter/Space: Toggle
- **enableKeyboardNav** setting

#### Touch Gestures
- **None**: Click/tap to expand

#### Accessibility Features
- **ARIA attributes**:
  - aria-expanded on buttons
  - aria-controls linking button to content
  - aria-labelledby on content regions
  - aria-live for dynamic content
  - role="region" for accordion items
- **Hidden attribute**: On collapsed content
- **Semantic HTML**: Proper heading hierarchy
- **Focus management**: Maintains focus on interaction
- **Screen reader support**: Descriptive labels

#### Internationalization Support
- **Full i18n support**: Uses @diboas/i18n/client
- **Registry mode**: References centralized FAQ registry
- **Legacy mode**: Direct items array support
- **Flattened messages**: Special handling for array keys

---

## 5. FeatureShowcase

### Component Name
**FeatureShowcase** - Manual navigation carousel for feature demonstrations

### Available Variants
- **FeatureShowcaseDefault** (default)
- **FeatureShowcaseBenefits** (alternative variant)

### Capabilities

#### Images
- **Primary image**: Large feature image per slide (400x520px)
- **Priority loading**: Supported via `priority` prop
- **Responsive sizing**:
  - Mobile: 100vw
  - Tablet: 50vw
  - Desktop: 400px
- **Format**: Next.js Image optimization

#### Text Elements
- **Slide title**: Main heading (h2)
- **Slide description**: Feature explanation
- **CTA text**: Call-to-action button per slide

#### Icons
- **Lucide icons**: ChevronLeft, ChevronRight for navigation

#### Interactive Elements
- **Navigation buttons**: Previous/Next chevron buttons
- **Dot navigation**: Slide indicators
- **CTA button**: Per-slide call-to-action
- **Manual carousel**: No auto-play, user-controlled
- **Swipe gestures**: Touch navigation support

### Layout Structure

#### Grid/Flexbox Organization
- **Two-column layout** (desktop):
  - Left: Text content (1fr)
  - Right: Visual content (1.2fr)
- **Single column** (mobile/tablet) with image above text

#### Number of Columns
- **Mobile/Tablet**: 1 column (stacked)
- **Desktop**: 2 columns (text + image)

#### Card-based or Continuous Layout
- **Continuous**: Single slide visible at a time

#### Background Options
- Configurable via `backgroundColor` prop
- Uses SectionContainer standard variant

### Animations

#### Auto-play/Rotation
- **No auto-play**: Manual navigation only

#### Transitions
- **Slide transitions**: 500ms duration (configurable)
- **Image crossfade**: Smooth transitions between slides

#### Hover Effects
- **Navigation buttons**: Hover styles
- **CTA button**: Standard button hover effects

#### Scroll-triggered Animations
- Not implemented

### Special Features

#### Keyboard Navigation
- **Enabled**: Arrow key navigation for slides
- **enableKeyboard**: true

#### Touch Gestures
- **Swipe support**: Left/right swipe to navigate
- **Threshold**: 50px, velocity: 0.3

#### Accessibility Features
- **ARIA labels**: Section aria-labelledby
- **Semantic HTML**: Proper heading structure
- **Focus management**: Disabled state during transitions
- **Image alt text**: Per-slide SEO configuration

#### Internationalization Support
- Content from config (not directly i18n in component)
- Supports external translation

---

## 6. HeroSection

### Component Name
**HeroSection** - Above-the-fold hero section with visual assets

### Available Variants
- **HeroDefault** (default - with phone/mascot images)
- **HeroFullBackground** (full background image variant)

### Capabilities

#### Images

**HeroDefault:**
- **Multiple images**: Background circle, phone mockup, mascot character
- **Priority loading**: Phone image gets priority (above-fold)
- **Responsive sizing**: Adaptive to viewport
- **Error handling**: Fallback UI with emoji for each image
- **Loading states**: Loading overlay during image load

**HeroFullBackground:**
- **Background image**: Full-width/height background
- **Separate mobile image**: Optional mobile-specific background
- **Overlay**: Configurable opacity overlay
- **Preloading**: Preloads both desktop and mobile backgrounds

#### Text Elements
- **Title**: Large hero heading (h1)
- **Description**: Optional subtitle/body text
- **CTA text**: Call-to-action button

#### Icons
- **None**: Uses images instead

#### Interactive Elements
- **CTA button**: Primary call-to-action with click handler
- **Loading states**: Visual feedback during image loading

### Layout Structure

#### Grid/Flexbox Organization
- **HeroDefault**: Two-column flex (text left, visual right on desktop)
- **HeroFullBackground**: Layered background + two-column content (title left, description right on desktop)

#### Number of Columns
- **Mobile**: 1 column (stacked)
- **Tablet**: 1-2 columns
- **Desktop**: 2 columns

#### Card-based or Continuous Layout
- **Continuous**: Full-width section

#### Background Options
- **HeroDefault**: Component background color
- **HeroFullBackground**: Full background image with overlay

### Animations

#### Auto-play/Rotation
- **None**: Static hero

#### Transitions
- **Image fade-in**: On load (HeroDefault)
- **Loading states**: Smooth transitions

#### Hover Effects
- **CTA button**: Standard button hover effects

#### Scroll-triggered Animations
- Not implemented

### Special Features

#### Keyboard Navigation
- **Standard focus navigation**: Tab through CTA

#### Touch Gestures
- **None**: Static display

#### Accessibility Features
- **ARIA labels**: Section aria-labelledby
- **Semantic HTML**: h1 for title
- **Alt text**: For all images
- **Loading states**: Accessible indicators
- **Focus management**: Proper focus order

#### Internationalization Support
- Content from config (can be integrated with i18n)
- Supports external translation systems

---

## 7. OneFeature

### Component Name
**OneFeature** - Single feature showcase with hero image and feature cards

### Available Variants
- **OneFeatureDefault** (default variant)

### Capabilities

#### Images
- **Hero image**: Large floating 3D image (250x250px) positioned outside container
- **Priority loading**: Supported via `priority` prop and `imageLoadPriority` setting
- **Error handling**: Fallback emoji (🔒) on load error
- **Responsive sizing**: 250px consistent

#### Text Elements
- **Main title**: Section heading (h2)
- **Subtitle**: Section description
- **Feature titles**: Individual feature link text
- **CTA text**: Primary call-to-action button

#### Icons
- **Lucide icon**: ChevronRight for feature links
- **Dual styles**: Primary and secondary icon colors

#### Interactive Elements
- **Feature cards**: Clickable links (primary/secondary variants)
- **CTA button**: Primary action button
- **Click handlers**: onFeatureClick, onCTAClick callbacks
- **External links**: Support for target="_blank"

### Layout Structure

#### Grid/Flexbox Organization
- **Flexbox column**: Vertical stacking
- **Feature grid**: Multi-column grid for feature cards

#### Number of Columns
- **Mobile**: 1 column
- **Tablet**: 2 columns (features)
- **Desktop**: Variable based on feature count

#### Card-based or Continuous Layout
- **Card-based**: Individual feature cards with primary/secondary styling

#### Background Options
- Configurable via `backgroundColor` prop
- Uses SectionContainer standard variant

### Animations

#### Auto-play/Rotation
- **None**: Static display

#### Transitions
- **Hero image animation**: Fade-in on load (if enableAnimations)
- **Feature card animations**: Staggered entrance with animationDelay
- **Delay calculation**: Index * animationDelay per card

#### Hover Effects
- **Feature cards**: Scale and color transitions
- **CTA button**: Standard button hover

#### Scroll-triggered Animations
- **Entrance animations**: Cards animate in with delay when mounted

### Special Features

#### Keyboard Navigation
- **Standard tab navigation**: Through feature links and CTA

#### Touch Gestures
- **None**: Standard click/tap

#### Accessibility Features
- **ARIA labels**: Link descriptions with target indication
- **Semantic HTML**: h2, h3 hierarchy, article elements
- **Role attribute**: Configurable section role
- **Alt text**: Hero image alt text
- **External link indicators**: Screen reader announcements

#### Internationalization Support
- Content from config
- Portuguese aria-label examples visible ("Abre em nova aba")

---

## 8. ProductCarousel

### Component Name
**ProductCarousel** - Three-card center-focused product carousel with dynamic subtitle

### Available Variants
- **ProductCarouselDefault** (default variant)

### Capabilities

#### Images
- **Product images**: Multiple slide images (3 cards visible at once)
- **Priority loading**: First 2 images get priority
- **Responsive sizing**:
  - Mobile: 280px
  - Tablet: 306px
  - Desktop: 360px
- **Format**: Next.js Image with fill mode
- **Loading strategy**: Eager for priority images, lazy for others

#### Text Elements
- **Carousel heading**: Fixed section title
- **Dynamic subtitle**: Changes per active slide (cross-fade animation)
- **Slide title**: Per-card title overlay
- **CTA text**: Optional per-card call-to-action

#### Icons
- **Lucide icons**: Play, Pause for carousel controls

#### Interactive Elements
- **3-card carousel**: Active center card + left/right side cards
- **Click navigation**: Click side cards to navigate
- **Dot navigation**: Slide indicators
- **Play/Pause button**: Auto-play control
- **Keyboard navigation**: Arrow keys, Home, End (configurable)
- **Swipe gestures**: Touch navigation
- **CTA links**: Per-card links with click tracking

### Layout Structure

#### Grid/Flexbox Organization
- **Flexbox carousel track**: Horizontal card arrangement
- **3-card visible**: Active (center) + 2 side cards

#### Number of Columns
- **All viewports**: 3 cards visible (1 active, 2 inactive)
- **Card positioning**: Left, center (active), right

#### Card-based or Continuous Layout
- **Card-based**: Individual product cards with image overlays

#### Background Options
- Configurable via `backgroundColor` prop
- Uses SectionContainer standard variant

### Animations

#### Auto-play/Rotation
- **Auto-play**: Configurable, default 5000ms from CSS custom property
- **Pause on hover**: Supported (configurable)
- **Play/Pause control**: Manual toggle

#### Transitions
- **Card transitions**: 800ms duration (configurable)
- **Subtitle cross-fade**: Triggered by key change on slide change
- **Active card**: Scale and position transitions
- **Smooth animations**: Cubic-bezier easing

#### Hover Effects
- **Cards**: Hover effects on inactive cards
- **Buttons**: Standard hover states

#### Scroll-triggered Animations
- Not implemented

### Special Features

#### Keyboard Navigation
- **Full keyboard support** (configurable):
  - Arrow keys: Navigate slides
  - Home: First slide
  - End: Last slide
  - Tab: Focus carousel
- **enableKeyboard** setting

#### Touch Gestures
- **Swipe support**: Left/right swipe navigation
- **Configurable thresholds**: From CSS custom properties (40px, 0.3 velocity)
- **enableTouch** setting
- **Touch action**: pan-y to prevent scroll blocking

#### Accessibility Features
- **ARIA attributes**:
  - aria-roledescription="carousel"
  - aria-live="polite" for subtitle
  - aria-atomic="true" for subtitle
  - aria-label for slides
  - aria-hidden for inactive slides
  - role="group" for cards
- **Inert attribute**: On inactive slides
- **Semantic HTML**: Proper heading structure
- **Focus management**: Tab index control
- **Disabled states**: During transitions

#### Internationalization Support
- Content from config
- Supports external translation
- **Event bus integration**: Emits carousel events

---

## 9. SectionContainer

### Component Name
**SectionContainer** - Unified wrapper component for all sections

### Available Variants
- **Container width variants**: standard (1200px), wide (1400px), narrow (custom)
- **Padding variants**: standard, hero-nav, none

### Capabilities

This is a **utility component**, not a content component. It provides:

#### Layout Standardization
- **Eliminates ~300 lines** of repeated boilerplate
- **Consistent padding**: Responsive padding from design tokens
- **Consistent max-width**: Semantic container widths
- **Background control**: Optional backgroundColor override

#### Text Elements
- **None**: Wrapper only, renders children

#### Icons
- **None**: Wrapper only

#### Interactive Elements
- **None**: Passes through children

### Layout Structure

#### Grid/Flexbox Organization
- **Nested structure**: Section wrapper → Container div → Children
- **Flexbox**: Center-aligned container

#### Number of Columns
- **Depends on children**: Container provides max-width constraint

#### Container Variants
- **standard**: 1200px max-width (var(--container-max-width-standard))
- **wide**: 1400px max-width (var(--container-max-width-wide))
- **narrow**: Custom max-width (var(--container-max-width-narrow))

#### Padding Variants
- **standard**: Standard section padding (responsive)
- **hero-nav**: Hero/navigation padding (minimal)
- **none**: No padding

#### Background Options
- **Configurable**: Via backgroundColor prop
- **Style override**: Merges with additional styles

### Animations
- **None**: Wrapper component

### Special Features

#### Accessibility Features
- **Semantic elements**: Configurable as section, div, article, main
- **ARIA support**:
  - aria-label
  - aria-labelledby
  - role attribute
- **data-testid**: Testing support

#### Flexibility
- **Memoized**: Performance optimization
- **Custom styles**: Style prop support
- **Custom classes**: className and containerClassName
- **Element override**: 'as' prop for semantic elements

---

## 10. StepGuide

### Component Name
**StepGuide** - Step-by-step numbered guide section

### Available Variants
- **StepGuideDefault** (default variant)

### Capabilities

#### Images
- **None**: Text-only component

#### Text Elements
- **Section title**: Main heading (configurable h1/h2/h3)
- **Step numbers**: Visual step indicators (e.g., "01", "02")
- **Step text**: Instruction text per step

#### Icons
- **None**: Text and numbers only

#### Interactive Elements
- **None**: Static display

### Layout Structure

#### Grid/Flexbox Organization
- **Flexbox column**: Vertical stacking
- **Ordered list**: Semantic HTML structure

#### Number of Columns
- **Single column**: Vertical step list

#### Card-based or Continuous Layout
- **Card-based**: Steps container has rounded white background

#### Background Options
- **White container**: Steps displayed in white rounded background
- **Section background**: Configurable outer background

### Animations

#### Auto-play/Rotation
- **None**: Static display

#### Transitions
- **None**: Static rendering

#### Hover Effects
- **None**: Static display

#### Scroll-triggered Animations
- Not implemented

### Special Features

#### Keyboard Navigation
- **Standard navigation**: Tab through ordered list

#### Touch Gestures
- **None**: Static display

#### Accessibility Features
- **Semantic HTML**:
  - Ordered list (ol) for steps
  - li elements for each step
  - Proper heading hierarchy
- **ARIA labels**:
  - Section aria-label
  - data-section-id for analytics
- **Screen reader support**: Step numbers marked aria-hidden (visual only)
- **List structure**: Semantic numbered list for screen readers

#### Internationalization Support
- **Full i18n support**: Uses @diboas/i18n/client
- **All text translated**: Title and step text via formatMessage

---

## 11. StickyFeaturesNav

### Component Name
**StickyFeaturesNav** - Card-based feature showcase with scroll stacking

### Available Variants
- **StickyFeaturesNavDefault** (default variant)

### Capabilities

#### Images
- **Feature images**: One image per feature item (fill mode)
- **Lazy loading**: All images lazy-loaded
- **Responsive sizing**: 100vw mobile, 50vw desktop
- **Format**: Next.js Image optimization

#### Text Elements
- **Main title**: Section heading (h2)
- **Card heading**: Per-feature heading (h3)
- **Card description**: Feature explanation
- **CTA text**: Link text per feature

#### Icons
- **None**: Text-based links with ">" character

#### Interactive Elements
- **Feature cards**: Clickable article elements
- **CTA links**: Per-feature links (supports external targets)
- **Click callbacks**: onCTAClick handler

### Layout Structure

#### Grid/Flexbox Organization
- **Flexbox column**: Vertical card stacking
- **Two-column card content** (desktop): Image left, text right

#### Number of Columns
- **Mobile**: 1 column (stacked image and text)
- **Desktop**: 2 columns per card (image + text)

#### Card-based or Continuous Layout
- **Card-based**: Individual article cards

#### Background Options
- Configurable via `backgroundColor` prop
- Uses SectionContainer narrow variant

### Animations

#### Auto-play/Rotation
- **None**: User scroll-controlled

#### Transitions
- **Scroll stacking**: Cards stack on scroll with z-index layering
- **CSS custom properties**: --card-index, --card-z-index per card

#### Hover Effects
- **CTA links**: Standard link hover effects

#### Scroll-triggered Animations
- **Sticky positioning**: Cards stack as user scrolls
- **Z-index layering**: Cards layer on top of each other

### Special Features

#### Keyboard Navigation
- **Standard tab navigation**: Through feature links

#### Touch Gestures
- **None**: Standard scroll behavior

#### Accessibility Features
- **Semantic HTML**:
  - article elements for cards
  - h2, h3 heading hierarchy
- **ARIA labels**:
  - Section aria-label
  - Descriptive link labels
- **Target indication**: External link aria-labels
- **Image alt text**: Per-feature alt attributes

#### Internationalization Support
- **Full i18n support**: Uses @diboas/i18n/client
- **All content translated**: Title, headings, descriptions, CTA text via formatMessage
- **Memoization**: useMemo for flattened items to prevent re-renders

---

## Cross-Component Patterns

### Factory Pattern
All components use a factory pattern:
- Main export from index.ts
- Variant registry system
- Type-safe variant selection

### Shared Hooks
Multiple components use shared custom hooks:
- **useCarousel**: AppFeaturesCarousel, ProductCarousel, FeatureShowcase
- **useImageLoading**: AppFeaturesCarousel, ProductCarousel, FeatureShowcase
- **useSwipeGesture**: AppFeaturesCarousel, ProductCarousel, FeatureShowcase
- **usePerformanceMonitoring**: BenefitsCards, BgHighlight, HeroDefault, FeatureShowcase
- **useTranslation (@diboas/i18n/client)**: BenefitsCards, BgHighlight, FAQAccordion, StepGuide, StickyFeaturesNav

### Design Token System
All components use CSS custom properties from centralized design tokens:
- Typography tokens (font-size, line-height, font-weight)
- Spacing tokens (padding, margin, gap)
- Color tokens (backgrounds, text, accents)
- Animation tokens (duration, easing)
- Layout tokens (max-width, breakpoints)

### Accessibility Standards
Common accessibility features across all components:
- ARIA labels and roles
- Semantic HTML5 elements
- Keyboard navigation support
- Focus management
- Reduced motion support
- High contrast mode support
- Screen reader optimization

### Internationalization
Components using i18n:
- BenefitsCards
- BgHighlight
- FAQAccordion
- StepGuide
- StickyFeaturesNav

Components using config-based content:
- AppFeaturesCarousel
- FeatureShowcase
- HeroSection
- OneFeature
- ProductCarousel

### Performance Optimizations
- Next.js Image component (all image-based components)
- Priority loading for above-fold content
- Lazy loading for below-fold content
- React.memo on SectionContainer
- Performance monitoring with render time tracking
- Image loading state management

---

## Summary Statistics

- **Total Components**: 11
- **Total Variants**: 13
  - Single variant: 9 components
  - Two variants: 2 components (HeroSection, FeatureShowcase)
- **Components with Carousels**: 3 (AppFeaturesCarousel, ProductCarousel, FeatureShowcase)
- **Components with i18n**: 5
- **Components with Images**: 9
- **Interactive Components**: 7
- **Static Display Components**: 4
- **Components with Keyboard Nav**: 3 (ProductCarousel, FAQAccordion, FeatureShowcase)
- **Components with Touch Gestures**: 3 (carousels)
- **Components with Auto-play**: 2 (AppFeaturesCarousel, ProductCarousel)

---

## Quick Reference Matrix

| Component | Images | i18n | Interactive | Carousel | Animations | Keyboard Nav |
|-----------|--------|------|-------------|----------|------------|--------------|
| AppFeaturesCarousel | ✅ Multiple | ❌ | ✅ | ✅ | ✅ | ❌ |
| BenefitsCards | ✅ Icons | ✅ | ❌ | ❌ | ✅ Hover | ✅ |
| BgHighlight | ✅ Background | ✅ | ❌ | ❌ | ❌ | ❌ |
| FAQAccordion | ❌ | ✅ | ✅ | ❌ | ✅ Expand | ✅ |
| FeatureShowcase | ✅ Single | ❌ | ✅ | ✅ Manual | ✅ | ✅ |
| HeroSection | ✅ Multiple | ❌ | ✅ CTA | ❌ | ❌ | ✅ |
| OneFeature | ✅ Single | ❌ | ✅ | ❌ | ✅ Entrance | ✅ |
| ProductCarousel | ✅ Multiple | ❌ | ✅ | ✅ | ✅ | ✅ |
| SectionContainer | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| StepGuide | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| StickyFeaturesNav | ✅ Multiple | ✅ | ✅ | ❌ | ✅ Scroll | ✅ |

---

**Note:** This guide is automatically generated based on component analysis. For implementation details, refer to individual component source files and TypeScript type definitions.
