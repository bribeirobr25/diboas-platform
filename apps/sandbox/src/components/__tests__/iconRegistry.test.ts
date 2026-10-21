import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ICON_NAMES } from '../LucideIcon';

/**
 * `LucideIcon` resolves an unknown name to `Sprout` rather than throwing, so a
 * missing registration produces a WRONG PICTURE instead of an error — and
 * nothing in type-check, lint, or the unit suite notices. §4.8 shipped the time
 * machine with a sprout where its clock should have been, and only the browser
 * pass caught it.
 *
 * This closes that class: every `name="…"` literal passed to LucideIcon
 * anywhere in the app must exist in the registry.
 */
function tsxFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = join(dir, e.name);
    if (e.isDirectory()) return tsxFiles(full);
    return e.isFile() && full.endsWith('.tsx') ? [full] : [];
  });
}

describe('LucideIcon registry — no silent Sprout fallbacks', () => {
  it('should register every icon name used across the app', () => {
    const root = join(process.cwd(), 'src');
    const used = new Map<string, string>();
    for (const file of tsxFiles(root)) {
      const src = readFileSync(file, 'utf8');
      for (const m of src.matchAll(/<LucideIcon[^>]*\sname="([a-z0-9-]+)"/g)) {
        used.set(m[1], file.replace(root, 'src'));
      }
    }
    expect(used.size).toBeGreaterThan(5); // the scan actually found call sites
    const missing = [...used.entries()].filter(([name]) => !ICON_NAMES.includes(name));
    expect(missing).toEqual([]);
  });
});

/**
 * Lane audit 2026-10-21 (C6): the scan above only sees `name="literal"`. Icons named by a
 * VARIABLE (`{goal.icon}`, `{OPTION_ICON[option]}`, a catalog strategy's icon) were
 * skipped, and the registry's `string` key type does not catch them either, so a new
 * token in data would have rendered as a Sprout. The sources those variables read from
 * are checked here instead.
 */
describe('LucideIcon registry — data-named icons are registered too (C6)', () => {
  it('should register every goal icon and every catalog strategy icon', async () => {
    const { GOAL_ICONS } = await import('@diboas/investing');
    const { STRATEGY_CATALOG } = await import('@diboas/defi');
    const names = [...GOAL_ICONS, ...STRATEGY_CATALOG.map((s) => s.icon)];
    expect(names.length).toBeGreaterThan(5);
    expect(names.filter((n) => !ICON_NAMES.includes(n))).toEqual([]);
  });

  it('should register every value of the in-component icon maps', () => {
    const root = join(process.cwd(), 'src');
    const missing: string[] = [];
    let seen = 0;
    for (const file of tsxFiles(root)) {
      const src = readFileSync(file, 'utf8');
      for (const block of src.matchAll(/const [A-Z_]*ICON[A-Z_]*\b[^=]*=\s*\{([^}]*)\}/g)) {
        for (const v of block[1].matchAll(/:\s*'([a-z0-9-]+)'/g)) {
          seen += 1;
          if (!ICON_NAMES.includes(v[1])) missing.push(`${v[1]} (${file.replace(root, 'src')})`);
        }
      }
    }
    expect(seen).toBeGreaterThan(3); // the scan actually found the maps
    expect(missing).toEqual([]);
  });
});
