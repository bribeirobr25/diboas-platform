# Increment Review Gate — one change, done and not harmful

> **What this is:** the mandatory review checklist for a SINGLE increment — a feature slice, a bug
> fix, a refactor — run before the increment is called done and before its commit is offered for
> merge. Its job is narrow and specific: **did this change do what its plan said, and did it break
> or misstate nothing?**
>
> **What this is not:** a system audit. Cross-increment coherence, the 12 principles end-to-end, and
> the data lifecycle belong to `system-review-gate.md`, which runs over a BATCH. An increment can
> pass this gate perfectly while the system drifts — that is the other gate's whole purpose.
>
> **Enforcement status:** MANDATORY REVIEW CHECKLIST (registered in `engineering-gates.md`). Part A
> is mechanical and executable; Parts B–F are review-time and are cited, not inferred. Rows marked
> **⚙** are mechanisable and should be scripted rather than judged.
>
> **Supersedes** the 2026-07-10 seven-step "review/audit" protocol, together with
> `system-review-gate.md`. There is no third definition.

## Trigger

Any one of: an increment declared complete · a bug fix before commit · a refactor before commit · a
branch offered for merge. One increment, one record.

## How to answer

- Verdict vocabulary per row: **PASS · FAIL · N/A**.
- **`N/A` requires proof, not assertion.** State the measurement that makes the row inapplicable
  ("the diff contains no effect, timer or listener line — `git diff | grep -E 'useEffect|setTimeout|addEventListener'`
  is empty"). An unproven N/A is a FAIL.
- **Every PASS names its instrument and pastes the measurement.** A row that says PASS with no
  evidence is the failure mode this gate exists to prevent: a one-sentence row reads as a completed
  step.
- Finish with the two lists that make the record honest: **what you did not check**, and **what you
  fixed versus what you registered**.

## Part A · Mechanical — must be green, paste the output ⚙

| #   | Check                                                                                           |
| --- | ----------------------------------------------------------------------------------------------- |
| A1  | Root `type-check` (the whole workspace, not the touched package)                                |
| A2  | Lint — errors block; warnings listed with their reason for existing                             |
| A3  | Every affected test suite                                                                       |
| A4  | Build                                                                                           |
| A5  | Dead-code (`knip`)                                                                              |
| A6  | Repo-wide `format:check` (what CI runs)                                                         |
| A7  | The increment's own domain battery where one exists (e.g. `pnpm --filter sandbox screen-check`) |

**Never verify behind a command that cannot fail.** No `&& echo PASS`, no `| tail` on the evidence
you are about to quote — a pipe that truncates output has hidden a real failure here before. Judge
by exit code and by the full text.

## Part B · Against the plan — completeness

| #   | Check                                                                                                    |
| --- | -------------------------------------------------------------------------------------------------------- |
| B1  | **Name the source document and its ref.** If none exists, say so explicitly — never "if available".      |
| B2  | Enumerate the plan's stated completion conditions **verbatim**, one verdict each. Paraphrase hides gaps. |
| B3  | Anything the plan required that was deliberately not done: stated, with the reason and the owner.        |
| B4  | Return the exact updated test count — and see D4 before quoting any number.                              |

## Part C · Regression, side-effects, and what the change touched

| #   | Check                                                                                                                                                                                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| C1  | **Diff completeness** — every changed file disclosed and accounted for (`git diff --name-only main...HEAD`). A file in the diff that the narrative does not mention is a finding.                                                                            |
| C2  | **Do-not-regress register** — the entries in `implementation-notes.md` that touch this area, plus any covenant-bearing file. Prove absence (a grep over the diff), do not assert it.                                                                         |
| C3  | **Orphaned consumers** ⚙ — grep an identifier before deleting its declaration; then grep again after. Deleting a binding without this has broken eleven tests from one root cause.                                                                           |
| C4  | **Async/effect surface** — if the diff touches an effect, timer, listener or async flow, cite the applicable R-rows from `robustness-checklist.md` (PASS/N-A per row). If it touches none, prove it (C2's shape).                                            |
| C5  | **Reachability** — for anything newly rendered or newly gated, check the MOUNT site and the conditions on the path in. "Renders unconditionally" is not reachable. State unmeasured cases as _unreachable-because-X_ or _not-yet-reached_, never as covered. |

## Part D · Truth of the change

| #   | Check                                                                                                                                                                                                                                    |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | **Assert resolved values, not flags.** A value a user reads is verified as the VALUE (the string, the hex, the ratio) — never via the attribute, flag or selector meant to produce it.                                                   |
| D2  | **A test asserts a REQUIREMENT, never observed output** (`coding-standards.md` § of the same name). Every assertion on a money path or honesty surface cites its requirement.                                                            |
| D3  | **Sabotage-prove every load-bearing test and gate** — break the implementation, confirm the test fails _for the right reason_, revert, and diff the revert. A test that still passes is vacuous.                                         |
| D4  | **Re-measure every number you republish** ⚙ — counts, sizes, percentages, timings. A figure is evidence only where it was measured; carried forward it is decoration. A published count that was never re-measured has been wrong twice. |
| D5  | **Suspect the instrument before the finding.** A grep, a parse or a fetch that returns nothing is a claim about the query until proven otherwise. Confirm absence a second way.                                                          |

## Part E · Visual validation (Docker MCP) — when a rendered value or layout changed

Skip only if nothing a user sees changed, and say so. Otherwise:

| #   | Check                                                                                                                                                                                                    |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E1  | Serve the **built** artefact over the LAN IP (Docker MCP cannot reach `localhost`), and record the build id.                                                                                             |
| E2  | **A/B against the pre-change reading** where the change is meant to preserve behaviour: the same state must render the same values. This is the strongest single piece of evidence a refactor can offer. |
| E3  | Both viewports (mobile ~375–390 and desktop 1440) and both a longest-text locale and English; section by section, because a full-page glance hides spacing defects.                                      |
| E4  | Console: 0 errors, per cell. Read the dev-server log too — dev-only warnings never appear in a production start.                                                                                         |
| E5  | Interactive states clicked through, not just the initial view.                                                                                                                                           |
| E6  | **Honesty rule:** if browser tooling is unavailable, write _"I could not visually verify this — browser tooling is not available."_ Never imply a visual pass that did not happen.                       |

## Part F · Disposition

| #   | Check                                                                                                                                                                                                                                |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| F1  | **Fix what is safe and value-preserving. Register and STOP for anything structural, any user-facing wording, or anything that changes a published number.** Naming the owner is part of the finding.                                 |
| F2  | Every finding registered in `docs/audit/PENDING_ALL.md` with an id claimed correctly ⚙ — re-read the marker AND measure the maximum existing id at write time; the marker is a claim, not evidence. Verify uniqueness after writing. |
| F3  | **What you did not check**, listed. Coverage is unbounded; the boundary is the honest part.                                                                                                                                          |
| F4  | Corrections to your own earlier statements, stated plainly — including withdrawn findings, which are evidence too.                                                                                                                   |

## Return block

```text
INCREMENT            = <name / commit>
STATE                = IMPLEMENTED ON BRANCH | MERGED TO MAIN | DEPLOYED·LIVE   (never collapsed)
PART_A_MECHANICAL    = <green? paste>
PART_B_VS_PLAN       = <n/n conditions, source doc + ref>
PART_C_REGRESSION    = <PASS / FAIL / N-A-with-proof per row>
PART_D_TRUTH         = <sabotage results>
PART_E_VISUAL        = <A/B result, or the honesty sentence>
TEST_COUNT           = <re-measured, not carried>
FIXED                = <...>
REGISTERED           = <ids + owners>
NOT_CHECKED          = <...>
```
