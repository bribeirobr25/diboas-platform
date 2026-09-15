# Increment Review Gate — one change, done and not harmful

> **What this is:** the mandatory review checklist for a SINGLE increment — a feature slice, a bug
> fix, a refactor — run before the increment is called done and before its commit is offered for
> merge. Its job is narrow: **did this change do what its plan said, and did it break or misstate
> nothing?**
>
> **What this is not:** a system audit. Cross-increment coherence, the 12 principles end-to-end and
> the data lifecycle belong to `system-review-gate.md`, which runs over a BATCH. An increment can
> pass this gate perfectly while the system drifts — that is the other gate's whole purpose.
>
> **Enforcement class:** MANDATORY REVIEW CHECKLIST (registered in `engineering-gates.md`). Part A
> is mechanical and executable; Parts B–H are review-time. Rows marked **⚙** are mechanisable and
> should be scripted rather than judged.
>
> **Where the record goes:** the return block in the commit body or PR description; findings in
> `docs/audit/PENDING_ALL.md` with ids claimed per F3; any narrative write-up in `docs/audit/`.
>
> **Owner:** engineering. **Re-audited** whenever an authority it routes to changes, or when a
> defect ships that a row should have caught — that second trigger is how this file grows.
>
> **Supersedes** the 2026-07-10 seven-step "review/audit" protocol, together with
> `system-review-gate.md`. There is no third definition. **v2, 2026-09-14** — v1 referenced 8 of 27
> authorities and omitted i18n, accessibility and the FAIL path; the gaps were found by auditing the
> gate against the authority inventory and against defects this project has actually shipped.

**Runner:** `pnpm review:increment` executes the ⚙ rows mechanically and prints the manual half every run — the same shape as `screen-check`. Standalone helpers: `pnpm review:register` (run it BEFORE claiming a register id) and `pnpm review:port <port> [--kill]` (stops a server by its LISTENER pid, refusing when the pid list is ambiguous). Source: `scripts/review-gate.mjs`. Each mechanical check is sabotage-proven: the defect is planted, the check fails, the plant is reverted and the revert verified byte-for-byte.

## Trigger

Any one of: an increment declared complete · a bug fix before commit · a refactor before commit · a
branch offered for merge. One increment, one record.

**This gate runs on EVERY increment. It is not a judgement call** (founder-ruled 2026-09-15, after
the same "which gate should I run?" question was asked three times in one session and answered the
same way each time — the absence of a rule was costing a decision per increment). Most of it is
Part A plus four greps; the expensive rows are the ones that keep finding real defects.

Two riders that are also not judgement calls:

- **Part E runs whenever a rendered surface changed, and A/Bs against PRODUCTION**, not only against
  a local build. The 2026-09-15 memo fix was verifiable rather than merely plausible because the
  before-reading came from `diboas.com`: same cycle, every typographic property identical, only the
  structure changed. A local-only pass cannot make that claim.
- **Anything touching the market pipeline runs `pnpm market:simulate-next-week` before merge.** It is
  the only check that looks FORWARD, and it is the one that converts a Monday outage into a Tuesday
  fix. A suite green today says nothing about the data the next refresh writes — four of ten weekly
  cycles failed on exactly that gap (`5.363`).

## How to answer

- Verdict per row: **PASS · FAIL · N/A**.
- **`N/A` requires proof, not assertion.** State the measurement that makes the row inapplicable
  ("the diff contains no effect, timer or listener line — the grep is empty"). An unproven N/A is
  indistinguishable from a skip and counts as a **FAIL**.
- **Every PASS names its instrument and pastes the measurement.** A row asserting PASS with no
  evidence beside it is the failure mode this gate exists to prevent: a one-sentence row reads as a
  completed step.
- **When you cite a gate as passing, state its scope limit** — what it does _not_ assert. A gate
  that checks a disclosure's presence but never its language must be quoted that way.
- Finish with the three lists that make a record honest: **what you did not check**, **what you
  fixed versus registered** (with owners), and **any correction to your own earlier statements**,
  including withdrawn findings — a withdrawn finding is evidence too.

## Routing — which authorities apply to THIS change

Cite the row that matches; mark the rest N/A. Completeness is achieved by routing, not by running 27
documents against every typo fix.

| If the change touches…                         | Authorities that apply                                                                                                        |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Any code at all                                | `coding-standards.md` (the 12 principles) · `engineering-gates.md`                                                            |
| Effects, timers, listeners, async, error paths | `robustness-checklist.md` (R-rows, PASS/N-A each)                                                                             |
| Money, fees, accrual, allocation, balances     | `financial-calculations.md` · `docs/full-view/FEES.md` as the fee authority · the domain's stated invariants                  |
| Any user-facing string                         | `internationalization.md` — **all four locales**, and parity ≠ translation · `VOICE_RUBRIC.md` (Q3 blocks)                    |
| Anything rendered                              | `design-system.md` + the app's token file · `anti-slop-checklist.md` Parts 1 & 3 · the accessibility standards in `CLAUDE.md` |
| A data source, rate, quote or freshness claim  | `DATA_VINTAGE_POLICY.md` · the provider interface it sits behind                                                              |
| Analytics or instrumentation                   | `INSTRUMENTATION_CONTRACT.md` (documentation-only until its phase is authorised)                                              |
| Monitoring, Sentry, PostHog, GA4               | `MONITORING_OPS.md` § verification-after-changes                                                                              |
| API routes, forms, DB, email, third-party JS   | `security-playbook.md` + `security.md`                                                                                        |
| An indexable surface                           | the SEO gate; state N/A explicitly for `noindex` surfaces                                                                     |
| Generated images or video frames               | `asset-compliance-checklist.md` (Group A FAIL blocks publish)                                                                 |
| A load-bearing architecture choice             | `architecture-decisions.md` — and check its **triggers to reconsider**                                                        |
| Calculator/tool product truth                  | `TOOLS_VALIDATION.md`                                                                                                         |
| Component patterns                             | `frontend.md` · `implementation-notes.md` for the matching do-not-regress entry                                               |

**Authorities this gate does NOT route, and why** (an N/A is proven, not silent): `email.md`, `infrastructure.md`, `onboarding.md`, `asset-management.md` and `iter5-sdk-migration-map.md` are surface-specific — a change touching those surfaces routes to them under the generic first row, and they carry no cross-cutting rule this gate must enforce. `analytics-integration.md` is the WEB app's event catalogue; the app's own contract is `INSTRUMENTATION_CONTRACT.md`, which is routed above. If a change touches one of these five surfaces, open it and say so.

## Part A · Mechanical — must be green, paste the output ⚙

| #   | Check                                                                              |
| --- | ---------------------------------------------------------------------------------- |
| A1  | Root `type-check` — the whole workspace, not just the touched package              |
| A2  | Lint — errors block; every surviving warning listed with its reason for existing   |
| A3  | Every affected test suite                                                          |
| A4  | Build                                                                              |
| A5  | Dead-code (`knip`)                                                                 |
| A6  | Repo-wide `format:check` — what CI runs                                            |
| A7  | The app's own battery where one exists (e.g. `pnpm --filter sandbox screen-check`) |

**Part A is run locally and pasted because CI does not run on feature branches** (a known hole — see
`PENDING_ALL` 5.122). "CI will catch it" is not available to this gate.

**Never verify behind a command that cannot fail.** No `&& echo PASS`; no pipe through `tail` on the
evidence you are about to quote. A truncating pipe has hidden a real failure here, and a `0 bytes
scanned` line has hidden a commit that staged nothing. Judge by exit code and by full text.

## Part B · Against the plan — completeness

| #   | Check                                                                                               |
| --- | --------------------------------------------------------------------------------------------------- |
| B1  | **Name the source document and its ref.** If none exists, say so explicitly — never "if available". |
| B2  | Enumerate the plan's completion conditions **verbatim**, one verdict each. Paraphrase hides gaps.   |
| B3  | Anything required but deliberately not done: stated, with the reason and the owner.                 |
| B4  | Return the exact updated test count — and read D4 before quoting any number.                        |

## Part C · Regression, side-effects, and what the change touched

| #   | Check                                                                                                                                                                                                                                                                                                                |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | **Diff completeness** — every changed file disclosed and accounted for. A file in the diff the narrative does not mention is a finding.                                                                                                                                                                              |
| C2  | **Do-not-regress** — the `implementation-notes.md` entries for this area plus any covenant-bearing file. **Prove absence with a grep over the diff**, never assert it.                                                                                                                                               |
| C3  | **Orphaned consumers** ⚙ — grep an identifier before deleting its declaration, and again after. Skipping this has broken eleven tests from one root cause. For an i18n key, grep the key's LAST segment and every template that composes the namespace.                                                              |
| C4  | **Async surface** — if the diff touches an effect, timer, listener or async flow, cite the applicable R-rows. If it touches none, prove it.                                                                                                                                                                          |
| C5  | **Reachability** — check the MOUNT site and every condition on the path in. "Renders unconditionally" is not reachable. State unmeasured cases as _unreachable-because-X_ or _not-yet-reached_, never as covered.                                                                                                    |
| C6  | **No fake control** — every control either acts or explains why it cannot. An enabled button whose handler returns null, and a priced action with no honest price, are both defects this project has shipped.                                                                                                        |
| C7  | **Link graph** ⚙ — if routes or navigation changed: is every new surface reachable, and did anything become unreachable? Two working screens once shipped linked from nowhere.                                                                                                                                       |
| C8  | **Locale parity** — any new or changed user-facing string exists in **all four** locales, and the non-English values are actually translated. Presence, parity and identity are three different guards; all three pass while content is still English. Tag anything unconfirmable natively `[NATIVE PASS REQUIRED]`. |

## Part D · Truth of the change

| #   | Check                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | **Assert resolved values, not flags.** A value a user reads is verified as the VALUE — the string, the hex, the ratio — never via the attribute or selector meant to produce it.                                                                                                                                                                                                                                                         |
| D2  | **A test asserts a REQUIREMENT, never observed output** (`coding-standards.md` § of that name). Every assertion on a money path or honesty surface cites its requirement. The three failure classes — vacuous, weak, wrong — need different detection; only tracing to a stated requirement finds the third.                                                                                                                             |
| D3  | **Sabotage-prove every load-bearing test and gate** — break the implementation, confirm the failure is _for the right reason_, revert, and diff the revert byte-for-byte. A test that still passes is vacuous.                                                                                                                                                                                                                           |
| D4  | **Re-measure every number you republish** ⚙ — counts, sizes, percentages, timings. A figure is evidence only where it was measured; carried forward it is decoration. A published test count was wrong for days for exactly this reason.                                                                                                                                                                                                 |
| D5  | **Suspect the instrument before the finding.** A grep, parse or fetch returning nothing is a claim about the query. Known instrument errors in this repo: unquoted variables and glob-expanded flags in zsh; `\|` not being alternation; a flat lookup against nested data; a one-level scan of a deeper tree; first-matching a whole document instead of an element; reading state you invented yourself. Confirm absence a second way. |
| D6  | **Verify the stage before the commit** ⚙ — `git diff --cached --name-only` and a file count, because a bad pathspec silently stages nothing and the commit then reports success over an empty change.                                                                                                                                                                                                                                    |

## Part E · Visual validation (Docker MCP) — when a rendered value or layout changed

Skip only if nothing a user sees changed, and say so.

| #   | Check                                                                                                                                                                                                                                                                                                            |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E1  | Serve the **built** artefact over the LAN IP (Docker MCP cannot reach `localhost`); record the build id, and confirm it is the build containing the change.                                                                                                                                                      |
| E2  | **A/B against the pre-change reading** wherever the change should preserve behaviour: the same state must render the same values. The strongest evidence a refactor can offer.                                                                                                                                   |
| E3  | **The matrix:** light **and** dark × mobile (~375–390) **and** desktop (1440) × English **and** the longest-text locale. Section by section — a full-page glance hides spacing defects.                                                                                                                          |
| E4  | Console 0 errors per cell, **and** read the dev-server log: hydration and dev-only warnings never appear in a production start.                                                                                                                                                                                  |
| E5  | Interactive states clicked through — wizards, sheets, toggles — not only the initial view.                                                                                                                                                                                                                       |
| E6  | **Accessibility, measured not assumed:** contrast as a resolved ratio (composited opacity included), touch targets ≥24px with spacing, no heading-level skips, focus-visible, `prefers-reduced-motion` respected. pa11y catches none of the middle three.                                                        |
| E7  | **State provenance:** say what state you measured and how it was built (seeded, replayed through the UI, or inherited). A device-local ledger can silently reset between runs.                                                                                                                                   |
| E8  | **Honesty rules.** If browser tooling is unavailable: _"I could not visually verify this — browser tooling is not available."_ If it drops mid-run: name the cells measured and the cells still owed. Never imply a pass that did not happen.                                                                    |
| E9  | **Teardown by listener, not by port** ⚙ — stop a dev/preview server by selecting the LISTENER (`lsof -ti:PORT -sTCP:LISTEN`), verifying the command name, and killing that ONE pid. A port's pid list also contains its CLIENTS: killing by process group off that list once took down Docker Desktop mid-audit. |

## Part F · Disposition

| #   | Check                                                                                                                                                                                                                               |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | **Fix what is safe and value-preserving. Register and STOP** for anything structural, any user-facing wording, or anything that changes a published number. The owner is part of the finding.                                       |
| F2  | **Public-repo sweep before committing tracked files** ⚙ — no legal position, forward pricing, regulator-perimeter interpretation, credential or customer content. This repository is public and history cannot be un-published.     |
| F3  | Findings registered in `docs/audit/PENDING_ALL.md`: re-read the marker **and measure the maximum existing id** at write time — the marker is a claim, not evidence; an id collision has proven it. Verify uniqueness after writing. |
| F4  | Docs retention respected: record substance in a living doc; **deletion is founder-only**; a missing local file is intentional cleanup, not a mystery to investigate.                                                                |
| F5  | **What you did not check**, listed. Coverage is unbounded; the boundary is the honest part.                                                                                                                                         |

## Part G · FAIL, waiver and escalation

| Situation                                        | Path                                                                                                                                                                                                               |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A mechanical row (Part A) fails                  | Not shippable. Fix, or stop and report. No waiver exists.                                                                                                                                                          |
| An anti-slop **veto row 10–17**, or **Voice Q3** | **Blocks merge regardless of measured lift.** The implementer may not waive it. Escalate to the founder; a waiver exists only as a founder-recorded decision plus a register row naming what was accepted and why. |
| A CLO / compliance row                           | Same as above, and it routes to the founder even when the implementer believes it is a false positive.                                                                                                             |
| A non-blocking row fails                         | Fix if safe, else register with an owner and say so in the return block. Silence is not a disposition.                                                                                                             |
| You believe a row does not apply                 | Prove the N/A. An unproven N/A is a FAIL.                                                                                                                                                                          |

## Return block

```text
INCREMENT            = <name / commit>
STATE                = IMPLEMENTED ON BRANCH | MERGED TO MAIN | DEPLOYED·LIVE   (never collapsed)
ROUTING              = <authorities that applied; the rest N/A>
PART_A_MECHANICAL    = <green? paste the output>
PART_B_VS_PLAN       = <n/n conditions, source doc + ref>
PART_C_REGRESSION    = <verdict per row; N/A rows show their proof>
PART_D_TRUTH         = <sabotage results; numbers re-measured>
PART_E_VISUAL        = <A/B result, matrix covered, a11y measured — or the honesty sentence>
TEST_COUNT           = <re-measured, not carried>
GATE_SCOPE_LIMITS    = <for each gate cited: what it does NOT assert>
FIXED / REGISTERED   = <ids + owners + blocking status>
WAIVERS              = <none | founder decision + register row>
NOT_CHECKED          = <...>
CORRECTIONS          = <to my own earlier statements, incl. withdrawn findings>
```
