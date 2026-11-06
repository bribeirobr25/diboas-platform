import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * ⚙ CATALOGUE REACHABILITY (register 5.800).
 *
 * A website catalogue key that no code reads passed every gate (type-check, knip,
 * `validate:translations`): the seventh audit put the `strategies.json` blocks platform #824
 * deleted back ×4 and nothing failed. This reads every website source file and marks a key as
 * read when the code names it in any of the ways the app reads text:
 *   - the full id as a string (`'faq.items.risk.answer'`, config key strings);
 *   - a template head or tail (`` `faq.items.${id}.answer` ``);
 *   - the namespace-relative key in code that names the namespace (`t('protocolLabels.tvl')`);
 *   - property access on a loaded catalogue object (`messages.accessibility?.skipToMain`);
 *   - a parent object passed whole (`'landing-b2c.draper.steps'`).
 *
 * It is a RATCHET: the keys unread when it was built are listed in
 * `catalogueReachability.baseline.json`, to be classified and deleted (register 5.808; the
 * `landing-b2b.footer.*` disclosures are Legal's to retire). A key unread and NOT listed fails, and
 * a listed key that is read again, or deleted, fails too, so the list only shrinks.
 */

function repoRoot(): string {
  let dir = __dirname;
  for (let i = 0; i < 10; i += 1) {
    if (existsSync(join(dir, 'packages/i18n/translations'))) return dir;
    dir = dirname(dir);
  }
  throw new Error('Could not locate the repository root');
}
const ROOT = repoRoot();
const CATALOGUE = join(ROOT, 'packages/i18n/translations/en');
const SOURCES = ['apps/web/src', 'packages/ui/src', 'packages/email/src'].map((d) => join(ROOT, d));
const SKIP_DIRS = new Set(['node_modules', '__tests__', '.next']);
const BASELINE: string[] = JSON.parse(
  readFileSync(join(__dirname, 'catalogueReachability.baseline.json'), 'utf8')
);

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    if (SKIP_DIRS.has(e)) continue;
    const full = join(dir, e);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function leafKeys(node: unknown, prefix = '', out: string[] = []): string[] {
  if (Array.isArray(node)) node.forEach((v, i) => leafKeys(v, `${prefix}.${i}`, out));
  else if (node && typeof node === 'object')
    for (const [k, v] of Object.entries(node)) leafKeys(v, prefix ? `${prefix}.${k}` : k, out);
  else out.push(prefix);
  return out;
}

interface Key {
  ns: string;
  key: string;
  id: string;
}

function catalogueKeys(dir: string): Key[] {
  return walk(dir)
    .filter((f) => f.endsWith('.json'))
    .flatMap((f) => {
      const ns = relative(dir, f).replace(/\.json$/, '');
      return leafKeys(JSON.parse(readFileSync(f, 'utf8'))).map((key) => ({
        ns,
        key,
        id: `${ns}.${key}`,
      }));
    });
}

/** What the source names: string literals, template heads and tails, property-access pairs. */
function readEvidence(texts: string[]) {
  const literals = new Set<string>();
  const heads = new Set<string>();
  const tails = new Set<string>();
  const access = new Set<string>();
  for (const t of texts) {
    for (const m of t.matchAll(/['"]([\w./-]+)['"]/g)) literals.add(m[1]);
    for (const m of t.matchAll(/`([\w./-]+)\$\{/g)) heads.add(m[1]);
    for (const m of t.matchAll(/\}(\.[\w.]+)[`$]/g)) tails.add(m[1]);
    // lookahead: chained reads (`a.b?.c`) yield every pair, not every other one
    for (const m of t.matchAll(/\b(\w+)\??\.(?=(\w+)\b)/g)) access.add(`${m[1]}.${m[2]}`);
  }
  const all = texts.join('\n');
  const named = new Map<string, boolean>();
  const namesNamespace = (ns: string) => {
    if (!named.has(ns)) {
      const esc = ns.replace(/[/-]/g, '\\$&');
      named.set(ns, new RegExp(`['"\`]${esc}['".\`/]`).test(all));
    }
    return named.get(ns)!;
  };
  return { literals, heads, tails, access, namesNamespace };
}

function isRead({ ns, key, id }: Key, ev: ReturnType<typeof readEvidence>): boolean {
  if (ev.literals.has(id)) return true;
  for (const h of ev.heads) if (h.length > 2 && id.startsWith(h)) return true;
  for (const x of ev.tails) if (x.length > 4 && id.endsWith(x)) return true;
  if (ev.namesNamespace(ns)) {
    if (ev.literals.has(key)) return true;
    for (const h of ev.heads) if (key.startsWith(h)) return true;
  }
  const parts = key.split('.');
  if (parts.length >= 2 && ev.access.has(parts.slice(-2).join('.'))) return true;
  const idParts = id.split('.');
  for (let i = idParts.length - 1; i >= 2; i -= 1)
    if (ev.literals.has(idParts.slice(0, i).join('.'))) return true;
  return false;
}

function unreadKeys(): string[] {
  const texts = SOURCES.flatMap((d) => walk(d))
    .filter((f) => /\.(tsx?|mjs|js)$/.test(f) && !/\.(test|stories)\./.test(f))
    .map((f) => readFileSync(f, 'utf8'));
  const ev = readEvidence(texts);
  return catalogueKeys(CATALOGUE)
    .filter((k) => !isRead(k, ev))
    .map((k) => k.id)
    .sort();
}

describe('5.800 · every website catalogue key is read by code (ratchet)', () => {
  const unread = unreadKeys();
  const listed = new Set(BASELINE);

  it('should find no unread key outside the baseline (delete it, or read it)', () => {
    expect(unread.filter((id) => !listed.has(id))).toEqual([]);
  });

  it('should keep the baseline exact: a listed key that is read again or deleted leaves the list', () => {
    const now = new Set(unread);
    expect(BASELINE.filter((id) => !now.has(id))).toEqual([]);
  });

  it('should keep the baseline sorted and free of duplicates', () => {
    expect(BASELINE).toEqual([...new Set(BASELINE)].sort());
  });

  it('should tell a read key from an unread one (non-vacuity)', () => {
    const ev = readEvidence([
      "t('faq.items.risk.answer')",
      'const x = `faq.items.${id}.question`;',
      "useNamespace('market'); t('views.title')",
      'messages.accessibility?.skipToMain',
    ]);
    const k = (ns: string, key: string) => ({ ns, key, id: `${ns}.${key}` });
    expect(isRead(k('faq', 'items.risk.answer'), ev)).toBe(true);
    expect(isRead(k('faq', 'items.other.question'), ev)).toBe(true);
    expect(isRead(k('market', 'views.title'), ev)).toBe(true);
    expect(isRead(k('common', 'accessibility.skipToMain'), ev)).toBe(true);
    expect(isRead(k('strategies', 'card.riskLabel'), ev)).toBe(false);
  });
});
