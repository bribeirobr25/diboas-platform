# Execution Log:

## Server
lsof -ti:3000 | xargs kill -9; pkill -f "next dev"; pkill -f "turbo run dev"; rm -rf apps/web/.next; rm -f apps/web/.waitlist-data.json; pnpm --filter @diboas/i18n build && pnpm install && pnpm -w run dev:web

> @diboas/i18n@0.1.0 build /Users/simonekugler/Desktop/diboas-platform/packages/i18n
> tsup

CLI Building entry: {"index":"src/index.ts","config":"src/config.ts","server":"src/server.ts","client":"src/client.ts"}
CLI Using tsconfig: tsconfig.json
CLI tsup v8.5.1
CLI Using tsup config: /Users/simonekugler/Desktop/diboas-platform/packages/i18n/tsup.config.ts
CLI Target: es2020
CLI Cleaning output folder
CJS Build start
ESM Build start
DTS Build start
CJS dist/client.js     3.08 KB
CJS dist/config.js     4.11 KB
CJS dist/client.js.map 4.35 KB
CJS dist/config.js.map 6.23 KB
CJS dist/server.js     2.55 MB
CJS dist/index.js      2.55 MB
CJS dist/index.js.map  3.12 MB
CJS dist/server.js.map 3.13 MB
CJS ⚡️ Build success in 426ms
ESM dist/config.mjs     2.82 KB
ESM dist/client.mjs     1.58 KB
ESM dist/config.mjs.map 6.15 KB
ESM dist/index.mjs      2.55 MB
ESM dist/client.mjs.map 4.02 KB
ESM dist/server.mjs     2.55 MB
ESM dist/index.mjs.map  3.11 MB
ESM dist/server.mjs.map 3.12 MB
ESM ⚡️ Build success in 427ms
DTS ⚡️ Build success in 2096ms
DTS dist/index.d.ts           655.00 B
DTS dist/server.d.ts          1.17 KB
DTS dist/config.d.ts          1.47 KB
DTS dist/client.d.ts          1.79 KB
DTS dist/utils-B5aP1u95.d.ts  1.75 KB
DTS dist/index.d.mts          658.00 B
DTS dist/server.d.mts         1.17 KB
DTS dist/config.d.mts         1.47 KB
DTS dist/client.d.mts         1.79 KB
DTS dist/utils-DUVOyKIF.d.mts 1.75 KB
Scope: all 4 workspace projects
Lockfile is up to date, resolution step is skipped
Already up to date
Done in 824ms

> diboas-platform@1.0.0 dev:web /Users/simonekugler/Desktop/diboas-platform
> turbo run dev --filter=web

╭───────────────────────────────────────────────────────────────────────────╮
│                                                                           │
│                     Update available v2.7.3 ≫ v2.8.10                     │
│    Changelog: https://github.com/vercel/turborepo/releases/tag/v2.8.10    │
│           Run "pnpm dlx @turbo/codemod@latest update" to update           │
│                                                                           │
│          Follow @turborepo for updates: https://x.com/turborepo           │
╰───────────────────────────────────────────────────────────────────────────╯
• turbo 2.7.3
• Packages in scope: web
• Running dev in 1 packages
• Remote caching disabled
web:dev: cache bypass, force executing 9c3094249574a7ba
web:dev: 
web:dev: > web@0.1.0 dev /Users/simonekugler/Desktop/diboas-platform/apps/web
web:dev: > next dev
web:dev: 
web:dev: ▲ Next.js 16.1.1 (Turbopack)
web:dev: - Local:         http://localhost:3000
web:dev: - Network:       http://192.168.178.198:3000
web:dev: - Environments: .env.local
web:dev: - Experiments (use with caution):
web:dev:   · clientTraceMetadata
web:dev:   ✓ optimizeCss
web:dev:   · optimizePackageImports
web:dev: 
web:dev: ✓ Starting...
web:dev: ✓ Ready in 2.6s
web:dev: ○ Compiling / ...
web:dev:  GET / 307 in 4.2s (compile: 3.7s, proxy.ts: 116ms, render: 376ms)
web:dev: [2026-02-21T22:11:31.681Z] SectionEventBus: Listener registered { eventType: 'section:error', listenerCount: 1 } undefined
web:dev: [2026-02-21T22:11:31.687Z] Error reporting service initialized {
web:dev:   environment: 'development',
web:dev:   enableReporting: false,
web:dev:   sessionId: 'session-1771711891681-pdar4a0rv'
web:dev: }
web:dev: [2026-02-21T22:11:31.869Z] State machine ProductCarousel initialized { initialState: 'idle' } undefined
web:dev: [2026-02-21T22:11:31.888Z] State machine FeatureShowcaseDefault initialized { initialState: 'idle' } undefined
web:dev: [2026-02-21T22:11:32.000Z] FAQ accordion variant selected { variant: 'default', section: 'FAQAccordion' } undefined
web:dev:  GET /en 200 in 3.1s (compile: 2.5s, proxy.ts: 17ms, generate-params: 406ms, render: 552ms)
web:dev:  GET /api/waitlist/stats 200 in 2.4s (compile: 2.4s, render: 28ms)
web:dev: [2026-02-21T22:11:41.593Z] State machine ProductCarousel initialized { initialState: 'idle' } undefined
web:dev: [2026-02-21T22:11:41.623Z] State machine FeatureShowcaseDefault initialized { initialState: 'idle' } undefined
web:dev: [2026-02-21T22:11:41.672Z] FAQ accordion variant selected { variant: 'default', section: 'FAQAccordion' } undefined
web:dev:  GET /en 200 in 337ms (compile: 21ms, proxy.ts: 16ms, generate-params: 3ms, render: 300ms)
web:dev: [2026-02-21T22:12:40.031Z] ApplicationEventBus: No listeners for event { eventType: 'waitlist:signupCompleted' } undefined
web:dev:  POST /api/waitlist/signup 200 in 384ms (compile: 352ms, render: 32ms)
web:dev: [2026-02-21T22:12:41.080Z] [Kit.com] Successfully synced subscriber { email: '[REDACTED]' }
web:dev:  GET /pt-BR 200 in 130ms (compile: 26ms, proxy.ts: 17ms, generate-params: 3ms, render: 87ms)
web:dev:  GET /pt-BR/demo 200 in 1713ms (compile: 1672ms, proxy.ts: 13ms, generate-params: 419ms, render: 28ms)
web:dev:  GET /pt-BR 200 in 67ms (compile: 18ms, proxy.ts: 11ms, generate-params: 2ms, render: 37ms)
web:dev: [2026-02-21T22:14:35.939Z] ApplicationEventBus: No listeners for event { eventType: 'waitlist:signupCompleted' } undefined
web:dev:  POST /api/waitlist/signup 200 in 28ms (compile: 13ms, render: 15ms)
web:dev: [2026-02-21T22:14:36.856Z] [Kit.com] Successfully synced subscriber { email: '[REDACTED]' }


## Browser Log

### Error Type
Runtime i

### Error Message
Failed to connect to MetaMask


    at Object.connect (chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/scripts/inpage.js:1:63510)
    at async s (chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/scripts/inpage.js:1:61013)

Next.js version: 16.1.1 (Turbopack)


### Console
inpage.js:1 {RAINBOW_CHAINS_SUPPORTED: Array(7)}
contentscript.js:1 {RAINBOW_CHAINS_SUPPORTED: Array(7)}
lockdown-install.js:1 SES Removing unpermitted intrinsics
injected.js:1 Backpack couldn't override `window.ethereum`.
G0s @ injected.js:1
j0s @ injected.js:1
(anonymous) @ injected.js:1
(anonymous) @ injected.js:1
PendingScript
(anonymous) @ contentScript.js:1
(anonymous) @ contentScript.js:1
(anonymous) @ contentScript.js:1
forward-logs-shared.ts:95 Download the React DevTools for a better development experience: https://react.dev/link/react-devtools
forward-logs-shared.ts:95 [HMR] connected
Logger.ts:151 [2026-02-21T22:11:43.079Z] Error reporting service initialized {environment: 'development', enableReporting: false, sessionId: 'session-1771711903078-rpsnepvza'}
forward-logs-shared.ts:95 [Fast Refresh] rebuilding
forward-logs-shared.ts:95 [Fast Refresh] done in 261ms
Logger.ts:151 [2026-02-21T22:11:52.213Z] Error reported {errorId: 'error-1771711912212-blitf2teh', fingerprint: 'aXxGYWlsZWQgdG8g', message: 'Failed to connect to MetaMask', category: 'third_party', sectionId: undefined, …}
inpage.js:1 Uncaught (in promise) i: Failed to connect to MetaMask
    at Object.connect (inpage.js:1:63510)
    at async s (inpage.js:1:61013)Caused by: Error: MetaMask extension not found
    at inpage.js:1:57963
connect @ inpage.js:1
await in connect
s @ inpage.js:1
e @ inpage.js:1
(anonymous) @ inpage.js:1
(anonymous) @ inpage.js:1
2.../../shared/modules/provider-injection @ inpage.js:1
i @ inpage.js:1
e @ inpage.js:1
(anonymous) @ inpage.js:1
Logger.ts:151 [2026-02-21T22:12:08.401Z] Product carousel slide changed {section: 'ProductCarousel', slideIndex: 2, slideId: 'step-3-withdraw', subtitle: 'Your money grows. Adelaide keeps you informed. Whe… you leave, no penalties, no lock-ups, no tricks.'}
Logger.ts:151 [2026-02-21T22:12:11.127Z] Product carousel slide changed {section: 'ProductCarousel', slideIndex: 0, slideId: 'step-1-deposit', subtitle: 'ACH or debit card, deposit the way you already do. No new methods to learn.'}
Logger.ts:151 [2026-02-21T22:12:12.941Z] Product carousel slide changed {section: 'ProductCarousel', slideIndex: 1, slideId: 'step-2-earn', subtitle: 'Conservative, balanced, or aggressive. Choose the one that matches how you sleep at night.'}
Logger.ts:151 [2026-02-21T22:12:14.643Z] Product carousel slide changed {section: 'ProductCarousel', slideIndex: 0, slideId: 'step-1-deposit', subtitle: 'ACH or debit card, deposit the way you already do. No new methods to learn.'}
Logger.ts:151 [2026-02-21T22:12:21.865Z] FeatureShowcaseDefault slide changed {section: 'FeatureShowcaseDefault', slideIndex: 1, source: 'user'}
Logger.ts:151 [2026-02-21T22:12:25.196Z] FeatureShowcaseDefault slide changed {section: 'FeatureShowcaseDefault', slideIndex: 2, source: 'user'}
Logger.ts:151 [2026-02-21T22:12:27.526Z] FeatureShowcaseDefault slide changed {section: 'FeatureShowcaseDefault', slideIndex: 0, source: 'user'}
forward-logs-shared.ts:95 [Fast Refresh] rebuilding
forward-logs-shared.ts:95 [Fast Refresh] done in 385ms
forward-logs-shared.ts:95 [Fast Refresh] rebuilding
forward-logs-shared.ts:95 [Fast Refresh] done in 1257ms
forward-logs-shared.ts:95 [Fast Refresh] rebuilding
forward-logs-shared.ts:95 [Fast Refresh] done in 168ms
forward-logs-shared.ts:95 [Fast Refresh] rebuilding
forward-logs-shared.ts:95 [Fast Refresh] done in 310ms