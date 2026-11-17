/**
 * The root `engines.node` accepts no Node version a direct dependency refuses (fifteenth audit,
 * C-7). `^22.22.2 || >=24.15.0` admitted Node 25, which vitest 5, jsdom 31 and tsup 9 all
 * exclude (`… || ^24.x || >=26.0.0`). Each direct dependency's own range is read from the
 * lockfile. The range parser knows only the forms in use and fails closed on anything else.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const yaml = require('js-yaml') as { load: (text: string) => unknown };
const REPO = resolve(__dirname, '../../../../..');

type Version = [number, number, number];
const cmp = (a: Version, b: Version) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

/** A range as a predicate: `^x.y.z`, `^x`, `x.x`, `>=x[.y[.z]]`, joined by `||`. */
export function parseRange(range: string): (v: Version) => boolean {
  const parts = range.split('||').map((c) => c.trim());
  const tests = parts.map((c) => {
    let m: RegExpExecArray | null;
    if ((m = /^\^(\d+)\.(\d+)\.(\d+)$/.exec(c))) {
      const min: Version = [+m[1], +m[2], +m[3]];
      return (v: Version) => v[0] === min[0] && cmp(v, min) >= 0;
    }
    if ((m = /^(?:\^(\d+)|(\d+)\.x)$/.exec(c))) {
      const major = +(m[1] ?? m[2]);
      return (v: Version) => v[0] === major;
    }
    if ((m = /^>=\s*(\d+)(?:\.(\d+))?(?:\.(\d+))?$/.exec(c))) {
      const min: Version = [+m[1], +(m[2] ?? 0), +(m[3] ?? 0)];
      return (v: Version) => cmp(v, min) >= 0;
    }
    throw new Error(`engines range not understood: "${c}" (extend parseRange)`);
  });
  return (v) => tests.some((t) => t(v));
}

const PROBES: Version[] = [
  [22, 22, 2],
  [22, 30, 0],
  [24, 15, 0],
  [24, 30, 0],
  [25, 0, 0],
  [26, 0, 0],
  [27, 0, 0],
];

interface Lock {
  importers: Record<string, Record<string, Record<string, { version: string }> | undefined>>;
  packages: Record<string, { engines?: { node?: string } }>;
}

describe('the root engines range fits every direct dependency (fifteenth audit C-7)', () => {
  it('should accept only Node versions that every direct dependency accepts', () => {
    const root = JSON.parse(readFileSync(join(REPO, 'package.json'), 'utf8')).engines
      .node as string;
    const accepted = PROBES.filter(parseRange(root));
    expect(accepted.length, 'the root range accepts a supported Node').toBeGreaterThan(0);
    const lock = yaml.load(readFileSync(join(REPO, 'pnpm-lock.yaml'), 'utf8')) as Lock;
    const direct = new Set<string>();
    for (const importer of Object.values(lock.importers))
      for (const field of ['dependencies', 'devDependencies'])
        for (const [name, dep] of Object.entries(importer[field] ?? {}))
          direct.add(`${name}@${String(dep.version).split('(')[0]}`);
    const refused: string[] = [];
    let checked = 0;
    for (const id of direct) {
      const range = lock.packages[id]?.engines?.node;
      if (!range) continue;
      checked += 1;
      const ok = parseRange(range);
      for (const v of accepted) if (!ok(v)) refused.push(`${id} (${range}) refuses ${v.join('.')}`);
    }
    expect(checked, 'direct dependencies with an engines range were read').toBeGreaterThan(5);
    expect(refused).toEqual([]);
  });

  it.each<[string, string, boolean]>([
    ['^22.22.2 || >=24.15.0', '25.0.0', true],
    ['^22.22.2 || ^24.15.0 || >=26.0.0', '25.0.0', false],
    ['^22.12.0 || ^24.0.0 || >=26.0.0', '24.0.0', true],
    ['>=18', '22.0.0', true],
  ])('should read %s as accepting %s: %s', (range, version, expected) => {
    expect(parseRange(range)(version.split('.').map(Number) as Version)).toBe(expected);
  });

  it('should refuse a range form it does not understand', () => {
    expect(() => parseRange('>=18 <21')).toThrow(/not understood/);
  });
});
