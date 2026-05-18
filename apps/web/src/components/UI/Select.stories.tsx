/**
 * Select Storybook Stories
 *
 * Demonstrates the @diboas/ui Select primitive — native `<select>` styled
 * via `appearance: none` with form-control variants (outline, ghost) and
 * sizes (sm, default, lg). Ships in Phase 1 PR-1A; calculator consumer
 * retrofit lands in PR-1B.
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { Select } from '@diboas/ui';

const meta: Meta<typeof Select> = {
  title: 'UI/Select',
  component: Select,
  parameters: {
    docs: {
      description: {
        component: `
# Select

Form-control primitive from \`@diboas/ui\`. Wraps a native \`<select>\` styled
via \`appearance: none\` — preserves native keyboard semantics (arrow keys,
type-to-search, Home/End), mobile picker UI, and free WCAG 2.1 AA accessibility.

Variants mirror Button's subset for form controls:
- **outline** (default) — neutral border, white background
- **ghost** — transparent, hover-revealed background

Sizes: \`sm\`, \`default\`, \`lg\`. Default size matches the calculator-input
padding (10px 14px) used across the tools suite.

The \`invalid\` prop sets both \`aria-invalid="true"\` and an error border;
\`disabled\` works as expected. Optional \`trackingEvent\` hooks into GA4 via
\`window.gtag\` after the consumer's \`onChange\` (analytics opt-in).
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['outline', 'ghost'],
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg'],
    },
    invalid: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Select>;

const sampleOptions = (
  <>
    <option value="conservative">Conservative</option>
    <option value="historical">Historical</option>
    <option value="optimistic">Optimistic</option>
  </>
);

const cadenceOptions = (
  <>
    <option value="oneTime">One time</option>
    <option value="daily">Daily</option>
    <option value="weekly">Weekly</option>
    <option value="monthly">Monthly</option>
    <option value="quarterly">Quarterly</option>
    <option value="semiAnnual">Semi-annual</option>
    <option value="yearly">Yearly</option>
  </>
);

/**
 * Default — outline variant + default size.
 */
export const Default: Story = {
  args: {
    'aria-label': 'Scenario',
    children: sampleOptions,
  },
};

/**
 * Ghost — transparent until hovered.
 */
export const Ghost: Story = {
  args: {
    'aria-label': 'Scenario',
    variant: 'ghost',
    children: sampleOptions,
  },
};

/**
 * All sizes side-by-side.
 */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
      <Select aria-label="Small" size="sm">{sampleOptions}</Select>
      <Select aria-label="Default" size="default">{sampleOptions}</Select>
      <Select aria-label="Large" size="lg">{sampleOptions}</Select>
    </div>
  ),
};

/**
 * Invalid state — red border + aria-invalid="true".
 */
export const Invalid: Story = {
  args: {
    'aria-label': 'Scenario',
    invalid: true,
    children: sampleOptions,
  },
};

/**
 * Disabled state.
 */
export const Disabled: Story = {
  args: {
    'aria-label': 'Scenario',
    disabled: true,
    children: sampleOptions,
  },
};

/**
 * Long option list — exercises the Phase 6A.2 cadence dropdown's 7 values.
 * Confirms native keyboard semantics scale: arrow keys cycle through all 7.
 */
export const Cadence: Story = {
  args: {
    'aria-label': 'Contribution cadence',
    children: cadenceOptions,
    defaultValue: 'monthly',
  },
};

/**
 * With tracking hook — emits `gtag('event', 'scenario_changed', ...)` after
 * the consumer's onChange fires. Verify in Storybook actions panel.
 */
export const WithTracking: Story = {
  args: {
    'aria-label': 'Scenario',
    trackingEvent: 'scenario_changed',
    trackingProps: { surface: 'storybook' },
    children: sampleOptions,
  },
};
