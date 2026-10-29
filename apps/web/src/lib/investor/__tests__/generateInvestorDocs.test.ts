import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

/**
 * Guard for register `5.652`: `scripts/generate-investor-docs.mjs` must FAIL CLOSED.
 *
 * It used to skip a missing source document and then write whatever was left, so a run
 * with its (local-only) source folder absent replaced the committed investor room with an
 * empty `docs` object and still reported success. Each case points the real script at
 * temporary source and output folders through its env overrides, so the committed
 * `investor-docs.json` is never at risk, even when the guard itself is sabotaged.
 */

const ROOT = resolve(process.cwd(), '..', '..');
const made: string[] = [];
afterEach(() => {
  while (made.length) rmSync(made.pop()!, { recursive: true, force: true });
});

function run(sourceDir: string) {
  const outDir = mkdtempSync(join(tmpdir(), 'investor-docs-out-'));
  made.push(outDir);
  try {
    execFileSync('node', ['scripts/generate-investor-docs.mjs', 'en'], {
      cwd: ROOT,
      stdio: 'pipe',
      env: { ...process.env, INVESTOR_DOCS_SOURCE_DIR: sourceDir, INVESTOR_DOCS_OUT_DIR: outDir },
    });
    return { code: 0, wrote: existsSync(join(outDir, 'investor-docs.json')) };
  } catch (error) {
    const status = (error as { status?: number }).status ?? 1;
    return { code: status, wrote: existsSync(join(outDir, 'investor-docs.json')) };
  }
}

describe('generate-investor-docs fail-closed (5.652)', () => {
  it('should exit non-zero and write nothing when every source is missing', () => {
    const src = mkdtempSync(join(tmpdir(), 'investor-docs-src-'));
    made.push(src);
    const result = run(src);
    expect(result.code).not.toBe(0);
    expect(result.wrote).toBe(false);
  });

  it('should exit non-zero and write nothing when only some sources are present', () => {
    const src = mkdtempSync(join(tmpdir(), 'investor-docs-src-'));
    made.push(src);
    mkdirSync(join(src, 'investor-page-en'), { recursive: true });
    writeFileSync(
      join(src, 'investor-page-en/01a_diboas_investment_summary_EN.md'),
      '# Investment summary\n\nOne paragraph.\n'
    );
    const result = run(src);
    expect(result.code).not.toBe(0);
    expect(result.wrote).toBe(false);
  });
});
