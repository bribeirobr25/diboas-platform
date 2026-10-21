import { dirname, join, normalize } from 'node:path';
import ts from 'typescript';
import { parseSource } from './parseSource';

/**
 * Module-import reading shared by the source guards `CI-N3` and `PRU-1`.
 *
 * ⛑ ONE PARSER, EVERY SPELLING IT CAN RESOLVE (R4-7 / R4-8, independent review 2026-10-16).
 * `PRU-1` matched FX modules by substring against the `@/` alias only, so
 * `lib/goalValue.ts` importing `./networkFee` passed; `CI-N3` had already
 * learned that lesson for relative imports, in its own copy. Both now read
 * imports here, through the TypeScript parser: static imports, re-exports,
 * `import()`, `require()` and `import x = require()`, alias `@/` or relative,
 * with or without a written `.js`/`.ts` extension. Type-only imports carry no
 * runtime capability and are excluded. SCOPE LIMIT (stated): a computed path
 * (`import(\`${base}/ledgerClient\`)`) is read by its static head only, and a
 * package specifier (`@diboas/…`) is outside the app and not followed.
 */
export function runtimeImports(text: string, fileName: string): string[] {
  const sf = parseSource(text, fileName);
  const out: string[] = [];
  const visit = (n: ts.Node): void => {
    if (ts.isImportDeclaration(n) && ts.isStringLiteral(n.moduleSpecifier)) {
      const clause = n.importClause;
      /* `import {} from 'x'` still LOADS x at runtime — only a non-empty all-type list is type-only. */
      const typeOnly =
        clause?.isTypeOnly ||
        (clause && !clause.name && clause.namedBindings && ts.isNamedImports(clause.namedBindings)
          ? clause.namedBindings.elements.length > 0 &&
            clause.namedBindings.elements.every((e) => e.isTypeOnly)
          : false);
      if (!typeOnly) out.push(n.moduleSpecifier.text);
    } else if (
      ts.isExportDeclaration(n) &&
      n.moduleSpecifier &&
      ts.isStringLiteral(n.moduleSpecifier)
    ) {
      if (!n.isTypeOnly) out.push(n.moduleSpecifier.text);
    } else if (
      ts.isImportEqualsDeclaration(n) &&
      !n.isTypeOnly &&
      ts.isExternalModuleReference(n.moduleReference) &&
      ts.isStringLiteral(n.moduleReference.expression)
    ) {
      out.push(n.moduleReference.expression.text); /* import x = require('…') */
    } else if (ts.isCallExpression(n) && n.arguments[0]) {
      const callee = n.expression;
      const isLoader =
        callee.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(callee) && callee.text === 'require');
      const arg = n.arguments[0];
      if (isLoader && (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg)))
        out.push(arg.text);
      else if (isLoader && ts.isTemplateExpression(arg))
        out.push(arg.head.text); /* best effort: the static head of a computed path */
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return out;
}

/**
 * The `src/`-relative module a specifier names, WITHOUT an extension — or null
 * for a package import. Independent of whether the file exists, so a guard can
 * fail closed on a spelling it cannot resolve.
 */
export function moduleBase(fromRel: string, spec: string): string | null {
  /* ⛑ A written extension is the same module (R4 correction): under `moduleResolution: bundler`,
     `@/lib/ledgerClient.js` resolves to `ledgerClient.ts`, and it used to resolve to nothing. */
  const bare = spec.replace(/\.(?:[cm]?js|jsx|tsx?)$/, '');
  if (bare.startsWith('@/')) return normalize(bare.slice(2));
  if (bare.startsWith('.')) return normalize(join(dirname(fromRel), bare));
  return null;
}

/** The existing `src/`-relative source file a specifier resolves to, or null. */
export function resolveModule(
  fromRel: string,
  spec: string,
  exists: (rel: string) => boolean
): string | null {
  const base = moduleBase(fromRel, spec);
  if (base === null) return null;
  for (const c of [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`])
    if (/\.tsx?$/.test(c) && exists(c)) return c;
  return null;
}
