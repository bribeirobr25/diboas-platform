/**
 * atomic.mjs — a file write that is never observed half-written (PENDING_ALL 5.302).
 *
 * WHY THIS EXISTS. The weekly pipeline has seven write sites across four
 * scripts, and every one of them was a bare `fs.writeFileSync`. That call is
 * not atomic: it truncates the target first and then streams the new bytes, so
 * a crash mid-write leaves a TRUNCATED file on disk — not the old content, not
 * the new content, and for `computed.json` not even valid JSON. The next run
 * then dies reading it, and the failure surfaces a week later at the one moment
 * nobody is watching.
 *
 * The fix is the standard one: write a temp file, then `rename` it over the
 * target. POSIX `rename(2)` is atomic — a concurrent reader sees either the
 * whole old file or the whole new one, never a mixture.
 *
 * Three details that make it actually atomic, each of which is wrong in the
 * naive version:
 *
 *   1. **The temp file must live in the TARGET'S OWN DIRECTORY.** `rename`
 *      across filesystems is not atomic and throws `EXDEV`; `os.tmpdir()` is
 *      very often a different mount. So the temp sits beside its target.
 *   2. **fsync before rename.** Rename ordering alone survives a process crash;
 *      it does not survive an OS or power loss, where the rename can land in
 *      the journal ahead of the data. The `fsync` costs a few milliseconds on a
 *      job that runs once a week. Claiming atomicity without it would be the
 *      kind of half-true guarantee this lane keeps finding.
 *   3. **Clean up the temp on failure, without masking the real error.** The
 *      unlink goes in its own try/catch so a cleanup failure cannot replace the
 *      exception the caller needs to see.
 *
 * NOT gitignored, deliberately. A leftover `.computed.json.1234.tmp` means the
 * cleanup path failed, and `git status` showing it is how we find out. An
 * ignore rule would hide exactly the bug this file exists to prevent.
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * Write `text` to `targetPath` so that no reader ever sees a partial file.
 *
 * @param {string} targetPath — the file to replace
 * @param {string} text — complete contents
 */
export function writeFileAtomic(targetPath, text) {
  const dir = path.dirname(targetPath);
  // Dotted so tooling ignores it; pid-tagged so two processes cannot collide.
  const tmp = path.join(dir, `.${path.basename(targetPath)}.${process.pid}.tmp`);

  let fd;
  try {
    fd = fs.openSync(tmp, 'w');
    fs.writeFileSync(fd, text);
    fs.fsyncSync(fd); // durability: the bytes are on the platter before the rename
    fs.closeSync(fd);
    fd = undefined;
    fs.renameSync(tmp, targetPath);
  } catch (err) {
    if (fd !== undefined) {
      try {
        fs.closeSync(fd);
      } catch {
        /* already closed, or never opened cleanly */
      }
    }
    try {
      fs.unlinkSync(tmp);
    } catch {
      /* the temp may not exist; never mask `err` with a cleanup failure */
    }
    throw err;
  }
}

/** `writeFileAtomic` for a JSON value, with the trailing newline the repo uses. */
export function writeJsonAtomic(targetPath, value) {
  writeFileAtomic(targetPath, JSON.stringify(value, null, 2) + '\n');
}
