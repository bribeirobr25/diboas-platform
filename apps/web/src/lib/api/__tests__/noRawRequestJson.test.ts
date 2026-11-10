import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { stripComments } from '@diboas/test-support';
import { describe, expect, it } from 'vitest';

/**
 * 5.823 family (5.846, 5.847; twelfth audit) — EVERY ROUTE READS ITS JSON BODY THROUGH
 * `readJsonObject`.
 *
 * A raw `request.json()` throws on malformed JSON and returns `null` for a `null` body; both
 * escaped as 500s in six routes. `readJsonObject` (`src/lib/api/routeHelpers.ts`) reads any
 * non-object as `{}`, so the route's own validation answers 400. This scan keeps a new or
 * edited route from going back to the raw call.
 *
 * Scope limit: it matches a `.json(` call on a receiver whose name contains `req` (`request`,
 * `req`, `nextReq`, …), comments stripped. A body read through another name, or
 * `JSON.parse(await request.text())`, is not matched; `/api/monitoring` reads its envelope
 * with `.text()` on purpose and validates the parsed header itself.
 */

const APP = resolve(__dirname, '../../../app');
const RAW_JSON = /\b\w*[Rr]eq\w*\s*\.\s*json\s*\(/;

const routeFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === '__tests__' ? [] : routeFiles(path);
    return name === 'route.ts' ? [path] : [];
  });

describe('5.823 family · route bodies are read through readJsonObject', () => {
  const routes = routeFiles(APP);

  it('should find the six body reads that go through readJsonObject (non-vacuity)', () => {
    const calls = routes.flatMap(
      (f) => stripComments(readFileSync(f, 'utf8'), f).match(/\breadJsonObject\s*[<(]/g) ?? []
    );
    expect(calls.length).toBeGreaterThanOrEqual(6);
  });

  it('should hold no raw request.json() call in any route', () => {
    const offenders = routes
      .filter((f) => RAW_JSON.test(stripComments(readFileSync(f, 'utf8'), f)))
      .map((f) => relative(APP, f));
    expect(offenders).toEqual([]);
  });

  it('should match the raw call it exists to catch (detector self-test)', () => {
    for (const line of [
      'const body = await request.json();',
      'const { email } = (await req.json()) as X;',
      'await nextReq .json ()',
    ])
      expect(RAW_JSON.test(line), line).toBe(true);
    for (const line of ['await readJsonObject(request)', 'await upstream.json()', 'res.json()'])
      expect(RAW_JSON.test(line), line).toBe(false);
  });
});
