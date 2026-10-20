/**
 * fsFaultInjector.mjs — loaded with `node --import` into the CHILD process that
 * `partialWriteEntryPoint.test.ts` spawns. Never imported by application code.
 *
 * It makes ONE file operation fail, the way a full disk or an I/O error would,
 * so the real `run.mjs` entry point can be watched reporting it:
 *
 *   FAULT_KIND=append-partial  appending to FAULT_TARGET writes the first half
 *                              of the row, then throws ENOSPC
 *   FAULT_KIND=append-none     appending to FAULT_TARGET throws before writing
 *   FAULT_KIND=rename          the atomic replace of FAULT_TARGET (temp file ->
 *                              target rename) throws EIO
 *   FAULT_KIND=rename-and-unlink  as `rename`, and removing that temp file also
 *                              fails, so it stays behind (a stated limit)
 *
 * FAULT_TARGET is a file NAME (`etf-shares-weekly.jsonl`, `computed.json`, ...).
 * Every other file operation, the stubs' own request logs included, is real.
 */
import fs from 'node:fs';
import path from 'node:path';

const TARGET = process.env.FAULT_TARGET;
const KIND = process.env.FAULT_KIND;
if (!TARGET || !KIND) throw new Error('fsFaultInjector: FAULT_TARGET and FAULT_KIND are required');

function injected(code, op) {
  const err = new Error(`${code}: injected failure, ${op} '${TARGET}'`);
  err.code = code;
  return err;
}

const realAppend = fs.appendFileSync;
const realRename = fs.renameSync;
const realUnlink = fs.unlinkSync;

if (KIND === 'append-partial' || KIND === 'append-none') {
  fs.appendFileSync = function appendWithFault(file, data, ...rest) {
    if (typeof file === 'string' && path.basename(file) === TARGET) {
      if (KIND === 'append-partial') {
        const text = String(data);
        realAppend.call(fs, file, text.slice(0, Math.floor(text.length / 2)));
      }
      throw injected('ENOSPC', 'write');
    }
    return realAppend.call(fs, file, data, ...rest);
  };
} else if (KIND === 'rename' || KIND === 'rename-and-unlink') {
  fs.renameSync = function renameWithFault(from, to, ...rest) {
    if (path.basename(String(to)) === TARGET) throw injected('EIO', 'rename');
    return realRename.call(fs, from, to, ...rest);
  };
  if (KIND === 'rename-and-unlink') {
    fs.unlinkSync = function unlinkWithFault(file, ...rest) {
      if (path.basename(String(file)).startsWith(`.${TARGET}.`)) throw injected('EPERM', 'unlink');
      return realUnlink.call(fs, file, ...rest);
    };
  }
} else {
  throw new Error(`fsFaultInjector: unknown FAULT_KIND ${KIND}`);
}
