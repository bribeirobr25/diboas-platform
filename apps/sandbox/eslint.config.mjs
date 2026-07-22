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
];
