import ts from 'typescript';

/**
 * Parse TypeScript / TSX source for the source-reading guards (`stripComments`,
 * `importGraph`). TSX only for `.tsx`: parsed as TSX, a `.ts` file's `<T>(x) =>`
 * or `<Type>v` misreads. Parent pointers are set, because every caller walks up.
 */
export function parseSource(text: string, fileName: string): ts.SourceFile {
  return ts.createSourceFile(
    fileName,
    text,
    ts.ScriptTarget.Latest,
    true,
    fileName.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );
}
