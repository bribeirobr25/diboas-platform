import os from 'node:os';

/**
 * Public audit evidence must not disclose the auditor's local directory layout.
 * Keep repository-relative frames; redact other local file locations.
 * This is a path filter, not a credential or vendor-redistribution review.
 * The auditor's home directory is replaced literally first, so a home path
 * containing spaces cannot leave its tail behind the pattern filter.
 */
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
      for (const prefix of new Set([home, encodeURI(home)])) {
        result = result
          .replaceAll(`file://${prefix}/`, '<local-path>/')
          .replaceAll(`${prefix}/`, '<local-path>/')
          .replaceAll(prefix, '<local-path>');
      }
    }
    return result
      .replace(/file:\/\/\/[^\s"'<>)]*/g, '<local-path>')
      .replace(/<local-path>\/[^\s"'<>)]*/g, '<local-path>')
      .replace(
        /\/(?:Users|home|private|var|tmp|Volumes|opt|mnt|srv|root)\/[^\s"'<>)]*/g,
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
