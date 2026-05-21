import type { StorybookConfig } from '@storybook/nextjs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM context (Next.js 16 / Storybook 10) — `__dirname` is undefined.
// Reconstruct via `import.meta.url` per the project precedent at
// `apps/web/vitest.config.mts`. Logged + fixed 2026-05-18 during Phase 3A
// kickoff per PENDING_ALL.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: [
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../src/components/Sections/**/*.stories.@(js|jsx|mjs|ts|tsx)'
  ],
  // Phase 3A cleanup (2026-05-18): only installed addons referenced. The 4
  // removed entries (addon-links, addon-essentials, addon-interactions,
  // addon-viewport) are Storybook 10 auto-included or were unused — removing
  // them clears the "Could not resolve addon" warnings without functional loss.
  addons: [
    '@storybook/addon-onboarding',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  },
  // Phase 3A cleanup (2026-05-18): removed manual CSS-modules override that
  // hardcoded `style-loader`/`css-loader`/`postcss-loader` — these loaders are
  // not installed under pnpm strict-resolution, AND `@storybook/nextjs` framework
  // configures CSS modules natively in Storybook 10. The manual override was
  // both redundant and broken. Path aliases (`@/*`) are also handled natively
  // by the Next.js framework from `apps/web/tsconfig.json` `paths`.
  webpackFinal: async (config) => {
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': path.resolve(__dirname, '../src'),
        '@/components': path.resolve(__dirname, '../src/components'),
        '@/lib': path.resolve(__dirname, '../src/lib'),
        '@/config': path.resolve(__dirname, '../src/config'),
        '@/styles': path.resolve(__dirname, '../src/styles'),
      };
    }
    return config;
  },
  staticDirs: ['../public'],
};

export default config;