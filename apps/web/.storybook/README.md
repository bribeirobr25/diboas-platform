# Storybook Component Documentation

This Storybook instance provides comprehensive documentation and interactive examples for all section components built with the Component Factory Pattern.

## Getting Started

```bash
# From the apps/web directory
cd apps/web

# Start Storybook development server
pnpm run storybook

# Build Storybook for production
pnpm run build-storybook
```

Storybook will be available at [http://localhost:6006](http://localhost:6006)

## Available Stories

### Section Components

- **HeroSection** - Hero variants with visual elements and content
- **FeatureShowcase** - Interactive carousel for feature presentation
- **ProductCarousel** - Auto-playing product showcase carousel
- **AppFeaturesCarousel** - Feature cards with rotation and layouts
- **SecurityOneFeature** - Security-focused feature presentation

## Key Features

### Component Factory Pattern
All components use the factory pattern for variant selection, providing:
- Consistent API across all sections
- Easy variant switching
- Centralized configuration management

### Design System Integration
- **Design Tokens**: All components use centralized design tokens
- **Theme Support**: Light, dark, and high-contrast themes
- **Responsive Design**: Mobile-first approach with breakpoint testing

### Accessibility & Performance
- **WCAG AA Compliance**: All components meet accessibility standards
- **Performance Monitoring**: Integrated render time tracking
- **Image Optimization**: Next.js Image with responsive loading

### Interactive Testing
- **Viewport Testing**: Mobile, tablet, and desktop breakpoints
- **Theme Testing**: All theme variants available
- **Analytics Simulation**: Performance monitoring examples

## Development Guidelines

### Story Structure
Each component includes:
- **Default variants** - Standard implementations
- **Custom content** - Customization examples
- **Responsive tests** - Mobile/tablet/desktop views
- **Theme tests** - Light/dark/high-contrast themes
- **Performance tests** - Analytics and monitoring examples
- **Accessibility tests** - WCAG compliance demonstrations

### Best Practices
- Use the **Controls** panel to test different configurations
- Test **all viewport sizes** for responsive behavior
- Verify **accessibility** with screen readers and keyboard navigation
- Check **performance** with browser dev tools
- Test **theme switching** for design token consistency

## Testing Checklist

When adding new stories:
- [ ] Include all component variants
- [ ] Test mobile, tablet, and desktop viewports
- [ ] Test all theme variants (light, dark, high-contrast)
- [ ] Include accessibility tests
- [ ] Add performance monitoring examples
- [ ] Document component API and features
- [ ] Include interactive playground story

## Configuration

### Main Configuration
- **main.ts** - Storybook configuration with Next.js integration
- **preview.ts** - Global parameters, themes, and decorators

### Addons
- **Essentials** - Controls, docs, actions, viewport
- **A11y** - Accessibility testing and auditing
- **Viewport** - Responsive design testing
- **Docs** - Automated documentation generation

## Documentation Standards

### Story Naming
- Use descriptive names that indicate the story purpose
- Group related stories logically
- Include context for business scenarios

### Documentation
- Provide clear component descriptions
- Document all props and configuration options
- Include usage examples and best practices
- Explain architectural patterns and principles

## Quality Assurance

### Performance
- All stories include performance monitoring examples
- Bundle size impact is documented
- Loading strategies are optimized

### Accessibility
- WCAG AA compliance verified
- Keyboard navigation tested
- Screen reader compatibility confirmed
- High contrast themes available

### Browser Compatibility
- Modern browser support (ES2020+)
- CSS custom properties for theming
- Next.js Image optimization support

## Analytics Integration

Stories demonstrate:
- Performance monitoring setup
- Analytics event tracking
- Error boundary implementation
- Custom metrics recording

## Design System

### Tokens
- **Colors** - Semantic color tokens with theme support
- **Typography** - Responsive font scales
- **Spacing** - Systematic spacing scale
- **Breakpoints** - Mobile-first responsive breakpoints

### Components
- **Factory Pattern** - Consistent variant selection
- **Configuration Management** - Centralized content and settings
- **Error Handling** - Graceful degradation and fallbacks

---

*This Storybook instance is maintained alongside the component library. Please update stories when adding new variants or changing component APIs.*