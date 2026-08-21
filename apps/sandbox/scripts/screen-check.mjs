#!/usr/bin/env node
/**
 * Screen Build Protocol — the executable spine.
 *
 * WHY THIS EXISTS: a build checklist written as prose gets skipped. This script
 * makes the mechanical half runnable in one command, and PRINTS the human half
 * every run so the non-automatable steps (mockup fidelity, dev-log read, the
 * visual matrix, the gates) are never silently forgotten. Run it for every
 * screen you build or change, before you commit.
 *
 *   pnpm --filter sandbox screen-check [ScreenName]
 *
 * The mechanical steps are fail-fast: a red here blocks the commit. The manual
 * checklist below them is YOURS to complete and cite in the commit body — same
 * discipline as the repo's PR self-checks. Fidelity, taste, and honesty are not
 * automatable; this script's job is to make sure you never reach them by
 * accident, having skipped the deterministic gates on the way.
 */
import { execSync } from 'node:child_process';

const screen = process.argv[2] ?? '(screen)';
const C = { g: '\x1b[32m', r: '\x1b[31m', y: '\x1b[33m', b: '\x1b[1m', d: '\x1b[2m', x: '\x1b[0m' };

// The deterministic battery, in order. Each runs from the repo root.
const STEPS = [
  // WORKSPACE-WIDE, not `--filter sandbox` (widened 2026-08-21 after this gate
  // missed a real break). Screen increments routinely touch packages/banking |
  // defi | investing, and a sandbox-only tsc cannot see them: §4.8 landed
  // `segs.at(-1)` in a banking test — ES2022 against that package's ES2020
  // target — and the root type-check stayed red for a day while every
  // screen-check reported PASS. A gate scoped narrower than the work it guards
  // reports green for the wrong reason.
  ['type-check (all workspaces)', 'pnpm -w type-check'],
  ['lint (errors block; warnings ok)', 'pnpm --filter sandbox lint'],
  ['test (sandbox + the packages it rides on)', 'pnpm --filter sandbox test'],
  [
    'test (banking · defi · investing)',
    'pnpm --filter @diboas/banking --filter @diboas/defi --filter @diboas/investing test',
  ],
  ['build', 'pnpm --filter sandbox build'],
  ['dead-code (knip)', 'pnpm -w check:dead-code'],
  ['prettier (sandbox src)', 'pnpm exec prettier --check "src/**/*.{ts,tsx,css,json}"'],
];

console.log(
  `\n${C.b}Screen Build Protocol — ${screen}${C.x}\n${C.d}Mechanical battery (fail-fast):${C.x}`
);

const failures = [];
for (const [label, cmd] of STEPS) {
  process.stdout.write(`  ${label} … `);
  try {
    execSync(cmd, { stdio: 'pipe' });
    console.log(`${C.g}PASS${C.x}`);
  } catch (err) {
    console.log(`${C.r}FAIL${C.x}`);
    failures.push({
      label,
      cmd,
      out: (err.stdout?.toString() ?? '') + (err.stderr?.toString() ?? ''),
    });
  }
}

if (failures.length) {
  console.log(
    `\n${C.r}${C.b}✗ ${failures.length} mechanical step(s) failed — fix before committing.${C.x}`
  );
  for (const f of failures) {
    console.log(
      `\n${C.r}── ${f.label}${C.x}\n${C.d}$ ${f.cmd}${C.x}\n${f.out.trim().split('\n').slice(-25).join('\n')}`
    );
  }
  process.exit(1);
}

console.log(`\n${C.g}${C.b}✓ Mechanical battery green.${C.x}\n`);

// ── The human half — NOT automatable. Complete these and cite them in the commit.
console.log(`${C.y}${C.b}MANUAL CHECKLIST — complete before commit, cite results in the commit body:${C.x}
${C.b}1. Source-of-truth split${C.x}
   • Mockup PNG rules DESIGN/LAYOUT/COLOR. Sample its pixels (don't eyeball);
     use the REAL assets (wordmark, hero images), never faked/approximated.
   • This session's docs rule COPY/RULES/BEHAVIOR. Verify each against its own
     source at the right ref — never a claim that travelled.

${C.b}2. Wired, not a preview${C.x}
   • Real navigation, state, and ruled behavior. Only external boundaries
     (auth / DB / market APIs) are deferred, behind their seam.

${C.b}3. Dev-mode + SERVER LOG (dev-only warnings never show in next start / curl)${C.x}
   • Boot: DEV_ALLOWED_ORIGINS + SANDBOX_ACCESS_PASSWORD, next dev -H 0.0.0.0 -p 3002.
   • Load each screen in a JS browser (Docker MCP over the LAN IP) and READ the
     server log for hydrat / mismatch / error / warn. curl does NOT hydrate.

${C.b}4. Visual matrix — section by section (a full-page glance hides spacing bugs)${C.x}
   • light + dark  ×  mobile 390 + desktop 1440  ×  EN + DE.
   • Check: overflow, control crowding, spacing rhythm, tap targets, console 0/0.
   • Compare each section against the mockup PNG side by side.

${C.b}5. Gates${C.x}
   • CLO: no fee/yield/GENIUS-adjacent drift; play-money framing where ruled.
   • Brand/anti-slop: tokens only, real assets, no #000/#FFF, no emoji-as-icon.
   • UX Governance Part-3 veto rows; Voice Q3 (never sell / promise / advise).
   • a11y: AA contrast, focus-visible, no heading skips, ≥44px targets.

${C.b}6. Do-not-regress${C.x}
   • The 3 sandbox covenants + the matching docs/tech/implementation-notes entry.

${C.d}Fidelity, taste, and honesty are not automatable. This gate only guarantees
you didn't reach them having skipped the deterministic steps.${C.x}\n`);
