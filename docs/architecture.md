# System Architecture

> **Essential architectural decisions and patterns for the diBoaS platform**

## Overview

3-app Next.js architecture across subdomains:
- `diboas.com` - Marketing website
- `app.diboas.com` - Consumer application
- `business.diboas.com` - B2B application

## Core Architecture Principles

### 1. Domain-Driven Design (DDD)
- **Three domains**: Banking, Investing, DeFi
- Each domain is self-contained with clear boundaries
- Domain logic isolated in shared packages
- Cross-domain communication via events only

### 2. Monorepo Structure
```
apps/                    # Next.js applications
  web/                   # Marketing
  app/                   # Consumer app
  business/              # B2B app

packages/                # Shared packages
  banking/               # Banking domain
  investing/             # Investing domain
  defi/                  # DeFi domain
  integrations/          # Provider integrations
  design-system/         # UI design system
  primitives/            # Base components (95% reuse)
  patterns/              # Layout patterns (85% reuse)
  marketing-ui/          # Marketing components (80% reuse)
  app-ui/                # App components (70% reuse)
  business-ui/           # B2B components (70% reuse)
```

### 3. Component Reusability Hierarchy
- **Level 1**: Primitives (Button, Input, Card) - 95% reuse
- **Level 2**: Patterns (Navigation, Modal) - 85% reuse
- **Level 3**: Marketing UI (Hero, Features) - 80% reuse
- **Level 4**: App-specific UI - 70% reuse

### 4. Transaction Architecture

**Key Components**:
- **Orchestration Layer**: Coordinates multi-step transactions
- **Provider Abstraction**: Service-agnostic integration layer
- **Outbox Pattern**: Ensures reliable event delivery
- **Idempotency**: Prevents duplicate processing

**Transaction Flow**:
1. User initiates transaction
2. Orchestrator validates and coordinates
3. Domain service executes business logic
4. Provider adapter interfaces with external services
5. Events published via outbox pattern
6. Results persisted and user notified

### 5. Event-Driven Architecture

**Event Types**:
- Domain Events (e.g., `BankingTransactionCompleted`)
- Integration Events (e.g., `ProviderPaymentReceived`)
- System Events (e.g., `HealthCheckFailed`)

**Event Flow**:
- Events stored in outbox table
- Background worker publishes to event bus
- Subscribers process asynchronously
- Inbox pattern for external events

### 6. Provider Integration

**Abstraction Strategy**:
- Interface-based abstractions per provider type
- Factory pattern for provider instantiation
- Adapter pattern for provider-specific logic
- Mock providers for development/testing

**Provider Types**:
- Payment (Stripe, PayPal)
- DEX (Uniswap, Jupiter)
- Blockchain (Bitcoin, Ethereum, Solana, Sui)
- Wallet (Wallet Connect, Phantom)

### 7. Database Strategy

**Schema Organization**:
- Domain-separated tables with prefixes
- Shared tables for cross-domain data
- Optimistic locking with version fields
- Audit logging for compliance

**Transaction Isolation**:
- Serializable for financial operations
- Read committed for queries
- Row-level locking where needed

### 8. Security Architecture

**Key Principles**:
- Non-custodial wallet architecture
- End-to-end encryption for sensitive data
- Rate limiting per user/endpoint
- Input validation at all layers
- Audit logging for all financial operations

### 9. Multi-Subdomain Deployment

**Subdomain Strategy**:
- Independent deployments per subdomain
- Shared authentication via JWT
- Centralized session management
- CDN for static assets

**Subdomain Configuration**:
- Marketing: High traffic, SEO optimized
- Consumer: Authenticated, real-time updates
- Business: Enterprise features, SLA guarantees

### 10. Monitoring & Observability

**Instrumentation**:
- Distributed tracing (OpenTelemetry)
- Structured logging (JSON format)
- Metrics collection (Prometheus)
- Health checks per service

**Key Metrics**:
- Transaction success rate
- API response times
- Provider availability
- Error rates by type

## Architecture Benefits

1. **Scalability**: Independent domain scaling
2. **Maintainability**: Clear boundaries and responsibilities
3. **Reliability**: Event-driven decoupling and retry mechanisms
4. **Flexibility**: Provider-agnostic design
5. **Developer Experience**: Monorepo with shared tooling
6. **Code Reuse**: Hierarchical component system
7. **Security**: Defense in depth with multiple layers
8. **Compliance**: Audit trail and data isolation

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Next.js 15 | SSR, performance, developer experience |
| Turborepo | Efficient monorepo builds |
| Domain packages | Encapsulation and reusability |
| Event-driven | Loose coupling, scalability |
| Outbox pattern | Reliable event delivery |
| Provider abstraction | Vendor independence |
| Non-custodial wallets | User asset ownership |

## Technology Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, CSS Modules
- **State**: React Context, Server Components
- **Database**: PostgreSQL with Prisma
- **Cache**: Redis
- **Queue**: BullMQ
- **API**: REST (Next.js API Routes)
- **Auth**: NextAuth.js
- **Monitoring**: OpenTelemetry, Sentry

---

**For detailed implementation**: See domain-specific documentation (backend.md, frontend.md, database.md)
