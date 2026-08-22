# Architecture Decision Records (ADRs)

> **What this is.** The durable, revisitable record of **load-bearing architecture decisions** for the diBoaS
> platform — the choices that are expensive to reverse and that new work must not silently drift from. Each
> ADR states the context, the decision, the alternatives weighed, the consequences, and — critically — the
> **triggers that should make us reconsider it**, so a decision is _decided_, not _defaulted_, and stays
> honest over time.
>
> **This is not** the per-feature do-not-regress changelog (that is `implementation-notes.md`) nor the
> current-state stack/deploy reference (that is `infrastructure.md`). ADRs are the _why_, at the platform grain.
>
> **Conventions.**
>
> - Numbered `ADR-NNN`, newest concerns appended. Status: **Proposed · Accepted · Superseded (by ADR-NNN) ·
>   Revisit-due**. Never delete a superseded ADR — mark it and link forward (the reasoning is the value).
> - Each ADR carries a **Review cadence** and **Triggers to reconsider**. When a trigger fires, the ADR is
>   re-opened and either re-affirmed (with a dated note) or superseded.
> - Material ADRs are CTO-board-reviewable artifacts; a change of an Accepted ADR is a board/founder event.

---

## ADR-001 — Backend & runtime stack: polyglot-by-boundary

- **Status:** Accepted — 2026-08-17.
- **Review cadence:** annually, or when any Trigger below fires.
- **Deciders:** founder + CC (this analysis); CTO-board-reviewable.
- **Supersedes:** nothing (first ADR).

### Context

diBoaS is a web application whose full scope spans **fiat on/off-ramp, on-chain transactions, DeFi protocol
integration, a social/community layer, and monetization**. The question raised (2026-08-17): are we choosing
the backend stack correctly by leaning on **TypeScript/Node** (app + API) and **Python** (quant/analytics),
or should we adopt **Rust, Go, Ruby on Rails, Python-everywhere, or another stack** — for security,
performance, and long-term fit?

The timing is deliberate: the sandbox Phase-2 build is intentionally client-side, and the _real_ backend
(accounts, persistence, ramp orchestration, on-chain execution) is a separate, not-yet-built track — so this
is the moment to ratify the direction before it is poured.

### The reframe that drives the decision

There is no single "backend." There are **four layers, each with its own right answer**; conflating them is
what makes the question feel harder than it is:

| Layer                                  | Responsibility                                                                       | Choice                                                                                            | Verdict  |
| -------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- | -------- |
| **Web app + API / orchestration**      | the UI, and the glue that calls everything (custody, ramp, RPCs, data providers, DB) | **TypeScript / Next.js / Node** (Vercel serverless today; dedicated services if/when needed)      | **Keep** |
| **Quant / analytics / simulation**     | Monte Carlo, backtests, anomaly/depeg detection, the market data spine               | **Python** (pandas/numpy/scipy/scikit-learn), behind a **TS API**                                 | **Keep** |
| **Custody / signing / key management** | the highest-security surface                                                         | **Turnkey (TEE) — bought, not built**                                                             | **Keep** |
| **On-chain execution + fiat ramp/KYC** | settlement, bridging, on/off-ramp                                                    | **Solana/Arbitrum + Jupiter/CCTP + a ramp provider** — existing **audited** protocols + providers | **Keep** |

The security and correctness that matter most here come from **architecture, not language**: you _buy_ custody
from a TEE specialist, _delegate_ KYC to the ramp (no diBoaS KYC — the W-13 ruling), and _integrate audited_
DeFi protocols rather than writing your own. None of that gets safer by changing the app language.

### Decision

**Keep the polyglot-by-boundary stack.** Specifically:

- **TypeScript/Node for the app, API, and orchestration** — for velocity, shared types with the React
  frontend (one schema validated end-to-end), and the best ecosystem for the _actual_ work of this layer,
  which is **I/O-bound integration glue with money-correctness discipline** (not CPU-bound compute, not a
  low-latency matching engine — DeFi settles on-chain, in seconds, which no language speeds up).
- **Python for quant/analytics**, kept **behind a TS API** (the boundary already ruled; see the analytics
  contract-shape open item below).
- **Buy the security-critical pieces** (custody/signing → Turnkey; ramp/KYC → the ramp provider) and
  **integrate audited on-chain protocols** rather than writing custody or custom protocols.

### Alternatives considered (judged against _our_ workload, not in the abstract)

- **Rust** — genuinely better for memory-safety, raw performance, and _writing on-chain programs_ (Anchor).
  But diBoaS **integrates existing protocols; it does not write custom on-chain programs**, and the signing
  security one would reach to Rust to build is exactly what Turnkey already provides. For API glue it costs
  ~2–4× the dev time and a far smaller hiring pool. **Warranted only for a custom on-chain program** (a
  Phase-3+ "if"), and even then as one isolated crate, not a rewrite. → Trigger T1.
- **Go** — excellent concurrency, clean single-binary deploys, strong for a large independent microservice
  fleet. At this stage it buys little over Node for I/O work and **loses the shared-types advantage** with
  the TS frontend. A sound _per-service_ choice when a measured scale bottleneck demands it — not a _now_
  choice. → Trigger T2.
- **Ruby on Rails** — its sweet spot (server-rendered CRUD/admin) is already covered by Next.js; it is weaker
  at async integration work and adds a second language with no shared types. **Poorest fit** of the options
  for a 2026 React-frontend + heavy-integration + separate-quant-engine app.
- **Python everywhere** — right where it already is (quant), wrong as the whole app backend: weaker
  I/O-concurrency (GIL) than Node, bolt-on typing, and it would forfeit the TS-frontend unity. Keep it **at
  the quant boundary**.
- **Elixir / BEAM** (not raised, but the one worth keeping on the shelf) — exceptional for **real-time
  social/community at scale** (presence, live feeds, pub-sub, fault-tolerance). If the community layer
  becomes genuinely real-time-heavy, it is the strongest specialist option. Not now. → Trigger T3.

### Consequences

- **Kept:** development velocity and a unified TS surface while the product is still finding PMF; a small,
  well-understood operational footprint (serverless + a Python service + provider SDKs).
- **Obligations this decision creates:**
  - The **polyglot boundary must stay clean** — the TS↔Python contract is an **HTTP API** (per the analytics
    ruling), versioned and typed; Python is never imported into the Node runtime.
  - **Money-correctness discipline is load-bearing and must be _enforced_, not assumed** — TS will not stop
    float math on money. The mitigations are the existing architecture: `Decimal.js`, event-sourcing, the
    `reconcile()` conservation invariant, and the exhaustive-switch guard on the reducer. A language with
    native decimals or a stricter type system would _enforce_ rather than _rely on_ this — which is why
    Trigger T4 exists — but not enough to justify rewriting a money engine that is built and tested.
  - The security posture depends on the **buy/delegate/integrate** choices holding — if any of custody, ramp,
    or "audited protocols only" is ever revisited, this ADR's security rationale must be re-examined.

### Triggers to reconsider (the revisit mechanism)

Re-open this ADR when any of these fires — each names the _specific_ layer, not the whole stack:

- **T1 — custom on-chain program.** If diBoaS ever writes its own Solana/EVM program: **Rust/Anchor** (or
  Solidity) for that program only — the client stays TS.
- **T2 — a measured service bottleneck.** If a specific service (market-data ingestion, real-time
  social/notification fanout, or on-chain transaction orchestration) hits a _measured_ throughput/latency
  wall that Node can't meet economically: evaluate **Go/Rust** for **that one polyglot microservice** behind
  the same API — not a stack change.
- **T3 — real-time social at scale.** If the community layer becomes presence/live-feed/chat-heavy: evaluate
  **Elixir/BEAM (Phoenix)** for that service.
- **T4 — money-correctness incident.** If a production defect is traced to language dynamism in the ledger/
  money path (a decimal/rounding/exhaustiveness class the guards didn't catch): evaluate a stricter core
  (native-decimal language or a typed money kernel) for the ledger _only_.
- **T5 — the analytics contract shape.** The **Node/TS-vs-Python** boundary for analytics is _stack-verified_
  (Python engines behind a TS API) but the **contract shape is not** — `diboas-analytics/LEDGER.md` (that
  repo's source-of-truth, flagging a 2026-08-12 docs-vs-code disagreement) and doc-07 are unread. Settle this
  at the R1.1 seam; start there, not at the recommendation.

### Where the real risk lives (and it is language-agnostic)

The architecture attention a crypto-fintech actually needs is **the reliability of the async money flows** —
idempotency, provider-webhook dedup (the `provider_events` inbox), retries/circuit-breakers, the `reconcile()`
invariant on every money-touching event, and the write-authority model (the D-q/D-l/D-m work in the sandbox
architecture map). None of that is improved by a language switch; all of it must be built regardless.

### References

- Provider stack + FC rulings (Turnkey/ramp/Jupiter/CCTP, Solana-hub + Arbitrum): `docs/sandbox-app/SANDBOX_ARCHITECTURE_AND_FLOWS.md`.
- Current deployed stack (as-built): `docs/tech/infrastructure.md`.
- Money-math model + guards: `docs/tech/financial-calculations.md`; the event-sourced ledger in `packages/banking`.
- Analytics boundary (open contract-shape item, T5): `diboas-analytics/LEDGER.md` + doc-07; the Phase-2 sequence's analytics note.
