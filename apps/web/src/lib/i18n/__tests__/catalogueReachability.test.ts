import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

/**
 * ⚙ CATALOGUE REACHABILITY (register 5.800).
 *
 * A website catalogue key that no code reads passed every gate (type-check, knip,
 * `validate:translations`): the seventh audit put the `strategies.json` blocks platform #824
 * deleted back ×4 and nothing failed. This parses every tracked website source file (TypeScript
 * AST, so a comment is never a read) and counts a key, from ANY locale, as read when:
 *   1. its full id is a string literal anywhere (`'faq.items.risk.answer'`, config key strings),
 *      or a parent object's id is (`'landing-b2c.draper.steps'`, read whole);
 *   2. in a file that names its namespace: its namespace-relative key, or a parent of it, is a
 *      literal (`t('protocolLabels.tvl')`); a relative template head covers it (`cards.${id}`);
 *      a constant-held prefix's tail covers it (`${PREFIX}.faq.header`); or a property-access
 *      path matches it (`messages.accessibility?.skipToMain`);
 *   3. a template head holding its namespace and at least one more segment covers it
 *      (`faq.items.${id}`), in any file;
 *   4. a namespace-family template covers it: `tools-${slug}.landing.cardTitle`;
 *   5. a DECLARED family reader (below) holds a `${namespace}.…` tail or a relative key for it.
 *
 * Eighth audit: the first version matched tails and access pairs across ALL namespaces (".title"
 * alone marked 184 keys read), read en only, and counted comments; 13 of 16 planted dead keys
 * passed. Every rule above is local to the reading file or the declared family.
 *
 * It is a RATCHET: the keys unread when it was built are listed in
 * `catalogueReachability.baseline.json`, to be classified and deleted (register 5.808; the
 * `footer.*` disclosures are Legal's to retire, and `common.errors.*` are unread because the error
 * fallbacks render hard-coded English — a defect to wire, not keys to delete). A key unread and
 * NOT listed fails; a listed key that is read again, or deleted, fails too: the list only shrinks.
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
const TRANSLATIONS = join(ROOT, 'packages/i18n/translations');
const LOCALES = ['en', 'pt-BR', 'es', 'de'];
const SOURCE_DIRS = ['apps/web/src', 'packages/ui/src', 'packages/email/src'];
const BASELINE: string[] = JSON.parse(
  readFileSync(join(__dirname, 'catalogueReachability.baseline.json'), 'utf8')
);

/**
 * Components shared by a family of namespaces, which hold the namespace in a variable: in these
 * files a `${namespace}.x.y` template tail and a namespace-relative key apply to every namespace
 * of the family. Each entry is checked to be load-bearing: without it, some key reads as unread.
 */
const FAMILIES: ReadonlyArray<{ family: RegExp; files: readonly string[] }> = [
  {
    family: /^learn-/,
    files: [
      'apps/web/src/components/Sections/Lesson/variants/LessonThreeBeat/LessonThreeBeat.tsx',
      'apps/web/src/components/Sections/TalkQuiz/variants/TalkQuizDefault/TalkQuizDefault.tsx',
      'apps/web/src/lib/learn/lessonMetadata.ts',
    ],
  },
  {
    family: /^market(-|$)/,
    files: [
      'apps/web/src/app/[locale]/(landing)/market/viewMetadata.ts',
      'apps/web/src/app/[locale]/(landing)/market/StateViewSections.tsx',
      'apps/web/src/app/[locale]/(landing)/market/MarketViewShell.tsx',
    ],
  },
  {
    family: /^tools-/,
    files: [
      'apps/web/src/app/[locale]/(landing)/tools/page.tsx',
      'apps/web/src/components/Sections/ToolPage/ToolPage.tsx',
    ],
  },
];

/**
 * Helpers that read through a translator their CALLER scopes (`regimeLabelMap(t)`, a hook handed
 * `t`), so the namespace never appears in the file: declared with the namespace the caller scopes.
 * Each entry must be load-bearing, like a family reader.
 */
const INJECTED: ReadonlyArray<{ file: string; namespaces: readonly string[] }> = [
  { file: 'apps/web/src/lib/market/presentationState.ts', namespaces: ['market'] },
  { file: 'apps/web/src/lib/market/viewRegistry.ts', namespaces: ['market'] },
  {
    file: 'apps/web/src/components/WaitingList/hooks/useWaitlistForm.ts',
    namespaces: ['waitlist'],
  },
];

interface Key {
  ns: string;
  key: string;
  id: string;
}

function catalogueKeys(): Key[] {
  const out = new Map<string, Key>();
  const leaves = (node: unknown, prefix: string, ns: string) => {
    if (typeof node === 'string')
      out.set(`${ns}.${prefix}`, { ns, key: prefix, id: `${ns}.${prefix}` });
    else if (node && typeof node === 'object')
      for (const [k, v] of Object.entries(node)) leaves(v, prefix ? `${prefix}.${k}` : k, ns);
  };
  for (const locale of LOCALES) {
    const walk = (dir: string) => {
      for (const e of readdirSync(dir)) {
        const full = join(dir, e);
        if (statSync(full).isDirectory()) walk(full);
        else if (e.endsWith('.json')) {
          const ns = relative(join(TRANSLATIONS, locale), full)
            .replace(/\\/g, '/')
            .replace(/\.json$/, '');
          leaves(JSON.parse(readFileSync(full, 'utf8')), '', ns);
        }
      }
    };
    walk(join(TRANSLATIONS, locale));
  }
  return [...out.values()];
}

interface FileEvidence {
  path: string;
  literals: Set<string>;
  heads: Set<string>;
  /** Template head → its first literal tail (`tools-` → `.landing.cardTitle`), and whether that
   *  tail ends the template (a closed path) or a further `${…}` continues it (an open prefix). */
  pairs: Array<[string, string, boolean]>;
  tails: Array<[string, boolean]>;
  chains: Set<string>;
  namespacesNamed: Set<string>;
  families: RegExp[];
}

function evidenceOf(path: string, text: string, namespaces: Set<string>): FileEvidence {
  const kind = /\.[jt]sx$/.test(path) ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, kind);
  const ev: FileEvidence = {
    path,
    literals: new Set(),
    heads: new Set(),
    pairs: [],
    tails: [],
    chains: new Set(),
    namespacesNamed: new Set(),
    families: FAMILIES.filter((f) => f.files.includes(path)).map((f) => f.family),
  };
  const visit = (n: ts.Node) => {
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) {
      ev.literals.add(n.text);
      if (namespaces.has(n.text) && namesANamespace(n)) ev.namespacesNamed.add(n.text);
    } else if (ts.isTemplateExpression(n)) {
      ev.heads.add(n.head.text);
      const spans = n.templateSpans;
      ev.pairs.push([n.head.text, spans[0].literal.text, spans.length === 1]);
      spans.forEach((span, i) => ev.tails.push([span.literal.text, i === spans.length - 1]));
    } else if (ts.isPropertyAccessExpression(n) && !ts.isPropertyAccessExpression(n.parent)) {
      const segs: string[] = [];
      let c: ts.Expression = n;
      while (ts.isPropertyAccessExpression(c)) {
        segs.unshift(c.name.text);
        c = c.expression;
      }
      if (ts.isIdentifier(c)) segs.unshift(c.text);
      ev.chains.add(segs.join('.'));
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  for (const inj of INJECTED)
    if (inj.file === path) inj.namespaces.forEach((x) => ev.namespacesNamed.add(x));
  // A full id or a full-id head names its namespace (`'faq.items.risk'`, `faq.items.${id}`).
  for (const l of [...ev.literals, ...ev.heads]) {
    const dot = l.indexOf('.');
    if (dot > 0 && namespaces.has(l.slice(0, dot))) ev.namespacesNamed.add(l.slice(0, dot));
  }
  return ev;
}

/**
 * A bare namespace literal names the namespace only where code LOADS or SCOPES with it: as a call
 * argument (`loadMessages(locale, 'faq')`, also inside an array argument), as a prefix or
 * namespace constant (`const I18N_PREFIX = 'strategies'`), or a namespace property
 * (`i18nNamespace: 'tools-x'`). A union type or an event tag (`'waitlist' | 'referral'`) does not
 * (9th audit: those made whole sections "read").
 */
function namesANamespace(n: ts.Node): boolean {
  let p = n.parent;
  if (ts.isArrayLiteralExpression(p)) p = p.parent;
  if (ts.isCallExpression(p) || ts.isNewExpression(p)) return true;
  const name =
    ts.isVariableDeclaration(p) ||
    ts.isPropertyAssignment(p) ||
    ts.isBindingElement(p) ||
    ts.isParameter(p)
      ? p.name.getText()
      : undefined;
  return name !== undefined && /(prefix|namespace|^ns$|_ns$)/i.test(name);
}

/** Does a template path cover `key`? An open path (a `${…}` follows) is a prefix; a closed one is
 *  the key itself or its subtree, never a longer segment (`.title` never covers `titleSuffix`). */
function covers(path: string, key: string, open: boolean): boolean {
  if (!path) return false;
  return open ? key.startsWith(path) : key === path || key.startsWith(`${path}.`);
}

function isRead(
  { ns, key, id }: Key,
  files: FileEvidence[],
  globals: Set<string>,
  namespaces: Set<string>
): boolean {
  if (globals.has(id)) return true;
  const idParts = id.split('.');
  for (let i = idParts.length - 1; i >= 2; i -= 1)
    if (globals.has(idParts.slice(0, i).join('.'))) return true;
  const keyParts = key.split('.');
  for (const f of files) {
    for (const h of f.heads) {
      const dot = h.indexOf('.');
      if (dot > 0 && h.slice(0, dot) === ns && h.length > dot + 1 && id.startsWith(h)) return true;
    }
    for (const [h, t, closed] of f.pairs)
      if (h && !h.includes('.') && ns.startsWith(h) && t.startsWith('.'))
        if (covers(t.slice(1), key, !closed)) return true;
    const inFamily = f.families.some((re) => re.test(ns));
    if (inFamily)
      for (const [t, closed] of f.tails)
        if (t.startsWith('.') && covers(t.slice(1), key, !closed)) return true;
    if (!inFamily && !f.namespacesNamed.has(ns)) continue;
    // A prefix held in a constant the file names: `${STRATEGIES_I18N_PREFIX}.faq.header`.
    if (f.namespacesNamed.has(ns))
      for (const [h, t, closed] of f.pairs)
        if (h === '' && t.startsWith('.') && covers(t.slice(1), key, !closed)) return true;
    // The key itself, or a parent of at least two segments: a one-word literal ('beat1',
    // 'contact', 'tier') is also a section id, a type tag or a class name, never proof that a
    // whole section is read (9th audit).
    for (let i = keyParts.length; i >= 1; i -= 1) {
      if (i < 2 && i < keyParts.length) break;
      if (f.literals.has(keyParts.slice(0, i).join('.'))) return true;
    }
    for (const h of f.heads)
      if (h.includes('.') && !h.startsWith(`${ns}.`) && key.startsWith(h)) return true;
    for (const c of f.chains) {
      const cs = c.split('.');
      for (let n = Math.min(cs.length, keyParts.length); n >= 2; n -= 1)
        if (cs.slice(-n).join('.') === keyParts.slice(0, n).join('.')) return true;
    }
  }
  return false;
}

function sourceEvidence(namespaces: Set<string>): FileEvidence[] {
  return execSync(`git ls-files ${SOURCE_DIRS.join(' ')}`, { cwd: ROOT })
    .toString()
    .split('\n')
    .filter(
      (f) => /\.(tsx?|jsx?|mjs|cjs)$/.test(f) && !/(\.(test|spec|stories)\.|__tests__\/)/.test(f)
    )
    .filter((f) => existsSync(join(ROOT, f))) // a tracked file deleted in the working tree
    .map((f) => evidenceOf(f, readFileSync(join(ROOT, f), 'utf8'), namespaces));
}

function unreadIds(keys: Key[], files: FileEvidence[]): string[] {
  const globals = new Set(files.flatMap((f) => [...f.literals]));
  const namespaces = new Set(keys.map((k) => k.ns));
  return keys
    .filter((k) => !isRead(k, files, globals, namespaces))
    .map((k) => k.id)
    .sort();
}

describe('5.800 · every website catalogue key is read by code (ratchet)', () => {
  const keys = catalogueKeys();
  const files = sourceEvidence(new Set(keys.map((k) => k.ns)));
  const unread = unreadIds(keys, files);
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

  it('should keep every declared family reader load-bearing: without it, some key reads as unread', () => {
    const before = unread.length;
    for (const { files: paths } of FAMILIES)
      for (const p of paths) {
        const f = files.find((x) => x.path === p);
        expect(f, `declared reader ${p} is not a tracked source file`).toBeDefined();
        const without = files.map((x) => (x === f ? { ...x, families: [] } : x));
        expect(
          unreadIds(keys, without).length,
          `${p} reads nothing only it can read`
        ).toBeGreaterThan(before);
      }
  }, 30_000); // 5.859: one full reachability pass per declared reader (1.6 s alone, 6.4 s under coverage)

  it('should keep every declared injected-translator reader load-bearing', () => {
    const before = unread.length;
    for (const { file } of INJECTED) {
      const f = files.find((x) => x.path === file);
      expect(f, `declared reader ${file} is not a tracked source file`).toBeDefined();
      const bare = evidenceOf(file, readFileSync(join(ROOT, file), 'utf8'), new Set());
      const without = files.map((x) =>
        x === f ? { ...bare, namespacesNamed: new Set<string>() } : x
      );
      expect(
        unreadIds(keys, without).length,
        `${file} reads nothing only it can read`
      ).toBeGreaterThan(before);
    }
  });

  it('should tell a read key from an unread one, file by file (non-vacuity)', () => {
    const ns = new Set(['faq', 'market', 'common', 'strategies', 'about']);
    const ev = [
      evidenceOf('a.ts', "t('faq.items.risk.answer'); const x = `faq.items.${id}.question`;", ns),
      evidenceOf('b.ts', "load('market'); t('views.title'); m.accessibility?.skipToMain", ns),
      evidenceOf(
        'c.ts',
        "// 'strategies.legacy.title' is only a comment\nconst k = `${ns}.title`;",
        ns
      ),
    ];
    const globals = new Set(ev.flatMap((f) => [...f.literals]));
    const k = (n: string, key: string) => ({ ns: n, key, id: `${n}.${key}` });
    expect(isRead(k('faq', 'items.risk.answer'), ev, globals, ns)).toBe(true);
    expect(isRead(k('faq', 'items.newQ.question'), ev, globals, ns)).toBe(true);
    expect(isRead(k('market', 'views.title'), ev, globals, ns)).toBe(true);
    // b.ts names `market`, not `common`: its access path reads nothing in `common`.
    expect(isRead(k('common', 'accessibility.skipToMain'), ev, globals, ns)).toBe(false);
    // A comment is not a read; a `${ns}.title` tail outside a declared family reads nothing.
    expect(isRead(k('strategies', 'legacy.title'), ev, globals, ns)).toBe(false);
    expect(isRead(k('about', 'title'), ev, globals, ns)).toBe(false);
  });
});
