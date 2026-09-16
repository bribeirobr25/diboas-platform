/**
 * COPY-3 scope extension (`5.371` blind spot 3).
 *
 * COPY-3 asserts the message CATALOGUE, so a user-facing string hardcoded into a
 * component is outside it BY DESIGN — and system-gate X6 proved that gap is real
 * rather than theoretical: planting `<p>Welcome to the Sandbox — play money
 * only.</p>` left both `messages.test.ts` and `check:ux-greps` green (the
 * latter's heuristic only sees JSX text on lines carrying `className`, which its
 * own Part 4 documents).
 *
 * This module finds text a USER CAN READ in a component source file, so the gate
 * can hold F-R4 over it too. It quotes CONTEXT rather than maintaining an
 * exception list: the 13 legitimate `sandbox` occurrences in this app (a font CSS
 * variable, the health route's `app: 'sandbox'` field, `SandboxNotification`
 * types, two storage keys, a log tag, a scope literal, comments) are all invisible
 * here because none of them is rendered text. Narrowing by context is what keeps
 * a guard honest; narrowing by exception is what hides the next defect.
 *
 * Pure: no fs, no React — the test walks the tree, as CID-1 does.
 */

export interface RenderedTextMatch {
  /** The rendered text containing the hit. */
  text: string;
  /** 1-based line, for the failure message. */
  line: number;
  /** Which rendered context matched, so a failure says WHY it is user-visible. */
  context: 'jsx-text' | 'aria-label' | 'title' | 'placeholder' | 'alt';
}

/**
 * Contexts a reader actually perceives. JSX text requires no `{`/`}`/`<`/`>`
 * between the delimiters, which is what keeps TypeScript generics
 * (`new Set<Action>(['withdraw'])`) out: the span between `>` and `<` there is
 * code, and — decisively — it does not contain the searched word anyway.
 */
const CONTEXTS: { re: RegExp; context: RenderedTextMatch['context'] }[] = [
  /* Single-line spans only, and never one containing `;` or `=`.
   *
   * ⚑ The first revision used `[^<>{}]+`, which spans NEWLINES — so it ran from
   * the closing `>` of `useParams<{ locale: string }>` to the `<` of `<main` in
   * `GateForm.tsx` and "found" the `enterSandbox` IDENTIFIER, a false positive on
   * the very first clean run. A real JSX text node sits on one line here and
   * contains neither `;` nor `=`; code between two angle brackets contains at
   * least one. Scope limit, stated rather than discovered later: JSX prose
   * wrapped across several lines is NOT scanned. That is acceptable because
   * SANDBOX_RULES R-3 puts user-facing prose in the catalogue, never inline. */
  { re: />([^<>{}\n;=]+)</g, context: 'jsx-text' },
  { re: /\baria-label=["']([^"']+)["']/g, context: 'aria-label' },
  { re: /\btitle=["']([^"']+)["']/g, context: 'title' },
  { re: /\bplaceholder=["']([^"']+)["']/g, context: 'placeholder' },
  { re: /\balt=["']([^"']+)["']/g, context: 'alt' },
];

/** Every rendered text span in a source file whose text matches `pattern`. */
export function findRenderedText(source: string, pattern: RegExp): RenderedTextMatch[] {
  const found: RenderedTextMatch[] = [];
  for (const { re, context } of CONTEXTS) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(source)) !== null) {
      const text = m[1].trim();
      // A span with no letters is punctuation or layout, never prose.
      if (!text || !/[A-Za-z]/.test(text)) continue;
      if (!pattern.test(text)) continue;
      found.push({ text, line: source.slice(0, m.index).split('\n').length, context });
    }
  }
  return found.sort((a, b) => a.line - b.line);
}
