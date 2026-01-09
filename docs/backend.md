# Backend & Services

> **diBoaS platform backend services, transaction orchestration, and business logic**

## Overview

Domain-separated backend architecture supporting Banking, Investing, and DeFi domains with unified transaction orchestration, provider integration, and fee management.

## Service Architecture

### Domain Structure
```
packages/
├── banking/src/services/         # Banking domain
├── investing/src/services/       # Investing domain
├── defi/src/services/           # DeFi domain
└── shared/src/services/         # Cross-domain services
```

### Core Services
- **Domain Services**: Banking, Investing, DeFi transaction processing
- **Transaction Orchestrator**: Unified transaction lifecycle management
- **Provider Registry**: Third-party provider integration with failover
- **Fee Engine**: Intelligent fee calculation and optimization
- **Balance Aggregator**: Unified balance across all domains
- **Webhook Handler**: Secure provider webhook processing

## Transaction Status Management

### Base Transaction States
- INITIATED → VALIDATING → BALANCE_RESERVED
- SENT_TO_PROVIDER → PROVIDER_PROCESSING → PROVIDER_CONFIRMING
- COMPLETED / FAILED / EXPIRED
- COMPENSATING → COMPENSATED (on failure)

### Domain-Specific Extensions

**Banking**:
- KYC_VERIFICATION
- COMPLIANCE_CHECK
- BANK_PROCESSING
- CLEARING

**Investing**:
- MARKET_ORDER_PLACED
- ORDER_FILLED
- SETTLEMENT_PENDING

**DeFi**:
- SMART_CONTRACT_INTERACTION
- BLOCKCHAIN_CONFIRMATION
- YIELD_STRATEGY_ACTIVE

## Transaction Orchestration

### Core Flow
1. **Security & Compliance**: Zero-trust validation
2. **Fee Calculation**: Optimal fee breakdown (5-tier)
3. **Balance Reservation**: Reserve with timeout
4. **Provider Selection**: Optimal provider based on cost/speed/reliability
5. **Execution**: Send to provider with tracking
6. **Status Updates**: Real-time status via WebSocket
7. **Completion**: Confirm or compensate

### Orchestrator Responsibilities
- Coordinate transaction lifecycle
- Manage provider communication
- Handle errors and compensation
- Track audit trail
- Optimize costs

## Provider Registry

### Provider Selection Algorithm
**Scoring Criteria**:
- Health: 50% weight (reliability most important)
- Cost: 30% weight (fee optimization)
- Speed: 20% weight (user experience)

**Provider Types**:
- ON_RAMP: Stripe, MoonPay, Ramp
- OFF_RAMP: Banking providers
- DEX: Uniswap, 1inch, Jupiter
- DEFI: Aave, Compound, Lido
- BRIDGE: Cross-chain protocols

### Failover Strategy
- Circuit breaker pattern
- Failure threshold: 5 failures
- Recovery timeout: 60 seconds
- Automatic provider switching
- Health monitoring

## Virtual Wallet System

### Unified Balance Aggregation
**Aggregated across**:
- Banking balance (fiat, USDC, USDT)
- Investing portfolio (BTC, ETH, SOL, SUI)
- DeFi strategies (active positions)

**Balance by Chain**:
- Bitcoin: BTC
- Ethereum: USDC, USDT, ETH
- Solana: USDC, USDT, SOL
- Sui: USDC, USDT, SUI

### Balance Reservation System
- Reserve balance during transaction
- Expiration: 30 minutes default
- Automatic cleanup of expired reservations
- Atomic operations with database locks

## Fee Orchestration Engine

### 5-Tier Fee Structure
1. **Platform Fees**: diBoaS service fees
2. **Provider Fees**: Third-party provider costs
3. **Network Fees**: Blockchain gas costs
4. **Compliance Fees**: KYC, AML costs
5. **Premium Fees**: Optional premium features

### Fee Optimization
- Compare multiple provider quotes
- Consider user preferences (speed vs cost)
- Calculate network fees for different chains
- Provide optimization suggestions
- Full transparency in fee breakdown

## Webhook Handling

### Security
- Signature validation
- Provider-specific payload parsing
- Correlation ID tracking
- Audit logging

### Processing
- Parse provider-specific payloads
- Update transaction status
- Process balance updates
- Trigger user notifications
- Log for compliance

## Race Condition Prevention

### Strategies
1. **Optimistic Locking**: Version control on balance updates
2. **Distributed Locks**: Redis-based locking for critical sections
3. **Database Locks**: `FOR UPDATE` on concurrent operations
4. **Atomic Operations**: Database transactions for multi-step updates

### Implementation Patterns
- Version field in balance table
- Lock acquisition with timeout
- Automatic lock release
- Rollback on conflicts

## Error Handling

### Error Classification
- **LOW**: Validation errors (not retryable)
- **MEDIUM**: Provider connection errors (retryable)
- **HIGH**: Transaction processing errors (retryable)
- **CRITICAL**: System failures (manual intervention)

### Retry Logic
- Exponential backoff
- Max retries: 3
- Base delay: 1 second
- Max delay: 10 seconds
- Conditional retry based on error type

### Circuit Breaker Pattern
- Failure threshold: 5 failures
- Recovery timeout: 60 seconds
- States: CLOSED → OPEN → HALF_OPEN
- Automatic reset on recovery

### Saga Pattern for Recovery
- Execute transaction steps
- Register compensation actions
- Execute compensations in reverse order on failure
- Continue compensations even if one fails

## Domain Transaction Architectures

### Banking Transaction Flow
1. Initiate with banking-specific validation
2. Select banking provider (Stripe, MoonPay, Ramp)
3. Calculate banking fees
4. Reserve balance
5. Execute with provider
6. Track clearing and settlement
7. Complete transaction

**Banking-Specific**:
- Compliance checks (KYC, AML)
- Banking regulations (PCI DSS, SOX)
- Clearing house integration
- Settlement time tracking

### Investing Transaction Flow
1. Initiate with asset validation
2. Analyze portfolio impact
3. Select execution strategy (market, limit, stop-loss)
4. Calculate investing fees
5. Execute order on exchange
6. Track order fulfillment
7. Update portfolio

**Investing-Specific**:
- Market data integration
- Portfolio impact analysis
- Order book analysis
- Risk assessment
- Settlement tracking

### DeFi Transaction Flow
1. Initiate with protocol analysis
2. Assess yield opportunity
3. Plan smart contract interactions
4. Optimize gas usage
5. Execute on-chain transaction
6. Monitor strategy performance
7. Track yield generation

**DeFi-Specific**:
- Protocol risk assessment
- Yield optimization
- Smart contract interaction
- Gas optimization
- Liquidity depth analysis
- Impermanent loss calculation

## Tech Stack

### Current (Budget-Conscious)
- **Frontend**: Next.js 15, React, Tailwind CSS
- **Backend**: Next.js API, TypeScript
- **Database**: PostgreSQL (Supabase)
- **Cache**: Redis (Upstash)
- **Queue**: RabbitMQ (CloudAMQP)
- **Security**: Cloudflare
- **Hosting**: Vercel + Railway

### Future (Enterprise Scaling)
- **Microservices**: Kubernetes, Docker, Service Mesh
- **Databases**: PostgreSQL Cluster, Redis Cluster, Elasticsearch
- **Message Queue**: Apache Kafka
- **AI/ML**: TensorFlow, Fraud Detection
- **Infrastructure**: Multi-cloud (AWS + GCP)
- **Security**: Zero-trust, SOC 2, PCI DSS

## Health Monitoring

### Health Checks
- Database connectivity
- Redis availability
- Provider API status
- Queue health
- Check interval: 30 seconds

### Auto-Recovery
- Automatic reconnection
- Service restart
- Provider failover
- Alert escalation

## Dead Letter Queue

### Failed Message Handling
**Failure Categories**:
- TRANSIENT: Network errors (retry with backoff)
- RECOVERABLE: Data inconsistencies (attempt reconciliation)
- PERMANENT: Validation errors (manual intervention)

**Recovery Strategies**:
- Schedule retry with exponential backoff
- Data reconciliation
- Manual task creation
- Poison queue for permanent failures

## Cross-Domain Coordination

### Complex Transactions
- Execute across multiple domains
- Maintain domain separation
- Coordinate results
- Handle partial failures
- Aggregate responses

## Codebase Enhancement Plan

### Missing Components (30% Gap)
- Simplified transaction state machine
- Provider integration layer
- Security infrastructure (encryption, audit logging)
- Real-time WebSocket updates
- Brand integration (diBoaS colors, Nubank-inspired UI)

### Enhancement Roadmap (8-10 Weeks)

**Phase 1 (Weeks 1-3): Critical Infrastructure**
- Transaction status management
- Provider integration layer
- Security & audit logging

**Phase 2 (Weeks 4-6): Business Logic**
- Fee management system
- Balance management
- Cross-domain coordination

**Phase 3 (Weeks 7-8): Integration & Testing**
- Provider integrations
- Webhook handlers
- Circuit breakers
- Testing & deployment

## Key Principles

1. **Domain Separation**: Clear boundaries between Banking, Investing, DeFi
2. **Event-Driven**: Cross-domain communication via events only
3. **Provider Abstraction**: Generic provider interface for easy integration
4. **Security First**: Zero-trust, audit logging, encryption
5. **Resilience**: Circuit breakers, retry logic, compensation
6. **Optimization**: Fee optimization, gas optimization, provider selection
7. **Monitoring**: Comprehensive logging and health checks
8. **Scalability**: Monolithic → Microservices ready

## Summary

The diBoaS backend provides:

1. **Domain-Separated Architecture**: Banking, Investing, DeFi services
2. **Transaction Orchestration**: Complete lifecycle management
3. **Provider Integration**: Robust third-party management with failover
4. **Balance Management**: Unified balance across domains and chains
5. **Fee Optimization**: Intelligent 5-tier fee calculation
6. **Webhook Processing**: Secure provider communication
7. **Status Management**: Real-time transaction tracking
8. **Security & Compliance**: Enterprise-grade audit logging
9. **Scalability**: Monolithic to microservices architecture
10. **Error Handling**: Compensation logic, retry mechanisms, circuit breakers

---

**For implementation details**: See coding-standards-condensed.md and architecture-condensed.md
