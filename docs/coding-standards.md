# Coding Standards & Best Practices

> **The 12 Principles of Excellence for building robust, maintainable fintech applications**

## Core Principles

### 1. Domain-Driven Design (DDD)
- Organize code around business domains (Banking, Investing, DeFi)
- Each domain is self-contained with clear boundaries
- Domain services don't directly call other domains
- Use events for cross-domain communication

### 2. Event-Driven Architecture
- All significant state changes emit events
- Events include: `eventId`, `eventType`, `timestamp`, `correlationId`, `domain`, `payload`, `metadata`
- Event naming: `[Domain][Entity][Action]Event`
- Example: `BankingTransactionCompletedEvent`, `InvestingOrderExecutedEvent`

### 3. Service Agnostic Abstraction Layer
- Never depend directly on external services
- Always use interface-based abstractions
- Provider implementations are swappable
- Factory pattern for provider instantiation

### 4. Code Reusability & DRY
- Write code once, use everywhere
- Create shared utilities and components
- Extract common patterns to packages
- Avoid duplication across domains

### 5. Semantic Naming Conventions

**Services & Classes**:
- Pattern: `[Domain][Entity][Action/Purpose]Service`
- Examples: `BankingTransactionValidationService`, `InvestingPortfolioCalculationService`

**Functions**:
- Pattern: `[verb][Entity][Condition]`
- Examples: `validateBankingTransactionAmount`, `calculateInvestingPortfolioValue`

**Constants**:
- Pattern: `SCREAMING_SNAKE_CASE` with context
- Examples: `MAX_BANKING_DAILY_WITHDRAWAL_LIMIT`, `INVESTING_ORDER_EXPIRY_MINUTES`

**API Endpoints**:
- Pattern: `/api/v{version}/{domain}/{resource}/{action}`
- Examples: `/api/v1/banking/transactions/deposit`, `/api/v1/investing/portfolio/summary`

**Database**:
- Tables: `domain_entity` (plural)
- Columns: `snake_case`
- Examples: `banking_transactions`, `investing_portfolios`

### 6. File Decoupling & Organization
- Single responsibility per file
- Services: Max 200 lines (prefer 100-150)
- Components: Max 150 lines (prefer 80-120)
- Utilities: Max 100 lines per file
- Break large files into focused modules

### 7. Error Handling & System Recovery
- Never let the system crash
- Implement retry logic with exponential backoff
- Use circuit breakers for external services
- Provide fallback strategies
- Queue operations for later retry when both primary and fallback fail
- Log all errors with correlation IDs
- Return degraded responses when appropriate

**Key Strategies**:
- Try-catch for all async operations
- Retry transient failures (network, timeout, rate limit)
- Fallback to secondary providers
- Graceful degradation with user feedback

### 8. Security & Audit Standards
- Input validation on all endpoints
- Parameterized queries (prevent SQL injection)
- Output encoding (prevent XSS)
- Rate limiting per user
- Authentication & authorization on all operations
- Encryption at rest and in transit
- Audit logging for all sensitive operations
- PII masking in logs
- Fraud detection integration

**Security Checklist**:
- ✓ Validate all inputs
- ✓ Sanitize all outputs
- ✓ Enforce rate limits
- ✓ Check authorization
- ✓ Encrypt sensitive data
- ✓ Log all financial operations
- ✓ Mask PII in logs

### 9. Performance & SEO Optimization
- Code splitting for large bundles
- Lazy loading for below-the-fold content
- Image optimization with Next.js Image
- Font optimization with next/font
- API response caching
- Database query optimization (select only needed fields)
- Preload critical resources
- Proper meta tags and structured data

**Performance Targets**:
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1
- Bundle size < 300KB per route

### 10. Product KPIs & Analytics
- Track all meaningful user interactions
- Enrich events with context (session, device, location)
- Multiple analytics providers
- Impression tracking with Intersection Observer
- Conversion funnel tracking

**Key Metrics**:
- User acquisition (signups, activations)
- Engagement (DAU, MAU, session duration)
- Transactions (volume, count, average size)
- Revenue (total, ARPU, LTV)
- Performance (latency, error rates, uptime)

### 11. Concurrency & Race Condition Prevention
- Use distributed locks for critical operations
- Database transactions with proper isolation levels
- Optimistic locking with version fields
- Queue-based processing for high-load operations
- Idempotency keys for retryable operations

**Patterns**:
- Pessimistic locking (lock before access)
- Optimistic locking (check version before update)
- Queue-based serialization
- Idempotent operations

### 12. Monitoring & Observability
- Distributed tracing (OpenTelemetry)
- Structured logging with correlation IDs
- Custom business metrics
- Health checks for all services
- Real-time alerting
- Error tracking (Sentry)

**What to Monitor**:
- Transaction success rates
- API latencies (p50, p95, p99)
- Error rates by type
- Provider availability
- Database performance
- Queue depths

## Additional Standards

### Git Commits
Format: `<type>(<scope>): <subject>`

Examples:
- `feat(banking): add deposit flow`
- `fix(investing): resolve calculation error`
- `docs(api): update authentication guide`

### Testing
- Unit tests for business logic
- Integration tests for workflows
- E2E tests for critical paths
- Minimum 80% code coverage
- Test naming: `should [expected behavior] when [condition]`

### Documentation
- JSDoc for public APIs
- Inline comments for complex logic
- README per package
- Architecture decision records (ADRs)

## Summary

Good code is:
- **Understandable** - Clear naming and structure
- **Maintainable** - Modular and well-organized
- **Secure** - Defense in depth
- **Performant** - Optimized and cached
- **Observable** - Instrumented and logged
- **Reliable** - Error-handled and tested
- **Trustworthy** - Handles people's money safely

---

**Remember**: These standards exist to ensure we build software worthy of user trust and suitable for handling financial operations.
