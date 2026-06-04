# diBoaS Security Playbook

**Last updated:** 2026-05-27
**Scope:** Pre-launch marketing + waitlist site at diboas.com — Next.js 16 on Vercel, Neon Postgres, Resend, Upstash Redis, Cloudflare DNS-only.
**Audience:** Engineering owner. Written so a senior engineer (not a dedicated security engineer) can act on every section.

---

## 1. Why this document exists

The diBoaS platform is in pre-launch. Traffic is low, no production financial features are live, no user accounts exist yet. **That is precisely when security hardening pays the highest dividend** — it costs almost nothing to fix now, and every defense built during pre-launch becomes the baseline for the (much harder) post-launch operational reality.

This playbook captures:

1. **The actual threat model** — what an attacker would target on this stack in 2026, with citations
2. **The attack surface** — every entry point, sanitization path, and third-party trust boundary
3. **Defenses currently in place** — what the codebase already does well
4. **Gaps and recommendations** — what's missing, with effort estimates
5. **A repeatable scan workflow** — `scripts/security-scan.sh` (one-command runner)

It deliberately does *not* duplicate the canonical references — for OWASP Top 10 details, see `https://owasp.org/Top10/2025/`. This doc is the diBoaS-specific layer on top.

---

## 2. Threat model — what an attacker would target

### 2.1 The attacker's actual goal hierarchy

For a pre-launch waitlist site with no live financial product, the realistic attacker goals — in descending order of attractiveness — are:

| # | Goal | Vector | Payoff |
|---|---|---|---|
| 1 | Scrape the email list | API enumeration via `/api/waitlist/*` | Sell list, phishing target acquisition |
| 2 | Game the leaderboard / referral system | Mass-signup with disposable emails + referral cycling | Become "top referrer" before launch — gain founder-tier seats / rewards |
| 3 | Send spam from diboas.com (DKIM-signed) | Email-header injection in waitlist signup name field; or DMARC/SPF bypass | Bypass content filters — high-conversion spam under your domain reputation |
| 4 | Brand damage via defacement | Subdomain takeover on dangling DNS; XSS in lesson/FAQ; supply-chain compromise of analytics scripts | Press attention, user-trust damage during launch window |
| 5 | Compete economically — bill-shock the founder | DDoS via `/api/og` (image gen) or calculator endpoints | Vercel function-second billing, Neon connection saturation |
| 6 | Server-side execution (RCE) | npm supply chain (Shai-Hulud-style), Next.js Server Action abuse (none used yet), `_next/image` SSRF | Highest payoff but lowest yield on this stack today |

**Note: this hierarchy will invert after launch.** Once real funds flow, goals #1 and #5 stay; goals #2-4 become less attractive vs. credential theft, account takeover, and balance manipulation.

### 2.2 Most relevant OWASP categories — 2025 edition

OWASP Top 10:2025 was finalized in January 2026 ([owasp.org/Top10/2025/](https://owasp.org/Top10/2025/)). The categories that matter most for diBoaS, in order of relevance:

- **A01 Broken Access Control** (now includes SSRF, absorbed from A10:2021) — applies to all 11 API routes. Token-based deletion and unsubscribe flows must verify the token-to-record binding, not just the token signature.
- **A03 Software Supply Chain Failures** (promoted from A06:2021) — **highest exploit/impact score in the entire list**. The diBoaS site uses `posthog-js`, one of the packages actively compromised in the Shai-Hulud 2.0 worm wave (November 24, 2025). Every `pnpm install` is a roll of the dice unless lockfile integrity is enforced.
- **A02 Security Misconfiguration** — Vercel preview URLs default public; CSP missing some directives; DMARC currently `p=none` (no enforcement).
- **A04 Cryptographic Failures** — AES-256-GCM + HMAC-SHA256 blind index for email PII is the right design; correctness of implementation is the audit target.

### 2.3 OWASP API Security Top 10 — 2023 edition (still canonical in 2026)

For the API surface specifically:

- **API1: Broken Object Level Authorization (BOLA)** — `/api/waitlist/delete?token=...`, `/api/email/unsubscribe?t=...`, `/api/waitlist/position?email=...`. The token-to-record binding must be cryptographic, not just "the token exists in the table."
- **API4: Unrestricted Resource Consumption** — `/api/og` carries billing-amplification risk (Vercel Function-second pricing; a sustained flood adds up). **The og routes now apply a per-IP `checkRateLimit`** (`[page]`/`share`/`dream`), so the residual exposure is the Edge in-memory-fallback weakness (per-isolate, ineffective without Upstash) rather than an unguarded endpoint — keep Upstash reachable for og.
- **API6: Unrestricted Access to Sensitive Business Flows** — `/api/waitlist/signup` is the textbook example. 10K rotating IPs at 1 RPS each defeats classic per-IP rate limits. Behavioral signals are required.

---

## 3. Attack surface map

### 3.1 Public API endpoints (11 routes)

| Endpoint | Methods | Auth | Rate-limit class | CSRF | Token gating |
|---|---|---|---|---|---|
| `/api/waitlist/signup` | POST | None | **strict** (5/min) | ✓ | — |
| `/api/waitlist/signup` | GET | None | standard (30/min) | — | — |
| `/api/waitlist/delete` | POST + DELETE | None | strict | ✓ | HMAC token (single-use, 15min TTL) |
| `/api/waitlist/position` | GET | None | standard | — | — |
| `/api/waitlist/position` | POST | **API key** (`INTERNAL_API_KEY`) | standard | ✓ | — |
| `/api/waitlist/referral` | GET | None | lenient (100/min) | — | — |
| `/api/waitlist/stats` | GET | None | lenient | — | — |
| `/api/email/unsubscribe` | GET + POST | None | standard | — | HMAC token (constant-time verify) |
| `/api/consent` | GET + POST + DELETE | None | standard / lenient | ✓ on mutate | — |
| `/api/monitoring` | POST | None | per-IP 1000/60s (F9, 2026-06-02) | **NONE** (deliberate — SDK can't send token) | DSN regex + 1MB body cap |
| `/api/health` (+`/ready`, `/live`) | GET + HEAD | Optional API key for detail | lenient | — | — |
| `/api/og/*` | GET | None | per-IP `checkRateLimit` (lenient, Edge) | — | — |

**Key defenses already in place:**
- Origin + Referer validation on all CSRF-protected mutations (`apps/web/src/lib/security/csrf.ts`)
- Constant-time HMAC comparison via `crypto.timingSafeEqual`
- Generic error responses with artificial delay (100-300ms) to prevent timing-based email enumeration
- Idempotency-key caching on `/api/waitlist/signup`
- All DB queries parameterized via Neon's `sql` template literal; `rawSql` not used in user-facing paths
- All `dangerouslySetInnerHTML` uses either receive hardcoded JSON-LD or DOMPurify-sanitized content (one exception flagged in §5.3)

### 3.2 Form inputs

The site has exactly five user-facing forms:

| Form | Fields | Client validation | Server validation | Sanitization |
|---|---|---|---|---|
| Waitlist signup | email, name (optional), gdprAccepted, referredBy (hidden) | Zod-like in custom hook | `validateEmail()`, `isValidName()` (length 100, trim) | `sanitizeText()`; stored AES-256-GCM encrypted |
| Email unsubscribe | id (HMAC hash), token (HMAC sig), action (enum) | Format check | `verifyToken()` constant-time | Tokens are HMAC-signed, no plaintext |
| Consent banner | analytics (boolean) | Type guard | Type guard | Cookie write (SameSite=Strict) |
| Position lookup | email (query param) | Loose regex | `sanitizeEmail() + isValidEmail()` | Read-only; no rendering |
| Referral lookup | code (query param) | Format check | `isValidReferralCode()` (format only) | Read-only |

**`name` is the only user-supplied text that reaches storage.** It's length-capped (100 chars) and sanitized; stored encrypted; surfaces only in React Email templates (which auto-escape JSX expressions). No XSS path identified.

### 3.3 Third-party JavaScript trust surface

CSP `script-src` (from `apps/web/middleware.ts` `csp` builder — search for `script-src` since line numbers drift) trusts:

- `vercel.live`, `nextjs.org` — Vercel platform + Next.js error overlay (dev)
- `*.googletagmanager.com`, `*.google-analytics.com` — Google tag stack
- `*.i.posthog.com` — PostHog ingest + assets hosts (US + EU coverage in a single full-label wildcard; see `docs/tech/MONITORING_OPS.md` § C for why partial-label patterns like `*-assets.i.posthog.com` are silently invalid per CSP 3 spec)

The CSP has additional allowlists for non-script directives that are worth distinguishing because their blast radius differs significantly:

- **`connect-src`** — `api.diboas.com`, `api.diboas-analytics.com` (own APIs — **data-exfiltration risk if taken over**), `vitals.vercel-analytics.com` (Vercel web-vitals), `app.posthog.com` + `*.posthog.com` (PostHog `/decide` and ingest POSTs — broader wildcard than script-src because the SDK posts to non-`.i.` subdomains too), `*.google-analytics.com`, `*.googletagmanager.com`, `*.doubleclick.net` (GA4 collect + tag-manager + DoubleClick beacons)
- **`img-src`** — `cdn.diboas.com` (asset CDN; **asset-substitution risk only if taken over** — no data exfil)
- **`media-src`** — `cdn.diboas.com` (same as above)
- **`worker-src`** — `'self' blob:` (Sentry session-replay spawns a worker from a `blob:` URL; documented in MONITORING_OPS.md § B)

The distinction matters for subdomain-takeover analysis (see §5.4). A dangling `cdn.diboas.com` would let an attacker swap images/video; a dangling `api.diboas.com` would let an attacker intercept fetch responses to logged-in users. Don't conflate the two.

**2026-06-01 — F11a + F11b RESOLVED via DNS recon.** All three subdomains (`api.diboas.com`, `api.diboas-analytics.com`, `cdn.diboas.com`) have **no DNS resolution** today; zero takeover risk while in that state. The CSP entries remain as intentional forward-declarations for iter-5 SDK swap + future API/CDN work. Re-verify before/after each DNS-add gate. See `docs/audit/SECURITY_FINDINGS_2026-05.md` § F11a + F11b.

**Subresource Integrity (SRI) is not applied** and cannot be applied to tag-manager-style dynamic loaders. This is the standard trade-off. The mitigation is the per-request CSP **nonce** which blocks inline script injection — already in place in `middleware.ts`.

**The supply-chain risk for the SDKs themselves (PostHog, Sentry, GA tag) is real and not mitigated at the application layer.** Defenses live at the build layer: lockfile enforcement (`pnpm install --frozen-lockfile` is used in CI), `pnpm audit` weekly via the existing security workflow, and the gitleaks pre-commit hook that now blocks new committed secrets.

### 3.4 Dangerously rendered HTML

Five `dangerouslySetInnerHTML` usages (verified via `git grep`):

| File | Source | Risk |
|---|---|---|
| `app/layout.tsx:108, 124` | Hardcoded JSON-LD / GA script | Safe |
| `components/SEO/StructuredData.tsx:25` | Hardcoded JSON-LD | Safe |
| `components/Sections/FAQAccordion/.../FAQAccordionDefault.tsx:36` | DOMPurify sanitized FAQ HTML | Safe |
| `components/Sections/Lesson/.../LessonThreeBeat.tsx:135, 151` | Custom `renderInlineEmphasis()` regex replacer | **Verify CMS source — if any user input ever reaches `p`, switch to DOMPurify** |

### 3.5 Database surface

- Migrations 001-012 (`apps/web/src/lib/database/migrations/*.sql`) — schema-only; no seed PII; AES-256-GCM + HMAC blind index pattern correctly applied to `waitlist_entries` and `email_delivery_logs`
- Migration runner is idempotent via `schema_migrations` tracking table
- Query layer (`apps/web/src/lib/database/client.ts`) parameterizes via Neon's `sql` tag — string-interpolated SQL is not present in API routes
- `rawSql()` exists but is only called from migration scripts, never from user-facing paths

### 3.6 Email surface

- All template variables flow through React Email components → automatic JSX-expression escaping
- All email headers (`From`, `Reply-To`, `Subject`) are hardcoded env-var or constant strings — no user input reaches headers → no header-injection vector
- Resend API key is gated by `env.ts` production-secrets check (throws at startup if missing)
- Circuit breaker (3 consecutive failures → 60s backoff) prevents send-loop amplification
- **Per-email-address volume cap (F8 — RESOLVED 2026-06-02):** `checkOutboundEmailRateLimit` caps a single address to **2 outbound emails per 5 minutes** (keyed by HMAC hash; gates all four send sites in `WaitlistApplicationService` via `allowOutboundEmail()`), closing the email-bombing vector that was previously open here. Fail-closed in production. (Was tracked as finding **F8**, not F2.)

### 3.7 DNS + email-deliverability surface (audited 2026-05-27)

```
A:        64.29.17.1, 216.198.79.1            (Vercel anycast)
AAAA:     none
www:      9718e0aa3bd04c20.vercel-dns-017.com.
MX:       diboas-com.mail.protection.outlook.com.   (Microsoft 365)
SPF:      v=spf1 include:spf.protection.outlook.com include:amazonses.com ~all
DMARC:    v=DMARC1; p=none; rua=mailto:dmarc@diboas.com   ⚠ p=none = monitor-only (F1 open — Phase 4 ramp)
DKIM:     no apex selectors (selector1/selector2._domainkey.diboas.com both empty)  ⚠ F3 open — Phase 4 BLOCKER
          resend._domainkey.adelaide.diboas.com (Resend signing, valid)              ✓
CAA:      0 issue "letsencrypt.org" + 0 iodef "mailto:security@diboas.com"           ✓ F5 RESOLVED 2026-05-30
          + Cloudflare auto-injects partner-CA records (comodoca, digicert, ssl.com, pki.goog) per zone SSL/TLS config
NS:       malcolm.ns.cloudflare.com, zara.ns.cloudflare.com
send.adelaide.diboas.com:
  TXT:    v=spf1 include:amazonses.com ~all   (Resend SES)
  MX:     10 feedback-smtp.us-east-1.amazonses.com.
```

**State as of 2026-06-01:**
- F1 (DMARC `p=none`) — open, calendar-gated on F3; Phase 4 ramp `none → quarantine → reject` over 30+30 days per Bar's locked Q1 decision
- F3 (apex DKIM missing) — open, BLOCKING for Phase 4; Bar's M365 admin task (enable DKIM → 2 Cloudflare CNAMEs → verify)
- F5 (CAA) — **RESOLVED 2026-05-30**. Net effective policy: Let's Encrypt + Cloudflare auto-injected partner-CAs. See `SECURITY_FINDINGS_2026-05.md` § F5 status note for the partner-CA acceptance rationale.

### 3.8 Subdomain surface

The CSP allowlists three diBoaS-owned subdomains across different directives:

| Subdomain | CSP directive | Blast radius if taken over |
|---|---|---|
| `api.diboas.com` | `connect-src` | **Data exfiltration** (fetch/XHR intercept) |
| `api.diboas-analytics.com` | `connect-src` | **Data exfiltration** (fetch/XHR intercept) |
| `cdn.diboas.com` | `img-src` + `media-src` | Asset substitution only (no data exfil) |

Of these, only `send.adelaide.diboas.com` (Resend, separate from the CSP allowlist) was confirmed active during scan. The others either don't resolve or weren't probed. **If any have DNS records but no live origin, they are subdomain-takeover candidates** — particularly any CNAME pointing at `*.vercel.app` or similar where the upstream project may have been deleted (per [Vercel subdomain takeover documentation, 2024-2025](https://medium.com/@pentestfox/how-i-took-over-a-vercel-subdomain-e7b03dbf222d)).

**Historical note**: `apps/web/middleware.ts:127` already excludes `security.txt` from the i18n locale-routing matcher — suggesting `/.well-known/security.txt` was at one point planned. The exclusion is harmless without the file present.

---

## 4. Defenses currently in place — what's working

This section is the positive ledger. Don't regress these.

### 4.1 Network + TLS

- **TLS 1.3 only** in practice (TLS 1.0 / 1.1 actively rejected; verified via `openssl s_client`)
- **HSTS preload + 1-year max-age + includeSubDomains** — `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- Vercel-managed Let's Encrypt cert; auto-renewal
- All HTTP → HTTPS redirect at edge

### 4.2 HTTP security headers

Verified from `curl -I https://diboas.com/api/health`:

```
strict-transport-security: max-age=31536000; includeSubDomains; preload
x-content-type-options: nosniff
x-frame-options: DENY
referrer-policy: strict-origin-when-cross-origin
permissions-policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
content-security-policy: default-src 'self'; script-src 'self' 'nonce-<per-request>' ...; ... frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self' ...
```

CSP is nonce-based with `frame-ancestors 'none'` (clickjacking defense), `object-src 'none'` (plugin defense), `base-uri 'self'` (base-tag injection defense), and `form-action 'self'` (form-redirect-to-evil defense). The only soft spot is `script-src 'self'` (could be tightened — see §6 F8).

### 4.3 Application code

- All API mutations validate `Origin` / `Referer` against allowlist
- Constant-time HMAC comparison (`crypto.timingSafeEqual`)
- Deterministic dummy responses + artificial delays on email-existence-revealing endpoints
- Generic error responses (no DB error leakage)
- Rate limit applied to every API route (verified by attack-surface map)
- Idempotency-key caching on signup
- AES-256-GCM encryption for stored email; HMAC-SHA256 blind index for lookups
- Production-secrets validator throws at startup if `ENCRYPTION_KEY` / `DATABASE_URL` / `INTERNAL_API_KEY` / `RESEND_API_KEY` / `HMAC_KEY` missing
- DOMPurify on FAQ HTML; React Email auto-escapes template variables

### 4.4 Build + supply chain

- `pnpm install --frozen-lockfile` in CI (locked dependency graph)
- `pnpm audit --prod --audit-level=critical` weekly (via `.github/workflows/security.yml`)
- Gitleaks pre-commit hook (added 2026-05-27) — scans staged diffs for secret-shaped strings
- Gitleaks CI job — scans every PR for secret regressions
- No `.env*` files ever committed (verified across full history)

### 4.5 Database + secrets

- `DATABASE_URL`, `RESEND_API_KEY`, `ENCRYPTION_KEY`, `HMAC_KEY`, `INTERNAL_API_KEY`, `UPSTASH_*` all stored as **Sensitive** in Vercel (encrypted at rest, restricted access)
- Migration runner is idempotent
- Connection pooling via Neon's HTTP driver (no TCP exhaustion on serverless cold-start)
- 8-second query timeout (`withTimeout(8000)`) prevents hung queries

---

## 5. Gaps and recommendations

This is the action-oriented section. Each item has a finding ID (F1, F2, ...) used in `docs/audit/SECURITY_FINDINGS_2026-05.md` for tracking.

(See companion finding ledger for the full prioritized action list with effort estimates.)

---

## 6. Periodic security scan workflow

Run `scripts/security-scan.sh` quarterly (or after any major dependency / infrastructure change). It's a one-command runner that wraps:

- `pnpm audit --prod` — dependency CVE check
- `pnpm run secrets:scan` — gitleaks full-history scan
- DNS audit (SPF / DMARC / DKIM / CAA / subdomain enum via crt.sh)
- TLS + HTTP header grading (sslyze + curl)
- Mozilla Observatory + SecurityHeaders.com (API-based)
- Live endpoint probe (catch-all routing canary, well-known path discovery)

Tools the script recommends you install for deeper scans (not bundled):

- **OWASP ZAP** (DAST) — `docker run -t zaproxy/zap-stable zap-baseline.py -t https://diboas.com`
- **Nuclei** (template-based vuln scanner) — `nuclei -u https://diboas.com -severity critical,high`
- **Semgrep** (SAST) — `semgrep --config=auto apps/web/src`
- **testssl.sh** (TLS deep audit) — `testssl.sh https://diboas.com`

---

## 7. Incident response basics

If you suspect a real incident (mass-signup attack, suspicious deploy, leaked credential):

1. **Stop the bleeding** — disable the affected endpoint via Vercel WAF "Block all" rule before investigating
2. **Rotate the credential** at the source (Sentry / Resend / Neon / Vercel / GitHub PAT) — see `SECURITY.md` for the rotation cookbook
3. **Snapshot state** — `git log -10`, `vercel logs --since=24h`, Neon connection logs, Sentry recent events
4. **Communicate** — if PII was exposed, GDPR Art. 33 / LGPD breach-notification clocks start ticking (72h EU, "reasonable time" BR)
5. **Post-mortem** — write up in `docs/audit/` (local-only), use it to update this playbook

For non-incident reports from security researchers, see `SECURITY.md` (vulnerability disclosure address).

---

## 8. References

Primary sources cited in this document:

- OWASP Top 10:2025 — https://owasp.org/Top10/2025/
- OWASP API Security Top 10 (2023) — https://owasp.org/API-Security/editions/2023/en/
- Next.js security advisories — https://github.com/vercel/next.js/security/advisories
- Vercel security blog — https://vercel.com/security
- CISA Known Exploited Vulnerabilities catalog — https://cisa.gov/known-exploited-vulnerabilities-catalog
- NIST NVD — https://nvd.nist.gov

For diBoaS-specific changelog of security work, see `docs/audit/SECURITY_FINDINGS_2026-05.md` (local-only) and the git history of this file.
