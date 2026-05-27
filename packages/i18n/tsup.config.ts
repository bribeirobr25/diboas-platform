import { defineConfig } from 'tsup';

/**
 * i18n package build configuration.
 *
 * Translation JSON files are marked external via esbuild's glob pattern
 * to prevent inlining ~15MB of translation data into dist/.
 * Translations are resolved at runtime by Next.js webpack via dynamic import()
 * in translations-map.ts.
 *
 * Note: utils.ts has a template literal fallback import for subdirectory namespaces.
 * Esbuild cannot resolve template literals at build time — they pass through as-is.
 * This is expected. Those paths resolve at runtime through Next.js webpack.
 */
export default defineConfig({
  entry: {
    index: 'src/index.ts',
    config: 'src/config.ts',
    server: 'src/server.ts',
    client: 'src/client.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-intl', 'next'],
  esbuildOptions(options) {
    options.jsx = 'automatic';
    // Mark all translation JSONs as external — esbuild glob pattern
    // prevents inlining 4 locales x 65+ namespace files into dist
    options.external = [...(options.external || []), '../translations/*'];
  },
});
