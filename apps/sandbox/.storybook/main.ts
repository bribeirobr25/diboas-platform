import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/nextjs';

/**
 * Storybook for the Practice app — the EVIDENCE surface, not a gallery.
 *
 * Register `5.277`: the sandbox had no Storybook at all, while the GO requires
 * "Storybook/test/gate evidence" and Strategy Canon §4.3 makes it the consumer
 * that justifies building the five L2 shell components structurally in I-1:
 * *"Storybook state evidence for applicable closed shell states"*. So a story
 * here is the proof that a component's CLOSED states exist and survive all six
 * themes — the states Product has NOT closed (the App Header / Bottom
 * Navigation / Alerts spec gaps in plan §7.7) get no invented story.
 *
 * ESM context (Next 16 / Storybook 10): `__dirname` is undefined — reconstruct
 * it from `import.meta.url`, the same precedent as `apps/web/.storybook/main.ts`
 * and `vitest.config.mts`.
 */
const dirname = path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs'],
  framework: { name: '@storybook/nextjs', options: {} },
  // No telemetry. This app's own analytics are consent-gated by policy; a build
  // tool reporting usage from a developer machine is the same question answered
  // the same way. (apps/web has not been changed — that is its own call.)
  core: { disableTelemetry: true },
  // The hero/atmosphere assets live in `public/`; without this the shell
  // stories would render their bands empty and a missing asset would look like
  // a deliberate design.
  staticDirs: ['../public'],
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
  },
  webpackFinal: async (webpackConfig) => {
    // The app's own `@/*` alias. `@storybook/nextjs` reads `tsconfig` paths for
    // most cases; stating it here keeps a story that imports `@/lib/...`
    // working even if that inference changes.
    webpackConfig.resolve = webpackConfig.resolve ?? {};
    webpackConfig.resolve.alias = {
      ...(webpackConfig.resolve.alias ?? {}),
      '@': path.resolve(dirname, '../src'),
    };
    return webpackConfig;
  },
};

export default config;
