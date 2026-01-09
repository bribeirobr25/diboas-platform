# Security & Compliance Guide

> **diBoaS platform security architecture, compliance frameworks, and data protection**

## Overview

Zero-trust security architecture with domain-separated controls for Banking, Investing, and DeFi. Enterprise-grade protection with ACID compliance, end-to-end encryption, and multi-layered authentication.

## Zero-Trust Security Architecture

### Core Principles
1. **Never Trust, Always Verify**: Every request validated regardless of source
2. **Multi-Layer Validation**: Authentication + Device + Risk + Permissions
3. **Dynamic Permissions**: Risk-based access control
4. **Security Context**: Immutable security state per request
5. **Correlation Tracking**: End-to-end request tracing

### Validation Layers
1. **Multi-Factor Authentication**: JWT + Session + Biometric
2. **Device Security**: Device fingerprinting, risk scoring
3. **Real-Time Risk Assessment**: Behavioral analysis, anomaly detection
4. **Dynamic Permission Evaluation**: Context-aware permissions
5. **Audit Logging**: Complete trail of all actions

### Security Context
**Contains**:
- User identity and roles
- Device trust level
- Risk score (LOW/MEDIUM/HIGH)
- Permissions granted
- Correlation ID for tracking
- Session metadata

**Features**:
- Immutable per request
- Logged for audit
- Step-up authentication trigger
- Permission checks

## Domain-Separated Security

### Multi-Subdomain Security Policies

**Marketing (diboas.com)**:
- Security Level: PUBLIC
- Authentication: Optional
- Rate Limit: 1000 req/hour per IP
- Session: 30 days
- Data Sensitivity: None

**Consumer App (app.diboas.com)**:
- Security Level: HIGH
- Authentication: Required
- MFA: Required for sensitive operations
- Rate Limit: 100 req/min per user
- Session: 24 hours (30 min idle timeout)
- Data Sensitivity: High (financial data)
- Encryption: AES-256

**Business App (business.diboas.com)**:
- Security Level: ENTERPRISE
- Authentication: Enterprise SSO required
- MFA: Always required
- Rate Limit: 500 req/min per organization
- Session: 8 hours (15 min idle timeout)
- Data Sensitivity: Highest
- Encryption: AES-256-GCM + mTLS
- IP Whitelisting: Enabled
- Audit Logging: Comprehensive
- Compliance: SOC2, PCI DSS, GDPR

### Financial Data Protection

**Balance Data Security**:
- Encryption: AES-256
- Rate Limit: 10 req/min (strict)
- Session Validation: Required
- Cache Policy: private, max-age=30
- Field Encryption: amount, accountNumber
- PII Redaction: Enabled

**Fee Data Security**:
- Encryption: TLS 1.3
- Transparency: Full fee breakdown
- Rate Limit: 30 req/min
- Cache Policy: private, max-age=300
- Immutability: Versioned fee structures

**Transaction Data Security**:
- Encryption: AES-256
- Immutability: Append-only logs
- Integrity Check: HMAC verification
- Rate Limit: 5 writes/min
- Step-Up Auth: Required for high-value
- Data Retention: 7 years (compliance)

## Domain-Specific Security

### Banking Domain Security
**Validation Requirements**:
- KYC status verification
- AML compliance check
- Transaction limit validation
- Account ownership verification
- Fraud pattern detection
- Step-up auth for wire transfers > $10,000

**Banking-Specific Rules**:
- SOX, PCI DSS, GDPR compliance
- Suspicious Activity Report (SAR) filing
- Large transaction reporting
- Rapid movement detection
- Structuring detection
- High-risk jurisdiction flagging

### Investing Domain Security
**Validation Requirements**:
- Accredited investor status
- Market hours validation
- Pattern day trading check
- Order size validation
- Market manipulation detection
- Margin requirement check

**Investing-Specific Rules**:
- SEC, FINRA regulations
- Best execution analysis
- Wash sale detection
- Insider trading prevention
- Multi-signature for large trades

### DeFi Domain Security
**Validation Requirements**:
- Protocol whitelist check
- Contract security audit verification
- Slippage tolerance validation
- Gas estimate validation
- Reentrancy protection
- Impermanent loss risk assessment

**DeFi-Specific Rules**:
- Smart contract formal verification
- MEV protection
- Strategy risk assessment
- TVL threshold monitoring
- Token compliance check
- Geo-restrictions enforcement

## Secure URL Architecture

### Zero Sensitive Data in URLs

**Secure Patterns**:
- `/banking/transaction/view?ref=tx_secure_abc123` ✅
- `/investing/trades?action=buy&asset=bitcoin` ✅
- `/defi/strategies` (no balance data in URL) ✅

**Avoid**:
- `/banking/transaction/12345/view` ❌ (exposes ID)
- `/banking/transaction/view/1000.00` ❌ (exposes amount)
- `/user/12345/balance` ❌ (exposes user ID and sensitive data)

### Secure Transaction References
**Features**:
- Encrypted reference generation
- Session binding
- Timestamp validation (1 hour expiry)
- Checksum verification
- Replay attack prevention
- URL-safe encoding

### Modal System for Details
**Security**:
- No URL changes on modal open
- Encrypted transaction references
- Session validation required
- User access verification
- Comprehensive audit logging
- Full fee breakdown displayed

## Authentication & Authorization

### Multi-Factor Authentication (MFA)

**MFA Requirements**:
- Business/Admin: Always required
- Risk-based: Required for 2+ risk factors
- Step-up: Required for sensitive operations

**Risk Factors**:
- New device
- New location
- High-risk country
- High-value account
- Suspicious activity detected

**Supported Methods**:
- SMS one-time password
- Authenticator app (TOTP)
- Biometric (fingerprint, face)
- Hardware security keys
- Push notifications

### Authorization Service

**Permission Levels**:
- Static permissions (role-based)
- Dynamic permissions (context-based)
- Resource-specific checks
- Time-based access

**Resource Checks**:
- Transaction: Owner only, status-based actions
- Account: Ownership verification
- Strategy: Risk level validation

## Data Security & Encryption

### Encryption Strategy

**Encryption Methods by Classification**:
- PII/Financial: AES-256-GCM
- Sensitive: AES-256-CBC
- Standard: AES-128-GCM

**Envelope Encryption**:
- Data Encryption Key (DEK) for data
- Master Key encrypts DEK
- Key rotation support
- HSM-managed keys

**Field-Level Encryption**:
- SSN, account numbers, routing numbers
- Private keys, API keys
- Credit card numbers
- Deterministic encryption for searchable fields

### Data Masking & Redaction

**Masking Rules**:
- SSN: `XXX-XX-####`
- Account: `****####`
- Credit Card: `****-****-****-####`

**Role-Based Masking**:
- Support: Balance/amount hidden
- Non-Admin: Full account/routing hidden
- All users: PII patterns redacted

**PII Detection Patterns**:
- SSN format detection
- Credit card pattern
- Email addresses
- Phone numbers

## API Security

### Security Middleware Layers
1. **Rate Limiting**: Per-user, per-IP, per-endpoint
2. **Authentication**: JWT + Session validation
3. **Request Validation**: Schema + business rules
4. **Security Headers**: CSP, HSTS, X-Frame-Options
5. **Audit Signing**: Correlation ID tracking

### Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`
- `Content-Security-Policy: [strict policy]`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: [restricted]`

### Input Validation & Sanitization

**Validation Steps**:
1. Schema validation
2. Input sanitization
3. Business rule validation
4. Security validation (SQL injection, XSS, etc.)

**Security Checks**:
- SQL injection prevention
- XSS protection
- Path traversal prevention
- Command injection detection

## Compliance Frameworks

### Banking Compliance (SOX, PCI DSS, GDPR)

**Required Checks**:
- KYC verification
- AML screening
- Transaction limits
- Sanctions list check
- PEP (Politically Exposed Person) list
- Source of funds verification

**AML Rules**:
- Large transaction detection ($10,000+)
- Rapid movement detection
- Structuring detection (breaking up large amounts)
- Unusual pattern analysis
- High-risk jurisdiction flagging

**Reporting**:
- Suspicious Activity Report (SAR) filing
- Currency Transaction Report (CTR)
- Compliance report generation

### Investing Compliance (SEC, FINRA)

**Required Checks**:
- Accredited investor verification
- Trading restriction validation
- Pattern day trading rules
- Market manipulation detection
- Insider trading prevention
- Wash sale detection

**Pattern Day Trading Rule**:
- 4+ day trades in 5 days triggers rule
- Minimum $25,000 account balance required
- Account restrictions if violated

**Best Execution**:
- Price improvement analysis
- Execution quality monitoring
- Order routing transparency

### DeFi Compliance

**Required Checks**:
- Protocol whitelist verification
- Geo-restriction enforcement
- Risk score assessment
- Protocol audit verification
- TVL (Total Value Locked) threshold
- Token compliance validation

**Geo-Restrictions**:
- Restricted jurisdictions: US (certain protocols), CN, KP
- Location verification required
- VPN detection

**Protocol Whitelisting**:
- Audited protocols only
- Risk level assessment
- TVL monitoring
- Security score tracking

## Infrastructure Security

### Network Security
**Firewall Rules**:
- HTTPS only (port 443) from anywhere
- SSH (port 22) from bastion only
- All other ports blocked

**Protection Layers**:
- DDoS protection (Cloudflare)
- Intrusion detection/prevention (IDS/IPS)
- Web Application Firewall (WAF)
- Internal VPN for services

### Secrets Management

**Secure Vault**:
- Provider: HashiCorp Vault
- Authentication: Kubernetes-based
- Automatic rotation
- Access auditing

**Rotation Policies**:
- Database credentials: 90 days
- API keys: 30 days
- Encryption keys: 365 days
- OAuth secrets: 180 days

### Monitoring & Alerting

**Event Monitoring**:
- Application events (login, logout, permission changes)
- API events (rate limits, auth failures)
- Database events (query timeouts, connection failures)
- Infrastructure events (CPU spike, memory alert)

**Anomaly Detection**:
- Unusual login patterns (95% threshold)
- Transaction velocity (98% threshold)
- API usage spikes (97% threshold)

**Alert Channels**:
- Email to security team
- Slack #security-alerts
- PagerDuty for critical incidents

## Incident Response

### Response Workflow
1. **Immediate Containment**: Block user/IP, invalidate sessions
2. **Evidence Preservation**: Capture logs, snapshots
3. **Impact Assessment**: Scope, severity, affected users
4. **Notification**: Internal teams, customers, regulators
5. **Remediation**: Fix vulnerabilities, restore systems
6. **Post-Incident Review**: Root cause analysis, improvements

### Containment Actions by Incident Type

**Unauthorized Access**:
- Block user account
- Invalidate all sessions
- Block source IP address

**Data Breach**:
- Isolate affected systems
- Revoke compromised credentials
- Enable emergency mode

**DDoS Attack**:
- Enable maximum DDoS protection
- Scale infrastructure
- Enable strict rate limiting

### Notification Requirements

**Internal** (Severity >= HIGH):
- Executive team
- Legal team
- Security team

**External** (Customer data affected):
- Affected customers (within 72 hours)
- Regulatory bodies (GDPR, state laws)
- Law enforcement (if required)

## Security Best Practices

### Development
1. Input validation on all user input
2. Parameterized queries (no string concatenation)
3. Least privilege principle
4. Secure defaults
5. Fail securely

### Deployment
1. Secrets in vault, not code
2. HTTPS everywhere
3. Security headers configured
4. Rate limiting enabled
5. Audit logging active

### Operations
1. Regular security audits
2. Penetration testing (quarterly)
3. Dependency vulnerability scanning
4. Security training for team
5. Incident response drills

## Summary

The diBoaS security architecture provides:

1. **Zero-Trust Model**: Every request validated, no implicit trust
2. **Domain-Separated Security**: Banking, Investing, DeFi-specific controls
3. **Data Protection**: End-to-end encryption, field-level security, PII redaction
4. **Secure URLs**: No sensitive data exposure, session-based access
5. **Multi-Layer Compliance**: SOX, PCI DSS, GDPR, SEC, FINRA
6. **Advanced Authentication**: Risk-based MFA, biometric support
7. **Granular Authorization**: Role-based + dynamic permissions
8. **API Security**: Rate limiting, input validation, security headers
9. **Infrastructure Security**: Network hardening, secrets management
10. **Proactive Monitoring**: Real-time detection, anomaly detection, incident response

---

**For implementation details**: See backend-condensed.md, database-condensed.md, and architecture-condensed.md
