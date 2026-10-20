import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { it as test } from 'vitest';

const { sanitizeAuditEvidence } = await import(
  pathToFileURL(path.join(__dirname, '../../../../../../scripts/market-audit-evidence.mjs')).href
);

const root = '/Users/synthetic-auditor/private-project/audit';

test('repository stack frames become relative without losing assertions or measurements', () => {
  const message = `AssertionError: expected 0 to be 1\n    at ${root}/apps/check.test.ts:12:3\n    at file://${root}/node_modules/runner.mjs:4:2`;
  const input = { seconds: 1.25, count: 7, caught: true, absent: null, nested: [{ message }] };
  assert.deepEqual(sanitizeAuditEvidence(input, root), {
    seconds: 1.25,
    count: 7,
    caught: true,
    absent: null,
    nested: [
      {
        message:
          'AssertionError: expected 0 to be 1\n    at apps/check.test.ts:12:3\n    at node_modules/runner.mjs:4:2',
      },
    ],
  });
  assert.equal(input.nested[0].message, message);
});

test('outside-repository home, temporary and file-URL locations are redacted', () => {
  const input = [
    '/Users/synthetic-other/private/file.ts:1:2',
    '/home/synthetic-other/project/file.ts:1:2',
    '/private/var/folders/synthetic/fixture.mjs:1:2',
    '/tmp/synthetic/fixture.mjs:1:2',
    'file:///opt/synthetic/fixture.mjs:1:2',
    'C:\\Users\\synthetic-other\\private\\file.ts:1:2',
  ];
  assert.deepEqual(
    sanitizeAuditEvidence(input, root),
    input.map(() => '<local-path>')
  );
});

test('encoded repository URLs and nested path keys are sanitized; repeated filtering is stable', () => {
  const spacedRoot = `${root}/with space`;
  const input = { [`${spacedRoot}/fixture.json`]: `file://${encodeURI(spacedRoot)}/test.ts:1:2` };
  const output = sanitizeAuditEvidence(input, spacedRoot);
  assert.deepEqual(output, { 'fixture.json': 'test.ts:1:2' });
  assert.deepEqual(sanitizeAuditEvidence(output, spacedRoot), output);
});

test('non-path assertion content, dates, hashes and public URLs stay unchanged', () => {
  const input = {
    message: 'expected literal \\n and \\t to stay unchanged',
    date: '2026-10-20T00:00:00Z',
    hash: 'a9c0ff0123',
    link: 'https://example.test/evidence',
  };
  assert.deepEqual(sanitizeAuditEvidence(input, root), input);
});
