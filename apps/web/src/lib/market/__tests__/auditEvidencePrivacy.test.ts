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

// 2026-10-20 (Codex audit of #737): both failure classes, with its reproductions.
const repo = '/project/repo';

test('public URLs stay byte-identical even when they contain the home, a mount root or the repository path', () => {
  const urls = [
    'https://example.test/root/guide',
    'https://example.test/Users/example%20auditor/guide',
    'https://example.test/project/repo/x.ts',
    'see https://example.org/opt/guide and https://example.org/var/x',
  ];
  assert.deepEqual(sanitizeAuditEvidence(urls, repo, '/root'), urls);
  assert.deepEqual(sanitizeAuditEvidence(urls, repo, '/Users/example auditor'), urls);
});

test('local paths whose directories contain spaces are removed whole, keeping the surrounding text', () => {
  const home = '/Users/example auditor';
  assert.deepEqual(
    sanitizeAuditEvidence(
      [
        '/Users/example auditor/Project With Spaces/file.ts:1:2',
        'at /Volumes/External Drive/Project With Spaces/file.ts:1:2',
        'AssertionError: boom\n    at fn (/Volumes/External Drive/x.mjs:3:4)\n    at next',
        'C:\\Users\\John Doe\\Project With Spaces\\file.ts:1:2',
        'file:///Volumes/External%20Drive/x.mjs:1:2',
      ],
      repo,
      home
    ),
    [
      '<local-path>',
      'at <local-path>',
      'AssertionError: boom\n    at fn (<local-path>)\n    at next',
      '<local-path>',
      '<local-path>',
    ]
  );
});

test('assertion prose after a local path is preserved (no greedy match)', () => {
  assert.deepEqual(
    sanitizeAuditEvidence(
      [
        'expected /tmp/x to equal 2026-10-30T00:00:00Z',
        'at /Users/a/file.ts:1:2 and see foo/bar.ts:3',
        'compare /Volumes/Data Disk/a.ts:1 with /Volumes/Other Disk/b.ts:2',
      ],
      repo,
      '/Users/nobody'
    ),
    [
      'expected <local-path> to equal 2026-10-30T00:00:00Z',
      'at <local-path> and see foo/bar.ts:3',
      'compare <local-path> with <local-path>',
    ]
  );
});

test('repository frames still become repository-relative (plain, file URL, stack frame)', () => {
  assert.deepEqual(
    sanitizeAuditEvidence(
      [
        'at /project/repo/apps/x.test.ts:12:3',
        'file:///project/repo/apps/x.mjs:4:2',
        '(/project/repo/a.ts:1:1)',
      ],
      repo,
      '/Users/nobody'
    ),
    ['at apps/x.test.ts:12:3', 'apps/x.mjs:4:2', '(a.ts:1:1)']
  );
});

test('an enclosed local path with spaces and no line number is removed up to its closing delimiter', () => {
  assert.deepEqual(
    sanitizeAuditEvidence(
      [
        'cwd was "/Volumes/Data Disk/x"',
        "cwd was '/Users/example auditor/My Project'",
        'cwd was (/Volumes/Data Disk/x) and then',
        'cwd was "C:\\Users\\John Doe\\proj"',
      ],
      repo,
      '/Users/example auditor'
    ),
    [
      'cwd was "<local-path>"',
      "cwd was '<local-path>'",
      'cwd was (<local-path>) and then',
      'cwd was "<local-path>"',
    ]
  );
});
