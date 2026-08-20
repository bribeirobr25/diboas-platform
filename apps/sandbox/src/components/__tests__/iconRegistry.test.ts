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
