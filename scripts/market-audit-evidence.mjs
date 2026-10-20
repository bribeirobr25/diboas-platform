/**
 * Public audit evidence must not disclose the auditor's local directory layout.
 * Keep repository-relative frames; redact other local file locations.
 * This is a path filter, not a credential or vendor-redistribution review.
 */
export function sanitizeAuditEvidence(value, repositoryRoot) {
  const root = repositoryRoot.replaceAll('\\', '/').replace(/\/$/, '');
  const clean = (text) => {
    let result = text;
    if (repositoryRoot.includes('\\'))
      result = result.replaceAll(`${repositoryRoot.replace(/\\$/, '')}\\`, '');
    for (const prefix of new Set([root, encodeURI(root)])) {
      result = result.replaceAll(`file://${prefix}/`, '').replaceAll(`${prefix}/`, '');
    }
    return result
      .replace(/file:\/\/\/[^\s"'<>)]*/g, '<local-path>')
      .replace(/\/(?:Users|home|private|var|tmp)\/[^\s"'<>)]*/g, '<local-path>')
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
