import nextConfig from 'eslint-config-next';

/**
 * diBoaS Sandbox — ESLint flat config (mirrors the apps/web approach:
 * eslint-config-next native flat config, no FlatCompat).
 */
export default [
  ...nextConfig,
  {
    ignores: ['.next/**', 'node_modules/**'],
  },
  /**
   * Gate `VIEW-1` — the purity of the view-model seam (architecture plan §3.2
   * rule 3, §9.3 mechanism 1).
   *
   * WHY: the seam's whole value is that it is testable with no DOM and no
   * network. A selector that reaches for React, a route, a provider or a
   * formatter is no longer a pure function of its arguments, and the honesty
   * assertions that live in `view/` stop being cheap to write — which is how
   * they end up not being written, and how money arithmetic drifts back into
   * components.
   *
   * `useFormatters` is banned on purpose even though it is harmless-looking: a
   * selector that formats has decided how a value is PRESENTED, which is the
   * component's job. Selectors return display-ready values (fixed-2dp strings),
   * never formatted ones.
   *
   * Orchestration fetches; selectors receive data as arguments.
   */
  {
    files: ['src/view/**/*.ts', 'src/view/**/*.tsx'],
    ignores: ['src/view/**/__tests__/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'react', message: 'VIEW-1: selectors are pure — no React in view/.' },
            { name: 'react-dom', message: 'VIEW-1: selectors are pure — no React in view/.' },
            {
              name: 'react-intl',
              message: "VIEW-1: formatting is the component's job, not the selector's.",
            },
            {
              name: '@/hooks/useFormatters',
              message: 'VIEW-1: selectors return display-ready values, never formatted ones.',
            },
          ],
          patterns: [
            {
              group: ['next', 'next/*'],
              message: 'VIEW-1: no framework in view/ — a selector must not know it is in Next.',
            },
            {
              group: ['@/lib/market', '@/lib/market/*'],
              message: 'VIEW-1: no I/O in view/ — orchestration fetches, selectors receive.',
            },
            {
              group: ['@/lib/ledgerClient', '@/lib/ledger/*'],
              message: 'VIEW-1: no ledger writes from a selector — view/ derives, never mutates.',
            },
            {
              group: ['@/components/*'],
              message: 'VIEW-1: the dependency direction is components -> view, never back.',
            },
          ],
        },
      ],
    },
  },
];
