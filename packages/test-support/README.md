# @diboas/test-support

Test-only helpers for the repository's source-scanning guards. Never imported by runtime code; a
devDependency of `apps/web`, `apps/sandbox`, `packages/banking` and `packages/defi`.

- `stripComments(text, fileName?)` — removes comments by the TypeScript parser, never by regex: a
  `//` inside a string or a URL is code. Pass the file name for `.tsx` sources.
- `parseSource(text, fileName)` — a parsed source file with parent pointers.

Every source-scanning test strips comments through this package (register `5.623`); a test that
defines its own `//` comment regex fails `apps/sandbox/src/test/__tests__/stripComments.test.ts`.
