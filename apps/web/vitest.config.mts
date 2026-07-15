import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    // Hermeticity (Phase-3 audit, 2026-07-16): happy-dom fetches iframe srcs
    // for real by default, so the VideoFacade suite was firing live network
    // requests at youtube-nocookie from unit tests. Unit tests never need a
    // real iframe document; the component under test only cares about the
    // element + its events.
    environmentOptions: {
      happyDOM: {
        settings: { disableIframePageLoading: true },
      },
    },
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['node_modules', '.next'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules', '.next', '**/*.stories.tsx', '**/*.d.ts'],
    },
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
