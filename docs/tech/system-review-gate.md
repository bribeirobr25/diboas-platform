# System Review Gate — a batch, properly built and still coherent

> **What this is:** the mandatory review checklist for a BATCH of increments. Its job is the one an
> increment gate structurally cannot do: **is the system still coherent?** Every increment can pass
> its own gate while the whole drifts — duplicate derivations of one fact, two names for one
> concept, a file whose name no longer matches its contents, a number republished without
> re-measurement, a policy silent on the surface it should govern. Those are only visible from above.
>
> **Precondition:** every increment in the batch has a passing `increment-review-gate.md` record.
> This gate **references** those records and never restates them — duplication between the two is how
> a project ends up with competing definitions of "review".
>
> **Enforcement status:** MANDATORY REVIEW CHECKLIST (registered in `engineering-gates.md`). Rows
> marked **⚙** are mechanisable and should be scripted rather than judged.
>
> **Supersedes** the 2026-07-10 seven-step "review/audit" protocol, together with
> `increment-review-gate.md`.

## Trigger

Any one of: before a merge train to `main` · at the close of a plan phase (e.g. before the next
numbered increment may start) · when two or more increments in the batch touched the same surface ·
after five increments without a system pass · founder-ordered.

## How to answer

As in the increment gate: **PASS · FAIL · N/A-with-proof**, every PASS naming its instrument and
pasting its measurement, and the record ending in the two honest lists (**not checked**, and **fixed
vs registered with owners**). Two additions specific to this gate:

- **Per-front verdicts are not averaged.** Front 2 bundles four authorities with different owners and
  different teeth; each gets its own verdict and its own blocking status.
- **State the coverage boundary.** "Breadth and depth" is unbounded and rewards widening; naming what
  a next pass would add is worth more than claiming completeness.

## Front 1 · Architecture principles and code standards

Audited against `coding-standards.md` (all 12) and the matching `docs/tech/` reference — from the
document, never from memory. One verdict per principle, in a table, with evidence.

Specific traps worth naming, each of which has been a real finding: hard-coded values that should be
imported constants · a file whose NAME no longer describes its contents · a "DRY" refactor that left
three copies of one sum · `as` casts on a money path (a discriminated union that `Array.filter` does
not narrow) · a docstring claiming an exactness the code stopped providing one line above · derived
state that is correct but reached through a float.

## Front 2 · CLO · Brand Positioning · UX Governance · Storytelling — four verdicts, not one

| Authority          | Instrument                                                                                                                            | Blocking?       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| CLO / compliance   | no fee, yield, or perimeter-adjacent drift; the covenant guards untouched and proven so                                               | **Yes**         |
| Brand Positioning  | tokens only, real assets, no emoji-as-icon, positioning line as ruled                                                                 | Per finding     |
| UX Governance      | `anti-slop-checklist.md` Part 3 rows 1–26, cited individually; **a FAIL on rows 10–17 blocks merge regardless of measured lift**      | **Yes (10–17)** |
| Voice Rubric       | Q1–Q4 per surface, in each locale's own register; **Q3 FAIL blocks**; anything unconfirmable natively tagged `[NATIVE PASS REQUIRED]` | **Yes (Q3)**    |
| Storytelling craft | `STORYTELLING_CRAFT.md` — advisory, never a blocker                                                                                   | No              |

If the batch authored no user-facing copy, say so and prove it (a diff sweep for currency, percent
and copy literals), then score only the rows the batch's RULES touch — a product rule that decides
what renders is inside this front even when no words changed.

## Front 3 · Other gates and playbooks

Every LIVE gate in `engineering-gates.md` run and pasted · `robustness-checklist.md` R-rows (or a
proven N/A) · `security-playbook.md` surfaces re-checked for anything the batch added (endpoints,
forms, DB, email, third-party JS) · SEO gate where the surface is indexable, and an explicit N/A
where it is not · design-token and asset-compliance checks where visuals changed.

## Front 4 · Completeness against the source

Name every source document and its ref. Enumerate stated requirements **verbatim**, verdict each.
Then the harder question an increment gate cannot ask: **what did the batch as a whole leave
undone** — a requirement each increment reasonably deferred and nobody owns.

## Front 5 · Dead and legacy code ⚙

`knip` · every new export checked for a real consumer, individually · code orphaned by the batch's
own deletions · superseded paths that survived a migration · tests pinning behaviour that no longer
exists. Cheap enough to run at any point; it does not need to wait its turn.

## Front 6 · Mathematics, calculations and formulas

Read every formula the batch touched, line by line, against `financial-calculations.md` and the
domain's own stated invariants. Per formula: units · rounding mode and where it is applied · exact
versus float arithmetic · division-by-zero and empty-set guards · bounds at BOTH ends · and the
identity it must satisfy.

**Prove identities by sabotage, not by assertion.** An identity asserted over values the code
derived from each other cannot fail. A preview that derives one of its own rows by subtraction is
self-consistent by construction and will render tidily over a broken input — the check must come
from the independent term.

**Pin the global configuration** a display path silently depends on (a shared rounding mode is the
known case: agreeing "by default" is not agreeing by construction).

## Front 7 · Real-time data readiness

Per data source, a row: **live path? · cache and TTL · stamp (fetched-at, not served-at) · fallback
and what the user is told when it is used**. Then the three horizons explicitly:

1. **Today** — the sandbox cadence (a single owned TTL constant, not a value per provider).
2. **Swap-ready** — the interface that lets `diboas-analytics` replace a source with no change to
   consumers. The property that makes this true: selectors receive data as arguments and never
   fetch. Verify it, don't assume it.
3. **Real-time at launch** — what changes for the real app, and whether that is a constant or an
   architectural change.

⚠️ **A provider with no live implementation is a finding, not a gap to note in passing** — it makes
every surface downstream of it permanently degraded, and any cadence stated for it is meaningless
because there is nothing to refresh.

## Front 8 · The data lifecycle — checked at the SEAMS

The orthogonal axis. Every honesty defect this project has found lived at a seam **between** two
stages, not inside one — so the seams are where the checks go.

| Stage                               | What to verify                                                                                                                                                                                                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Collection**                      | Source named and reachable · timeout and failure path · what is recorded about the fetch (when, from where, which version) · no seeded or synthetic value entering as observed                                                                                     |
| **Validation**                      | Fail-closed or fail-honest, chosen deliberately · bounds and type checks at the boundary · age and staleness rules, with an upper bound that exists · a rejected value never silently becomes a default                                                            |
| **Storage**                         | One owner per fact · units and precision recorded with the value, not implied · immutability where the record is an event · trust boundary stated (client-editable storage is not authoritative)                                                                   |
| **Transformation into information** | Every derived figure traceable to its inputs · the identity it must satisfy, checked · a derivation that exists once, not per consumer · no truth decision taken during rendering                                                                                  |
| **Presentation**                    | What the number IS, said plainly (measured, modelled, reference value, projection) · units and currency from the authoritative source, not the viewing locale · absent over false where a zero would mislead · nothing claimed that the stage above cannot support |

**The seam checks — where the defects actually were:**

| Seam                          | The question                                                                                                                                                                                              |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Collection → Validation       | Can a value with an unbounded age reach a consumer? Is there a provider whose freshness rule cannot be enforced because it has no live source?                                                            |
| Validation → Storage          | Does a fallback get stored indistinguishably from a measured value?                                                                                                                                       |
| Storage → Transformation      | Is one stored fact re-derived in two places that can drift? Does a transformation read a raw record it should read through a projection?                                                                  |
| Transformation → Presentation | Does the screen state a stronger claim than the derivation supports? Is a user's own deposit ever presented as market movement?                                                                           |
| Presentation → the user       | Does a sentence name something it cannot name (an empty list, a source it did not use)? Is a fallen value ever shown in the colour of a gain? Is prose rendering in a language the reader did not choose? |

## Front 9 · Cross-increment coherence (this gate's reason to exist)

| #   | Check                                                                                                                                                                                     |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| X1  | **One fact, one derivation** ⚙ — search for the same total computed in two places. Where a second derivation is deliberate, a test must assert the two AGREE.                             |
| X2  | **One concept, one name** — two vocabularies for one product noun, in code or in copy.                                                                                                    |
| X3  | **One definition of a process** — competing checklists, protocols or registries for the same activity. (This gate exists because there were two.)                                         |
| X4  | **Names that still describe contents** — files, modules and exports whose scope grew past their name.                                                                                     |
| X5  | **No number republished without re-measurement** ⚙ — sweep the documents the batch updated for counts and figures carried forward.                                                        |
| X6  | **Guard filters are part of the threat model** — for every guard relied on, state what its filter EXCLUDES, and sabotage that excluded class. Whatever a filter drops can never be found. |
| X7  | **Three-state truth kept distinct** — `IMPLEMENTED ON BRANCH` / `MERGED TO MAIN` / `DEPLOYED·LIVE` are never collapsed, in any document.                                                  |

## Return block

```text
BATCH                  = <increments covered>
INCREMENT_RECORDS      = <one per increment, all passing>
FRONT_1_PRINCIPLES     = <per-principle verdicts>
FRONT_2_AUTHORITIES    = CLO=… BRAND=… UX=… VOICE=… STORY=…   (never averaged)
FRONT_3_GATES          = <pasted>
FRONT_4_COMPLETENESS   = <n/n, source + ref>
FRONT_5_DEAD_CODE      = <knip + per-export>
FRONT_6_MATH           = <per-formula; identities sabotage-proven>
FRONT_7_DATA_READINESS = today=… swap-ready=… real-time=…
FRONT_8_LIFECYCLE      = collection=… validation=… storage=… transformation=… presentation=… seams=…
FRONT_9_COHERENCE      = <X1–X7>
COVERAGE_BOUNDARY      = <what a next pass would add>
FIXED / REGISTERED     = <ids + owners + blocking status>
NOT_CHECKED            = <...>
```
