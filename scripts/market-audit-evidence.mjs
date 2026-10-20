import os from 'node:os';

/**
 * Public audit evidence must not disclose the auditor's local directory layout.
 * Keep repository-relative frames; redact other local file locations.
 * This is a path filter, not a credential or vendor-redistribution review.
 * The auditor's home directory is replaced literally first, so a home path
 * containing spaces cannot leave its tail behind the pattern filter.
 */
const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// A path STARTS here only if it is not inside a URL or a longer path: not after a
// host/word character, a dot, a colon, a dash or a slash.
const START = String.raw`(?<![\w.:\-/])`;
// A directory segment may contain spaces, but no separator, colon, quote or bracket.
const DIR = String.raw`[^"'<>()\n\\/:]*`;
// The file a stack frame points at: no spaces, an extension, then :line[:col].
const FILE_AT = String.raw`[^"'<>()\s\\/:]+\.[A-Za-z0-9]{1,8}(?::\d+){1,2}`;
// A local path whose directories contain spaces, ending at the FIRST file:line
// (lazy), so the assertion text after it is preserved.
const spacedPath = (lead) => new RegExp(`${lead}(?:[\\\\/]${DIR})*?[\\\\/]${FILE_AT}`, 'g');
const LOCAL_ROOTS = String.raw`\/(?:Users|home|private|var|tmp|Volumes|opt|mnt|srv|root)`;

export function sanitizeAuditEvidence(value, repositoryRoot, homeDirectory = os.homedir()) {
  const root = repositoryRoot.replaceAll('\\', '/').replace(/\/$/, '');
  const home = (homeDirectory ?? '').replaceAll('\\', '/').replace(/\/$/, '');
  const clean = (text) => {
    let result = text;
    if (repositoryRoot.includes('\\'))
      result = result.replaceAll(`${repositoryRoot.replace(/\\$/, '')}\\`, '');
    // Repository paths become repository-relative, but never inside a URL.
    for (const prefix of new Set([root, encodeURI(root)])) {
      result = result.replace(new RegExp(`${START}(?:file://)?${escapeRegExp(prefix)}/`, 'g'), '');
    }
    if (home.length > 1) {
      // Only a WHOLE path segment, and never inside a URL: '/Users/simone' never
      // cuts into '/Users/simonekugler/...', '/root' never into '.../rootcause'
      // or 'https://example.test/root/guide'.
      const homes = new Set([home, encodeURI(home), (homeDirectory ?? '').replace(/[\\/]$/, '')]);
      for (const prefix of homes) {
        if (prefix.length <= 1) continue;
        result = result.replace(
          new RegExp(`${START}(?:file://)?${escapeRegExp(prefix)}(?=[\\\\/\\s"'<>)]|$)`, 'g'),
          '<local-path>'
        );
      }
    }
    return result
      .replace(spacedPath('<local-path>'), '<local-path>')
      .replace(/<local-path>[\\/][^\s"'<>)]*/g, '<local-path>')
      .replace(spacedPath(String.raw`${START}file:\/\/`), '<local-path>')
      .replace(new RegExp(String.raw`${START}file:\/\/\/[^\s"'<>)]*`, 'g'), '<local-path>')
      .replace(spacedPath(`${START}${LOCAL_ROOTS}`), '<local-path>')
      .replace(new RegExp(`${START}${LOCAL_ROOTS}\\/[^\\s"'<>)]*`, 'g'), '<local-path>')
      .replace(spacedPath(String.raw`\b[A-Za-z]:`), '<local-path>')
      .replace(/\b[A-Za-z]:[\\/][^\s"'<>)]*/g, '<local-path>');
  };
  const visit = (item) => {
    if (typeof item === 'string') return clean(item);
    if (Array.isArray(item)) return item.map(visit);
    if (item !== null && typeof item === 'object')
      return Object.fromEntries(
        Object.entries(item).map(([key, entry]) => [clean(key), visit(entry)])
      );
    return item;
  };
  return visit(value);
}
