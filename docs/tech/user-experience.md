# User Experience Guide

> **diBoaS platform user experience design, transaction wizards, and domain-specific UX flows**

## Overview

Comprehensive UX framework supporting Banking, Investing, and DeFi operations with transaction wizards, real-time status tracking, mascot-driven guidance, and Nubank-inspired 3-part content strategy (Promote → Trust → Action).

## Transaction Wizard Framework

### Core Wizard Service
**Features**:
- Multi-step guided transaction flows
- Domain-specific customization (Banking, Investing, DeFi)
- Intelligent navigation with validation
- Balance-aware transaction types
- Mascot guidance integration
- Real-time fee calculation
- Security context preservation

**Wizard State Management**:
- Current step tracking with progress calculation
- Form data persistence across steps
- Validation results per step
- Navigation controls (forward, back, skip)
- Estimated completion time
- Security context binding

### Wizard Components
**Core Components**:
- WizardHeader: Progress indicator, back/cancel controls
- MascotGuidance: Contextual help and tips
- WizardStepRenderer: Dynamic step content
- WizardNavigation: Step navigation controls
- WizardProgress: Visual progress bar

**Step Validation**:
- Real-time form validation
- Error messages with mascot guidance
- Suggestions for error resolution
- Business rule validation
- Security checks

## Domain-Specific Transaction Wizards

### Banking Transaction Wizard

**Transaction Types**:
- Deposit: amount → bank_account → compliance → review → confirm
- Withdrawal: amount → destination → compliance → fees → review → confirm
- Wire Transfer: recipient → amount → compliance → fees → review → confirm
- ACH Transfer: recipient → amount → bank_account → review → confirm

**Key Features**:
- KYC/AML compliance checks
- Bank account linking
- Fee transparency
- Security verification (2FA, biometric)
- Estimated completion time

**Mascot**: Acqua (friendly, helpful, trustworthy)

### Investing Transaction Wizard

**Transaction Types**:
- Crypto Purchase: asset → amount → exchange → fees → review → confirm
- Crypto Sale: asset → amount → exchange → fees → tax_implications → review → confirm
- Portfolio Rebalance: current → target → trades → fees → review → confirm
- Stop Loss Order: asset → trigger → amount → exchange → review → confirm

**Key Features**:
- Real-time market data integration
- Exchange comparison (fees, liquidity, speed)
- Order preview with slippage estimation
- Risk assessment
- Tax implications display

**Mascot**: Mystic (analytical, insightful, strategic)

### DeFi Strategy Wizard

**Transaction Types**:
- Yield Strategy: protocol → pool → amount → gas → risks → review → confirm
- Liquidity Provision: pair → amounts → slippage → gas → review → confirm
- Strategy Withdrawal: strategy → amount → gas → fees → review → confirm
- Strategy Compound: strategy → compounding_options → gas → review → confirm

**Key Features**:
- Protocol selection with security audit status
- Pool comparison (APY, impermanent loss risk, TVL)
- Gas optimization
- Risk assessment (protocol risk, impermanent loss, smart contract audit)
- Yield projections

**Mascot**: Coral (confident, innovative, risk-aware)

## Real-Time Status Tracking

### Status Service Features
**Real-Time Updates via WebSocket**:
- Subscribe to transaction updates
- Instant status notifications
- Push notifications for significant changes
- Connection status monitoring

**Status Enrichment**:
- User-friendly status messages
- Mascot animations per status
- Progress percentage calculation
- Estimated completion time
- Next steps guidance
- Action required alerts

**Status Transitions**:
- INITIATED → VALIDATING → BALANCE_RESERVED
- SENT_TO_PROVIDER → PROVIDER_PROCESSING → PROVIDER_CONFIRMING
- COMPLETED / FAILED / EXPIRED

### Status Display Components

**TransactionStatusTracker**:
- Real-time WebSocket connection
- Mascot status display with animations
- Progress bar with percentage
- User-friendly status messages
- Next steps display
- Action required indicators

**Status Messages by Type**:
- Deposit: "Your $X deposit is being processed"
- Withdrawal: "Preparing your $X withdrawal"
- Crypto Purchase: "Exchange is executing your order"
- Yield Strategy: "Protocol is setting up your strategy"

## Unified Status Tracking Across Domains

### Cross-Domain Status Component

**Domain-Specific Progress**:
- Banking: INITIATED (10%) → KYC (25%) → COMPLIANCE (40%) → BANK_PROCESSING (65%) → CLEARING (85%) → COMPLETED (100%)
- Investing: INITIATED (15%) → ORDER_PLACED (35%) → ORDER_FILLED (70%) → SETTLEMENT_PENDING (90%) → COMPLETED (100%)
- DeFi: INITIATED (10%) → SMART_CONTRACT (30%) → BLOCKCHAIN_CONFIRMATION (60%) → YIELD_CALCULATION (85%) → COMPLETED (100%)

### Domain-Specific Status Indicators

**DeFi Indicators**:
- Gas Tracker: Current gas price, network congestion, estimated vs actual gas
- Protocol Status: Protocol health, TVL, current APY
- Yield Progress: Total earned, current APY, historical data, projections

**Banking Indicators**:
- Compliance Status: KYC, AML, sanctions check
- Bank Processing: Bank name, processing time, timeline
- Clearing Status: Current phase, estimated completion

**Investing Indicators**:
- Market Status: Current price, price change, trend chart
- Order Status: Order type, fill status, executed vs total amount
- Settlement Status: Current phase, estimated completion, phases

## Mascot-Driven User Guidance

### Mascot System

**Three Mascots**:

1. **Acqua** (Teal/Cyan colors):
   - Personality: Friendly, helpful, trustworthy
   - Specialties: Banking, basic investing, onboarding, balance overview
   - User Level: Beginner
   - Domains: Welcome, dashboard, banking operations, basic buy/sell crypto

2. **Mystic** (Purple colors):
   - Personality: Analytical, insightful, strategic
   - Specialties: Advanced investing, DeFi strategy (goal-driven), risk management
   - User Level: Intermediate
   - Domains: Advanced investing, DeFi strategy, risk management

3. **Coral** (Red/Coral colors):
   - Personality: Confident, innovative, risk-aware
   - Specialties: Advanced DeFi strategies, in-depth goal-driven strategies
   - User Level: Advanced
   - Domains: Advanced DeFi strategy (goal-driven)

### Guidance System

**Context-Aware Guidance**:
- Domain-based mascot selection
- User level adaptation
- Action-specific animations
- Contextual messages
- Step-specific tips
- Error resolution guidance

**Animations & Emotions**:
- Waving (welcome)
- Thinking (processing)
- Celebrating (success)
- Sympathetic (error)
- Monitoring (waiting)
- Focused (working)

**Error Handling**:
- Insufficient balance: "Let me show you your available balance"
- Invalid amount: "Let's adjust that amount to the acceptable range"
- Invalid address: "I can help you verify that address format"
- KYC required: "Let's complete your verification quickly"
- Gas too low: "Let's increase the gas fee for smooth processing"

### Interactive Mascot Components

**InteractiveMascot**:
- Click interaction for tips
- Message bubbles with emotion indicators
- Support actions (quick help buttons)
- Tips panel with navigation
- Timestamp display

**Message Bubbles**:
- Emotion-based styling
- Mascot name display
- Timestamp
- Clickable for more info

## Progressive Disclosure UX Patterns

**Principles**:
- Information revealed at optimal moments
- Prevent cognitive overload
- Step-by-step complexity introduction
- Context-sensitive help
- Advanced features hidden by default

**Implementation**:
- Collapsible advanced options
- Tooltip explanations
- "Learn more" expandable sections
- Feature discovery based on user level
- Gradual feature unlocking

## Error Recovery & User Support

### Error Types & Recovery

**Validation Errors**:
- Inline error messages
- Field-specific guidance
- Mascot suggestions
- Auto-correction where possible

**Network Errors**:
- Automatic retry with exponential backoff
- Connection status indicator
- Offline mode support
- Data persistence

**Business Logic Errors**:
- Clear explanation of constraint
- Alternative solutions
- Link to support resources
- Transaction history reference

### Support Actions
- Contact support
- View help articles
- Schedule callback
- Live chat (for premium users)
- FAQ quick links

## Nubank-Inspired 3-Part Content Strategy

### Framework: Promote → Trust → Action

**Phase 1: PROMOTE** (Showcase benefits):
- Feature highlights
- Benefit explanations
- Use case demonstrations
- Value proposition clarity

**Phase 2: TRUST** (Build credibility):
- Security certifications
- Transparency reports
- User testimonials
- Regulatory compliance
- Real-time data
- Fee transparency

**Phase 3: ACTION** (Clear CTA):
- Compelling headline
- Clear button text
- Reassurance text
- Secondary options
- No friction

### Subdomain Strategy

**Marketing (diboas.com)**:
- Weight: 60% Promote, 30% Trust, 10% Action
- Trust builders: Security certs, testimonials, transparency, compliance
- CTA: Soft signup prompts

**Consumer App (app.diboas.com)**:
- Weight: 30% Promote, 20% Trust, 50% Action
- Trust builders: Real-time balances, fee transparency, security indicators
- CTA: Transaction-focused

**Business App (business.diboas.com)**:
- Weight: 25% Promote, 50% Trust, 25% Action
- Trust builders: Enterprise certs, audit reports, SLA guarantees, dedicated support
- CTA: Enterprise onboarding

## Trust-Building Component Patterns

### DeFi-Specific Trust Components

**Security Assurance**:
- Bank-level security badge
- Multi-signature wallets
- Cold storage protection
- Real-time fraud monitoring
- Security feature list (for advanced users)

**Transparency Indicator**:
- Current APY display
- Total fees breakdown
- Risk level indicator
- "View Full Breakdown" link
- Historical data access

**Social Proof**:
- "Trusted by 50,000+ Users"
- Testimonial carousel
- User avatars and quotes
- Verified user badges

## Multi-Subdomain Navigation Experience

### Context-Aware Navigation

**Cross-Subdomain Transitions**:
- Marketing → App: Require authentication, store intended destination
- App → Business: Upgrade user context
- Intra-subdomain: Preserve state

**State Synchronization**:
- Secure state transfer between subdomains
- Encrypted transfer tokens (5-minute expiry)
- Session continuity
- User context preservation

### Navigation Security
- Authentication checks
- Intended destination storage
- Secure token-based transfer
- Session validation
- User verification

## Accessibility & Inclusive Design

**WCAG 2.1 AA Compliance**:
- Keyboard navigation support
- Screen reader optimization
- Color contrast ratios (4.5:1 minimum)
- Focus indicators
- Alt text for images
- ARIA labels

**Inclusive Features**:
- Multiple language support
- Adjustable font sizes
- High contrast mode
- Reduced motion option
- Clear error messages
- Simple language

## Mobile-First Responsive Design

**Breakpoints**:
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

**Mobile Optimizations**:
- Touch-friendly targets (44x44px minimum)
- Simplified navigation
- Bottom navigation bar
- Swipe gestures
- Mobile-optimized wizards
- Reduced data usage

**Responsive Patterns**:
- Stacked layouts on mobile
- Collapsible sections
- Hamburger menus
- Modal dialogs instead of popovers
- Progressive enhancement

## Performance-Optimized UX

**Loading States**:
- Skeleton screens for content
- Progressive image loading
- Lazy loading for below-fold content
- Optimistic UI updates

**Perceived Performance**:
- Instant feedback on interactions
- Loading animations
- Progress indicators
- Preloading critical resources
- Service worker caching

**Performance Targets**:
- Time to Interactive: < 3s
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1
- First Input Delay: < 100ms

## Summary

The diBoaS user experience framework provides:

1. **Transaction Wizards**: Multi-step guided flows for Banking, Investing, and DeFi
2. **Real-Time Status Tracking**: WebSocket-powered live updates with rich context
3. **Mascot-Driven Guidance**: Three mascots (Acqua, Mystic, Coral) for personalized help
4. **Domain-Specific UX**: Tailored experiences for each financial domain
5. **Progressive Disclosure**: Information revealed at optimal moments
6. **3-Part Content Strategy**: Promote → Trust → Action framework (Nubank-inspired)
7. **Trust-Building Components**: Security, transparency, and social proof
8. **Multi-Subdomain Navigation**: Seamless cross-domain experiences
9. **Accessibility-First**: WCAG 2.1 AA compliance, inclusive design
10. **Mobile-Optimized**: Touch-friendly, responsive, progressive enhancement
11. **Error Recovery**: Intelligent handling with clear resolution paths
12. **Performance-Optimized**: Fast, smooth interactions with minimal loading

---

**For implementation details**: See frontend-condensed.md, design-system-condensed.md, and backend-condensed.md
