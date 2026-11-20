/**
 * ⛑ RETENTION-1 guards 8, 9 and 11 (plan P14; register `5.863`).
 *
 * 8 · Every table the website writes has a retention entry: a source scan reads every
 *     `INSERT INTO <table>` and `UPDATE <table>` in non-test code (apps/web/src and the repo's
 *     scripts/), comments stripped, and fails on a table missing from `RETENTION_REGISTRY`.
 *     Scope limit: only literal table names are seen.
 * 9 · The 3-year number equals the privacy policy's "Communication records" item, in every locale.
 * 11 · The orphan sweep assumes every delivery row's recipient is a waitlist member: only the
 *     four waitlist templates are recorded, and only `sendEmail.ts` writes delivery rows.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { stripComments } from '@diboas/test-support';
import { RETENTION_REGISTRY } from '../registry';
import { PURGES } from '..';
import { EMAIL_DELIVERY_RETENTION_YEARS } from '../emailDeliveryLogs';
import { DELIVERY_SUBJECTS } from '@/lib/email/deliveryLogger';

const SRC = join(__dirname, '../../..');
const REPO = join(SRC, '../../..');
const TRANSLATIONS = join(REPO, 'packages/i18n/translations');

const files = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = join(dir, e.name);
    if (e.isDirectory())
      return ['__tests__', 'node_modules', 'test'].includes(e.name) ? [] : files(full);
    return /\.(tsx?|mjs|js)$/.test(e.name) && !/\.(test|spec|stories)\./.test(e.name) ? [full] : [];
  });

/** Tables written by literal SQL; `ON CONFLICT … DO UPDATE SET` is not a table. */
function writtenTables(code: string): string[] {
  const found = new Set<string>();
  for (const m of code.matchAll(/\bINSERT INTO\s+([a-z_][a-z0-9_]*)/g)) found.add(m[1]!);
  for (const m of code.matchAll(/(?<!\bDO\s)\bUPDATE\s+([a-z_][a-z0-9_]*)/g))
    if (m[1] !== 'SET') found.add(m[1]!);
  return [...found];
}

/* A source scan over two trees: its own timeout under coverage (COV-1, 5.1023). */
describe(
  'RETENTION-1 guard 8 · every written table has a retention entry',
  { timeout: 30_000 },
  () => {
    const scanned = [...files(SRC), ...files(join(REPO, 'scripts'))];
    const tables = new Map<string, string>();
    for (const f of scanned)
      for (const table of writtenTables(stripComments(readFileSync(f, 'utf8'), f)))
        if (!tables.has(table)) tables.set(table, relative(REPO, f).split(sep).join('/'));

    it('should find every table the website writes (the scan is not vacuous)', () => {
      expect([...tables.keys()].sort()).toEqual(
        expect.arrayContaining([
          'audit_logs',
          'deletion_tokens',
          'email_delivery_logs',
          'gdpr_deletion_logs',
          'idempotency_cache',
          'schema_migrations',
          'waitlist_counters',
          'waitlist_entries',
        ])
      );
    });

    it('should name each written table in the registry, with a purge, an erasure or a reason', () => {
      const missing = [...tables.entries()]
        .filter(([table]) => !(table in RETENTION_REGISTRY))
        .map(([table, file]) => `${table} (${file})`);
      expect(missing).toEqual([]);
      for (const [table, entry] of Object.entries(RETENTION_REGISTRY))
        expect(
          Boolean(entry.purges?.length || entry.erasure || entry.exemption),
          `${table} needs a purge, an erasure or an exemption`
        ).toBe(true);
    });

    it('should register each purge on a table, and only purges the job runs', () => {
      const registered = Object.values(RETENTION_REGISTRY).flatMap((e) => e.purges ?? []);
      expect(registered.sort()).toEqual(PURGES.map((p) => p.name).sort());
    });

    it('should read a written table and ignore lookalikes (detector self-test)', () => {
      expect(writtenTables('sql`INSERT INTO new_table (a) VALUES (1)`')).toEqual(['new_table']);
      expect(writtenTables('sql`UPDATE other SET a = 1`')).toEqual(['other']);
      expect(
        writtenTables('INSERT INTO t (k) VALUES (1) ON CONFLICT (k) DO UPDATE SET k = 2')
      ).toEqual(['t']);
      expect(writtenTables("Logger.error('Failed to update entry')")).toEqual([]);
      expect(writtenTables(stripComments('// INSERT INTO ghost\nconst a = 1;', 'x.ts'))).toEqual(
        []
      );
    });
  }
);

describe('RETENTION-1 guard 9 · the policy number', () => {
  const retentionItems = (locale: string): Array<{ type?: string; text?: string }> => {
    const policy = JSON.parse(
      readFileSync(join(TRANSLATIONS, locale, 'legal/privacy.json'), 'utf8')
    ) as { sections: { dataRetention: { items: Array<{ type?: string; text?: string }> } } };
    return policy.sections.dataRetention.items;
  };
  const index = retentionItems('en').findIndex((i) =>
    /communication records/i.test(JSON.stringify(i))
  );

  it.each(['en', 'pt-BR', 'es', 'de'])(
    'should state the same number of years as the code when the policy is read in %s',
    (locale) => {
      expect(index, 'the "Communication records" item in en').toBeGreaterThanOrEqual(0);
      const item = JSON.stringify(retentionItems(locale)[index]);
      expect(item.match(/\d+/g)?.map(Number)).toContain(EMAIL_DELIVERY_RETENTION_YEARS);
    }
  );
});

/* A source scan: its own timeout under coverage (COV-1, 5.1023). */
describe('RETENTION-1 guard 11 · only waitlist emails are recorded', { timeout: 30_000 }, () => {
  it('should record only the four waitlist templates', () => {
    expect(Object.keys(DELIVERY_SUBJECTS).sort()).toEqual([
      'deletion-complete',
      'deletion-confirmation',
      'referral-success',
      'welcome',
    ]);
  });

  it('should write delivery rows from sendEmail.ts alone', () => {
    const writers = files(SRC)
      .filter((f) => !f.endsWith(`${sep}deliveryLogger.ts`))
      .filter((f) => /\blogEmailDelivery\s*\(/.test(stripComments(readFileSync(f, 'utf8'), f)))
      .map((f) => relative(SRC, f).split(sep).join('/'));
    expect(writers).toEqual(['lib/email/sendEmail.ts']);
  });
});
