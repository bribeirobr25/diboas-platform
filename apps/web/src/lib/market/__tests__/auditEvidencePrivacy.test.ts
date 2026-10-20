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

test('a home directory containing spaces is redacted whole, not left behind the pattern', () => {
  const home = '/Users/synthetic auditor';
  const input = [
    `${home}/elsewhere/file.ts:1:2`,
    `file://${encodeURI(home)}/elsewhere/file.ts:1:2`,
    `cwd was ${home}`,
  ];
  const output = sanitizeAuditEvidence(input, root, home);
  assert.deepEqual(output, ['<local-path>', '<local-path>', 'cwd was <local-path>']);
  assert.equal(JSON.stringify(output).includes('auditor'), false);
});

test('other local mount roots are redacted too', () => {
  const input = [
    '/Volumes/External/x.ts:1:2',
    '/opt/tool/x.mjs:3:4',
    '/mnt/data/x:1',
    '/srv/app/x:1',
  ];
  assert.deepEqual(
    sanitizeAuditEvidence(input, root, '/Users/nobody'),
    input.map(() => '<local-path>')
  );
});

test('the home directory is replaced only as a whole path segment', () => {
  // A shorter home must not cut into a longer sibling, and '/root' must not cut
  // into ordinary text; the general pattern still redacts the sibling path.
  assert.deepEqual(
    sanitizeAuditEvidence(
      ['/Users/simone2/x.ts:1', 'https://example.test/rootcause'],
      root,
      '/Users/simone'
    ),
    ['<local-path>', 'https://example.test/rootcause']
  );
  assert.deepEqual(
    sanitizeAuditEvidence(['https://example.test/rootcause', 'at /root/x.ts:1'], root, '/root'),
    ['https://example.test/rootcause', 'at <local-path>']
  );
});

test('a Windows home with a space is redacted whole', () => {
  const home = 'C:\\Users\\John Doe';
  const output = sanitizeAuditEvidence([`${home}\\proj\\x.ts:1:2`], root, home);
  assert.deepEqual(output, ['<local-path>']);
});

test('mount-root patterns do not rewrite public URLs', () => {
  const input = [
    'https://example.org/opt/guide',
    'https://example.org/var/x',
    'see https://a.test/tmp/y',
  ];
  assert.deepEqual(sanitizeAuditEvidence(input, root, '/Users/nobody'), input);
});
