/**
 * Test-only helpers shared by every workspace's source-scanning guards (register 5.623). One
 * implementation, so a fix reaches every guard: the naive `//` comment regex this replaced
 * truncated a scan at the first URL or string holding `//`.
 */
export { stripComments } from './stripComments';
export { parseSource } from './parseSource';
