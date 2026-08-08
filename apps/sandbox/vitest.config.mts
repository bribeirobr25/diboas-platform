import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    // Default stays node (lib/ledger suites). Component tests opt into DOM via
    // a per-file `// @vitest-environment happy-dom` annotation — the same split
    // the web app uses. Hermeticity: happy-dom never loads iframe pages here.
    environment: 'node',
    environmentOptions: {
      happyDOM: {
        settings: { disableIframePageLoading: true },
      },
    },
    globals: true,
    include: ['src/**/__tests__/**/*.test.ts', 'src/**/__tests__/**/*.test.tsx'],
    setupFiles: ['./src/test/setup.ts'],
  },
});
