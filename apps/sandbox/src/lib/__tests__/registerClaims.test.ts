/**
 * REG-CLAIMS-1 (register 5.782) · two open docs PRs must never claim the same register id.
 * Drives `scripts/check-register-claims.mjs` through its fixture mode (no network): the
 * checkout under test is DIBOAS_DOCS_DIR, main and the other open PRs are files.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { makeFixtureParent } from '../../test/fixtureParent';

const ROOT = resolve(process.cwd(), '..', '..');
const SCRIPT = join(ROOT, 'scripts/check-register-claims.mjs');
const PARENT = makeFixtureParent('register-claims-');
afterAll(() => PARENT.remove());

const row = (id: string, text = 'a row') => `> **${id}** — ⏳ **OPEN · ${text}**`;
const register = (...ids: string[]) =>
  ['# register', '', ...ids.map((id) => row(id)), '', '**NEXT FREE ID: 5.999**'].join('\n\n');

/** Runs the check with this checkout's register, main's, and the other open PRs' registers. */
function check(self: string, main: string, others: Record<string, string>) {
  const dir = mkdtempSync(join(PARENT.dir, 'case-'));
  mkdirSync(join(dir, 'docs', 'audit'), { recursive: true });
  writeFileSync(join(dir, 'docs', 'audit', 'PENDING_ALL.md'), self);
  writeFileSync(join(dir, 'main.md'), main);
  const args = [SCRIPT, '--main', join(dir, 'main.md')];
  for (const [name, text] of Object.entries(others)) {
    writeFileSync(join(dir, `${name}.md`), text);
    args.push('--other', `${name}=${join(dir, `${name}.md`)}`);
  }
  const r = spawnSync(process.execPath, args, {
    encoding: 'utf8',
    env: { ...process.env, DIBOAS_DOCS_DIR: join(dir, 'docs'), NO_COLOR: '1' },
  });
  return { code: r.status, out: `${r.stdout}${r.stderr}` };
}

const MAIN = register('5.100', '5.101');

describe('REG-CLAIMS-1 · an id claimed by two open docs PRs fails (5.782)', () => {
  it('should FAIL and name the ids when another open PR adds one of the same ids', () => {
    const r = check(register('5.100', '5.101', '5.102', '5.103'), MAIN, {
      market: register('5.100', '5.101', '5.103', '5.104'),
    });
    expect(r.code).toBe(1);
    expect(r.out).toContain('market: 5.103');
    expect(r.out).not.toContain('5.102,');
  });

  // Sixth audit (2026-11-05): the register writes rows three ways; each is a claim.
  it.each([
    ['a title row', '> **5.103 — a title in bold**'],
    ['a table row', '| **5.103** | a table row |'],
  ])('should FAIL when another PR claims the same id as %s', (_kind, otherRow) => {
    const r = check(register('5.100', '5.101', '5.103'), MAIN, {
      market: `${register('5.100', '5.101')}\n\n${otherRow}`,
    });
    expect(r.code).toBe(1);
    expect(r.out).toContain('market: 5.103');
  });

  it('should PASS when the other open PRs add different ids', () => {
    const r = check(register('5.100', '5.101', '5.102'), MAIN, {
      market: register('5.100', '5.101', '5.103'),
      other: register('5.100', '5.101'),
    });
    expect(r.code).toBe(0);
    expect(r.out).toContain('1 id(s) added here');
  });

  it("should PASS when an id is shared only through main's own rows", () => {
    const r = check(register('5.100', '5.101', '5.102'), MAIN, {
      market: register('5.100', '5.101'),
    });
    expect(r.code).toBe(0);
  });

  it('should count only row headers, never an id mentioned in prose or the index', () => {
    const selfWithMention = `${register('5.100', '5.101', '5.102')}\n\nsee 5.103 in the index: 5.103   OPEN`;
    const r = check(selfWithMention, MAIN, { market: register('5.100', '5.101', '5.103') });
    expect(r.code).toBe(0);
  });

  it('should be INCOMPLETE (exit 2), never a pass, when a register cannot be read', () => {
    const dir = mkdtempSync(join(PARENT.dir, 'missing-'));
    mkdirSync(join(dir, 'docs', 'audit'), { recursive: true });
    writeFileSync(join(dir, 'docs', 'audit', 'PENDING_ALL.md'), register('5.100'));
    const r = spawnSync(process.execPath, [SCRIPT, '--main', join(dir, 'absent.md')], {
      encoding: 'utf8',
      env: { ...process.env, DIBOAS_DOCS_DIR: join(dir, 'docs') },
    });
    expect(r.status).toBe(2);
    expect(`${r.stdout}${r.stderr}`).toContain('INCOMPLETE');
    expect(`${r.stdout}${r.stderr}`).not.toContain(dir);
  });
});
