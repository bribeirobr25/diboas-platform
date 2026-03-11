# Database & Data Architecture

> **diBoaS platform database schema, data models, and data management strategies**

## Overview

Domain-driven database architecture with PostgreSQL 15+, supporting Banking, Investing, and DeFi domains with ACID compliance, event-sourcing, and CQRS patterns.

## Technology Stack

### Primary Database
- **PostgreSQL 15+**: ACID compliance, JSON support, robust indexing
- **Deployment**: Railway/Supabase (free tier) → dedicated instances

### Additional Data Stores
- **Redis**: Session management, caching, rate limiting (Upstash)
- **Elasticsearch**: Transaction search and analytics (future)
- **TimescaleDB**: Time-series metrics (optional)

## Architecture Principles

1. **Domain-Driven Design**: Separate schemas for Banking, Investing, DeFi
2. **Event-Sourcing**: Immutable transaction logs with outbox/inbox patterns
3. **CQRS Support**: Optimized read/write patterns
4. **Horizontal Scaling**: Designed for future sharding by user_id or domain
5. **Compliance-First**: Built-in audit trails, retention, privacy controls

## Core Data Models

### User Model
**Key Fields**:
- Authentication: email, password, 2FA
- Profile: name, phone, DOB, nationality
- KYC: status, documents, compliance flags, risk level
- Preferences: timezone, language, currency
- Mascot: selected mascot (Acqua, Mystic, Coral), experience level
- Gamification: points, streak, enabled domains

**Relationships**:
- Accounts (banking, investing, DeFi)
- Transactions (across all domains)
- Balances (domain-separated)
- Audit logs

### Virtual Wallet System
- **4 Non-Custodial Wallets per user**
- One per chain: BTC, ETH, SOL, SUI
- Each with address and public key
- User controls private keys

## Domain Schemas

### Banking Domain

**BankingAccount**:
- Account types: Checking, Savings, Credit Card, Wire
- Verification status
- Daily/monthly/transaction limits

**BankingTransaction**:
- Types: Add Money, Send Money, Withdraw, Transfers
- Status: Initiated → KYC → Compliance → Processing → Clearing → Completed
- Provider integration (Stripe, MoonPay, Ramp)
- Compliance: AML status, flags, risk score

**BankingBalance**:
- Available, reserved, total
- Per asset (USD, USDC, USDT)
- Real-time updates

### Investing Domain

**InvestingAccount**:
- Account types: Brokerage, Retirement, Margin
- Exchange integration
- Trading/margin enabled flags
- Risk tolerance settings

**InvestingTransaction**:
- Types: Buy Crypto, Sell Crypto, Convert, Transfer
- Order types: Market, Limit, Stop Loss
- Order status: Pending → Placed → Filled → Completed
- Execution details: price, quantity, commission
- Portfolio impact tracking

**Portfolio**:
- Multi-portfolio support
- Target vs current allocation
- Performance metrics (total return, day change)
- Auto-rebalance configuration
- Risk level: Conservative, Balanced, Aggressive

**InvestingBalance**:
- Quantity, average cost, market value
- Unrealized P&L
- Per asset tracking

### DeFi Domain

**DeFiAccount**:
- Wallet address per chain
- Wallet types: Hot, Hardware, Multisig
- Auto-compound enabled
- Risk tolerance

**DeFiTransaction**:
- Types: Start Strategy, Stop Strategy, Harvest Yield
- Protocol integration (Uniswap, Aave, Compound, Lido)
- Blockchain data: tx hash, block, gas
- Yield tracking: expected vs actual
- Impermanent loss risk calculation

**DeFiStrategy**:
- Strategy types: Yield Farming, Liquidity Provision, Staking, Lending
- Multi-protocol support
- Performance: deposited, current value, yield earned, APY
- Auto-compound/rebalance settings
- Risk management: stop loss, max drawdown

**DeFiBalance**:
- Position tracking (LP tokens, staked tokens)
- APY monitoring
- Rewards tracking
- Impermanent loss calculation

## Balance Management

### Balance Aggregation
**Unified View**:
- Banking: Fiat, stablecoins
- Investing: Portfolio value across all assets
- DeFi: Strategy positions and yields

**By Chain**:
- Bitcoin: BTC
- Ethereum: USDC, USDT, ETH
- Solana: USDC, USDT, SOL
- Sui: USDC, USDT, SUI

### Balance Reservation System
- Reserve balance during transaction processing
- Expiration: 30 minutes default
- Status: Active → Completed/Released/Expired
- Automatic cleanup of expired reservations
- Atomic operations with database locks

## Transaction Management

### Transaction Lifecycle
1. **Initiated**: User initiates transaction
2. **Validating**: Input validation, balance check
3. **Balance Reserved**: Lock funds
4. **Sent to Provider**: Submit to third party
5. **Provider Processing**: External processing
6. **Provider Confirming**: Awaiting confirmation
7. **Completed**: Success
8. **Failed/Compensating**: Error handling

### Transaction Tracking
**TransactionStatusHistory**:
- Tracks all status changes
- Polymorphic: Banking, Investing, DeFi
- Reason, timestamp, metadata
- Provider updates

**ProviderUpdates**:
- Webhook data from providers
- Raw and processed payloads
- Processing status
- Error handling

## Fee Management

### 5-Tier Fee Structure
1. **Platform Fees**: diBoaS service fees
2. **Provider Fees**: Third-party costs
3. **Network Fees**: Blockchain gas
4. **Compliance Fees**: KYC, AML
5. **Premium Fees**: Optional features

### Fee Tracking
- Per-transaction fee breakdown
- Fee type, category, amount
- Provider information
- Calculation method (percentage, flat, tiered)
- Historical fee structures

## Event-Driven Architecture

### Outbox Pattern
**Purpose**: Reliable event publishing
- Event type, version, aggregate ID
- Payload, metadata
- Status: Pending → Published/Failed
- Retry mechanism (max 3 retries)
- Automatic retry scheduling

### Inbox Pattern
**Purpose**: Handle external events
- Event ID for idempotency
- Source (provider or system)
- Status: Pending → Processed/Failed/Ignored
- Retry mechanism
- Duplicate detection

## Data Security & Compliance

### Encryption
**EncryptedUserData**:
- Data types: PII, Financial, Documents
- Sensitivity levels: Low, Medium, High, Critical
- Encryption algorithm tracking
- Key rotation support
- Access policies

### Audit Trail
**AuditLog**:
- Event type, entity type, entity ID
- Before/after state tracking
- IP address, user agent, session
- Correlation ID for distributed tracing

### Compliance Records
**ComplianceRecords**:
- Check types: KYC, AML, Sanctions
- Provider integration
- Risk score, flags
- Expiration tracking

### Data Access Log
- Track who accessed what data
- Access reason, context
- Timestamp, IP, session
- Admin access tracking

## Performance Optimization

### Indexing Strategy
**Core Indexes**:
- Users: email, created_at, last_active
- Transactions: user_id, status, created_at, provider
- Balances: user_category, asset, updated
- Fees: transaction_id, type_category

**Composite Indexes**:
- transactions(user_id, status, created_at)
- balances(user_id, category)

**Partial Indexes**:
- Active transactions only
- Pending reservations

### Partitioning
- **Transactions**: Monthly partitions by created_at
- **Audit Logs**: Monthly partitions by timestamp
- **Time-Series Data**: Automatic partitioning

### Query Optimization
- Materialized views for aggregations
- User balance summary view
- Transaction summary view
- Periodic refresh

## Data Migration & Versioning

### Schema Migrations
**Tracking**:
- Migration version, execution time
- Checksum for integrity
- Rollback support

**Strategy**:
- Run within transactions
- Automatic rollback on failure
- Record migration history

### Model Versioning
- Track schema definition changes
- Migration scripts per version
- Backward compatibility

## Monitoring & Backup

### Database Monitoring
**Metrics Tracking**:
- Query execution time
- Connection counts
- Table/index usage
- Slow query log

**Slow Query Detection**:
- Log queries > threshold
- Track query patterns
- Identify optimization opportunities

### Backup Strategy
**Full Backups**:
- Daily full backups
- Stored in cloud storage
- Retention: 30 days

**Incremental Backups**:
- Hourly incremental backups
- Faster than full backups
- Retention: 7 days

**Point-in-Time Recovery**:
- WAL archiving
- Restore to any point in time
- Recovery testing

## Scalability Design

### Horizontal Scaling
- Sharding by user_id
- Read replicas for read-heavy operations
- Connection pooling

### Microservices Ready
- Domain-separated schemas
- Independent scaling per domain
- Event-driven communication

## Key Database Views

### User Balance Summary
Aggregates available, reserved, staked balances per category and asset.

### Transaction Summary
Aggregates transaction counts, amounts, fees by user, category, type, status.

## Data Retention

### Retention Policies
- **Transactions**: Indefinite (compliance)
- **Audit Logs**: 7 years (regulatory)
- **Session Data**: 30 days
- **Encrypted Data**: Per data type

### Archival Strategy
- Move old data to cold storage
- Maintain queryable archive
- Compliance-aware deletion

## Summary

The diBoaS database provides:

1. **Domain-Separated Schema**: Clear data organization across Banking, Investing, DeFi
2. **Transaction Management**: Full lifecycle tracking with provider integration
3. **Balance Management**: Real-time tracking with reservation system
4. **Event-Driven**: Reliable publishing with outbox/inbox patterns
5. **Security & Compliance**: Encryption, audit trails, regulatory compliance
6. **Performance**: Strategic indexing, partitioning, query optimization
7. **Scalability**: Horizontal scaling and microservices ready
8. **Data Integrity**: ACID compliance with validation and constraints
9. **Monitoring**: Performance tracking and health monitoring
10. **Disaster Recovery**: Backup, versioning, and recovery strategies

---

**For implementation details**: See backend-condensed.md and architecture-condensed.md
