import os from 'node:os';

/**
 * Public audit evidence must not disclose the auditor's local directory layout.
 * Keep repository-relative frames; redact other local file locations.
 * This is a path filter, not a credential or vendor-redistribution review.
 * The auditor's home directory is replaced literally first, so a home path
 * containing spaces cannot leave its tail behind the pattern filter.
 */
const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function sanitizeAuditEvidence(value, repositoryRoot, homeDirectory = os.homedir()) {
  const root = repositoryRoot.replaceAll('\\', '/').replace(/\/$/, '');
  const home = (homeDirectory ?? '').replaceAll('\\', '/').replace(/\/$/, '');
  const clean = (text) => {
    let result = text;
    if (repositoryRoot.includes('\\'))
      result = result.replaceAll(`${repositoryRoot.replace(/\\$/, '')}\\`, '');
    for (const prefix of new Set([root, encodeURI(root)])) {
      result = result.replaceAll(`file://${prefix}/`, '').replaceAll(`${prefix}/`, '');
    }
    if (home.length > 1) {
      // Only a WHOLE path segment: the home must be followed by a separator, a
      // delimiter or the end, so '/Users/simone' never cuts into
      // '/Users/simonekugler/...' and '/root' never into '.../rootcause'.
      const homes = new Set([home, encodeURI(home), (homeDirectory ?? '').replace(/[\\/]$/, '')]);
      for (const prefix of homes) {
        if (prefix.length <= 1) continue;
        result = result.replace(
          new RegExp(`(?:file://)?${escapeRegExp(prefix)}(?=[\\\\/\\s"'<>)]|$)`, 'g'),
          '<local-path>'
        );
      }
    }
    return result
      .replace(/file:\/\/\/[^\s"'<>)]*/g, '<local-path>')
      .replace(/<local-path>[\\/][^\s"'<>)]*/g, '<local-path>')
      .replace(
        // Only where a path STARTS (not inside a URL such as https://x.org/opt/guide).
        /(?<![\w.:\-/])\/(?:Users|home|private|var|tmp|Volumes|opt|mnt|srv|root)\/[^\s"'<>)]*/g,
        '<local-path>'
      )
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
