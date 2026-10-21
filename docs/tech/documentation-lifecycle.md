# Documentation Lifecycle & Authority Hygiene

> **Status:** LIVING AUTHORITY. Founder ruling, 2026-09-25 (`5.458` / `5.459`).
> This is the durable home for how diBoaS documentation is created, promoted, compacted and
> retired — and for what `CLAUDE.md` is allowed to be. It replaces the retention rules that
> were previously stated inline in `CLAUDE.md`.

---

## 1 · The two invariants

```text
NO DURABLE RULE MAY EXIST ONLY IN A DISPOSABLE AUDIT ARTIFACT
NO HISTORICAL AUDIT ARTIFACT BECOMES CURRENT AUTHORITY BY EXISTENCE
```

An audit record is **evidence that work or a decision happened**. A living authority is
**where the durable rule lives afterwards**. A document does not become authority merely by
being the first place a ruling appeared.

⚑ **This was not abstract.** `5.458` measured **870** concrete file references across **212**
documents and found **114 distinct missing targets** — including the Legal covenant register
that `CLAUDE.md` instructed every session to _"consult before writing any compliance copy or
claim"_. The rules survived; the documents did not.

---

## 2 · `CLAUDE.md` is session bootstrap, and nothing else

```text
CLAUDE.md  = SESSION BOOTSTRAP

CLAUDE.md ≠ canon archive      ≠ audit history
          ≠ decision log       ≠ document index
          ≠ sensitive project knowledge store
```

Its only job: **give a new session enough current operational context to begin correctly and
to know how to resolve authority.**

**It may contain:** repository identity · stack and layout · commands · the current execution
phase in one line · a small set of universal invariants · the authority-resolution method ·
execution/review discipline · true STOP conditions · the current Git operating rule.

**It must not accumulate:** historical audit narrative · per-lane implementation history ·
dated document paths · old plans · copied domain canon · sensitive Legal, commercial or
provider reasoning · obsolete references · temporary findings · anything whose natural owner
is a living domain or governance document.

```text
CLAUDE.md = LEAST-SENSITIVE NECESSARY BOOTSTRAP CONTEXT
```

⚑ **Do not fix an archive by replacing one long list of document paths with another.** Teach
the session _how to resolve authority_ (§4), do not hard-code a path registry.

---

## 3 · The lifecycle

```text
ACTIVE       full plan · increment records · sabotage evidence · manual fronts · measurements
                ↓
CLOSURE      the final system review determines the durable outcomes
                ↓
PROMOTION    each durable outcome moves to its living owner (§3.1)
                ↓
COMPACTION   the large execution artifact is compacted or deleted
                ↓
HISTORY      an optional short receipt — carrying NO load-bearing current authority
```

### 3.1 · Promotion targets — where a durable outcome actually belongs

| Outcome                                                          | Living owner                                                                      |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| A new or changed engineering gate                                | `docs/tech/engineering-gates.md` (+ its gate index)                               |
| A locked-in implementation decision / do-not-regress rule        | `docs/tech/implementation-notes.md`                                               |
| An architectural decision                                        | `docs/tech/architecture-decisions.md` (ADR)                                       |
| An operational invariant                                         | the matching living operational doc (`MONITORING_OPS`, `INFRASTRUCTURE_GUIDE`, …) |
| An open follow-up                                                | `docs/audit/PENDING_ALL.md` (+ its status index)                                  |
| A domain ruling (Product / Legal / Brand / Growth / M&E / Token) | the domain's own living document, as a dated status banner                        |
| An ID namespace                                                  | `docs/sandbox-app/REGISTER_INDEX.md`                                              |
| A historical milestone worth keeping                             | `docs/audit/AUDIT_HISTORY.md`                                                     |

⚑ **A domain ruling is promoted into the document it GOVERNS, not into a register of
rulings.** This is how `F-R1`…`F-R13` survived the loss of the register they were recorded in:
each one had already been written into `FEES.md`, `INTRO.md`, `BRAND_POSITIONING.md`,
`USER_JOURNEYS`, or the live queue, as a status banner at the point of use.

### 3.2 · Closure is what authorises compaction

A lane's execution records stay **full and detailed while the lane is active**. Compaction is
permitted only after the lane's final system review has determined its durable outcomes and
those outcomes have been promoted. **Deletion of any document remains FOUNDER-ONLY.**

---

## 4 · Resolving current authority — the procedure, not a path list

A session establishes authority by running this, in order:

```text
1 · WHAT IS THE CURRENT WORK?
      docs/audit/PENDING_ALL.md  → the live register + its machine-readable status index
      (a status index entry is the claim's status; prose elsewhere is not)

2 · WHAT IS THE AUTHORITY FOR IT?
      pnpm review:auth                → AUTH-1 · the corpus is reachable and citable
      `docs/full-view/canon/README.md` (local-only) → READ THE INDEX FIRST. It lists the current
                                        authority set, its precedence, and what is
                                        explicitly NOT authority (drafts, history).
      then search `docs/full-view/canon/` — THE WHOLE ROOT, not extracted/ alone.

      ⚑ A NEWER TARGETED RULING OVERRIDES AN OLDER BASELINE INSIDE extracted/.
        `extracted/` is the 2026-09-07 snapshot. Targeted reconciliations issued
        AFTER it sit directly under canon/ and are the controlling authority on
        their subject. Searching extracted/ alone is how a superseded 2026-08-29
        M&E ruling governed a Pre-I2 decision (5.461). Guarded by DOC-2.

      ⚑ AUTHORITY IS NOT "EVERY FILE UNDER canon/". Class comes from each
        document's own declared **Status:** — an outbound draft (READY TO SEND)
        is not a ruling, and history/ is audit history.

3 · WHAT ENFORCES IT?
      docs/tech/engineering-gates.md → the gate registry + its status index

4 · WHICH ID REGISTER IS THIS?
      docs/sandbox-app/REGISTER_INDEX.md → "a register not in this table does not exist"

5 · DISTINGUISH
      living authority   = governs current work
      historical evidence = records that work happened

6 · IF AUTHORITY IS MISSING OR CONTRADICTORY → STOP AND REPORT.
      A missing document is NOT permission to infer the rule.
```

⚑ **These four indexes are the mechanism.** They already existed; this section names them so
no session has to rediscover them, and so `CLAUDE.md` does not have to carry them.

---

## 5 · Reference hygiene

A reference presented as **authority** — _"consult it"_, _"read first"_, _"the reference"_,
_"governs"_ — is a promise that the target is readable. Guarded by **`DOC-1`**
(`docs/tech/engineering-gates.md`) in two layers: `pnpm review:doc1` judges the committed
references and gives the same verdict in every clone (a private reference is classified by git's
ignore policy, never by the local disk); `pnpm review:doc1-local` checks private references only
where their area exists on the machine running it, and is a SKIP where none does.

When a target is gone, classify it before acting:

```text
A · ALREADY PROMOTED   the durable substance is in living authority
                       → remove the stale dependency · do NOT restore the document

B · SUPERSEDED         the material no longer governs current work
                       → remove the stale dependency · keep provenance only if useful

C · UNIQUE AUTHORITY   a still-current ruling with no surviving living home
       NOT PROMOTED    → recover ONLY that ruling · reconcile against canon
                       → promote it · record provenance · drop the historical dependency
```

⚑ **A missing file is not a missing rule, and a similarly named surviving file is not a
successor.** Both were live risks in `5.458`: every `F-R` ruling turned out to be Class A, while
`ADELAIDE_MARKET_PMF_EXERCISE` is the _market lane's_ document and mapping it onto the missing
`PRODUCT_PMF_EXERCISE` would have been a false repair. **Never silently map a near-namesake.**

⚑ **Annotate, never silently delete.** An unreachable citation is marked
`⚠ NOT REACHABLE` so it cannot read as _"no authority exists"_ — the `AUTH-1` rule.

---

## 6 · Pre-I2 compaction policy (defined now, executed at closure)

The Pre-I2 lane is **ACTIVE**. Its records are **not** compacted by this pass.

```text
DURING       A · B · C · D · E · F · G records + system review + closure record stay FULL

AT CLOSURE   1 · the final system review names every durable outcome
             2 · gates        → engineering-gates.md (+ index)
                 rules        → implementation-notes.md
                 decisions    → architecture-decisions.md
                 open items   → PENDING_ALL.md (+ status index)
                 milestone    → AUDIT_HISTORY.md (one short paragraph)
             3 · statuses reconciled — register index and gate index agree with their rows
             4 · every reference INTO the records from living docs is removed or annotated
             5 · the large per-block records become eligible for compaction or deletion
                 — FOUNDER-ONLY, and only after 1–4

NEVER        a per-block record is cited as current authority after closure
```

---

## 7 · Sensitivity

Bootstrap context is read by every session, including ones doing unrelated work. Commercial
reasoning, provider and contractual reasoning, Legal risk-acceptance detail, internal business
assumptions and historical decision trails do **not** belong there.

**Move them to their controlled living home — do not delete durable authority because it is
sensitive.** The goal is separation of responsibility, not information loss.
