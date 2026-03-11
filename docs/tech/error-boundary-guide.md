# diBoaS Error Boundary System

> **Complete error handling system implementing Principle 7: Error Handling & System Recovery from coding-standards.md**

## Overview

The error boundary system provides comprehensive error handling with:
- Proper React Error Boundaries with class components
- Error categorization and recovery strategies
- Retry mechanisms with exponential backoff
- User-friendly error states with fallback UI
- Comprehensive monitoring and audit logging
- Context-specific handling (transactions, marketing, etc.)

## Core Components

### DiBoaSErrorBoundary

**Main error boundary** with proper React error catching for general application errors.

**Usage**: Import from `@diboas/primitives`
**Props**:
- componentName: Component identifier for error tracking
- enableAutoRetry: Enable automatic retry on retryable errors
- maxRetries: Maximum retry attempts (default: 3)
- onError: Callback for error handling
- fallback: Custom fallback UI component

### Specialized Error Boundaries

**TransactionErrorBoundary**:
- Purpose: Financial operations with transaction-specific recovery
- Import: `@diboas/app-ui`
- Props: transactionType, onTransactionError
- Features: Transaction rollback, balance reservation release, provider failover

**MarketingErrorBoundary**:
- Purpose: Marketing content with conversion funnel protection
- Import: `@diboas/landing-ui`
- Props: sectionName, contentPhase, enableFallbackContent
- Features: Fallback content, conversion tracking, graceful degradation

## Error Recovery Hooks

### useErrorRecovery

**Purpose**: Implements systematic error recovery strategies with automatic retry and fallback mechanisms.

**Features**:
- Automatic error categorization
- Context-aware recovery strategies
- Exponential backoff retry logic
- Operation result tracking
- Error logging and monitoring

**Returns**:
- recoverFromError: Function to attempt error recovery
- isRecovering: Boolean flag for recovery state

### useRetryableOperation

**Purpose**: For operations with automatic retry logic and exponential backoff.

**Features**:
- Configurable max retries
- Automatic retry eligibility check
- Success and error callbacks
- Loading state management
- Manual retry trigger

**Returns**:
- data: Operation result data
- error: Error object if operation failed
- isLoading: Loading state boolean
- execute: Function to execute operation
- retry: Function to manually retry
- canRetry: Boolean indicating retry eligibility

### useSmartRetry

**Purpose**: Advanced retry logic with intelligent error analysis and conditional retry strategies.

**Features**:
- Custom retry condition functions
- Error-specific retry strategies
- Retry attempt tracking
- Circuit breaker integration
- Performance optimization

## Error Types & Recovery Strategies

**Error Categories**:

**NETWORK_ERROR** (Retryable):
- Recovery: Exponential backoff retry
- Max Retries: 3
- Backoff: 1s, 2s, 4s

**PROVIDER_ERROR** (Retryable):
- Recovery: Circuit breaker pattern
- Failover: Alternate provider selection
- Monitoring: Provider health tracking

**TRANSACTION_ERROR** (Retryable):
- Recovery: Idempotency check + retry
- Compensation: Balance reservation release
- Audit: Transaction failure logging

**VALIDATION_ERROR** (Not Retryable):
- Recovery: Show user correction UI
- Guidance: Field-specific error messages
- Prevention: Client-side validation

**AUTH_ERROR** (Not Retryable):
- Recovery: Redirect to login
- Session: Clear invalid session
- Retry: After re-authentication

**COMPONENT_ERROR** (Retryable):
- Recovery: Component re-render
- Fallback: Error state UI
- Reporting: Component error tracking

## Integration Examples

### App Layout with Error Boundaries

**Pattern**: Nested error boundaries with app-level and feature-level coverage
**Structure**: DiBoaSErrorBoundary (app) → TransactionErrorBoundary (feature) → children
**Import**: `@diboas/primitives`, `@diboas/app-ui`

### Marketing Page with Fallback Content

**Pattern**: Section-specific error boundaries with conversion funnel protection
**Structure**: Multiple MarketingErrorBoundary components per page section
**Import**: `@diboas/landing-ui`
**Props**: sectionName (hero, cta, etc.), contentPhase (promote, trust, action)

### API Operation with Smart Retry

**Pattern**: useSmartRetry hook with conditional retry logic
**Features**: Automatic retry on retryable errors, manual retry trigger, error state UI
**Import**: `@diboas/primitives`

## Best Practices

### 1. Use Appropriate Error Boundaries

**App Level**: DiBoaSErrorBoundary for general errors and critical failures
**Feature Level**: Specialized boundaries (Transaction, Marketing) for domain-specific handling
**Component Level**: Local error handling with hooks for granular control

### 2. Error Boundary Placement Strategy

**Good Strategy**:
- Strategic placement at logical boundaries
- Protect critical features separately
- Avoid catching non-critical component errors

**Anti-Pattern**:
- Over-granular boundaries (every component)
- Single boundary for entire app
- No boundaries at all

### 3. Custom Fallback UI

**Purpose**: Provide user-friendly error messages with recovery options
**Features**: Custom error display, retry buttons, contextual guidance
**Implementation**: Pass fallback function as prop with error and retry parameters

### 4. Error Monitoring Integration

**Google Analytics**: Send exception events via gtag
**Audit Logger**: Log errors for compliance and debugging
**Custom Events**: Dispatch custom events for app-specific monitoring
**Pattern**: Custom error handler passed to onError prop

## Testing Error Boundaries

**Approach**: Render error boundary with component that throws
**Tools**: React Testing Library
**Pattern**: Mock component with controlled throw behavior
**Assertions**: Verify error UI display and retry button presence

## Migration from Old Error Boundaries

**Old Pattern** (Incorrect): Functional component with try-catch (doesn't work for React errors)
**New Pattern** (Correct): Proper React error boundary class component
**Migration**: Replace old try-catch boundaries with DiBoaSErrorBoundary component

## Performance Considerations

**Minimal Overhead**: Error boundaries add negligible performance impact
**Exponential Backoff**: Automatic retry uses exponential backoff to prevent spam
**Circuit Breaker**: Prevents cascading failures through provider health tracking
**Batched Logging**: Error logging is batched for performance optimization

## Monitoring & Analytics

**Automatic Event Tracking**:
- Google Analytics: Exception events via gtag
- Audit Logger: Compliance and debugging logs
- Custom Events: App-specific error monitoring

**Key Metrics**:
- Error rate by component
- Recovery success rate
- Retry attempt distribution
- Error type frequency

## Summary

The diBoaS error boundary system provides:

1. **Comprehensive Error Handling**: Proper React error boundaries for all error types
2. **Specialized Boundaries**: Transaction and Marketing boundaries for domain-specific handling
3. **Recovery Hooks**: useErrorRecovery, useRetryableOperation, useSmartRetry for systematic recovery
4. **Error Categorization**: 6 error types with specific recovery strategies (network, provider, transaction, validation, auth, component)
5. **Retry Mechanisms**: Exponential backoff with configurable max retries (default: 3)
6. **User-Friendly UI**: Custom fallback components with retry options
7. **Monitoring Integration**: Automatic logging to Google Analytics, Audit Logger, and custom events
8. **Performance Optimization**: Minimal overhead, circuit breaker pattern, batched logging
9. **Testing Support**: React Testing Library integration with mock error components
10. **Migration Path**: Clear guidance from old try-catch pattern to proper React error boundaries
11. **Best Practices**: Strategic placement, appropriate boundary selection, custom fallback UI
12. **Recovery Strategies**: Retryable errors (network, provider, transaction, component) with automatic retry, non-retryable errors (validation, auth) with user guidance

---

**For implementation details**: See coding-standards-condensed.md (Principle 7: Error Handling & System Recovery)
