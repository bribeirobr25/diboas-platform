import ts from 'typescript';
import { parseSource } from './parseSource';

/**
 * Remove comments from TypeScript/TSX source, for source-scanning guards.
 *
 * ⛑ BY THE PARSER, NOT BY REGEX (P0 review, PB-3). A regex stripper deletes
 * everything after `//` — including the rest of a line holding a URL in a
 * string, so `fetch("https://x/kyc"); const kycStatus = …` was never scanned.
 * Comment ranges come from the TypeScript parser, which already knows where
 * strings, templates and regex literals end. Line structure is preserved, so a
 * guard's reported line numbers stay true. Shared by `CI-N1`, `CI-N3` and `PRU-1`.
 *
 * ⛑ JSX TEXT IS NOT TRIVIA (independent review, 2026-10-15). The trivia scanner
 * reads `<p> // docs</p>` as a comment running to the end of the LINE, which
 * blanked any code after it. A comment range that starts inside a `JsxText`
 * span is visible text, so it is kept.
 *
 * ⛑ NEVER WALK INTO A JSDOC NODE (R4-3, independent review 2026-10-16). JSDoc
 * nodes are children of the declaration they document; asking for comment
 * ranges from a position INSIDE `/** … // old *\/` read `// old *\/ const …`
 * as a line comment and blanked the real code after the closing `*\/`. The
 * JSDoc block itself is still found, as the leading comment of its node.
 */
export function stripComments(text: string, fileName = 'x.ts'): string {
  const sf = parseSource(text, fileName);
  const ranges = new Map<number, number>();
  const jsxText: Array<[number, number]> = [];
  const visit = (node: ts.Node): void => {
    if (node.kind >= ts.SyntaxKind.FirstJSDocNode && node.kind <= ts.SyntaxKind.LastJSDocNode)
      return;
    if (ts.isJsxText(node)) jsxText.push([node.pos, node.end]);
    for (const r of ts.getLeadingCommentRanges(text, node.getFullStart()) ?? []) {
      ranges.set(r.pos, r.end);
    }
    for (const r of ts.getTrailingCommentRanges(text, node.getEnd()) ?? []) {
      ranges.set(r.pos, r.end);
    }
    node.getChildren(sf).forEach(visit);
  };
  visit(sf);
  const chars = text.split('');
  for (const [pos, end] of ranges) {
    if (jsxText.some(([from, to]) => pos >= from && pos < to)) continue;
    for (let i = pos; i < end; i += 1) if (chars[i] !== '\n') chars[i] = ' ';
  }
  return chars.join('');
}
