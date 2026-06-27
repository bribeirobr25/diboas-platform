# Monitoring Operations Playbook

**Status:** committed, source of truth for monitoring ops
**Scope:** error tracking (Sentry), product analytics (PostHog), traffic analytics (GA4), web-vitals
**Audience:** engineers configuring, deploying, debugging, or rotating the monitoring stack
**Companion docs:**

- `docs/tech/infrastructure.md` § Monitoring — high-level overview
- `CLAUDE.md` § Monitoring — one-page operating constraints
- `docs/monitoring/INFRASTRUCTURE_GUIDE.md` — local-only, contains actual project IDs / dashboard links / rotation runbooks
- `apps/web/.env.example` — env-var inline comments

> **No sensitive data in this file.** DSN URLs, project IDs, key names, and dashboard bookmarks live in `INFRASTRUCTURE_GUIDE.md` (local-only). This playbook describes the _shape_ of the configuration, not the values.

---

## A. Overview

### What we run and why

| Tool                                  | Purpose                                              | Loading strategy                                         | Consent-gated?                                                        |
| ------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| **Sentry** (`@sentry/nextjs`)         | Error tracking + session replay + perf tracing       | Server, edge, client SDKs all init at startup if DSN set | No (errors are not PII; session replay is consent-gated separately)   |
| **PostHog** (`posthog-js`)            | Product analytics, feature flags, A/B tests, surveys | Lazy `import('posthog-js')` after consent                | **Yes** — only initialises after `hasAnalyticsConsent()` returns true |
| **GA4** (`gtag.js` via `next/script`) | Traffic analytics, conversion attribution            | `afterInteractive` script strategy                       | **Yes** — gated via Google Consent Mode v2                            |
| **web-vitals** (`web-vitals` npm)     | Core Web Vitals (LCP, INP, CLS, FCP, TTFB)           | Dynamic `import()` with sample rate                      | No (no PII)                                                           |

### High-level architecture

```
Browser ─┬─ Sentry SDK ──POST──> /api/monitoring (same-origin tunnel) ──> *.ingest.sentry.io
         │
         ├─ PostHog SDK (consent-gated) ──POST──> us.i.posthog.com (ingest)
         │                              ──GET───> us-assets.i.posthog.com (array.js, recorder.js, surveys.js)
         │
         ├─ GA4 gtag.js  ──POST──> *.google-analytics.com / *.googletagmanager.com
         │
         └─ web-vitals   ──> analyticsService.trackPerformance ──> `page_performance` analytics event (GA4 / PostHog) — NOT the Sentry tunnel

Server ──┬─ Sentry server SDK   (instrumentation.ts → sentry.server.config.ts)
         └─ Sentry edge SDK     (instrumentation.ts → sentry.edge.config.ts)
```

The Sentry tunnel route exists for two reasons:

1. **Same-origin = no CSP `connect-src` exposure to Sentry's hostname** — keeps the CSP narrow
2. **Ad-blocker bypass** — uBlock, Privacy Badger, Brave Shields all block `*.ingest.sentry.io` by default; same-origin POSTs go through

### File map (committed code)

| Component                                                                                 | File                                                                            |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Next.js root instrumentation (loads server/edge Sentry by runtime)                        | `apps/web/src/instrumentation.ts`                                               |
| Server-side Sentry init (loaded by `instrumentation.ts` when `NEXT_RUNTIME === 'nodejs'`) | `apps/web/sentry.server.config.ts`                                              |
| Edge-runtime Sentry init (loaded when `NEXT_RUNTIME === 'edge'`)                          | `apps/web/sentry.edge.config.ts`                                                |
| Client-side Sentry init (consent-gated Replay — Lighthouse Workstream B)                  | `apps/web/src/instrumentation-client.ts`                                        |
| Server-side error capture hook (`onRequestError`) for RSC + route handlers + middleware   | `apps/web/src/instrumentation.ts` § `onRequestError`                            |
| Sentry build plugin config                                                                | `apps/web/next.config.js` § `sentryWebpackPluginOptions`                        |
| Sentry tunnel route                                                                       | `apps/web/src/app/api/monitoring/route.ts`                                      |
| PostHog Provider (consent-gated init)                                                     | `apps/web/src/components/Providers/PostHogProvider.tsx`                         |
| PostHog ENV config                                                                        | `apps/web/src/config/env.ts` § `POSTHOG_CONFIG`                                 |
| GA4 script loader (consent-gated `<Script>` mounting — Lighthouse Workstream D)           | `apps/web/src/components/Providers/GoogleAnalyticsLoader.tsx`                   |
| GA4 Consent Mode v2 inline bootstrap (pre-hydration)                                      | `apps/web/src/app/layout.tsx`                                                   |
| web-vitals tracker component                                                              | `apps/web/src/components/Performance/WebVitalsTracker.tsx`                      |
| web-vitals helper module                                                                  | `apps/web/src/lib/analytics/web-vitals.ts`                                      |
| Client-side analytics config (telemetry tagging)                                          | `apps/web/src/config/monitoring.ts` § `SENTRY_CONFIG`                           |
| CSP directive (script-src, connect-src, worker-src)                                       | `apps/web/middleware.ts` § `csp` builder                                        |
| Turborepo env passthrough                                                                 | `turbo.json` § `pipeline.build.env` (and `.dev.env` if dev needs build secrets) |

---

## B. Sentry configuration

### Initialisation contract

Sentry initialises in three runtime contexts. Each has its own config file because Edge and Server have different module-resolution and API surfaces (Edge Runtime has no `node:crypto`, no Node streams, etc.). Next.js 16 wires them together via a single root instrumentation file:

```
apps/web/src/instrumentation.ts            ← Next.js root entry
  ├─ register() — switches on NEXT_RUNTIME:
  │     'nodejs' → import ../sentry.server.config
  │     'edge'   → import ../sentry.edge.config
  └─ onRequestError() — server-side error hook (RSC, route handlers, middleware)
                        called automatically by Next.js on request-time errors

apps/web/sentry.server.config.ts           ← Node.js runtime API routes + Server Components
apps/web/sentry.edge.config.ts             ← middleware.ts + any edge-runtime routes
apps/web/src/instrumentation-client.ts     ← browser; auto-loaded by Next.js 16 (replaces the legacy `sentry.client.config.ts` per Turbopack-compat convention)
```

All read `process.env.NEXT_PUBLIC_SENTRY_DSN`. If unset, `Sentry.init()` is skipped entirely — the SDK becomes a no-op. This is the intended dev / stub-env behaviour: builds run, no Sentry traffic generated.

The `onRequestError` hook in `instrumentation.ts` is what catches **server-side** errors (RSC render failures, route handler exceptions, middleware crashes). It dynamically imports `@sentry/nextjs` and calls `Sentry.captureException(error, { tags: { correlationId: request.headers['x-request-id'] }, extra: { path, method, routePath, routeType } })`. This is separate from the browser-side `window.onerror` / `unhandledrejection` hooks that the client SDK registers automatically.

**Server↔client error correlation (E-2, 2026-06-07).** Both Sentry doors tag every event with `correlationId` = the middleware-set `x-request-id`: the **server door** here reads `request.headers['x-request-id']`; the **client door** (`ErrorReportingService.captureException`) reads `Logger.getRequestId()` (which the client picks up from the `<meta name="x-request-id">` tag rendered in `layout.tsx`). A client error and the server request that produced it therefore share a `correlationId` tag in Sentry. This rides on **`tags`** specifically because `beforeSend` scrubs `user` / `extra` / `breadcrumbs` but **not** `tags` (see below) — do not move `correlationId` onto `extra`, and do not add `tags` to the scrub list.

### Release tagging — single source of truth

`Sentry.init({ release })` reads from `process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0'`. **The fallback `'0.1.0'` MUST match `apps/web/package.json#version`.** When you bump the package version, the fallback must follow. The Sentry build plugin overrides this in production builds with the Vercel commit SHA, but the fallback covers dev / preview / stub builds.

If `release` is stale or empty:

- Errors get tagged to the wrong release in Sentry
- Source maps fail to associate with the in-flight build
- "Resolved in version X" tracking in Sentry breaks

### Tunnel route — `/api/monitoring`

```
apps/web/src/app/api/monitoring/route.ts
```

**Critical history (do not regress):**

- The path was originally `/monitoring` (per Sentry docs default). Our locale-prefix middleware redirected unknown paths to `/<locale>/...`, which turned `/monitoring` into `/en/monitoring` 404. **Phase 5.1.b (2026-05-09)** moved it to `/api/monitoring` because `apps/web/middleware.ts` already excludes `/api/...` from the locale-prefix matcher.
- Under Turbopack the Sentry Webpack plugin does **NOT** auto-generate the tunnel route handler. We ship a **manual handler** that validates the envelope DSN host against `*.ingest(.<region>)?.sentry.io` and forwards the body upstream.
- The handler **deliberately skips `applyCsrf`** (the Sentry SDK posts on every error/replay segment without a CSRF token). It **does apply a permissive per-IP rate limit** — added in **F9 (2026-06-02)**: `checkMonitoringTunnelRateLimit` (sliding window), a billing-amplification guard that is **fail-closed in production** and returns `429` + `Retry-After` so the SDK's offline buffer re-delivers rather than dropping telemetry. ⚠️ **Gotcha:** that limiter needs Upstash, and `UPSTASH_REDIS_REST_URL/TOKEN` are scoped **Production-only** — so on **Preview deploys it fails-closed and every tunnel POST 429s** (client error-tracking is effectively off there; events buffer + retry but drop if sustained). The fail-closed path is gated on `IS_PRODUCTION` in `rateLimiter.ts` — **local dev does NOT 429**, it uses the in-memory limiter fallback. The original caution here — "per-IP rate-limiting either blocks legitimate error bursts or sets limits so generous they don't protect anything" — is exactly the live tradeoff to watch; see **`docs/audit/PENDING_ALL.md` item 5.35** for the fail-open-vs-fail-closed decision + the prod-throttle verification. Other defense in depth:
  - Body size cap at 1 MB (Sentry envelopes are typically <100 KB; replay segments peak ~500 KB)
  - DSN host regex validation (rejects forwarding to non-Sentry hosts)
  - POST-only (other methods 405 automatically)

When debugging tunnel failures, the first thing to check is the response from `POST /api/monitoring`.

**Statuses generated by OUR tunnel handler** (`apps/web/src/app/api/monitoring/route.ts`):

| Response                  | Body                                                                                               | Meaning                                                                                                                                                                                                                                                                                         |
| ------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **204 No Content**        | empty                                                                                              | Sentry DSN unset — handler short-circuits. Set `NEXT_PUBLIC_SENTRY_DSN` if you want events.                                                                                                                                                                                                     |
| **400 Bad Request**       | `{"error":"invalid_body"\|"invalid_envelope"\|"missing_dsn"\|"invalid_dsn"\|"invalid_project_id"}` | Body/envelope validation failed before forwarding. Indicates a bug in either the SDK or our route.                                                                                                                                                                                              |
| **403 Forbidden**         | `{"error":"forbidden_host"}`                                                                       | The envelope's DSN host doesn't match the `*.sentry.io` allowlist. **Our** guard against SSRF.                                                                                                                                                                                                  |
| **413 Payload Too Large** | `{"error":"payload_too_large"}`                                                                    | Envelope exceeded 1 MB. Usually a runaway session replay.                                                                                                                                                                                                                                       |
| **429 Too Many Requests** | `{"error":"rate_limited"}` + `Retry-After`                                                         | F9 per-IP rate limit hit OR (more commonly) the limiter is **fail-closed** because Upstash is absent — expected on Preview (Production-only Upstash; fail-closed is `IS_PRODUCTION`-gated, so local dev uses the in-memory fallback and does not 429). SDK buffers + retries. See pending 5.35. |
| **502 Bad Gateway**       | `{"error":"upstream_unreachable"}`                                                                 | `fetch()` to upstream Sentry threw (network error, DNS failure, etc). Distinct from upstream Sentry returning 502.                                                                                                                                                                              |

**Statuses FORWARDED verbatim from upstream Sentry ingest** (any non-204/non-error-shaped JSON response): the route uses `return new NextResponse(upstreamRes.body, { status: upstreamRes.status })` on the happy path, so anything Sentry returns is passed through unchanged.

| Upstream response                                               | Likely meaning at Sentry's end                                                                                                                                                                                                 |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **200 OK**                                                      | Envelope accepted. Event will appear in Sentry dashboard.                                                                                                                                                                      |
| **400 Bad Request**                                             | Sentry-side envelope validation failed (malformed payload). Check the response body for Sentry's error description.                                                                                                            |
| **401 Unauthorized**                                            | DSN public key invalid. Check the DSN value in `NEXT_PUBLIC_SENTRY_DSN`.                                                                                                                                                       |
| **403 Forbidden with body containing `with_reason: ProjectId`** | **The DSN's project key is DISABLED in Sentry.** See § E.2 (the 3-month silent-dropout incident). Check Sentry → Project Settings → Client Keys; the key must show "Active".                                                   |
| **403 Forbidden** (other reasons)                               | Project disabled, organisation suspended, or Sentry IP-rejected the request. Check the response body.                                                                                                                          |
| **413 Payload Too Large**                                       | Sentry's own envelope-size cap exceeded (larger than ours; rare). Investigate the envelope contents.                                                                                                                           |
| **429 Too Many Requests**                                       | Rate-limited by Sentry. Response includes `Retry-After` header (seconds). SDK should respect this automatically.                                                                                                               |
| **500 / 502 / 503 / 504**                                       | Upstream Sentry ingest hiccup. Usually transient — SDK has built-in retry via offline buffer. Verify via [status.sentry.io](https://status.sentry.io). If persistent, see § G "I see persistent 5xx on /api/monitoring" below. |

### Build plugin — source maps and release tagging

In `apps/web/next.config.js`:

```js
const sentryWebpackPluginOptions = {
  silent: true, // flip to false to debug build-time issues
  disableServerWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
  disableClientWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
  hideSourceMaps: process.env.NODE_ENV === 'production',
  widenClientFileUpload: true,
  tunnelRoute: '/api/monitoring',
  webpack: {
    treeshake: { removeDebugLogging: process.env.NODE_ENV === 'production' },
    automaticVercelMonitors: true,
  },
};

module.exports = process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig;
```

The plugin needs **three** env vars at build time. **None of them are `NEXT_PUBLIC_*`** — they're server-side build secrets:

| Var                 | Purpose                                           | Where set                                 |
| ------------------- | ------------------------------------------------- | ----------------------------------------- |
| `SENTRY_AUTH_TOKEN` | Auth for Sentry API (releases, source map upload) | Vercel project env, also `turbo.json#env` |
| `SENTRY_ORG`        | Sentry organisation slug                          | Vercel project env, also `turbo.json#env` |
| `SENTRY_PROJECT`    | Sentry project slug                               | Vercel project env, also `turbo.json#env` |

**If any of the three is missing, source maps will NOT upload** but the build does NOT fail — it logs and continues. With `silent: true` (the default), you won't see the warning unless you flip silent off. See § E "Common build & deploy pitfalls" below.

### Sentry session replay (consent-gated, Lighthouse Workstream B)

Session replay is bundled into `@sentry/nextjs`. Replay traffic goes through the same `/api/monitoring` tunnel.

**Replay is OFF by default and added only after consent — NOT at SDK init time.** This is the Lighthouse Remediation Plan Workstream B pattern (2026-05-22) — defers the ~120 KB Replay integration until the user accepts analytics cookies.

The flow in `apps/web/src/instrumentation-client.ts`:

1. `Sentry.init({ replaysSessionSampleRate: 0, ... })` — Replay integration NOT included at init.
2. Subscribe to `applicationEventBus` events:
   - `CONSENT_GIVEN` (analytics or all) → `client.addIntegration(Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }))`. Note: the init sample rates (`replaysSessionSampleRate: 0`, `replaysOnErrorSampleRate: 0`) are NOT changed on consent — recording is enabled purely by adding the replay integration.
   - `CONSENT_WITHDRAWN` → `Sentry.getReplay()?.stop()` halts active recording.
3. The `CONSENT_GIVEN`/`CONSENT_WITHDRAWN` events come from the `applicationEventBus` (NOT the DOM `cookie-consent-changed` event — that's pre-hydration-only for the GA4 Consent Mode v2 inline bootstrap).

Lawful basis: GDPR Article 6(1)(f) legitimate interest (site reliability + security) for the bare error-capture SDK, which initialises unconditionally. Replay specifically needs explicit consent because it records DOM mutations (Recital 26 — even with masking applied, the data is "personal" in legal terms).

Replay requires a CSP `worker-src 'self' blob:` directive — the SDK spawns a worker from a `blob:` URL. Without it, replay silently dies on the worker spawn. See `apps/web/middleware.ts` `csp` builder for the `worker-src` line and the audit-trail comment.

**Replay privacy defaults** (set in `instrumentation-client.ts` when Replay is added post-consent):

- `maskAllText: true` — every text node in the recording is replaced with `*` characters. We never see the user's email, name, message content, etc.
- `blockAllMedia: true` — `<img>`, `<video>`, `<audio>`, `<canvas>` are blocked from recording. Only their bounding boxes are captured.

These defaults are why post-consent Replay is safe to enable — the recording shows the user's _interaction_ (clicks, scrolls, form submissions) without exposing the _content_.

### Sentry `beforeSend` — error filtering + PII scrubbing

Both `sentry.server.config.ts` and `instrumentation-client.ts` have a `beforeSend` hook. Each filters / mutates events before they leave the SDK.

**Server-side `beforeSend`** (`sentry.server.config.ts`) — minimal:

- Filters events whose `message` contains `'NEXT_NOT_FOUND'` (these are intentional 404s, not real errors)

**Client-side `beforeSend`** (`instrumentation-client.ts`) — substantial:

1. Filters events whose `message` contains `'Hydration'` (hydration mismatch noise — usually not actionable). Note: unlike the server/edge `beforeSend`, the client does NOT filter `NEXT_NOT_FOUND` — that filter is server/edge-only.
2. Filters errors whose stack frames mention `'extension'` (browser-extension noise)
3. **In production only:**
   - Removes `event.user.email`, `event.user.username`, `event.user.ip_address`
   - Scrubs `event.extra` keys matching `['email', 'name', 'username', 'ip_address', 'phone', 'address']` (case-insensitive) → replaced with `'[REDACTED]'`
   - Regex-replaces email patterns (`[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}`) in any string values in `event.extra` with `'[EMAIL_REDACTED]'`
   - Same scrubbing applied to breadcrumb data

**Why client-only PII scrubbing:** server-side errors carry stack traces + route paths + request method — no user PII typically reaches `event.user` or `event.extra`. Client-side errors can include form values, URL search params with email in `?email=...`, breadcrumbs from analytics calls — that's where active scrubbing is needed.

**Adding new PII fields:** if a new field is introduced (e.g., `tax_id`, `phone_number`, `iban`), update the `piiFields` array in the client-side `beforeSend` and re-validate via a deployed test that triggers an error containing the new field.

**`tags` are intentionally NOT scrubbed (do-not-regress).** `beforeSend` only mutates `user` / `extra` / `breadcrumbs`. The `correlationId` request-id rides on `tags` precisely so it survives to Sentry for server↔client correlation (E-2). Never put PII on `tags` (it would bypass scrubbing), and never extend the scrub logic to strip `tags` (it would silently break correlation). Keep request-id-only on `tags`; PII-bearing context goes on `extra`, which is scrubbed.

### Sentry integration whitelist (Workstream B)

`instrumentation-client.ts` passes `integrations: []` at `Sentry.init()` time. This does NOT disable Sentry's default integrations — there is no `defaultIntegrations: false`, so the built-in defaults (error capture, `LinkedErrors`, etc.) are RETAINED and run automatically. The empty array only means no _extra_ integrations are registered at init. Notably, there is **no** `Sentry.browserTracingIntegration(...)` call. Only `Replay` is added later, and only after consent:

- `Replay` — added LATER via `client.addIntegration(Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }))` only after `CONSENT_GIVEN`

This is the Workstream B pattern — Replay is the one integration deferred behind consent; everything else relies on Sentry's retained defaults.

---

## C. PostHog configuration

### The ingest-vs-console host distinction (load-bearing)

This is the single most error-prone PostHog config knob. **`NEXT_PUBLIC_POSTHOG_HOST` MUST be the ingest endpoint**, not the console URL:

| Region      | Ingest host (use this)                             | Console URL (do NOT use as `host`)                  |
| ----------- | -------------------------------------------------- | --------------------------------------------------- |
| US Cloud    | `https://us.i.posthog.com`                         | `https://us.posthog.com`, `https://app.posthog.com` |
| EU Cloud    | `https://eu.i.posthog.com`                         | `https://eu.posthog.com`                            |
| Self-hosted | `https://<your-domain>` (must contain `.i.` infix) | n/a                                                 |

The SDK derives the **assets host** from `host` by string-replacing `.i.posthog.com` → `-assets.i.posthog.com`:

- `host = 'https://us.i.posthog.com'` → assets host = `https://us-assets.i.posthog.com` ✅
- `host = 'https://app.posthog.com'` → derivation fails → assets fetch from your own domain → `GET /array/<key>/config.js` returns 404

When the derivation fails, the SDK falls back to a **degraded mode** with no feature flags, no surveys, no session replay, no autocapture init — but it does NOT throw or surface the failure. Symptom: `/array/<key>/config.js` 404 in Network tab, and feature flags / surveys silently don't fire.

**Verification:**

```bash
# Should resolve and return JSON config:
curl -sI "https://us.i.posthog.com/array/<your_project_token>/config.js" | head -1
# HTTP/2 200

# Same value at app.posthog.com would 404:
curl -sI "https://app.posthog.com/array/<your_project_token>/config.js" | head -1
# HTTP/2 404
```

### CSP wildcards (browsers silently ignore invalid ones)

Per CSP Level 3 spec, wildcards in host-source values can **only replace a full subdomain label**, never a partial label.

| Pattern                          | Valid?         | Matches                                                                                                                                                    |
| -------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `https://*.i.posthog.com`        | ✅             | `us.i.posthog.com`, `eu.i.posthog.com`, `us-assets.i.posthog.com`, `eu-assets.i.posthog.com`, `decide.i.posthog.com` (anything ending in `.i.posthog.com`) |
| `https://*.posthog.com`          | ✅             | `app.posthog.com`, `us.posthog.com`, `us.i.posthog.com`, ... (broader)                                                                                     |
| `https://*-assets.i.posthog.com` | ❌ **invalid** | nothing — browser silently drops the entry and logs `The source list ... contains an invalid source 'X'. It will be ignored.`                              |
| `https://us-*.i.posthog.com`     | ❌ **invalid** | same — partial label                                                                                                                                       |
| `https://us.*.posthog.com`       | ❌ **invalid** | `*` cannot be a label between two labels                                                                                                                   |

Our middleware CSP (`apps/web/middleware.ts`):

```
script-src  ... https://*.i.posthog.com
connect-src ... https://app.posthog.com https://*.posthog.com
```

- `script-src` uses `*.i.posthog.com` because it covers both ingest hosts (`us.i.posthog.com`) AND assets hosts (`us-assets.i.posthog.com`). The assets host is where `array.js`, `recorder.js`, `surveys.js` come from.
- `connect-src` uses the broader `*.posthog.com` because PostHog's `/decide` endpoint and a few legacy ingest paths use the non-`.i.` subdomain. `app.posthog.com` is listed explicitly because some SDK code paths POST to it directly.

**Test the CSP after every change:** open the browser console on a deployed page and look for `contains an invalid source` warnings. A test that asserts the string is present in the CSP header passes for invalid wildcards too — the only way to catch invalid wildcards is the live browser warning.

### SDK initialisation pattern

`apps/web/src/components/Providers/PostHogProvider.tsx` wraps the app in a provider that:

1. Reads `POSTHOG_CONFIG.apiKey` and `POSTHOG_CONFIG.host` from `apps/web/src/config/env.ts`
2. Checks `hasAnalyticsConsent()` (from the cookie-consent system)
3. If both pass, dynamically imports `posthog-js` and `posthog-js/react` via `Promise.all([import('posthog-js'), import('posthog-js/react')])`
4. Initialises with the pinned-defaults config:

```ts
posthog.init(posthogKey, {
  api_host: posthogHost,
  defaults: '2025-11-30', // see § "Why pin defaults" below
  person_profiles: 'identified_only', // GDPR-friendly + cost-saving
  capture_pageview: true,
  capture_pageleave: true,
  respect_dnt: true,
  advanced_disable_feature_flags: process.env.NODE_ENV === 'development',
  loaded: (ph) => {
    if (process.env.NODE_ENV === 'development') ph.debug(false);
  },
});
```

5. Subscribes to `ApplicationEventBus`:
   - `CONSENT_GIVEN` (analytics or all) → init if not already
   - `CONSENT_WITHDRAWN` → `posthog.opt_out_capturing()`

**NEVER `import posthog from 'posthog-js'` at module level.** That would inline ~250 KB of analytics code into every page bundle, breaking the consent gate (the SDK would execute as soon as the module evaluates, before the user has accepted cookies). The dynamic `import()` inside a `useEffect` is the only allowed pattern.

### Why pin `defaults: '2025-11-30'`

PostHog ships dated **default-config bundles** to stabilise SDK behaviour across version bumps. Without a pinned date, you inherit whichever defaults the installed SDK version happens to ship with — which can change autocapture rules, session-replay settings, or feature-flag-eval timing unexpectedly between minor versions.

- `'2025-11-30'` is the latest accepted date by `posthog-js` 1.313.0 (our pinned version)
- The newer `'2026-01-30'` value the PostHog UI suggests requires a future SDK release — using it on 1.313.0 trips a TypeScript error
- Bump this date when (a) you upgrade `posthog-js` to a version that accepts a newer value AND (b) you've reviewed PostHog's release notes for the behaviour change between dates

### Why `person_profiles: 'identified_only'`

PostHog charges per "person" (identified user). With the default `'always_create'`, every anonymous visitor burns a person-quota slot. With `'identified_only'`:

- Anonymous events still get tracked under a session-anonymous `distinct_id`
- A "person" is only created when you call `posthog.identify(distinctId)` — e.g. after a successful waitlist signup
- GDPR-friendlier (no implicit person record for visitors who never identified themselves)
- Cuts our PostHog person quota usage by ~95% at marketing-site traffic levels

If you want to identify a user, call `posthog.identify(submissionId)` after a successful waitlist signup — never identify with email or any other PII directly.

---

## D. GA4 configuration

### Two-stage loading: Consent Mode v2 bootstrap + script gate

GA4 setup is split across two files that work together (Lighthouse Workstream D pattern, 2026-05-22):

1. **`apps/web/src/app/layout.tsx`** — inline Consent Mode v2 bootstrap (pre-hydration). Sets `window.dataLayer = []`, declares `gtag` function, calls `gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ... })`. This runs as a render-blocking inline `<script>` in `<head>` to establish the consent default BEFORE any GA4 calls fire. It also subscribes to the DOM `cookie-consent-changed` event (the one pre-hydration-React-unaware consumer in the codebase) to flush `gtag('consent', 'update', { analytics_storage: 'granted' })` when the user accepts.

2. **`apps/web/src/components/Providers/GoogleAnalyticsLoader.tsx`** — script-loading gate. The `<Script>` tag for `gtag/js` (~67 KB) does NOT download until the user grants analytics consent. The loader subscribes to `applicationEventBus.CONSENT_GIVEN` (NOT the DOM event — that's the bootstrap's job) and conditionally renders the `<Script>` tag with `next/script`. Pre-consent: nothing mounts, nothing downloads.

After consent the sequence is:

1. DOM `cookie-consent-changed` event → inline bootstrap flushes buffered events via `gtag('consent', 'update', ...)` with `wait_for_update: 500`
2. `applicationEventBus.CONSENT_GIVEN` event → `GoogleAnalyticsLoader` mounts the `<Script>` tags
3. `gtag('config', '<measurement-id>', ...)` runs once the script loads

### Withdrawal path

No script-teardown — the inline bootstrap's DOM-event listener handles withdrawal by calling `gtag('consent', 'update', { analytics_storage: 'denied' })`. The script stays loaded after first-grant; Consent Mode v2 handles the data-send gate. Mirrors the PostHog opt-out pattern.

### Env var

`NEXT_PUBLIC_GA_ID` — Google Analytics 4 Measurement ID (format: `G-XXXXXXXXXX`). If unset, `GoogleAnalyticsLoader` renders nothing and no script is loaded.

### Why this pattern (vs the default `next/script` `afterInteractive`)

The Lighthouse audit (Workstream D, 2026-05-22) found that loading `gtag/js` at `afterInteractive` (even with Consent Mode v2 denied) added ~67 KB to the initial payload AND ran the GA4 init on every page load regardless of consent. Gating the `<Script>` mount on `CONSENT_GIVEN` saves that download entirely for users who don't accept analytics — typical real-world ~60-70% of EU traffic. The Consent Mode v2 inline bootstrap is still pre-hydration so that any code paths checking `window.dataLayer` find it in the expected shape from page load 0.

---

## E. Common build & deploy pitfalls

### 1. Turborepo env passthrough — silent scrubbing

**Symptom:** `SENTRY_AUTH_TOKEN` is set in Vercel, but the build log says "no auth token, skipping source map upload" (visible only if `silent: false` in `sentryWebpackPluginOptions`).

**Root cause:** Turborepo passes env vars to tasks only when the var name is declared in `turbo.json`. By default, the `build` and `dev` tasks see a curated whitelist — anything else is scrubbed for build cacheability.

**Fix:** any env var read at build time must be listed in `turbo.json`:

```json
{
  "tasks": {
    "build": {
      "env": ["SENTRY_AUTH_TOKEN", "SENTRY_ORG", "SENTRY_PROJECT", "...other vars..."]
    }
  }
}
```

After adding a var to `turbo.json#env`:

1. Invalidate the Turborepo cache (`pnpm turbo run build --force` once, or just delete `.turbo/`)
2. Trigger a fresh Vercel build
3. Verify in build log: `Created release: <sha>` and `Uploaded N source maps` lines should appear

**Why this isn't obvious:** the build doesn't fail when env vars are missing — the Sentry plugin silently skips source map upload. The first time you notice is when a production error in Sentry shows minified stack frames with no source mapping.

### 2. Sentry DSN keys can be **disabled** silently

**Symptom:** No events appearing in Sentry. `POST /api/monitoring` returns 403 with body containing `with_reason: ProjectId` (the body may be opaque to clients — check Sentry's ingest logs or the tunnel route response).

**Root cause:** Sentry projects can have multiple **Client Keys** (DSNs). Each key can be independently enabled or disabled in **Project Settings → Client Keys**. A disabled key:

- Accepts incoming requests
- Returns 403 with `with_reason: ProjectId`
- Drops 100% of events
- Does NOT surface anywhere in the Sentry UI as "you have a disabled key in use"

This is a real production incident pattern. We had **three months of silent dropout** in early 2026 because the auto-created "Default" key was disabled when a new key was provisioned, but the env var still pointed at the disabled DSN.

**Detection:**

```bash
# From devtools network tab, capture a POST to /api/monitoring
# Then re-issue with curl to see the upstream response:
curl -v -X POST 'https://<your-sentry-ingest>/api/<project-id>/envelope/?sentry_key=<key>' \
  -H 'Content-Type: application/x-sentry-envelope' \
  --data-binary @captured-envelope.bin
```

If you see `< HTTP/2 403` with a body mentioning `ProjectId`, the DSN's key is disabled.

**Fix:**

1. Sentry → Settings → Projects → `<project>` → Client Keys (DSN)
2. Find the key matching the public ID at the front of your DSN
3. If status is "Disabled", click "Enable" — OR pick an Active key and copy its DSN
4. Update `NEXT_PUBLIC_SENTRY_DSN` everywhere (local `.env.local`, Vercel preview env, Vercel production env)
5. Verify the next deployed page emits a test event (see § F)

**Prevention:** when rotating Sentry projects or keys, always note which key is "Active" in the new project, copy that specific DSN, and verify with a test event before pointing production at it.

### 3. CSP partial-label wildcards are silently ignored

**Symptom:** scripts from `<some-host>.posthog.com` don't load. Browser console: `Loading the script '<URL>' violates the following Content Security Policy directive: "script-src ..."`. Earlier in the same console: `The source list for the Content Security Policy directive 'script-src' contains an invalid source: 'https://*-assets.i.posthog.com'. It will be ignored.`

**Root cause:** CSP wildcards (`*`) can only replace a full subdomain **label**. They cannot be embedded inside a label.

**Fix:** use `*.i.posthog.com` (full-label wildcard) instead of `*-assets.i.posthog.com` (partial-label).

**Prevention:**

- A simple unit test that checks `csp.includes('*-assets.i.posthog.com')` passes for the broken policy — string-regex tests don't catch invalid wildcards. The only reliable test is opening the deployed page in a browser and looking for `contains an invalid source` warnings.
- Consider adding a Playwright smoke test that asserts the browser console has zero CSP-violation messages on a clean page load.

### 4. Vercel "Sensitive" env var flag is write-once

**Symptom:** you cannot view the value of an env var marked "Sensitive" in the Vercel dashboard, even when editing.

**Root cause:** Vercel hashes Sensitive vars at rest. The dashboard never reveals them after creation.

**Fix:**

- To rotate a Sensitive var, **delete it and recreate it** with the new value. You cannot edit it in place to "see what it was".
- Use `vercel env pull` from the CLI if you need to recover the value into a local `.env.local` (this works because the running app has the value available at runtime, and `vercel env pull` reads from the project's runtime env).

**Note for `NEXT_PUBLIC_*` vars:** the Sensitive flag is **theatre** — `NEXT_PUBLIC_*` env vars are inlined into the browser JavaScript bundle at build time, so every visitor's DevTools can read them. Use Sensitive for server-side secrets (e.g., `DATABASE_URL`, `RESEND_API_KEY`, `HMAC_KEY`, `SENTRY_AUTH_TOKEN`). For `NEXT_PUBLIC_*` vars, the flag just inconveniences your future self when you need to verify the deployed value.

### 5. `dynamic({ ssr: false })` in client components silently bails out

**Symptom:** a component referenced by `dynamic(() => import('...'), { ssr: false })` renders as an empty `<template>` element in the HTML, even after client hydration. Production HTML shows `<template data-dgst="BAILOUT_TO_CLIENT_SIDE_RENDERING">`.

**Root cause:** Next.js 16 + Turbopack has a bundler edge case where `dynamic({ ssr: false })` wrapping a module that **re-exports a default through a barrel file** fails to swap the placeholder after client hydration. The chunk fetches successfully (visible in `performance.getEntriesByType('resource')`), but the client-side render never produces the component.

**Fix:** for components that are already inside `'use client'` parent components, **import them directly** — Next.js App Router automatically code-splits client components at the route level, so the `dynamic()` wrapper is redundant.

```diff
- import dynamic from 'next/dynamic';
- const Calculator = dynamic(
-   () => import('@/components/Sections/CompoundInterestCalculator'),
-   { ssr: false }
- );
+ import { CompoundInterestCalculator } from '@/components/Sections/CompoundInterestCalculator';
```

**Prevention:** add a `curl` smoke test to your release checklist for any page that uses an interactive `dynamic({ ssr: false })` component. Compare the labels / inputs in the HTML response of a working route vs. a candidate route:

```bash
# Working tool page should have calculator labels in initial HTML:
curl -s https://diboas.com/en/tools/compound-interest | grep -oE '<label[^>]*for="[^"]+"' | wc -l
# Expect: 3+

# If the equivalent lesson page returns 0 (or just `<template>` with `BAILOUT_TO_CLIENT_SIDE_RENDERING`):
curl -s https://diboas.com/en/learn/compound-interest | grep -c 'BAILOUT_TO_CLIENT_SIDE_RENDERING'
# 0 = OK, ≥1 = component is silently not rendering
```

See `docs/audit/SECURITY_FINDINGS_2026-05.md` § F20 for the full incident write-up. The fix shipped 2026-06-01.

### 6. PostHog ingest-host derivation can produce bizarre 404s

**Symptom:** browser DevTools Network tab shows `GET /array/<token>/config.js` returning 404 — but the URL is your own domain, not PostHog's.

**Root cause:** `NEXT_PUBLIC_POSTHOG_HOST` is set to a value that doesn't contain `.i.posthog.com`. The SDK's assets-host derivation falls back to a **relative path** which then hits your own server (404 because no such route exists).

**Fix:** set `NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com` (or `eu.i.posthog.com` for EU Cloud). See § C above.

### 7. Sentry source maps stop uploading after a Turborepo task graph change

**Symptom:** Sentry → Releases → `<release>` → Source Maps is empty for the current release, despite previous releases having maps.

**Root cause:** the `turbo.json#env` whitelist for the `build` task was modified, and `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT` got dropped (or never added when a new task graph was created).

**Fix:** see § E.1 above.

---

## F. Verification procedures (step-by-step)

After deploying any change to the monitoring stack, run these in order.

### F.1. Sentry — verify events flow end-to-end

1. Open the deployed page in a fresh browser tab.
2. Open DevTools → Network tab → filter `monitoring`.
3. In the DevTools Console, paste:
   ```js
   setTimeout(() => {
     throw new Error('monitoring verification ' + Date.now());
   }, 0);
   ```
   **Why `setTimeout(..., 0)` and not a direct `throw`:** a `throw` from a console-line context can be caught by the DevTools error overlay before reaching `window.onerror`, depending on the browser version. `setTimeout(0)` defers to the next macrotask, where the error reliably hits the global handler that Sentry hooks.
4. Verify in DevTools:
   - A POST to `/api/monitoring` appears, status 200
   - Request body is binary (Sentry envelope format)
5. Verify in Sentry dashboard:
   - Within 30 seconds, a new issue titled "Error: monitoring verification <timestamp>" appears
   - The issue has the correct release tag (e.g., `0.1.0`)
   - The stack trace shows readable filenames + line numbers (if source maps uploaded successfully)

**If step 4 returns 403:** see § E.2 (disabled DSN key).
**If step 5 shows minified stack frames:** see § E.1 + § E.7 (source maps not uploaded).
**If step 4 returns 204:** Sentry DSN unset.

### F.2. PostHog — verify SDK initialises and emits

1. Open the deployed page in a fresh browser tab.
2. Open DevTools → Network tab → filter `posthog`.
3. Accept analytics cookies (cookie consent banner → Accept All, or Accept Analytics).
4. Verify network requests fire **in this order**:
   ```
   GET  https://us-assets.i.posthog.com/static/array.js                          → 200
   GET  https://us-assets.i.posthog.com/static/recorder.js (if replay enabled)    → 200
   GET  https://us.i.posthog.com/array/<token>/config.js                          → 200
   POST https://us.i.posthog.com/decide/?v=3                                      → 200 with feature-flag JSON body
   POST https://us.i.posthog.com/e/                                               → 200 (pageview event)
   ```
5. Verify in PostHog dashboard:
   - Live Events panel shows the pageview within 30 seconds
   - Event has `distinct_id` starting with anonymous prefix (no real user identified yet)

**If `config.js` returns 404 against your own domain:** see § E.6 (wrong host).
**If you see CSP violations for any of the PostHog hosts:** see § E.3 + § C (CSP wildcards).
**If nothing fires at all:** check `hasAnalyticsConsent()` is returning true. The SDK is consent-gated — without consent it never initialises.

### F.3. GA4 — verify dataLayer and Consent Mode

1. Open the deployed page.
2. Open DevTools → Console:
   ```js
   typeof window.dataLayer; // 'object' — should be Array
   typeof window.gtag; // 'function'
   window.dataLayer.length; // >= 2 (first entry is the consent default, second is the gtag('js') init)
   window.dataLayer.find((d) => d[0] === 'consent'); // should exist
   ```
3. Verify in Network tab:
   - `GET https://www.googletagmanager.com/gtag/js?id=G-...` → 200
   - After consent acceptance: `POST https://*.google-analytics.com/g/collect?...` → 200 (or 204)
4. Verify in GA4 dashboard → Realtime → Users in last 30 minutes — the test user should appear.

**If `dataLayer` is undefined:** the GA component isn't rendering. Check `NEXT_PUBLIC_GA_ID` is set and the consent gate is open.

### F.4. CSP — verify no invalid sources

1. Open the deployed page.
2. Open DevTools → Console (no filter).
3. Hard refresh (Cmd+Shift+R / Ctrl+Shift+R) so the CSP is freshly evaluated.
4. **Look for the literal string** `contains an invalid source` anywhere in the console output.
5. Zero matches = CSP is well-formed.
6. Any matches = at least one directive has an invalid wildcard or hostname syntax. Each instance names the directive (e.g. `script-src`) and the bad source — fix in `apps/web/middleware.ts` § `csp` builder.

This is the **only reliable test for CSP validity** — string-matching the CSP header passes for invalid wildcards because the header content is literal text. The browser is the source of truth.

### F.5. Release tagging — verify Sentry knows about the current release

1. After deploy, check Sentry → Releases → top of list.
2. The newest release should have:
   - Version matching the Vercel commit SHA (production) or `apps/web/package.json#version` (preview/dev)
   - Source Maps tab: non-empty list of uploaded `.map` files (one per generated chunk)
   - Commits tab: linked GitHub commits since previous release (if Vercel + GitHub integration is wired)

If the newest release is older than your most recent deploy, the Sentry build plugin didn't run — see § E.1.

### F.6. Lesson page calculator (LessonThreeBeat regression test)

Per § E.5 — applies to any page that uses interactive components inside Beat 3 of `LessonThreeBeat` (currently `/learn/compound-interest`).

```bash
# Calculator labels MUST be present in initial HTML (server-rendered):
curl -s https://diboas.com/en/learn/compound-interest | grep -c '<label[^>]*for="[^"]*-amount"'
# Expect: 1 or more

# BAILOUT marker MUST NOT be present:
curl -s https://diboas.com/en/learn/compound-interest | grep -c 'BAILOUT_TO_CLIENT_SIDE_RENDERING'
# Expect: 0
```

---

## G. Troubleshooting playbook (symptom → diagnosis → fix)

### "I don't see any Sentry events from production."

1. Open DevTools on the deployed page → Network tab → filter `monitoring`.
2. Trigger an error (use the `setTimeout(throw)` pattern from § F.1).
3. **No POST appears:** SDK isn't initialising. Check:
   - `NEXT_PUBLIC_SENTRY_DSN` is set (build log + `vercel env ls`)
   - `instrumentation-client.ts` is being loaded (search Vercel build log for "Sentry" lines)
   - No JS error before Sentry init blocks it (check Console for unrelated errors)
4. **POST returns 204:** DSN unset at runtime. Same checks as step 3 but verify the production env var, not preview.
5. **POST returns 200 but no events in Sentry:** check Sentry → Settings → Filters & Inbound — maybe events are being filtered (e.g., by URL pattern, by error type).
6. **POST returns 403 (our guard):** body is `{"error":"forbidden_host"}` — the envelope DSN host doesn't match `*.sentry.io`. SDK was probably initialised with a wrong DSN.
7. **POST returns 403 (upstream):** body contains `with_reason: ProjectId` — see § E.2 (disabled DSN key).
8. **POST returns 502 (our handler):** body is `{"error":"upstream_unreachable"}` — `fetch()` to Sentry threw. Network blip or DNS issue.
9. **POST returns upstream 5xx:** see "I see persistent 5xx on /api/monitoring" below.

### "I see an occasional 503 on /api/monitoring (one-off, with `sendSession`/`captureSession` in the stack trace)."

**Most likely benign.** Sentry's ingest occasionally returns 503 for transient capacity reasons. The SDK has built-in retry via its offline buffer — failed envelopes are re-sent on the next online connection.

**Diagnostic flow:**

1. Confirm the 503 came from upstream (not our handler) — our handler doesn't have a 503 path, so any 503 you see is forwarded verbatim from Sentry ingest.
2. Check the response body — upstream 503 from Sentry usually includes a `Retry-After` header (in seconds).
3. Check the trigger — is it tied to a specific user action (e.g., a route change that fires both Sentry session-tracking AND GA4 history hooks at once)? That's a burst pattern. Not a bug.
4. Check [status.sentry.io](https://status.sentry.io) for ongoing incidents.

**If it's a one-off:** ignore. The retry buffer handles it.

### "I see persistent 5xx on /api/monitoring."

If you're seeing 5xx (500 / 502 / 503 / 504) on most or every envelope POST:

1. **Check `vercel logs` for our function:** confirm whether the 5xx is from our handler (our 502 = `upstream_unreachable`) or forwarded from upstream (anything else).
2. **Check Sentry quota usage:** Sentry → Settings → Subscription → Usage. Free tier is 5K errors + 50 replays + 10K performance units/month. Exhaustion returns 5xx until the next billing window.
3. **Check Sentry rate limits:** Sentry → Settings → Rate Limits. If you've configured a per-key cap and you're hitting it (e.g., a runaway error loop), the project rate-limits and returns 5xx with `Retry-After`.
4. **Check [status.sentry.io](https://status.sentry.io):** ongoing platform incidents are surfaced there.
5. **Check our Vercel function logs** for cold-start / timeout patterns. Our `/api/monitoring` is a server-side route on Fluid Compute; if it's cold-starting too often, the SDK retries on each cold-start which can compound.

### "PostHog returns 404 for /array/<token>/config.js"

→ `NEXT_PUBLIC_POSTHOG_HOST` is wrong. Set to `https://us.i.posthog.com` (or `eu.i.posthog.com`). See § C.

### "CSP keeps blocking PostHog assets even though I added them to the policy"

→ Check the browser console for `contains an invalid source` warnings. You probably have a partial-label wildcard (`*-assets.i.posthog.com`). Use `*.i.posthog.com`. See § C and § E.3.

### "Source maps stopped uploading after I touched turbo.json"

→ See § E.1. Add `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` to `turbo.json#env`. Invalidate Turborepo cache.

### "Sentry release tag is `0.1.0` in production but should be the commit SHA"

→ The Sentry build plugin didn't run, or `SENTRY_AUTH_TOKEN` was scrubbed by Turborepo. Same fix as above. The fallback `'0.1.0'` from `sentry.server.config.ts` / `sentry.edge.config.ts` is what you see when the plugin's release-injection didn't execute.

### "I can see PostHog `/decide` 200 but no events fire when I click around"

→ Probably one of:

- Consent gate not open (`hasAnalyticsConsent()` returns false) — check the cookie state
- `respect_dnt: true` and the browser has Do Not Track enabled
- An ad-blocker is matching the POST destination

### "429 on /api/waitlist/stats during testing"

**Not a bug.** The endpoint is rate-limited (Upstash Redis, lenient preset: 100 req/60s per IP). When tripped, the server returns 429 **with the fallback stats payload** so the UI stays stable. The client's `fetchWithRetry` correctly does NOT retry 4xx responses (only 5xx + network errors). See `apps/web/src/app/api/waitlist/stats/route.ts` for the rate-limit logic.

### "lockdown-install.js: SES Removing unpermitted intrinsics" in the browser console

→ Your browser has MetaMask (or another wallet extension that uses Secure ECMAScript) installed. The warning is from the extension, not our app. Not actionable.

### "Content Security Policy of your site blocks the use of 'eval' in JavaScript" but I'm in dev mode

→ Dev CSP allows `'unsafe-eval'` for Turbopack's source maps. The warning is almost certainly from:

- A browser extension (MetaMask's `lockdown-install.js` uses internal eval to install SES)
- A residual warning from a previous navigation to production (Chrome's Issues panel accumulates across recent navigations)

Our own code has **zero `eval()` / `new Function()` / `setTimeout(string)` / `setInterval(string)` calls** (verified by grep). Not actionable in code.

### "HMR WebSocket failed: ERR_INVALID_HTTP_RESPONSE" in browser console

→ Only fires when accessing the dev server from a non-localhost origin (e.g., Docker MCP browser at the host IP, or another device on the LAN). The HMR WebSocket binds to localhost only. Browser console errors only; the page itself renders fine. **Not actionable** — dev-mode only, never affects production.

---

## H. Rotation runbooks

Step-by-step procedures for rotating each service's secret. **Org-specific values (project IDs, account names, current key IDs) live in `docs/monitoring/INFRASTRUCTURE_GUIDE.md` — local-only.**

### H.1. Rotate Sentry DSN

**Why:** key compromise suspected, or quarterly rotation policy.

1. Sentry → Settings → Projects → `<project>` → Client Keys (DSN)
2. Click "Generate New Key". Name it `<existing-name>-rotated-<YYYY-MM-DD>`.
3. **Verify the new key is "Active"** (not "Disabled" — see § E.2)
4. Copy the new DSN string
5. Update env var in **THREE** places:
   - `apps/web/.env.local` (local dev)
   - Vercel → `<project>` → Settings → Environment Variables → `NEXT_PUBLIC_SENTRY_DSN` (Production + Preview + Development)
   - Any other deployment target (staging, dogfood)
6. Trigger a deploy on each environment.
7. Verify events flow per § F.1.
8. Disable the OLD key in Sentry only after observing **at least 24 hours** of events on the new key — gives time for cached client-side DSNs to roll off.
9. Record rotation in team password manager.

### H.2. Rotate Sentry Auth Token (for source map uploads)

**Why:** token compromise, or org-level token rotation policy.

1. Sentry → Settings → Account → API → Auth Tokens (or Settings → Internal Integrations for org-scoped tokens)
2. Click "Create New Token". Scopes needed: `project:releases`, `org:read`, `project:read`. (Don't grant more.)
3. Copy the token. **You won't see it again.**
4. Update Vercel env var: `SENTRY_AUTH_TOKEN` (Production + Preview only; not needed in Development unless you build locally)
5. Verify in next build log: source maps upload successfully (look for "Created release" + "Uploaded N source maps")
6. Revoke the OLD token in Sentry.

### H.3. Rotate PostHog Project Token

**Why:** token compromise. Project tokens are write-only (per PostHog docs they're safe to expose), so the bar for rotation is lower than for Personal API Tokens.

1. PostHog → Project Settings → Project ID, Tokens — note: there isn't a rotate-in-place flow as of 2026. You create a new project with the new token, then migrate.
2. For an actual rotation (rare), the easier path is:
   - Create a new PostHog project
   - Copy the new project's API key into `NEXT_PUBLIC_POSTHOG_KEY`
   - Lose the historical events tied to the old project
3. For the marketing site at our scale, **prefer not rotating** the project token unless there's a real compromise.

### H.4. Rotate GA4 Measurement ID

**Why:** GA4 property reset / migration. Rare.

1. Create the new GA4 property in Google Analytics dashboard.
2. Copy the new Measurement ID (`G-XXXXXXXXXX`).
3. Update `NEXT_PUBLIC_GA_ID` in Vercel + local .env.
4. Verify in GA4 Realtime → Users in last 30 minutes within 5 minutes of deploy.
5. The OLD property continues to receive events from cached client-side scripts for up to 24 hours — disable / archive it after the rolloff window.

---

## I. Anti-patterns (do NOT do these)

| Anti-pattern                                                                        | Why it's wrong                                                                                                                                    | What to do instead                                                                                             |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `import posthog from 'posthog-js'` at module level                                  | Inlines 250 KB into every page; bypasses consent gate                                                                                             | `await import('posthog-js')` inside a `useEffect` after consent check                                          |
| Setting `NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com`                          | Breaks assets-host derivation → `/array/<token>/config.js` 404                                                                                    | Use the **ingest** host: `https://us.i.posthog.com`                                                            |
| CSP `script-src ... https://*-assets.i.posthog.com`                                 | Partial-label wildcards are invalid CSP 3 — silently ignored                                                                                      | `https://*.i.posthog.com` (full-label wildcard)                                                                |
| Setting `SENTRY_AUTH_TOKEN` in Vercel but forgetting `turbo.json#env`               | Turborepo scrubs the var; source maps silently fail to upload                                                                                     | Add all three (`SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`) to `turbo.json#env`                        |
| Marking `NEXT_PUBLIC_SENTRY_DSN` as "Sensitive" in Vercel                           | The flag is theatre for `NEXT_PUBLIC_*` (the value is inlined into the browser bundle); just inconveniences future-you who needs to see the value | Mark server-side secrets (`HMAC_KEY`, `RESEND_API_KEY`) as Sensitive; leave `NEXT_PUBLIC_*` unmarked           |
| Wrapping a `'use client'` component in `dynamic(() => import(...), { ssr: false })` | Next.js 16 + Turbopack edge case: produces a `BAILOUT_TO_CLIENT_SIDE_RENDERING` placeholder that never hydrates                                   | Import the component directly; Next.js App Router auto-splits client components at the route level             |
| Tunneling Sentry through a CSRF-protected route                                     | Sentry posts on every error without a CSRF token; would silently drop events                                                                      | Use the bare `/api/monitoring` route (no CSRF, no rate limit; defended by body-size cap + DSN host validation) |
| Pointing tunnel route at `/monitoring` (no `/api` prefix)                           | Locale-prefix middleware redirects to `/<locale>/monitoring` → 404                                                                                | Use `/api/monitoring` (middleware matcher excludes `/api/*`)                                                   |
| Sending PII (email, name, IP) to PostHog via `posthog.identify(email)`              | GDPR violation; bypasses pseudonymisation guarantees                                                                                              | Use an opaque per-user ID: `posthog.identify(submissionId)`                                                    |
| Adding `'unsafe-eval'` to production CSP                                            | Opens path for inline script injection                                                                                                            | Keep `'unsafe-eval'` dev-only (Turbopack needs it for source maps); production CSP must exclude it             |

---

## J. Lessons learned (incident archive)

For severity-tagged, audit-tracked incident records see `docs/audit/SECURITY_FINDINGS_2026-05.md` (local-only) — entries F16–F20 cover the monitoring stack incidents that informed this playbook:

- **F16** — Sentry Default DSN key disabled, 3-month silent dropout
- **F17** — CSP partial-label wildcard silently ignored by browsers
- **F18** — Turborepo env passthrough scrubbing `SENTRY_AUTH_TOKEN`
- **F19** — PostHog `app.posthog.com` vs `us.i.posthog.com` host confusion
- **F20** — LessonThreeBeat `dynamic({ ssr: false })` silent BAILOUT in Next.js 16 + Turbopack

Each entry includes: detection method, root cause, fix applied, and prevention measure (which is what's encoded in this playbook).

---

## K. When to update this playbook

Update this file when any of the following happen:

- A new monitoring tool is added (e.g., Datadog APM, LogRocket) → add a new top-level section
- A monitoring tool's SDK has a breaking API change (e.g., PostHog `defaults` accepts a new date)
- A new incident class emerges that wasn't covered → add to § E (pitfalls) AND § G (troubleshooting) AND § J (incident archive)
- The Sentry tunnel route path changes → update § B and § E.5
- The CSP `script-src` / `connect-src` / `worker-src` directives change → update § C
- A rotation runbook step changes (e.g., Sentry UI navigation) → update § H

This file is the **single source of truth for monitoring ops**. If `infrastructure.md` § Monitoring, `CLAUDE.md` § Monitoring, or `.env.example` contradicts this file, this file wins — then fix the others.
