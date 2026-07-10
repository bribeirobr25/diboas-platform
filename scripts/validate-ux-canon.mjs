#!/usr/bin/env node
/**
 * validate-ux-canon.mjs — drift guard for the UX governance layer
 * (CC-3, docs/audit/UX_GOVERNANCE_FIX_PLAN_2026-07-10.md).
 *
 * Checks:
 *  (a) canon ID sequence UX-01…UX-NN is contiguous — no duplicates, no gaps —
 *      and matches the canon's own "<N> numbered principles" self-description;
 *  (b) every UX-ID cited in the checklist, the Writing System, the usage
 *      protocol, and any docs/audit/UX_AUDIT_*.md exists in the canon;
 *  (c) veto-list parity — the checklist's dark-pattern block (rows 10–N) and
 *      canon Appendix B carry the same number of items, and all three homes
 *      (checklist, canon Appendix B, BRAND_POSITIONING Gate 4) carry the
 *      canonical-source declaration;
 *  (d) governance cross-references to docs/**.md resolve on disk (lines that
 *      annotate a reference as removed/lost/deleted are exempt — that is the
 *      documented-dead form required by G-2);
 *  (e) the "How to use it" blocking-range sentence names exactly the last veto
 *      row (kills the C-1 off-by-one defect class permanently).
 *
 * G-1 history: originally declined (2026-07-10 AM, files untracked, validator
 * local-only), then REVISITED AND ACCEPTED via relocation (same day, PM): the
 * three enforcement files moved to docs/tech/ux-governance/ (tracked), so this
 * validator now runs for real in CI and fresh clones. Two consequences:
 *  - the absent-files skip below is a safety net, no longer the expected CI path;
 *  - check (d) must NOT fail on references pointing INTO still-untracked doc
 *    areas (docs/audit/, docs/full-view/, …) when that area is absent from the
 *    clone — the reference is fine, the area is just local-only. A missing file
 *    inside a PRESENT area is still a failure (local typo).
 */

// V-1 (verification audit 2026-07-10): readdirSync, not fs.globSync — globSync is absent
// on Node 20.0–20.16/21.x and a named core-module import crashes at load, before the G-1
// skip runs. Engines was bumped to >=22 the same day, but readdirSync stays: it's simpler
// and immune to the whole runs-only-where-authored defect class.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.env.UXCANON_ROOT
  ? resolve(process.env.UXCANON_ROOT)
  : resolve(dirname(fileURLToPath(import.meta.url)), '..');

const FILES = {
  canon: join(ROOT, 'docs/tech/ux-governance/UX_PRINCIPLES_CANON.md'),
  checklist: join(ROOT, 'docs/tech/ux-governance/anti-slop-checklist.md'),
  brand: join(ROOT, 'docs/full-view/BRAND_POSITIONING.md'),
  usage: join(ROOT, 'docs/tech/ux-governance/UX_GOVERNANCE_USAGE.md'),
};

// ---- safety skip (should not trigger since the G-1 relocation made these tracked) ----
if (!existsSync(FILES.canon) || !existsSync(FILES.checklist)) {
  console.log(
    'validate:ux-canon SKIPPED — governance files not on disk (unexpected since the 2026-07-10 G-1 relocation tracked them; check the checkout).'
  );
  process.exit(0);
}

const read = (p) => readFileSync(p, 'utf8');
const canon = read(FILES.canon);
const checklist = read(FILES.checklist);
const brand = existsSync(FILES.brand) ? read(FILES.brand) : '';
const usage = existsSync(FILES.usage) ? read(FILES.usage) : '';

let auditFiles = [];
const auditDir = join(ROOT, 'docs/audit');
if (existsSync(auditDir)) {
  auditFiles = readdirSync(auditDir)
    .filter((f) => f.startsWith('UX_AUDIT_') && f.endsWith('.md'))
    .map((f) => join(auditDir, f));
}

const errors = [];
const fail = (check, msg) => errors.push(`(${check}) ${msg}`);

// ---- (a) canon ID sequence ----
const defined = [...canon.matchAll(/^\*\*UX-(\d{2})\s*·/gm)].map((m) => Number(m[1]));
const maxId = Math.max(...defined);
{
  const seen = new Set();
  const dups = defined.filter((n) => (seen.has(n) ? true : (seen.add(n), false)));
  if (dups.length) fail('a', `duplicate canon IDs: ${dups.map((n) => `UX-${n}`).join(', ')}`);
  const gaps = [];
  for (let i = 1; i <= maxId; i++) if (!seen.has(i)) gaps.push(i);
  if (gaps.length)
    fail(
      'a',
      `gaps in canon ID sequence: ${gaps.map((n) => `UX-${String(n).padStart(2, '0')}`).join(', ')}`
    );
  const selfDesc = canon.match(/\*\*(\d+)\*\*\s+numbered principles|(\d+)\s+numbered principles/);
  if (selfDesc) {
    const claimed = Number(selfDesc[1] ?? selfDesc[2]);
    if (claimed !== defined.length)
      fail(
        'a',
        `canon self-description says ${claimed} principles but ${defined.length} are defined`
      );
  }
}

// ---- (b) every cited UX-ID exists ----
{
  const definedSet = new Set(defined);
  const sources = [
    ['checklist', checklist],
    ['BRAND_POSITIONING', brand],
    ['UX_GOVERNANCE_USAGE', usage],
    ...auditFiles.map((f) => [f.replace(ROOT + '/', ''), read(f)]),
  ];
  for (const [name, text] of sources) {
    const cited = new Set([...text.matchAll(/UX-(\d{2})/g)].map((m) => Number(m[1])));
    for (const id of cited)
      if (!definedSet.has(id))
        fail(
          'b',
          `${name} cites UX-${String(id).padStart(2, '0')} which does not exist in the canon`
        );
  }
}

// ---- (c) veto-list parity + canonical declarations ----
let lastVetoRow = null;
{
  // checklist dark rows: numbered items between the Gate 4 header and the next bold block header
  const darkBlock = checklist.match(
    /\*\*Dark patterns \(Gate 4\)[\s\S]*?(?=\n\*\*[A-Z]|## Part 4)/
  );
  if (!darkBlock) fail('c', 'checklist: dark-pattern block header not found');
  const rows = darkBlock ? [...darkBlock[0].matchAll(/^(\d+)\.\s/gm)].map((m) => Number(m[1])) : [];
  if (rows.length) {
    if (rows[0] !== 10) fail('c', `checklist veto rows start at ${rows[0]}, expected 10`);
    for (let i = 1; i < rows.length; i++)
      if (rows[i] !== rows[i - 1] + 1)
        fail('c', `checklist veto rows not contiguous at row ${rows[i]}`);
    lastVetoRow = rows[rows.length - 1];
  } else fail('c', 'checklist: no numbered veto rows found in the dark-pattern block');

  // canon Appendix B items
  const appB = canon.match(/# Appendix B[\s\S]*?(?=\n# Appendix|$)/);
  const appBItems = appB ? [...appB[0].matchAll(/^\d+\.\s/gm)].length : 0;
  if (rows.length && appBItems !== rows.length)
    fail(
      'c',
      `veto-list drift: checklist has ${rows.length} veto rows but canon Appendix B has ${appBItems} items`
    );

  // canonical-source declarations in all three homes
  if (!/canonical veto list/i.test(checklist))
    fail('c', 'checklist: missing "canonical veto list" declaration');
  if (appB && !/Canonical enforcement list.*Part 3 rows 10/i.test(appB[0]))
    fail(
      'c',
      'canon Appendix B: missing canonical-source declaration pointing at checklist Part 3'
    );
  if (brand && !/canonical veto list/i.test(brand))
    fail('c', 'BRAND_POSITIONING Gate 4: missing canonical-source declaration');
}

// ---- (d) dead-link check across governance files ----
{
  const sources = [
    ['checklist', FILES.checklist, checklist],
    ['canon', FILES.canon, canon],
    ['usage', FILES.usage, usage],
    ...auditFiles.map((f) => [f.replace(ROOT + '/', ''), f, read(f)]),
  ];
  const DEAD_OK =
    /removed|lost|deleted|does not exist|destinations do not exist|no longer exists|file removed/i;
  // G-1 relocation (2026-07-10): governance files are tracked, so this check now
  // runs in CI/fresh clones — but references INTO untracked doc areas (docs/audit/,
  // docs/full-view/, …) are only checkable where those areas exist locally. Missing
  // file in a PRESENT directory = real break; missing directory = local-only area.
  for (const [name, , text] of sources) {
    if (!text) continue;
    for (const line of text.split('\n')) {
      if (DEAD_OK.test(line)) continue; // documented-dead form (G-2 annotation standard)
      for (const m of line.matchAll(/`?(docs\/[\w\-./]+\.md)`?/g)) {
        if (existsSync(join(ROOT, m[1]))) continue;
        const parentPresent = existsSync(join(ROOT, dirname(m[1])));
        if (parentPresent) fail('d', `${name}: broken reference ${m[1]}`);
      }
    }
  }
}

// ---- (e) blocking-range sentence matches the last veto row ----
{
  const m = checklist.match(/FAIL on rows 10[–-](\d+) blocks/);
  if (!m) fail('e', 'checklist: blocking-range sentence ("a FAIL on rows 10–NN blocks") not found');
  else if (lastVetoRow !== null && Number(m[1]) !== lastVetoRow)
    fail(
      'e',
      `blocking-range sentence says rows 10–${m[1]} but the last veto row is ${lastVetoRow}`
    );
  const header = checklist.match(/Rows 10[–-](\d+) are THE canonical veto list/);
  if (header && lastVetoRow !== null && Number(header[1]) !== lastVetoRow)
    fail(
      'e',
      `dark-block header says rows 10–${header[1]} but the last veto row is ${lastVetoRow}`
    );
}

// ---- (f) rows-range references match the checklist's actual last Part-3 row ----
// Guards the "rows 1–NN" band citations across the four homes (checklist, usage,
// design-reviewer agent, CLAUDE.md) — the synchronized-edit risk the 2026-07-10
// verification audit flagged when declining to add row 21 mid-audit.
let lastRow = null;
{
  const part3 = checklist.match(/## Part 3[\s\S]*?(?=\n## Part 4)/);
  const rowNums = part3 ? [...part3[0].matchAll(/^(\d+)\.\s/gm)].map((m) => Number(m[1])) : [];
  if (!rowNums.length) fail('f', 'checklist: no numbered rows found in Part 3');
  else {
    lastRow = Math.max(...rowNums);
    for (let i = 1; i <= lastRow; i++)
      if (!rowNums.includes(i))
        fail('f', `checklist Part 3: row ${i} missing from the 1–${lastRow} sequence`);
    const bandSources = [
      ['checklist', checklist],
      ['usage', usage],
      ['design-reviewer', join(ROOT, '.claude/agents/design-reviewer.md')],
      ['CLAUDE.md', join(ROOT, 'CLAUDE.md')],
    ].map(([name, v]) =>
      typeof v === 'string' && v.includes('\n')
        ? [name, v]
        : [name, existsSync(v) ? readFileSync(v, 'utf8') : '']
    );
    for (const [name, text] of bandSources) {
      if (!text) continue; // absent in fixtures / fresh clones
      // "Rows 1–9 and 18–NN" is the two-band friction form, not a full-range citation
      for (const m of text.matchAll(/rows 1[–-](\d+)(?!\s+and\s+18[–-])/gi))
        if (Number(m[1]) !== lastRow)
          fail(
            'f',
            `${name}: cites "rows 1–${m[1]}" but the checklist's last Part-3 row is ${lastRow}`
          );
      for (const m of text.matchAll(/18[–-](\d+)(?=\s*(?:are friction|should PASS|\(friction\)))/g))
        if (Number(m[1]) !== lastRow)
          fail(
            'f',
            `${name}: cites friction band "18–${m[1]}" but the checklist's last Part-3 row is ${lastRow}`
          );
    }
  }
}

// ---- report ----
if (errors.length) {
  console.error(`validate:ux-canon FAILED — ${errors.length} defect(s):`);
  errors.forEach((e) => console.error('  ✗ ' + e));
  process.exit(1);
}
console.log(
  `✓ validate:ux-canon OK — ${defined.length} canon IDs contiguous; all citations resolve; veto list in parity (rows 10–${lastVetoRow}); no broken governance references; blocking range consistent; rows-range citations match Part 3's ${lastRow} rows.`
);
