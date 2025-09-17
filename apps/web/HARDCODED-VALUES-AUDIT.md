# Hardcoded Values Audit Report

## Executive Summary

This audit identifies hardcoded values across the codebase that violate the single source of truth principle. While the codebase shows good practices with configuration files, several areas still contain hardcoded values that should be centralized.

## Categories of Hardcoded Values Found

### 1. ✅ Properly Configured Values (Good Examples)

These are already following best practices:

- **Performance Thresholds**: `/config/performance-thresholds.ts`
  - Web Vitals thresholds (FCP, LCP, CLS, etc.)
  - API performance metrics
  - System performance metrics
  - Bundle size budgets
  
- **Design System**: `/config/design-system.ts`
  - Layout dimensions
  - Animation durations
  - Transition timings
  - Breakpoints

- **Business Metrics**: `/config/business-metrics.ts`
  - Platform statistics
  - Customer satisfaction ratings
  - Uptime guarantees

### 2. ❌ Hardcoded Strings That Need Attention

#### Error Messages
**Location**: `/components/ErrorBoundary/PageErrorBoundary.tsx`
```typescript
// Lines 69-72
"Something went wrong"
"We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists."
"Try Again"
"Refresh Page"
"Error Details (Development)"
```
**Recommendation**: Move to a centralized error messages configuration or i18n system.

#### UI Labels
**Location**: `/components/Layout/Navigation/MobileNav.tsx`
```typescript
// Line 229
"Back"
// Line 234
"Close menu"
// Line 96
"Toggle menu"
```
**Recommendation**: Move to navigation constants or i18n.

#### Console Messages
**Location**: Multiple files
```typescript
// /lib/analytics/service.ts:144
'Failed to flush analytics events:'
// /lib/content/service.ts:52
'Failed to load page content:'
// /lib/content/service.ts:74
'Failed to load section content:'
```
**Recommendation**: Create a centralized logging messages configuration.

### 3. ❌ Magic Numbers

#### Timeouts and Delays
**Location**: Various files
```typescript
// /components/Layout/Navigation/MobileNav.tsx:52
setTimeout(() => { ... }, 50);  // Magic number: 50ms delay

// /components/ErrorBoundary/NavigationErrorBoundary.tsx:200
const delay = Math.min(1000 * Math.pow(2, this.state.retryCount), 10000);
// Magic numbers: 1000ms base delay, 10000ms max delay

// /lib/analytics/error-resilient-service.ts
retryableErrors array with hardcoded error codes
```
**Recommendation**: Move to configuration constants.

#### Dimensions
**Location**: `/components/Layout/Navigation/MobileNav.tsx`
```typescript
// Line 252
sizes="(max-width: 768px) 384px, 384px"
```
**Recommendation**: Use breakpoint constants from design system.

### 4. ❌ URLs and Endpoints

**Location**: `/config/environment.ts`
```typescript
// Lines 118-119
app: 'http://localhost:3001',
business: 'http://localhost:3002'
```
**Note**: While these are in a config file, they should use environment variables.

### 5. ❌ Business Logic Values

#### Ratings (Partially Configured)
**Location**: `/lib/constants/content.ts`
```typescript
// Lines 49-51
APP_STORE: '4.8/5 stars on App Store',
GOOGLE_PLAY: '4.7/5 stars on Google Play',
TRUSTPILOT: '4.6/5 stars on Trustpilot'
```
**Note**: These should use the business metrics configuration that already exists.

### 6. ❌ Style Values Not Using Design Tokens

**Location**: `/components/Layout/Navigation/DesktopNav.tsx`
```typescript
// Line 46
style={{ width: 'auto', height: 'auto', maxHeight: '76px' }}
```
**Recommendation**: Use design system constants.

### 7. ❌ Date Formats and Currency

**Location**: `/lib/seo/constants.ts`
```typescript
// Line 269
dateFormat: 'YYYY-MM-DD',
// Line 271
currencyCode: 'USD'
```

**Location**: `/lib/utils.ts`
```typescript
// Line 11
currency: string = 'USD',
```
**Recommendation**: Move to locale/internationalization configuration.

### 8. ❌ Error Type Strings

**Location**: `/lib/analytics/error-resilient-service.ts`
```typescript
// Lines 201-206
const retryableErrors = [
  'GTAG_UNAVAILABLE',
  'NETWORK_ERROR',
  'TIMEOUT',
  'TEMPORARILY_UNAVAILABLE'
];
```
**Recommendation**: Create an error types enum or constants object.

## Recommendations

### 1. Create Centralized Constants Files

- `constants/errors.ts` - Error messages and types
- `constants/ui-labels.ts` - UI text and labels
- `constants/timeouts.ts` - All timeout and delay values
- `constants/dimensions.ts` - UI dimensions and sizes

### 2. Implement i18n System

Many hardcoded strings should be part of an internationalization system for:
- Error messages
- UI labels
- Success messages
- Navigation text

### 3. Use Environment Variables

URLs and endpoints should always come from environment variables:
```typescript
app: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
business: process.env.NEXT_PUBLIC_BUSINESS_URL || 'http://localhost:3002'
```

### 4. Create Enums for Fixed Values

Error types, event types, and status codes should use enums:
```typescript
enum AnalyticsErrorType {
  GTAG_UNAVAILABLE = 'GTAG_UNAVAILABLE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  // etc.
}
```

### 5. Extend Existing Configuration

The codebase already has good configuration patterns. Extend them to cover:
- Console/logging messages
- UI labels
- Error messages
- Timeout values

## Priority Items

1. **High Priority**: Error messages and user-facing text (UX impact)
2. **High Priority**: Magic numbers for timeouts and delays (maintainability)
3. **Medium Priority**: Console messages (debugging consistency)
4. **Medium Priority**: URL endpoints (deployment flexibility)
5. **Low Priority**: Internal error type strings (code organization)

## Positive Findings

The codebase demonstrates good practices in several areas:
- Centralized performance thresholds
- Well-organized design system constants
- Business metrics configuration
- SEO configuration management
- Brand configuration

These patterns should be extended to cover the hardcoded values identified in this audit.