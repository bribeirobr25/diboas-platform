# Payment Methods & Transaction Types

> **Comprehensive payment methods, transaction types, and payment processing flows across Banking, Investing, and DeFi domains**

## Overview

Complete payment method framework supporting On/Off-ramp operations, on-chain transactions, DEX swaps, and cross-chain operations with provider-centric orchestration and real-time webhook-based status management.

## Payment Method Overview

### Complete Integration Requirements

**Authentication**: Email magic link, OAuth (Google, Apple, X), Web3 (Phantom, MetaMask)
**Wallet Creation**: 4 Non-Custodial Wallets (BTC, ETH L1, SOL, SUI) via providers
**Compliance**: KYC and 2FA through provider services
**Payments**: On/Off-Ramp via provider APIs with webhook notifications
**On-Chain Operations**: DEX swaps, sends, bridges via provider APIs
**DeFi**: Strategy management via provider APIs with status tracking
**Data**: Market data and gas fees from provider APIs

### Payment Types Supported

**Primary Payment Categories**:
1. On-Ramp Operations: Fiat to crypto conversions
2. Off-Ramp Operations: Crypto to fiat conversions
3. On-Chain Transactions: Direct blockchain operations
4. DEX Swaps: Decentralized exchange operations
5. Cross-Chain Bridges: Multi-chain transfer operations

**Specific Payment Methods**:
- Bank Transfers: ACH, wire transfers
- Card Payments: Credit/debit card processing
- Digital Wallets: Apple Pay, Google Pay, PayPal
- Cryptocurrency Swaps: Token-to-token exchanges
- On-Chain Sends: Direct blockchain transfers
- Cross-Chain Bridges: Multi-network operations

## Third-Party Integration Strategy

### Provider-Centric Architecture

**Key Insight**: diBoaS acts as **orchestrator and status manager** rather than direct executor, simplifying implementation while maintaining excellent UX.

**diBoaS Core Responsibilities**:
- Initiate: Validate requests, reserve balances, send to providers
- Monitor: Listen for provider updates, track transaction progress
- Complete: Update balances, release reservations, notify users
- Compensate: Handle failures, release funds, implement retry logic

**Provider Responsibilities**:
- Execute: Handle actual transaction processing (blockchain, fiat, DeFi)
- Update: Send status updates via webhooks
- Deliver: Complete transactions and provide confirmations
- Report: Provide detailed transaction information

### Architectural Philosophy

**Provider-Centric Approach**: Platform acts as intelligent orchestrator leveraging specialized third-party providers for:
- Transaction execution and blockchain interactions
- Compliance and regulatory requirements
- Payment processing and fiat conversions
- DeFi protocol integrations

## Domain-Specific Payment Processing

### Domain-Driven Integration Strategy

**Key Architecture Principle**: diBoaS separates business domains (Banking, Investing, DeFi) while maintaining unified user experience through shared services and consistent APIs.

**Banking Domain (@diboas/banking)**:
- Fiat operations: deposits, withdrawals, transfers
- Traditional payment processing
- Banking compliance and regulations
- ACH, wire transfers, card processing

**Investing Domain (@diboas/investing)**:
- Crypto asset purchases and sales
- Portfolio management
- Market data integration
- Investment compliance

**DeFi Domain (@diboas/defi)**:
- Yield strategies and optimization
- Liquidity pool management
- Smart contract interactions
- DeFi protocol integrations

**Shared Services (@diboas/config, @diboas/ui)**:
- Authentication and user management
- UI components and design system
- Common utilities and helpers
- Shared configuration

### Domain-Specific Operations

**Banking Operations**: On/Off-Ramp via banking domain providers
**Investing Operations**: Crypto purchases, portfolio management via investing domain
**DeFi Operations**: Yield strategies, liquidity provision via DeFi domain
**Data**: Market data and gas fees from domain-specific provider APIs

## Transaction Types & Operations

### Core Business Functionality

**Multi-Chain Financial Services**:
- Banking Operations: Add funds (on-ramp), send money, withdraw funds (off-ramp)
- Investment Services: Buy/sell cryptocurrencies and tokenized assets
- DeFi Strategies: Automated goal-based investment strategies
- Multi-Chain Support: Bitcoin, Ethereum, Solana, and Sui networks

**Third-Party Integration Strategy**:
- Authentication: Email magic link, OAuth (Google, Apple, X), Web3 wallets
- Compliance: KYC verification and multi-factor authentication
- Transaction Execution: Provider-based execution with orchestration and monitoring
- Market Data: Real-time pricing, gas fees, and market analytics

### Transaction Component Interface

**TransactionWizardProps**:
- type: 'add' | 'send' | 'withdraw' | 'buy' | 'sell' | 'start_strategy' | 'stop_strategy'
- onComplete: (transactionId: string) => void
- onCancel: () => void

### Complete Operation Types

**Banking Operations**:
1. Add Funds (On-Ramp): Convert fiat currency to cryptocurrency
2. Send Money: Transfer funds between wallets or to external addresses
3. Withdraw Funds (Off-Ramp): Convert cryptocurrency back to fiat currency

**Investing Operations**:
1. Buy Crypto: Purchase cryptocurrencies and tokenized assets
2. Sell Crypto: Sell holdings for fiat or other cryptocurrencies

**Strategy Operations (DeFi)**:
1. Start DeFi Strategy: Begin automated yield generation strategies
2. Stop DeFi Strategy: End active DeFi strategies and retrieve funds

## Provider Architecture

### Provider Types

**ProviderType Enum**:
- ON_RAMP: Fiat to crypto
- OFF_RAMP: Crypto to fiat
- DEX: Decentralized exchange (Uniswap, Jupiter, etc.)
- BRIDGE: Cross-chain bridges
- DEFI: DeFi protocols (Aave, Compound, etc.)
- WALLET: Wallet services (Privy, Dynamic, etc.)
- COMPLIANCE: KYC/AML providers (Persona, Jumio, etc.)

### Banking Providers

**BankingProviderFactory**:
- Stripe: On/Off-ramp, card payments, ACH
- Plaid: Bank account linking and verification

### Investing Providers

**InvestingProviderFactory**:
- Coinbase: Buy/sell orders, market data, portfolio tracking
- Binance: Trading, advanced features
- Kraken: Advanced trading, institutional features

### DeFi Providers

**DeFiProviderFactory**:
- Uniswap: DEX swaps, liquidity pools
- Aave: Lending/borrowing, yield strategies
- Compound: DeFi protocol integrations

## Payment Webhook Handling

### Transaction Orchestration - Payment Webhook Flow

**Process**:
1. Receive webhook from provider with transactionId and status
2. Route to appropriate handler based on status:
   - `payment_confirmed`: Update status to PROVIDER_PROCESSING
   - `crypto_delivered`: Update status to PROVIDER_COMPLETED, complete transaction
   - `failed`: Update status to PROVIDER_FAILED, handle failure
3. Update transaction status via StatusService
4. Trigger completion logic for successful transactions
5. Audit webhook processing

**Key Statuses**:
- payment_confirmed: Payment received, processing crypto delivery
- crypto_delivered: Crypto delivered to user wallet, transaction complete
- failed: Transaction failed, trigger compensation

## Balance Categorization

### Payment-Related Balance Management

**Process**:
1. Get wallet balances from blockchain providers
2. Categorize assets into Banking, Investing, Strategy
3. Get DeFi strategy balances separately
4. Return CategorizedBalances with totals

**CategorizedBalances Structure**:
- userId: User identifier
- banking: Banking balance total
- investing: Investing balance total
- strategy: DeFi strategy balance total
- total: Sum of all balances
- lastUpdated: Timestamp

## Fee Structure by Payment Type

### Fee Rates by Transaction Type

**Platform Fee Rates**:
- ADD_ON_RAMP: 0.009% (0.009% platform fee)
- SEND_ON_CHAIN: 0.009% (0.009% platform fee)
- WITHDRAW_OFF_RAMP: 0.9% (0.9% platform fee)
- BUY_CRYPTO: 0.009% (0.009% platform fee)
- SELL_CRYPTO: 0.009% (0.009% platform fee)
- START_DEFI: 0.009% (0.009% platform fee)
- STOP_DEFI: 0.009% (0.009% platform fee)

### DeFi Fee Structure

**DeFiFeeCalculator Components**:
- diboasFee: Strategy management fee
- providerFee: Protocol fees (Aave, Compound, etc.)
- networkFee: Gas cost estimate
- complianceFee: 0 (DeFi generally no regulatory fees)
- premiumFee: Premium features fee
- total: Sum of all fees
- transparency: Detailed breakdown
- optimizationSuggestions: Fee optimization tips

## Domain-Specific State Machines

### Banking-Specific States

**BankingTransactionStatus Extensions**:
- KYC_VERIFICATION: Compliance verification in progress
- COMPLIANCE_CHECK: AML/regulatory check in progress
- BANK_PROCESSING: Bank processing payment
- CLEARING: Payment clearing period

### Investing-Specific States

**InvestingTransactionStatus Extensions**:
- EXCHANGE_PROCESSING: Exchange executing order
- ORDER_PLACED: Order placed, awaiting execution
- ORDER_FILLED: Order filled, awaiting settlement

### DeFi-Specific States

**DeFiTransactionStatus Extensions**:
- SMART_CONTRACT_INTERACTION: Smart contract execution in progress
- BLOCKCHAIN_CONFIRMATION: Awaiting blockchain confirmations
- YIELD_CALCULATION: Calculating yield and performance

## Multi-Chain Support Architecture

### Supported Networks

**Bitcoin (BTC)**: Primary value storage and transfers
**Ethereum (ETH L1)**: Smart contracts and DeFi operations
**Solana (SOL)**: High-speed, low-cost transactions
**Sui (SUI)**: Next-generation blockchain operations

### Payment Flow Integration

**Process**:
1. User initiates payment through unified interface
2. Domain router determines appropriate domain (Banking/Investing/DeFi)
3. Provider selector chooses optimal provider for transaction type
4. Transaction orchestrator manages execution and monitoring
5. Status manager tracks progress through webhooks
6. Balance service updates user balances upon completion

## Real-Time Payment Processing

### Key Features

**Webhook-Driven Updates**: Real-time status tracking via provider webhooks
**Automatic Retry Logic**: Failed transactions automatically retried
**Provider Failover**: High availability through multiple providers
**Fee Optimization**: Best fees across multiple providers
**Regulatory Compliance**: Domain-specific compliance checks

### Security Measures

**Zero Sensitive Data**: No sensitive data in URLs or client-side storage
**Multi-Factor Authentication**: Required for high-value transactions
**KYC Verification**: Through trusted compliance providers (Persona, Jumio)
**Transaction Monitoring**: Fraud detection and prevention

## Summary

The diBoaS payment methods system provides:

1. **Comprehensive Payment Support**: On/Off-ramp, on-chain, DEX swaps, bridges across all major networks
2. **Domain Separation**: Banking, Investing, and DeFi operations with specialized providers
3. **Provider Orchestration**: Intelligent routing with failover and optimization
4. **Multi-Chain Operations**: BTC, ETH, SOL, and SUI network support
5. **Real-Time Processing**: Webhook-based status management with instant updates
6. **Fee Transparency**: Complete fee breakdown (platform 0.009-0.9%, provider, network, compliance, premium)
7. **Security & Compliance**: KYC, 2FA, zero sensitive data exposure
8. **User Experience**: Unified interface across all payment methods and domains
9. **Domain-Specific State Machines**: Banking (KYC, clearing), Investing (exchange), DeFi (smart contracts)
10. **Balance Categorization**: Automatic categorization into Banking, Investing, Strategy
11. **Provider Architecture**: Specialized provider factories for each domain
12. **Transaction Types**: 7 operation types (add, send, withdraw, buy, sell, start strategy, stop strategy)

---

**For implementation details**: See operations-condensed.md, integrations-condensed.md, backend-condensed.md, and fees-condensed.md
