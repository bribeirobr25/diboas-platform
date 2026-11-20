/**
 * ⛑ `5.1025` · every message the signup hook can show exists where each caller reads it.
 *
 * `useWaitlistForm` asks its caller's translator for keys such as `error.invalidEmail`. The
 * landing form prefixes them with `waitlist.`; the Money Jobs gate prefixed them with
 * `common.waitingList.`, where `error.*` never existed, so a failed signup on the gate showed a
 * raw key. Unit tests could not see it: they mock the translator to echo the id.
 *
 * Read from source, so a new key in the hook or a new caller is covered without editing this
 * file: every `t('…')` key in the hook, under every caller's prefix, must exist in all four
 * locales, and a caller's page must load that namespace (`common` loads on every page).
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { stripComments } from '@diboas/test-support';
import { describe, expect, it } from 'vitest';

const SRC = join(__dirname, '../../../..');
const TRANSLATIONS = join(SRC, '../../../packages/i18n/translations');
const LOCALES = ['en', 'pt-BR', 'es', 'de'] as const;
const read = (rel: string) => stripComments(readFileSync(join(SRC, rel), 'utf8'), rel);

/** The hook's message keys: every `t('…')` literal it passes. */
const HOOK_KEYS = [
  ...new Set(
    [...read('components/WaitingList/hooks/useWaitlistForm.ts').matchAll(/\bt\('([\w.]+)'/g)].map(
      (m) => m[1]!
    )
  ),
].sort();

/** Each caller, the prefix its translator adds, and the page that mounts it. */
const CALLERS = [
  { file: 'components/WaitingList/WaitlistForm.tsx', page: null },
  {
    file: 'components/Sections/MoneyJobsCalculator/MoneyJobsGate.tsx',
    page: 'app/[locale]/(landing)/tools/money-jobs/page.tsx',
  },
].map((c) => ({ ...c, prefix: hookPrefix(read(c.file)) }));

/**
 * The prefix of the translator handed to `useWaitlistForm` (a file may hold other translators:
 * the gate has its own for `tools-money-jobs.gate.*`). Inline `t: (key, values) => …` is read
 * in place; a shorthand `t` or `t: name` is read from that function's definition.
 */
function hookPrefix(code: string): string | undefined {
  const TEMPLATE = /formatMessage\(\{\s*id:\s*`([\w.-]+)\.\$\{key\}`/;
  const call = code.slice(code.indexOf('useWaitlistForm({'));
  const args = call.slice(0, call.indexOf('});'));
  const inline = args.match(/\bt:\s*\([^)]*\)\s*=>\s*([^\n]*)/)?.[1];
  if (inline) return inline.match(TEMPLATE)?.[1];
  const name = args.match(/\bt:\s*(\w+)/)?.[1] ?? (/[{,\s]t,/.test(args) ? 't' : undefined);
  if (!name) return undefined;
  const def = code.match(new RegExp(`const ${name} = \\([^)]*\\)[^=]*=>\\s*\\{?([\\s\\S]{0,200})`));
  return def?.[1]?.match(TEMPLATE)?.[1];
}

function lookup(locale: string, id: string): unknown {
  const [ns, ...path] = id.split('.');
  const file = join(TRANSLATIONS, locale, `${ns}.json`);
  let node: unknown = JSON.parse(readFileSync(file, 'utf8'));
  for (const k of path) node = (node as Record<string, unknown> | undefined)?.[k];
  return node;
}

/* A source scan over `components/`: its own timeout under coverage (COV-1). It timed out at the
   5 s default in the P13 PR-2 coverage run under load, and passes alone in well under a second. */
describe('5.1025 · the signup hook messages resolve for every caller', { timeout: 30_000 }, () => {
  it('should read the hook keys and every caller prefix (the check is not vacuous)', () => {
    expect(HOOK_KEYS.length).toBeGreaterThanOrEqual(5);
    expect(HOOK_KEYS).toContain('error.invalidEmail');
    for (const c of CALLERS) expect(c.prefix, c.file).toBeTruthy();
    // every caller of the hook is listed here
    const callers = (dir: string): string[] =>
      readdirSync(join(SRC, dir), { withFileTypes: true }).flatMap((e) => {
        const rel = `${dir}/${e.name}`;
        if (e.isDirectory()) return e.name === '__tests__' ? [] : callers(rel);
        return /\.tsx?$/.test(e.name) &&
          rel !== 'components/WaitingList/hooks/useWaitlistForm.ts' &&
          /\buseWaitlistForm\(/.test(read(rel))
          ? [rel]
          : [];
      });
    expect(callers('components').sort()).toEqual(CALLERS.map((c) => c.file).sort());
  });

  for (const c of CALLERS)
    it.each(LOCALES)(
      `should find every hook message under ${c.file.split('/').pop()} in %s`,
      (locale) => {
        const missing = HOOK_KEYS.filter(
          (k) => typeof lookup(locale, `${c.prefix}.${k}`) !== 'string'
        );
        expect(missing.map((k) => `${c.prefix}.${k}`)).toEqual([]);
      }
    );

  it("should load the caller's namespace on the page that mounts it", () => {
    for (const c of CALLERS.filter((x) => x.page)) {
      const ns = c.prefix!.split('.')[0]!;
      if (ns === 'common') continue;
      const list = read(c.page!).match(/loadPageNamespaces\(\s*locale,\s*\[([^\]]*)\]/)?.[1] ?? '';
      expect(list, c.page!).toContain(`'${ns}'`);
    }
  });
});
