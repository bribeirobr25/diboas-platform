# API Documentation

> **diBoaS platform API architecture, endpoints, security, and domain-separated communication**

## Overview

Complete API implementation for Banking, Investing, and DeFi domains with multi-subdomain architecture, zero-trust security, real-time webhooks, and unified balance/fee management.

## Optimized URL Structure

### Security-First URL Design

**Key Principles**:
- No sensitive data in URLs (no user IDs, amounts, wallet addresses)
- SEO-optimized semantic naming
- Consistent patterns across all pages
- User-friendly and memorable URLs

### Multi-Subdomain Architecture

**diboas.com (Marketing & Public)**:
- Personal finance: /, /benefits, /account, /banking-services, /investing, /cryptocurrency, /defi-strategies, /credit
- Business marketing: /business/*, /business/banking, /business/payments, /business/treasury
- Learning center: /learn/*, /learn/financial-basics, /learn/cryptocurrency-guide
- Rewards: /rewards/*, /rewards/referral-program, /rewards/points-system
- Security: /security/*, /security/fund-protection, /security/audit-reports
- Legal: /legal/terms, /legal/privacy, /help/faq

**app.diboas.com (Authenticated Consumer)**:
- Dashboard: /dashboard, /profile, /profile/settings
- Banking: /banking, /banking/operations
- Investing: /investing, /investing/markets, /investing/trades, /investing/portfolio
- DeFi Strategy: /strategy, /strategy/manage, /strategy/portfolio
- Transactions: /transactions

**business.diboas.com (Business Platform)**:
- Enterprise: /dashboard, /treasury, /payments, /analytics, /integration, /reports, /settings

**Secure Detail Pages (Public IDs Only)**:
- Asset details: /assets/{symbol} (e.g., /assets/bitcoin)
- Transaction details: /transactions/{publicId} (e.g., /transactions/tx_abc123)
- Strategy details: /strategy/{strategyId} (e.g., /strategy/yield-farming-eth)

## Domain-Separated API Architecture

### API Route Structure

**app.diboas.com/api/ (Domain-Separated)**:

**Unified Services**:
- /api/balances/ (Balance Management)
  - GET /api/balances/summary
  - GET /api/balances/history
  - POST /api/balances/refresh
- /api/fees/ (Fee Management)
  - GET /api/fees/calculator
  - GET /api/fees/structure
  - GET /api/fees/transparency

**Domain-Specific APIs**:
- /api/banking/ (Banking Domain)
  - /api/banking/accounts
  - /api/banking/transfers
  - /api/banking/compliance
- /api/investing/ (Investing Domain)
  - /api/investing/portfolio
  - /api/investing/orders
  - /api/investing/markets
- /api/strategy/ (DeFi Domain)
  - /api/strategy/manage
  - /api/strategy/protocols
  - /api/strategy/yields

**Shared Services**:
- /api/auth/ (Authentication)
- /api/users/ (User Management)
- /api/notifications/ (System Notifications)
- /api/webhooks/{provider} (Provider Webhooks)

## Authentication & Authorization

### Complete Integration Requirements

**Authentication Methods**:
- Email magic link
- OAuth (Google, Apple, X)
- Web3 wallets (Phantom, MetaMask)

**Provider Integrations**:
- Compliance: KYC and 2FA through provider services
- Payments: On/Off-Ramp via provider APIs with webhook notifications
- On-Chain: DEX swaps, sends, bridges via provider APIs
- DeFi: Strategy management via provider APIs with status tracking
- Data: Market data and gas fees from provider APIs

### Zero-Trust Security Service

**Validation Process**:
1. Multi-factor authentication validation
2. Device security validation (flag HIGH risk devices)
3. Real-time risk assessment
4. Dynamic permission evaluation
5. Security context creation with correlation ID

**Security Context**:
- User authentication result
- Device fingerprint and risk level
- Risk score calculation
- Dynamic permissions based on risk
- Correlation ID for audit trail
- Timestamp for all operations

## API Endpoints & Routes

### Transaction Status API

**Features**:
- Public ID only (no internal IDs)
- User-friendly status mapping
- Progress percentage calculation
- Estimated completion time
- Full transaction details (type, amount, asset, provider)

### Balance Management API

**GET /api/balances/summary**:
- Returns unified balance across all domains
- Total balance aggregate
- Banking, Investing, Strategy balances
- Balance by chain (Bitcoin, Ethereum, Solana, Sui)
- Available stablecoins (USDC, USDT)
- Last updated timestamp

**POST /api/balances/refresh**:
- Triggers real-time balance refresh
- Updates all wallet balances
- Returns refresh timestamp

### Fee Management API

**GET /api/fees/calculator**:
- Query params: type, amount
- Returns complete fee breakdown (5 tiers)
- Optimal provider selection
- Estimated completion time
- Optimization suggestions

**GET /api/fees/structure**:
- Returns current fee structure
- diBoaS fees (Banking, Investing, DeFi)
- Provider fees (Stripe, Coinbase, Uniswap)
- Network fees (Ethereum, Solana, Bitcoin)

**GET /api/fees/transparency**:
- User-specific fee report
- Total fees paid
- Savings achieved
- Optimization opportunities

### Domain-Specific APIs

**Banking API - /api/banking/transfers**:
- POST: Execute transfer
- Request: userId, amount, currency, recipient, reference
- Orchestrates through BankingTransactionOrchestrator

**Investing API - /api/investing/orders**:
- POST: Place buy/sell order
- Request: userId, asset, amount, orderType
- Orchestrates through InvestingTransactionOrchestrator

**DeFi API - /api/strategy/strategies**:
- POST: Start yield strategy
- Request: userId, strategyType, amount, riskTolerance, duration
- Orchestrates through DeFiTransactionOrchestrator

## Webhook Implementation

### Provider Webhook Handling

**Process Flow**:
1. Find transaction by provider transaction ID
2. Validate transaction exists
3. Switch on webhook status:
   - processing → PROVIDER_PROCESSING
   - confirming → PROVIDER_CONFIRMING
   - completed → Complete transaction
   - failed → Fail transaction with error

### Unified Webhook Handler

**Security & Processing**:
1. Validate webhook signature
2. Parse provider-specific payload
3. Update transaction status
4. Process balance updates (if required)
5. Audit webhook processing with correlation ID
6. Handle errors with detailed logging

### Webhook Endpoints

**POST /api/webhooks/{provider}**:
- Dynamic provider routing
- Signature validation via x-webhook-signature header
- Provider-specific parsing
- Secure processing with audit trail

## Request/Response Formats

### Standard Response Format

**Success Response**:
- success: true
- data: payload
- timestamp: ISO string
- correlationId: tracking ID

**Error Response**:
- success: false
- error: message
- code: error code
- timestamp: ISO string
- correlationId: tracking ID

### Transaction Request Format

**Fields**:
- type: TransactionType
- amount: number
- currency: string
- asset: optional asset identifier
- recipient: optional recipient address
- reference: optional reference text
- preferences: optional user preferences
  - prioritizeSpeed: boolean
  - prioritizeCost: boolean
  - slippageTolerance: percentage

### Balance Response Format

**Structure**:
- totalBalance: aggregate across all domains
- banking: banking balance
- investing: investing balance
- strategy: DeFi strategy balance
- balanceByChain: per-chain breakdown (BTC, ETH, SOL, SUI)
- availableStablecoins: USDC and USDT totals
- currency: display currency
- lastUpdated: timestamp

## Security & Compliance

### Secure URL Patterns

**Secure (Used)**:
- Transaction details: ?ref=tx_abc123 (secure public ID)
- Trade details: ?ref=tr_def456 (secure public ID)
- Strategy performance: ?ref=st_ghi789 (secure public ID)
- Account summary: Session-authenticated, no account numbers
- Portfolio overview: Session-authenticated, no values in URL
- Balance information: Real-time via secure API calls

**Avoided (Not Used)**:
- /accounts/12345 (exposes account numbers)
- /balance/1000.50/USD (exposes balance amounts)
- /transaction/withdrawal/500 (exposes transaction details)
- /user/email@domain.com (exposes email addresses)

### API Security Headers

**Standard Headers**:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security: max-age=31536000; includeSubDomains
- Content-Security-Policy: default-src 'self'
- Referrer-Policy: strict-origin-when-cross-origin

## Error Handling

### Standard Error Responses

**APIError Structure**:
- message: error description
- statusCode: HTTP status code
- code: error code identifier
- details: optional additional information

**Generic Error Handling**:
- Structured error responses
- Correlation ID tracking
- Timestamp for all errors
- Appropriate HTTP status codes

### Error Codes

**Authentication Errors**:
- UNAUTHORIZED (401)
- FORBIDDEN (403)
- TOKEN_EXPIRED (401)

**Validation Errors**:
- INVALID_REQUEST (400)
- MISSING_PARAMETERS (400)
- INVALID_AMOUNT (400)

**Business Logic Errors**:
- INSUFFICIENT_BALANCE (400)
- TRANSACTION_FAILED (500)
- PROVIDER_UNAVAILABLE (503)

**System Errors**:
- INTERNAL_ERROR (500)
- SERVICE_UNAVAILABLE (503)
- RATE_LIMIT_EXCEEDED (429)

## Rate Limiting & Protection

### Rate Limiting Implementation

**Features**:
- Per-identifier tracking (IP, user ID)
- Per-endpoint limits
- Sliding window algorithm
- Automatic window reset
- Remaining requests tracking
- Reset time calculation

**Rate Limit Headers**:
- X-RateLimit-Remaining: requests remaining
- X-RateLimit-Reset: reset timestamp

**Example Limits**:
- Transaction creation: 10 requests per minute
- Balance refresh: 30 requests per minute
- Fee calculation: 100 requests per minute

## Internal API Communication

### Service-to-Service Communication

**InternalAPIClient Features**:
- Secure request with API key
- Bearer token authentication
- Service name identification (X-Service-Name)
- Correlation ID tracking (X-Correlation-ID)
- Error handling with detailed status
- Type-safe responses

**Key Operations**:
- getBalance(userId): Fetch user balance
- calculateFees(request): Calculate fee breakdown
- updateTransactionStatus(id, status, metadata): Update transaction state

**Security**:
- Internal-only API keys
- Service-to-service authentication
- Request integrity validation
- Comprehensive audit logging

## Summary

The diBoaS API architecture provides:

1. **Secure URL Structure**: No sensitive data exposure, SEO-optimized, public IDs only
2. **Domain-Separated APIs**: Clear separation between Banking, Investing, DeFi domains
3. **Multi-Subdomain Support**: Marketing, consumer app, business platform
4. **Zero-Trust Security**: Multi-factor auth, device validation, risk assessment
5. **Unified Balance Management**: Cross-domain balance aggregation and refresh
6. **Transparent Fee Calculation**: Five-tier fee structure with optimization
7. **Robust Webhook Handling**: Secure provider integration with signature validation
8. **Comprehensive Error Handling**: Structured responses with detailed error codes
9. **Rate Limiting Protection**: API abuse prevention with intelligent limiting
10. **Internal Service Communication**: Secure service-to-service API calls
11. **Production-Ready Security**: Enterprise-grade security headers and compliance
12. **Real-Time Updates**: WebSocket and webhook integration for instant notifications

---

**For implementation details**: See backend-condensed.md, security-condensed.md, and frontend-condensed.md
