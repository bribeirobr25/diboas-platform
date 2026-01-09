# Infrastructure & Deployment

> **diBoaS platform infrastructure architecture, deployment strategies, monitoring, and scaling**

## Overview

Production-grade infrastructure with zero-budget start, domain-separated deployment, comprehensive monitoring, and clear scaling paths for Banking, Investing, and DeFi domains.

## Production Technology Stack

### Frontend
- Framework: Next.js 14 (App Router)
- Styling: Tailwind CSS + Custom Design System
- State: Zustand + React Query
- Testing: Jest + React Testing Library + Playwright
- PWA: Service workers for offline support

### Backend
- Runtime: Node.js 20 LTS
- Framework: Next.js API Routes + tRPC
- Database: PostgreSQL 15 + Prisma ORM
- Cache: Redis 7
- Queue: BullMQ + Redis
- Auth: NextAuth.js + custom providers
- WebSockets: Socket.IO for real-time updates

### Infrastructure
- Hosting: Vercel (Frontend) + Railway (Backend services)
- Database: Supabase / Neon PostgreSQL
- Cache: Upstash Redis
- Storage: Cloudflare R2 / AWS S3
- CDN: Cloudflare
- Monitoring: Sentry + Vercel Analytics + Grafana
- Logging: Pino + Better Stack

### Security
- Authentication: NextAuth.js + JWT + OAuth
- Authorization: RBAC with Prisma
- Encryption: AES-256-GCM for sensitive data
- Secrets: Vercel Environment Variables + HashiCorp Vault
- Rate Limit: Upstash Rate Limiting
- SSL: Let's Encrypt + Cloudflare SSL
- Firewall: Cloudflare WAF

### Third-Party Integrations
- Payments: Stripe
- Wallets: Privy / Dynamic
- Blockchain: Alchemy / Infura RPC
- Exchanges: Coinbase, Binance APIs
- DeFi: Uniswap SDK, Compound API
- Compliance: Persona / Jumio for KYC
- Communications: Twilio (SMS), SendGrid (email)
- Analytics: PostHog / Mixpanel

## Domain-Separated Deployment

### Multi-App Architecture
**Three Independent Applications**:
1. **Marketing (diboas.com)**: Public marketing site
2. **Consumer App (app.diboas.com)**: Authenticated B2C app
3. **Business App (business.diboas.com)**: B2B enterprise app

**Microservices**:
- Balance Service: Unified balance aggregation
- Fee Service: Fee calculation and optimization
- Provider Service: Third-party integration

**Shared Infrastructure**:
- PostgreSQL: Central database
- Redis: Caching and queues
- Message Queue: Event-driven communication

### Load Balancing Strategy
**Nginx Configuration**:
- Rate limiting: API (10 req/s), Auth (5 req/s)
- Static assets: 1-year caching
- API routes: No caching for balance/fees
- WebSocket: Real-time updates support
- Business app: IP whitelisting for enterprise

**Caching Strategy**:
- Static assets: Long-term (1 year)
- Learn/rewards: Medium-term (1 hour)
- API responses: Context-specific
- Balance/fees: No caching (real-time)

## Zero-Budget Deployment

### Free Tier Infrastructure ($0/month)

**Hosting**:
- Vercel Hobby Plan: 100 GB bandwidth, unlimited domains
- Supabase Free: 500 MB storage, 50K API requests/month
- Upstash Redis Free: 10K requests, 256 MB storage
- Cloudflare Free: CDN, SSL, DDoS protection, WAF

**Additional Services**:
- GitHub Actions: Background jobs (2,000 min/month)
- NextAuth.js: Free authentication
- Privy Developer: 2,500 MAU for wallets
- Sentry Developer: 5,000 errors/month
- Vercel Analytics: Included with hosting
- Let's Encrypt: Free SSL certificates

**Deployment Script**:
1. Deploy frontend/dapp to Vercel
2. Setup Supabase database
3. Configure Upstash Redis
4. Setup monitoring (Sentry)
5. Configure Cloudflare CDN
6. Set environment variables

## Cost Scaling Path

### Scaling Strategy by Growth

**Startup Phase ($0/month)**:
- Users: < 1,000 MAU
- Transactions: < 10,000/month
- Pure free tier infrastructure
- Limitations: 500MB database, 50K API requests

**Growth Phase ($100-400/month)**:
- Users: 1,000 - 10,000 MAU
- Transactions: 10,000 - 100,000/month
- Upgrades: Supabase Pro ($25), Upstash Pro ($50), Enhanced Monitoring ($50), Premium APIs ($100)
- New features: Real-time notifications, advanced analytics, customer support

**Enterprise Phase ($1,000-5,000/month)**:
- Users: 10,000+ MAU
- Transactions: 100,000+/month
- Infrastructure: Dedicated database cluster ($500), Redis cluster ($300), Enterprise monitoring ($200), Advanced security ($300), Load balancers ($200)
- Features: Multi-region, compliance tools, white-label, enterprise SLA

### Cost Optimization Strategies
- **Database**: Archive old data, cleanup automation (save $50/month)
- **CDN**: Better caching, image compression (save $100/month)
- **API**: Request batching, caching (save $75/month)
- **Monitoring**: Track usage, set alerts

## Monitoring & Observability

### Monitoring Stack (Prometheus, Loki, Grafana)

**Business Metrics**:
- Transaction volume (by type, status, domain, provider)
- User balances (by category, asset, domain)
- Fee revenue (by type, domain)
- Active users (daily, weekly, monthly)

**Technical Metrics**:
- HTTP request duration (p95, p99 latency)
- Database connections and query performance
- Provider health status (1=healthy, 0=unhealthy)
- Queue size and job status
- Error rates and patterns

**Domain-Specific Dashboards**:
- Banking: Transactions, compliance checks, KYC completion rate
- Investing: Portfolio values, asset distribution, trading volume
- DeFi: TVL, gas costs, yield by protocol, strategy performance

### Alerting Configuration

**Business Alerts**:
- High transaction failure rate (>5% for 2min)
- Low user activity (<100 daily users)

**Technical Alerts**:
- High API latency (p95 > 2s for 5min)
- Database connections high (>80 for 3min)
- Provider down (health check failed for 1min)

**Alert Channels**:
- Email to security team
- Slack #security-alerts
- PagerDuty for critical incidents

## Testing Framework

### Test Coverage Strategy

**Test Types**:
- Unit tests: 90% coverage threshold (Jest)
- Integration tests: Database + Redis services
- E2E tests: Playwright (chromium, firefox, webkit, mobile)
- Security tests: SQL injection, XSS, auth bypass, rate limiting
- Load tests: k6 scenarios (normal, spike, stress)
- Performance benchmarks: API (<200ms), Database (<50ms), Balance (<100ms), Fees (<50ms)

**Domain-Specific Test Suites**:
- Banking: Deposit, withdrawal, compliance, KYC, account linking
- Investing: Crypto purchase, portfolio management, order execution, market data
- DeFi: Yield strategies, protocol integration, gas optimization, risk assessment

**Cross-Domain Tests**:
- Deposit to invest flow
- Invest to DeFi flow
- Balance aggregation
- Fee calculation
- Transaction orchestration

## Security Infrastructure

### Network Security

**Firewall Rules**:
- Ingress: HTTPS (443), HTTP redirect (80)
- Egress: HTTPS (443), Database (5432), Redis (6379)

**DDoS Protection**:
- Provider: Cloudflare
- Settings: Medium security, browser integrity check

**WAF Rules**:
- Block SQL injection attempts
- Block XSS attempts
- Rate limit API endpoints (100/min)

**SSL Configuration**:
- Certificate: Let's Encrypt (auto-renewal)
- Protocols: TLSv1.2, TLSv1.3
- Ciphers: ECDHE-RSA-AES256-GCM, DHE-RSA-AES256-GCM

### Secrets Management

**Secure Vault**:
- Provider: Vercel Env Variables / HashiCorp Vault
- Audit logging for all secret access
- Automatic rotation policies

**Rotation Schedule**:
- Database credentials: 90 days
- API keys: 30 days
- Encryption keys: 365 days
- OAuth secrets: 180 days

**Rotation Process**:
1. Generate new secret
2. Store with version (_new suffix)
3. Update application
4. Verify new secret works
5. Archive old secret
6. Delete after 24 hours

## Database Infrastructure

### Database Optimization

**Connection Pooling**:
- Max connections: 200
- Shared buffers: 256MB
- Effective cache: 1GB
- Work memory: 4MB

**Performance Tuning**:
- Random page cost: 1.1 (for SSD)
- IO concurrency: 200
- WAL configuration for replication

**Query Monitoring**:
- Log slow queries (>1000ms)
- Log modifications
- Log checkpoints

### Backup Strategy

**Full Backups**:
- Daily full backups (compressed)
- Stored in cloud (S3-compatible)
- Retention: 30 days

**Incremental Backups**:
- Hourly incremental backups
- Retention: 7 days

**Point-in-Time Recovery**:
- WAL archiving enabled
- Restore to any point in time
- Regular recovery testing

**Backup Verification**:
- Integrity check after each backup
- Automated verification script

### Database Schema Optimization

**Indexes**:
- Users: email, created_at
- Transactions: user_id, status, domain, created_at
- Balances: user_id + domain, asset + balance_type

**Partitioning**:
- Transactions: Monthly partitions by created_at
- Audit logs: Monthly partitions by timestamp
- Automatic partition management

## CI/CD Pipeline

### GitHub Actions Workflow

**Lint and Test Job**:
- Services: PostgreSQL 15, Redis 7
- Steps: Lint, type-check, unit tests, integration tests, build, E2E tests
- Coverage: 90% threshold

**Security Scan Job**:
- Security audit (pnpm audit)
- CodeQL analysis (TypeScript)
- Snyk vulnerability scan

**Deploy Staging** (develop branch):
- Deploy to Vercel staging
- Run smoke tests
- Verify deployment

**Deploy Production** (main branch):
- Deploy to Vercel production
- Run health checks (diboas.com, app.diboas.com)
- Notify Slack on success
- Run Lighthouse CI for performance monitoring

### Deployment Process

**Pre-Deployment**:
1. Run pre-deployment checks
2. Database migrations (Prisma)
3. Build all applications

**Deployment**:
1. Deploy frontend apps (web, dapp, business)
2. Deploy backend services
3. Post-deployment verification

**Post-Deployment**:
1. Cache warming (curl all domains)
2. Health check verification
3. Slack notification

## Performance Optimization

### Optimization Strategies

**Database Optimization**:
- Add missing indexes on frequent queries
- Query result caching for expensive operations
- Connection pooling
- Partition large tables by date
- Optimize N+1 queries with eager loading
- Impact: 40% faster queries

**API Optimization**:
- Request/response compression
- Response caching headers
- GraphQL for complex queries
- API response pagination
- Request batching
- Impact: 30% faster responses

**Frontend Optimization**:
- Code splitting and lazy loading
- Image optimization (next/image)
- Service worker caching
- Virtual scrolling for lists
- Preload critical resources
- Impact: 50% faster page loads

**Caching Strategy**:
- Multi-level caching (CDN, Redis, browser)
- CDN for static assets
- Cache expensive calculations
- Cache warming for critical data
- Smart cache invalidation
- Impact: 60% reduction in server load

### Performance Monitoring

**Metrics Tracking**:
- Database query duration
- API call duration
- Transaction execution time
- Error rates by endpoint

**Performance Reports**:
- API response times (averages, p95, p99)
- Database query times
- Error rates and patterns
- Throughput metrics
- Recommendations for optimization

## Summary

The diBoaS infrastructure provides:

1. **Zero-Budget Start**: $0/month with free tier services (Vercel, Supabase, Upstash, Cloudflare)
2. **Clear Scaling Path**: $0 → $400/month → $5,000/month as user base grows
3. **Domain Separation**: Independent apps for marketing, consumer, and business
4. **Comprehensive Monitoring**: Business + technical metrics with Prometheus/Grafana
5. **Robust Testing**: 90% coverage with unit, integration, E2E, security, and load tests
6. **Production Security**: Zero-trust network, secrets management, WAF, DDoS protection
7. **Database Excellence**: Optimized schema, daily backups, PITR, partitioning
8. **Automated CI/CD**: GitHub Actions with quality gates and automated deployment
9. **Performance Optimization**: Multi-level caching, query optimization, CDN
10. **Enterprise Ready**: Production-grade from day one with clear scaling strategy

---

**For implementation details**: See backend-condensed.md, security-condensed.md, and database-condensed.md
