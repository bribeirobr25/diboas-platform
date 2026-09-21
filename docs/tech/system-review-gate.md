# System Review Gate — a batch, properly built and still coherent

> **What this is:** the mandatory review checklist for a BATCH of increments. Its job is the one an
> increment gate structurally cannot do: **is the system still coherent?** Every increment can pass
> its own gate while the whole drifts — one fact derived twice, two names for one concept, a file
> whose name outgrew its contents, a number republished unmeasured, a policy silent on the surface
> it should govern. Those are only visible from above.
>
> **Precondition:** every increment in the batch has a passing `increment-review-gate.md` record.
> This gate **references** those records and never restates them; duplication between the two is how
> a project ends up with competing definitions of "review".
>
> **Work that predates this gate — the one exception, and it is single-use per lane** (founder-ruled
> 2026-09-16, register `5.385`). These gates landed mid-stream. Increments merged before a lane
> adopted them were never going to carry records, and the precondition above would otherwise bar the
> `/market` wave — the work most in need of a system pass — from ever receiving one. It happened
> twice: `5.325` for PR #595, then again for #614–#621.
>
> So, for increments merged **before** the lane's adoption date only:
>
> 1. **One BATCH-LEVEL increment record** may stand in for the missing per-increment records. It
>    covers the batch diff as a single change and is **labelled `BATCH-LEVEL (LEGACY)`** in its own
>    return block and wherever it is cited. It is not equivalent to per-increment records and must
>    never be described as though it were.
> 2. **Retrospective per-increment records must NOT be written.** Reconstructing a review that did
>    not happen produces exactly the failure this gate names — a one-sentence row reading as a
>    completed step. An absent record is recorded as absent.
> 3. **The system gate's return block states the precondition as `MET (legacy batch record)`**, names
>    the increments with no individual record, and carries the consequence: cross-increment findings
>    are still valid, but "this increment was reviewed" cannot be claimed for any of them.
> 4. **The exception expires at the lane's adoption date.** After it, a missing increment record is a
>    FAIL with no waiver — `#620` and `#621` merged one day after the cadence rule with no record, and
>    that is a gap, not a legacy case.
>
> **Adoption dates.** market lane: **2026-09-15** (the cadence rule, PR #619). webapp/sandbox lane:
> **2026-09-16** — this lane's first per-increment records (the Error semantic family and `5.234`)
> were both written and run BEFORE their commits, so from this date a missing increment record in
> this lane is a FAIL with no waiver. Everything this lane merged to `main` before it (P0, I-0a/b,
> I-1a..I-1f) is legacy: one labelled `BATCH-LEVEL (LEGACY)` record may stand in, and
> retrospective per-increment records must NOT be written. Any other lane records its own here
> when it adopts.
>
> **Enforcement class:** MANDATORY REVIEW CHECKLIST (registered in `engineering-gates.md`). Rows
> marked **⚙** are mechanisable and should be scripted rather than judged.
>
> **Where the record goes:** a dated write-up in `docs/audit/`, its findings in
> `docs/audit/PENDING_ALL.md`, and the return block reproduced wherever the batch is handed on.
>
> **Owner:** engineering, with per-authority verdicts owned by the authority named in Front 2.
> **Re-audited** when an authority changes, or when a defect ships that a front should have caught.
>
> **Supersedes** the 2026-07-10 seven-step protocol, with `increment-review-gate.md`.
> **v2, 2026-09-14** — v1 referenced 8 of 27 authorities and omitted i18n parity, accessibility,
> ADR triggers and the FAIL path.

**Runner:** `pnpm review:system` executes the ⚙ rows this gate shares with the increment gate (authority coverage, republished counts, register integrity, dead exports) and prints the manual fronts. **X1 (duplicate derivations) and X6 (guard filters) are deliberately NOT mechanised** — the first is too heuristic to avoid noise, and no script here claims either. Source: `scripts/review-gate.mjs`. **Register path (5.382):** the id-collision check resolves `docs/audit/PENDING_ALL.md` repo-relative first, then `REVIEW_REGISTER_PATH`, and **FAILS rather than skips** when neither resolves — a SKIP reads as a pass in a green run. The ledger is local-only and lives in the `diboas-platform` checkout, so a session working from a git WORKTREE must export `REVIEW_REGISTER_PATH=/path/to/diboas-platform/docs/audit/PENDING_ALL.md` or the gate is red by design.

## Block closure — mechanical execution is NOT a system review

⛑ **ADDED 2026-09-21 (`5.431`), because the runner's output read like a complete checklist when it
was a partial one.** It printed six fronts — the ones nobody had mechanised — so Fronts 3, 4 and 10
were never surfaced in any state, and Front 5 appeared only through its mechanical `exports` row.
That row SKIPs whenever a change touches nothing under `apps/sandbox/src/view`, and when it skipped,
Front 5 was adjudicated by nobody.

```text
mechanical gate execution alone   !=  complete system review
all TEN authoritative fronts      =   must each receive an EXPLICIT disposition
```

**The four dispositions, and no others:**

| Disposition                         | When                                                                                   |
| ----------------------------------- | -------------------------------------------------------------------------------------- |
| `PASS`                              | the front applies and was satisfied; name the instrument                               |
| `N/A · WITH MEASURED PROOF`         | the front cannot apply to this batch, and the proof is a measurement — never a silence |
| `NON-BLOCKING FINDING · REGISTERED` | a real gap, registered with an id and an owner, that does not block the block          |
| `BLOCKING FINDING · STOP`           | the block does not close                                                               |

A **zero-change or structurally inapplicable** row is reported as `N/A`, never promoted to `PASS`.

**A mechanised front still needs manual fallback adjudication when its mechanical row cannot run.**
Front 5 is the live case: `exports` supplies evidence when it PASSES, but SKIP, N/A or FAIL means the
row discharged nothing and the reviewer must adjudicate the front by hand. The runner now prints
every front on every run, marking each either `MECHANICAL EVIDENCE` (its row PASSED — record it, then
disposition it) or `MANUAL ADJUDICATION REQUIRED`, naming the row that failed to discharge it.

A block may be declared **RECONCILED** only when every runnable mechanical row **and** all ten fronts
carry a disposition. The dated record must contain a `SYSTEM REVIEW · MANUAL FRONTS` subsection
listing every front and its disposition.

⚑ **This adds no eleventh front and changes no front's subject.** The ten-front architecture is
unchanged; what changed is that none of them can now go unmentioned. Guard:
`apps/sandbox/src/lib/__tests__/authGate.test.ts` compares the runner's emitted front numbers against
the `## Front N` headings in THIS document — so adding a front here without teaching the runner fails
the test, which is the drift one door further along.

## Trigger

Before a merge train to `main` · at the close of a plan phase (before the next numbered increment may
start) · when two or more increments touched the same surface · after five increments without a
system pass · founder-ordered.

**Plus: when a FRONT'S OWN SUBJECT changed** (founder-ruled 2026-09-15). A front is worth re-running
precisely when the thing it inspects has moved, and that is knowable without judgement:

| The batch touched…                         | Re-run                                          |
| ------------------------------------------ | ----------------------------------------------- |
| a provider, a cadence, a freshness rule    | Front 7, and the Collection → Validation seam   |
| any user-facing string or rendered surface | Front 2 (all five verdicts) and the increment E |
| a formula, a weight, a threshold, a band   | Front 6                                         |
| a stored record's shape                    | Front 8, Storage and the two seams either side  |

This is not extra ceremony: Front 7 FAILED on 2026-09-15 (`no fetch in the pipeline has a timeout`)
and passed a day later only because the provider layer had changed and the front was re-run against
it. A front nobody re-runs after its subject moves is a front that records history, not state.

**X9 is the row most likely to catch YOU.** Three separate status claims went stale within hours of
being written during the 2026-09-15 session, each in a document the author had written that same
day. A status sentence decays from the moment it is written; re-reading never catches it, only
re-deriving does. Run X9 against your own register rows, not just the project's prose.

## How to answer

**PASS · FAIL · N/A-with-proof**, every PASS naming its instrument and pasting its measurement, and
the record ending in the honest lists (**not checked**, **fixed vs registered with owners**,
**corrections and withdrawn findings**). Three additions specific to this gate:

- **Per-front verdicts are never averaged.** Front 2 bundles authorities with different owners and
  different teeth; each gets its own verdict and blocking status.
- **State the coverage boundary.** "Breadth and depth" is unbounded and rewards widening; naming what
  a next pass would add is worth more than claiming completeness.
- **Routing applies here too** — the table in `increment-review-gate.md` maps a touched surface to
  its authorities. A front that does not apply to this batch is an N/A with proof, not a silence.

## Front 1 · Architecture principles and code standards

All 12 from `coding-standards.md`, read from the document, one verdict each in a table, with
evidence. The founder-named emphases get their own line whatever the batch touched: **no hard-coded
values** (a literal that should be an imported constant) · **DRY** · **service/API-agnostic
abstraction** (dependencies inverted or injected, never reached into) · **event-driven** (state
changes emit; read models never mutate) · **security** · **performance**.

Also: does the batch touch a load-bearing decision in `architecture-decisions.md`, or trip one of its
**triggers to reconsider**? An ADR silently outgrown is a coherence defect.

Traps that have each been a real finding here: a file whose NAME no longer describes its contents · a
"DRY" refactor that left three copies of one sum · `as` casts on a money path where a discriminated
union was not narrowed · a docstring claiming an exactness the code stopped providing one line above
· derived state that is correct but reached through a float.

## Front 2 · CLO · Brand · UX Governance · Voice · Storytelling — five verdicts, not one

| Authority          | Instrument                                                                                                                                                                                    | Blocking?         |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| CLO / compliance   | no fee, yield or perimeter-adjacent drift; covenant guards untouched **and proven so**                                                                                                        | **Yes**           |
| Brand Positioning  | `design-system.md` + the app token file: tokens only, real assets, no emoji-as-icon, positioning line as ruled                                                                                | Per finding       |
| UX Governance      | `anti-slop-checklist.md` Parts 1–3, rows cited individually; **a FAIL on rows 10–17 blocks merge regardless of measured lift**; `UX_PRINCIPLES_CANON.md` for the UX-NN ids                    | **Yes (10–17)**   |
| Voice              | `VOICE_RUBRIC.md` Q1–Q4 per surface, **scored in each locale's own register, never against the English**; **Q3 FAIL blocks**; anything unconfirmable natively tagged `[NATIVE PASS REQUIRED]` | **Yes (Q3)**      |
| Storytelling craft | `STORYTELLING_CRAFT.md` — advisory, never a blocker                                                                                                                                           | No                |
| Generated assets   | `asset-compliance-checklist.md` — Group A FAIL blocks publish                                                                                                                                 | **Yes (Group A)** |

Findings are written in the **F-finding format** from `UX_GOVERNANCE_USAGE.md`, with its role table
deciding who receives each one. If the batch authored no user-facing copy, prove it (a diff sweep for
currency, percent and copy literals) and then score only the rows the batch's **rules** touch — a
product rule that decides what renders is inside this front even when no words changed.

## Front 3 · Other gates and playbooks

Every LIVE gate in `engineering-gates.md` run and pasted, **each with its scope limit stated** · the
R-rows from `robustness-checklist.md` (or a proven N/A) · `security-playbook.md` + `security.md`
surfaces re-checked for anything the batch added · the SEO gate where the surface is indexable, an
explicit N/A where it is not · `MONITORING_OPS.md` § verification where monitoring changed ·
`TOOLS_VALIDATION.md` where calculator or product truth changed.

**Locale integrity across the batch** (`internationalization.md`): every user-facing string in all
four locales; the untranslated ratchet not silently widened; **and state what each i18n guard's
filter EXCLUDES**, because whatever a filter drops can never be found — a length filter once hid six
untranslated words and made one locale report zero debt when it had some.

**Accessibility across the batch** (`CLAUDE.md` § Accessibility Standards, `design-system.md`):
WCAG 2.1 AA contrast as measured ratios including composited opacity · touch targets ≥24px with
spacing · no heading-level skips · focus-visible · reduced motion · dark mode carrying its own
overrides. **pa11y does not catch touch targets, heading skips, or an `aria-disabled` item's
contrast** — say so when citing it.

### AUTH-1 · Canon-First authority resolution ⚙

Run `pnpm review:auth` and report the batch's authority arithmetic. A batch that escalated anything
without a completed Canon-First search is **INCOMPLETE**, not green:

```text
AUTHORITY QUESTIONS RAISED      = N
AUTH-1 RUNS                     = N
AUTHORITY FOUND / IMPL. GAP     = N
GENUINE AUTHORITY CONFLICTS     = N
GENUINE AUTHORITY GAPS          = N
EXTERNAL ESCALATIONS            = N
ESCALATIONS WITHOUT AUTH-1      = 0 REQUIRED
```

**The corpus boundary is part of this row.** Authority packages are SEARCHED as authority and never
scanned as repository claims — extracting them once took the counts walk from 334 documents to 1,062
(69 % canon) and it passed only because canon happens to contain no `N tests / N files` strings. Luck
of vocabulary is not a boundary.

## Front 4 · Completeness against the source

Name every source document and its ref. Enumerate stated requirements **verbatim**, verdict each.
Then the question an increment gate cannot ask: **what did the batch as a whole leave undone** — a
requirement each increment reasonably deferred and nobody now owns.

## Front 5 · Dead and legacy code ⚙

`knip` · every new export checked individually for a real consumer · code orphaned by the batch's own
deletions · superseded paths that survived a migration · tests pinning behaviour that no longer
exists. Cheap enough to run at any point; it does not wait its turn.

## Front 6 · Mathematics, calculations and formulas

Read every formula the batch touched, line by line, against `financial-calculations.md` and the
domain's stated invariants. Per formula: **units · rounding mode and where applied · exact vs float ·
division-by-zero and empty-set guards · bounds at BOTH ends · the identity it must satisfy**.

- **Prove identities by sabotage, and from an independent term.** An identity asserted over values
  the code derived from each other cannot fail. A row derived by subtraction from its own siblings is
  self-consistent by construction and will render tidily over a broken input.
- **Pin the global configuration a display path depends on** — a shared rounding mode is the known
  case. Agreeing "by default" is not agreeing by construction.
- **Reject non-finite input explicitly.** `NaN` once passed every `Decimal` affordability guard in this codebase, because every comparison with `NaN` is false: `amount > 0` fails OPEN, while `!(amount > 0)` fails closed. Parse untrusted text to `Decimal` inside a try/catch with an `isFinite` check, never through `Number()` first — a float parse in the middle also silently discards precision the comparison then claims to have.
- **Never assert a count floor.** A minimum-length assertion makes inventing data the only way to go
  green; assert provenance and precision instead.
- **A verifier must never write to what it verifies.**

## Front 7 · Real-time data readiness

Per source, a row: **live path? · cache and TTL · stamp (fetched-at, never served-at) · fallback, and
what the user is told when it is used**. Governed by `DATA_VINTAGE_POLICY.md`; instrumentation claims
by `INSTRUMENTATION_CONTRACT.md`. Then the three horizons explicitly:

1. **Today** — the current cadence, as a single owned constant rather than a value per provider.
2. **Swap-ready** — the interface that lets the analytics product replace a source with no change to
   consumers. The property that makes it true: consumers receive data as arguments and never fetch.
   Verify it; do not assume it.
3. **Real-time at launch** — what changes for the real app, and whether that is a constant or an
   architectural change.

⚠️ **A provider with no live implementation is a finding, not an aside.** Everything downstream of it
is permanently degraded, and any cadence stated for it is meaningless because there is nothing to
refresh. Equally: a freshness rule with no upper bound, or one that cannot be enforced because its
source cannot refresh, is a finding against the policy, not against the code.

## Front 8 · The data lifecycle — checked at the SEAMS

The orthogonal axis. Every honesty defect this project has found lived at a seam **between** two
stages, never inside one — so the seams are where the checks go.

| Stage                               | What to verify                                                                                                                                                                                                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Collection**                      | Source named and reachable · timeout and failure path · what is recorded about the fetch (when, whence, which version) · no seeded or synthetic value entering as observed                                                                                         |
| **Validation**                      | Fail-closed or fail-honest, chosen deliberately · bounds and type checks at the boundary · age rules with an upper bound that exists · a rejected value never silently becoming a default                                                                          |
| **Storage**                         | One owner per fact · units and precision stored with the value, not implied · immutability where the record is an event · trust boundary stated (client-editable storage is not authoritative)                                                                     |
| **Transformation into information** | Every derived figure traceable to its inputs · the identity it must satisfy, checked · one derivation, not one per consumer · no truth decision taken during rendering                                                                                             |
| **Presentation**                    | What the number IS, said plainly (measured · modelled · reference value · projection) · units and currency from the authoritative source, never the viewing locale · absent over false where a zero would mislead · nothing claimed the stage above cannot support |

**The seam checks — where the defects actually were:**

| Seam                          | The question                                                                                                                                                                                              |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Collection → Validation       | Can a value with an unbounded age reach a consumer? Is there a source whose freshness rule cannot be enforced because it has no live path?                                                                |
| Validation → Storage          | Does a fallback get stored indistinguishably from a measured value?                                                                                                                                       |
| Storage → Transformation      | Is one stored fact re-derived in two places free to drift? Does a transformation read a raw record it should read through a projection?                                                                   |
| Transformation → Presentation | Does the screen state a stronger claim than the derivation supports? Is a user's own deposit ever presented as market movement?                                                                           |
| Presentation → the user       | Does a sentence name something it cannot name (an empty list, a source it did not use)? Is a fallen value ever shown in the colour of a gain? Is prose rendering in a language the reader did not choose? |

## Front 9 · Cross-increment coherence (this gate's reason to exist)

| #   | Check                                                                                                                                                                    |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| X1  | **One fact, one derivation** ⚙ — search for the same total computed twice. Where a second derivation is deliberate, a test must assert the two AGREE.                    |
| X2  | **One concept, one name** — two vocabularies for one product noun, in code or in copy.                                                                                   |
| X3  | **One definition of a process** — competing checklists, protocols or registries for one activity. (This gate exists because there were two.)                             |
| X4  | **Names that still describe contents** — files, modules and exports whose scope outgrew their name.                                                                      |
| X5  | **No number republished without re-measurement** ⚙ — sweep every document the batch updated for carried-forward figures.                                                 |
| X6  | **Guard filters are part of the threat model** — for every guard relied on, state what its filter EXCLUDES and sabotage that class.                                      |
| X7  | **Three-state truth kept distinct** — `IMPLEMENTED ON BRANCH` / `MERGED TO MAIN` / `DEPLOYED·LIVE`, never collapsed, in any document.                                    |
| X8  | **Every cited gate carries its scope limit** — a gate quoted as passing must say what it does not assert.                                                                |
| X9  | **Status prose re-verified with `git`**, never trusted from a document. A stale merge claim has gone stale in five documents at once.                                    |
| X10 | **Authority coverage** ⚙ — which authorities does this batch's surface route to, and was each actually opened? An unopened authority is an N/A that has not been proven. |

## Front 10 · FAIL, waiver and escalation

| Situation                                                      | Path                                                                                                                                                                          |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Any mechanical gate fails                                      | Not shippable. No waiver exists.                                                                                                                                              |
| Veto rows 10–17 · Voice Q3 · CLO · asset Group A               | **Blocks.** The implementer may not waive. Escalate to the founder; a waiver exists only as a founder-recorded decision plus a register row naming what was accepted and why. |
| A front cannot be completed (missing authority, absent ruling) | Return the front as **BLOCKED**, naming who owes what. Do not substitute judgement for a missing ruling, and do not invent the wording an authority owes.                     |
| A non-blocking finding                                         | Fix if safe, else register with an owner. Silence is not a disposition.                                                                                                       |

## Return block

```text
BATCH                  = <increments covered>
INCREMENT_RECORDS      = <one per increment, all passing — OR `BATCH-LEVEL (LEGACY)` plus the
                         list of increments with no individual record, for work predating the
                         lane's adoption date. See the Precondition. Never both silently.>
ROUTING / COVERAGE     = <authorities opened; N/A ones with proof>
FRONT_1_PRINCIPLES     = <per-principle verdicts; ADR triggers checked>
FRONT_2_AUTHORITIES    = CLO=… BRAND=… UX=… VOICE=… STORY=… ASSETS=…   (never averaged)
FRONT_3_GATES          = <pasted, each with its scope limit> · I18N=… · A11Y=…
FRONT_4_COMPLETENESS   = <n/n, source + ref; what the batch left undone>
FRONT_5_DEAD_CODE      = <knip + per-export>
FRONT_6_MATH           = <per-formula; identities sabotage-proven from independent terms>
FRONT_7_DATA_READINESS = today=… swap-ready=… real-time=…
FRONT_8_LIFECYCLE      = collection=… validation=… storage=… transformation=… presentation=… seams=…
FRONT_9_COHERENCE      = <X1–X10>
FRONT_10_DISPOSITION   = <blocked fronts + owners> · WAIVERS=<none | founder decision + row>
COVERAGE_BOUNDARY      = <what a next pass would add>
NOT_CHECKED            = <...>
CORRECTIONS            = <incl. withdrawn findings>
```
