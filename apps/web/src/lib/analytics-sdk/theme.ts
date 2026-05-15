/**
 * Theme bridge for the analytics-product SDK.
 *
 * Maps the SDK's required theme tokens (per
 * `diboas-analytics/docs/sdk/09_analytics_client_sdk_specification.md` §5.3
 * + `diboas-analytics/docs/integration/13_host_integration_guides/diboas_platform.md` §6)
 * to diBoaS design tokens. Consumed via `<AnalyticsProvider theme={...} />`
 * on every market surface.
 *
 * NF6 (rev-3): every regime band maps to a semantic accessible token
 * (`--text-success-accessible`, `--text-brand-accessible`,
 * `--color-text-secondary`, `--color-amber-700`, `--text-error-accessible`).
 * All values verified ≥ WCAG AA 4.5:1 against white.
 *
 * Iteration 5 swap deletes this file when `@analytics-platform/client` ships.
 */

export const diboasAnalyticsTheme = {
  // Surfaces
  '--analytics-surface-main': 'var(--color-white)',
  '--analytics-surface-card': 'var(--color-slate-50)',

  // Text
  '--analytics-text-primary': 'var(--color-text-primary)',
  '--analytics-text-muted': 'var(--color-text-secondary)',
  '--analytics-text-faint': 'var(--color-slate-500)',

  // Regime palette — semantic accessible tokens (all WCAG AA on white).
  // - emerald-700:  5.53:1
  // - teal-700:     4.85:1
  // - slate-600:    7.55:1
  // - amber-700:    4.52:1
  // - red-600:      4.63:1
  '--analytics-regime-favorable': 'var(--text-success-accessible)',
  '--analytics-regime-constructive': 'var(--text-brand-accessible)',
  '--analytics-regime-mixed': 'var(--color-text-secondary)',
  '--analytics-regime-defensive': 'var(--color-amber-700)',
  '--analytics-regime-hostile': 'var(--text-error-accessible)',

  // Borders / radii / typography
  '--analytics-border-default': 'var(--color-slate-200)',
  '--analytics-border-subtle': 'var(--color-slate-100)',
  // Tailwind's `rounded-2xl` = 1rem = 16px; design system uses class not variable.
  '--analytics-radius-card': '16px',
  '--analytics-font-family': 'var(--font-family-sans)',
} as const;

export type DiboasAnalyticsTheme = typeof diboasAnalyticsTheme;
