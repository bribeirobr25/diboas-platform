/**
 * Until-exhausted translation-array reading (Phase 1, learn redesign plan).
 *
 * Lesson copy stores paragraphs as JSON arrays; react-intl flattens them to
 * indexed keys (`<ns>.beat1.body.0`, `.1`, ...). The variant previously read
 * FIXED counts, which desynced from the copy (the B-0 bug PR #422 fixed with
 * a temporary count contract). This helper reads until the catalog runs out,
 * making the JSON the single source of truth for paragraph counts.
 *
 * `messages` is react-intl's flattened catalog (`intl.messages`); membership
 * is a plain key lookup, so this is O(n) in the array length.
 */

const MAX_ITEMS = 50; // safety bound; no lesson beat is remotely this long

export function readMessageArray(
  messages: Record<string, unknown>,
  prefix: string,
  formatItem: (id: string) => string
): string[] {
  const out: string[] = [];
  for (let i = 0; i < MAX_ITEMS; i++) {
    const id = `${prefix}.${i}`;
    if (!(id in messages)) break;
    out.push(formatItem(id));
  }
  return out;
}
