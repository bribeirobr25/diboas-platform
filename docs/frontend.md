# Frontend Guide

> **React components, pages, and UI patterns for diBoaS platform**

## Overview

Next.js 15 frontend across three subdomains with domain-separated architecture:
- `diboas.com` - Marketing website
- `app.diboas.com` - Consumer application
- `business.diboas.com` - B2B application

## Component Hierarchy

### Level 1: Primitives (95% reuse)
**Package**: `@diboas/design-system`
- Button (variants: primary, secondary, outline, ghost)
- Input (with validation states)
- Card (variants: default, elevated, accent, gradient)
- Typography (h1-h6, body, caption)
- Layout (Container, Grid, Stack)

### Level 2: Patterns (85% reuse)
**Package**: `@diboas/shared-patterns`
- Modal (sizes: sm, md, lg, xl, fullscreen)
- Navigation (header, sidebar, breadcrumb)
- Footer
- Pagination
- Tabs

### Level 3: Marketing UI (80% reuse)
**Package**: `@diboas/marketing-ui`
- Hero Section (variants: centered, split, background-image)
- Feature Promotion
- Trust Builder (security badges, testimonials)
- CTA Section

### Level 4: App-Specific (70% reuse)
**Packages**: `@diboas/app-ui`, `@diboas/business-ui`
- Dashboard widgets
- Transaction wizards
- Portfolio charts
- Balance cards
- Data visualization

## Key Pages

### Marketing (diboas.com)
- `/` - Homepage with hero, features, CTA
- `/learn/*` - Educational content
- `/rewards/*` - Gamification and rewards
- `/business/*` - B2B landing pages
- `/security/*` - Trust-building content

### Consumer App (app.diboas.com)
- `/dashboard` - Main dashboard with balance overview
- `/banking` - Banking operations (Add, Send, Withdraw)
- `/investing` - Buy/Sell crypto, portfolio management
- `/strategy` - DeFi strategies (Start, Stop, Manage)
- `/transactions` - Transaction history

### Business App (business.diboas.com)
- `/dashboard` - Enterprise dashboard
- `/treasury` - Treasury management
- `/analytics` - Business intelligence
- `/integration` - API integration

## Mascot Integration

### Acqua (Beginner - Aqua)
- **Usage**: Banking, basic investing, onboarding
- **Contexts**: Homepage, banking operations, beginner help
- **Colors**: primary-500, primary-600

### Mystic (Intermediate - Purple)
- **Usage**: Advanced investing, strategy, portfolio
- **Contexts**: Investment pages, market insights
- **Colors**: secondary-purple-500, secondary-purple-600

### Coral (Advanced - Coral)
- **Usage**: Advanced DeFi, complex strategies
- **Contexts**: DeFi strategies, expert features
- **Colors**: secondary-coral-500, secondary-coral-600

## State Management

### Balance Management
- Hook: `useBalanceAggregation()`
- Aggregates across all domains (banking, investing, strategy)
- Real-time updates via WebSocket
- Automatic refresh every 30 seconds

### Transaction Management
- Context: `TransactionProvider`
- Hook: `useTransactions()`
- Real-time status tracking
- WebSocket for live updates

### Fee Management
- Hook: `useFeeManagement()`
- 5-tier fee breakdown:
  1. Platform fees
  2. Provider fees
  3. Network fees
  4. Compliance fees
  5. Premium features
- Fee optimization suggestions

## Real-Time Updates

### WebSocket Integration
- Balance updates
- Transaction status changes
- Fee updates
- Market data
- Automatic reconnection with exponential backoff

### Implementation
- Connection: `wss://api.diboas.com/realtime?userId={userId}`
- Event types: BALANCE_UPDATE, TRANSACTION_STATUS, FEE_UPDATE, MARKET_DATA
- Max reconnect attempts: 5
- Reconnect delay: Exponential (1s, 2s, 4s, 8s, 16s)

## Transaction Workflows

### Progressive Multi-Step Flow
1. **Selection** - Choose transaction type and amount
2. **Configuration** - Set parameters and preferences
3. **Confirmation** - Review fees and details
4. **Execution** - Process transaction

### Wizard Components
- Progress indicator (current step/total steps)
- Step navigation (back/continue)
- Form validation per step
- Fee breakdown modal
- Real-time status updates

### Transaction Types
- **Banking**: Add, Send, Withdraw
- **Investing**: Buy, Sell
- **DeFi**: Start Strategy, Stop Strategy

## Responsive Design

### Breakpoints
- `sm`: 640px - Mobile
- `md`: 768px - Tablet
- `lg`: 1024px - Laptop
- `xl`: 1280px - Desktop
- `2xl`: 1536px - Large desktop

### Mobile-First Approach
- Base styles for mobile
- Progressive enhancement for larger screens
- Touch-optimized interactions (44px minimum touch targets)
- Bottom navigation for mobile apps

## Accessibility

### WCAG 2.1 AA Compliance
- Color contrast: 4.5:1 for normal text, 3:1 for large text
- Keyboard navigation support
- Screen reader labels (`aria-label`, `aria-describedby`)
- Focus indicators on all interactive elements
- Semantic HTML structure

### Accessibility Features
- Skip to main content link
- Keyboard shortcuts (Ctrl/Cmd + K for command palette)
- Status announcements (`aria-live`)
- Focus management in modals

## Performance Optimization

### Code Splitting
- Lazy loading for heavy components
- Dynamic imports for below-fold content
- Domain-based bundle splitting (banking, investing, defi)
- Vendor chunk separation

### Image Optimization
- Next.js Image component
- WebP and AVIF formats
- Lazy loading with placeholder blur
- Priority loading for above-fold images

### Caching Strategy
- Static page caching
- API response caching with revalidation
- CDN for static assets
- Service Worker for offline support

### Performance Targets
- LCP < 2.5s (Largest Contentful Paint)
- FID < 100ms (First Input Delay)
- CLS < 0.1 (Cumulative Layout Shift)
- Bundle size < 300KB per route

## SEO Implementation

### Dynamic Metadata
- Title and description per page
- Open Graph tags
- Twitter Card tags
- Canonical URLs

### Structured Data
- JSON-LD for rich snippets
- Organization schema
- FinancialProduct schema
- Breadcrumb schema

### Sitemap & Robots
- Dynamic sitemap generation
- Robots.txt configuration
- Per-page indexing control

## Content Strategy

### Three-Part Framework (Nubank-inspired)

**1. Promote**
- Primary feature/benefit
- Differentiators
- Technical advantages

**2. Trust**
- Security evidence
- Certifications (SOC 2, ISO 27001)
- Social proof
- Audit reports

**3. Action**
- Clear CTA
- Address objections/barriers
- Provide incentives
- Multiple entry points

## Multi-Subdomain Navigation

### Context-Aware Navigation
- Marketing: Products, Business, Learn, Rewards, Security
- Consumer App: Dashboard, Banking, Investing, Strategy, Transactions
- Business App: Dashboard, Treasury, Payments, Analytics, Integration

### Cross-Subdomain Consistency
**Must be consistent**:
- Logo placement and sizing
- Primary brand colors
- Mascot personalities
- Core typography
- Icon library

**Can be adapted**:
- Color emphasis
- Component sizing
- Layout density
- Interaction patterns
- Content strategy

## Development Workflow

### Component Development
1. Create in appropriate package level
2. Add TypeScript interfaces
3. Style with Tailwind + CSS Modules
4. Add design tokens
5. Create Storybook stories
6. Write tests
7. Document props

### Adding New Pages
1. Define page objectives (Promote → Trust → Action)
2. Choose appropriate components
3. Implement SEO metadata
4. Add analytics tracking
5. Test responsiveness
6. Verify accessibility

### Performance Checklist
- [ ] Code splitting implemented
- [ ] Images optimized
- [ ] Critical CSS inlined
- [ ] Lazy loading for heavy components
- [ ] API calls cached
- [ ] Bundle size < target

## Key Hooks

### Balance
- `useBalanceAggregation()` - Unified balance across domains
- `useBankingBalance()` - Banking-specific balance
- `usePortfolio()` - Investment portfolio
- `useDeFiStrategies()` - Active DeFi strategies

### Transactions
- `useTransactions()` - Transaction state management
- `useTransactionStatus(id)` - Real-time status
- `useFeeCalculation(request)` - Fee breakdown

### Data
- `useMarketData()` - Real-time market prices
- `useUserProfile()` - User information
- `useRealTimeUpdates()` - WebSocket connection

### UI
- `useDebounce(value, delay)` - Debounced values
- `useLocalStorage(key)` - Persistent local state
- `useMediaQuery(query)` - Responsive breakpoints

## Error Handling

### Error Boundaries
- Page-level error boundary
- Section-level error boundaries
- Component-level fallbacks

### User Feedback
- Toast notifications
- Inline error messages
- Loading skeletons
- Empty states

## Testing Strategy

### Unit Tests
- Component rendering
- User interactions
- State changes
- Hooks behavior

### Integration Tests
- Multi-step workflows
- API integration
- Real-time updates
- Navigation flows

### E2E Tests
- Critical user paths
- Transaction flows
- Authentication
- Cross-browser compatibility

## Summary

diBoaS frontend provides:

1. **Hierarchical Component System**: 95% reuse at primitive level down to 70% at app level
2. **Domain Separation**: Clear boundaries between marketing, consumer, and business apps
3. **Real-Time Updates**: WebSocket integration for live data
4. **Progressive Workflows**: User-friendly transaction wizards
5. **Trust-First Design**: Security-focused UI components
6. **Performance**: Optimized loading and caching
7. **Accessibility**: WCAG 2.1 AA compliant
8. **SEO**: Dynamic metadata and structured data
9. **Mascot Integration**: Contextual AI guide system
10. **Multi-Subdomain**: Consistent yet context-appropriate design

---

**For implementation details**: See component documentation in Storybook and refer to design system tokens
