import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The guard that keeps `VIEW-2`'s pass-in exception honest.
 *
 * `eslint.config.mjs` permits four domain money helpers to be IMPORTED by a
 * component — `splitEntry`, `allocateByRule`, `previewGoalStop`,
 * `previewPositionStop` — because each is handed to a selector so the domain
 * function keeps one owner while the arithmetic leaves the component. The
 * alternative (the selector importing them itself) is closed by `VIEW-1`, which
 * bans `@/lib/ledger*` inside `view/**`.
 *
 * An exception is only safe while it stays an exception. Nothing in ESLint can
 * tell "passed as a value" from "called here", so this test does: in
 * `components/**`, each permitted name may appear as an identifier, but never
 * as a direct invocation `name(`.
 *
 * Without this, the allow-list would be the escape hatch that hollows out the
 * rule it sits inside — which is the failure mode this project has already paid
 * for twice (`TOK-1`'s attribute check, the untranslated ratchet's `length > 3`).
 */
const PASS_IN_ONLY = [
  'splitEntry',
  'allocateByRule',
  'previewGoalStop',
  'previewPositionStop',
] as const;

const COMPONENTS = join(__dirname, '..', '..', 'components');

function componentFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = join(dir, e.name);
    if (e.isDirectory()) return e.name === '__tests__' ? [] : componentFiles(full);
    return e.name.endsWith('.tsx') && !e.name.endsWith('.stories.tsx') ? [full] : [];
  });
}

/** Strip comments so a name quoted in prose is never mistaken for a call. */
function code(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

describe('VIEW-2 pass-in exception — the four permitted helpers are passed, never called', () => {
  const files = componentFiles(COMPONENTS);

  it('should find component files to check, so this test can never be vacuous', () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it.each(PASS_IN_ONLY)('should never invoke %s directly in a component', (name) => {
    const offenders: string[] = [];
    for (const file of files) {
      const src = code(readFileSync(file, 'utf8'));
      /**
       * ⚑ ALIAS RESOLUTION ADDED 2026-09-14 (AUD-D02). The guard searched only
       * for the DECLARED name, so `import { splitEntry as calc }` followed by
       * `calc(100, 1)` left it 6/6 green — the auditor falsified its central
       * claim by execution, and I reproduced that before fixing it. Any local
       * binding the name is imported under is now a call site too.
       */
      /* Widened deliberately: `name` is the narrow four-name union, so an
         inferred Set would reject every alias `.add()` below. */
      const localNames = new Set<string>([name]);
      const importRe = new RegExp(String.raw`import\s*\{([^}]*)\}\s*from\s*['"][^'"]+['"]`, 'g');
      for (const m of src.matchAll(importRe)) {
        for (const spec of m[1].split(',')) {
          const parts = spec.trim().split(/\s+as\s+/);
          if (parts[0].trim() === name && parts[1]) localNames.add(parts[1].trim());
        }
      }
      const called = [...localNames].filter((n) =>
        new RegExp(String.raw`(?<![.\w])${n}\s*\(`).test(src)
      );
      if (called.length > 0)
        offenders.push(
          `${file.replace(/.*\/components\//, 'components/')} (as ${called.join(', ')})`
        );
    }
    expect(offenders).toEqual([]);
  });

  it('should confirm each permitted name IS actually passed to a select* call somewhere', () => {
    // The mirror of the check above: if a name is no longer passed anywhere, the
    // exception for it is stale and must be removed from the ESLint config. A
    // stale allow-list entry hides the next defect.
    const all = files.map((f) => code(readFileSync(f, 'utf8'))).join('\n');
    const unused = PASS_IN_ONLY.filter((name) => !new RegExp(String.raw`\b${name}\b`).test(all));
    expect(unused).toEqual([]);
  });
});
