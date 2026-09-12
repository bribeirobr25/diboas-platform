import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

/**
 * `Button` — the first story in this app, and the proof that the harness works
 * (register `5.277`).
 *
 * It shows ONLY what the component implements: `primary`, `secondary`,
 * `fullWidth`, and the native `disabled`. Minimum UI System §11.1 closes a
 * wider set — `tertiary/text` and `destructive` variants, and `hover` /
 * `pressed` / `loading` states — and none of those exist in the code, so none
 * of them gets a story. A story for a variant the component cannot render
 * would be exactly the kind of claim this project treats as a defect.
 *
 * The toolbar carries appearance (light/dark) × mode (neutral/practice/real) —
 * the Minimum UI System §4.2 matrix — so every state below can be read in all
 * six themes. Contrast itself is asserted mechanically for all six in
 * `src/styles/__tests__/tokenArchitecture.test.ts`; the stories are where a
 * human checks that the state still *reads* as what it is.
 */
const meta = {
  title: 'L3 Primitives/Button',
  component: Button,
  parameters: { layout: 'centered' },
  args: { children: 'Put it to work' },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The one dominant next action (§11.1: "primary = one dominant next action"). */
export const Primary: Story = { args: { variant: 'primary' } };

/** The safe alternative — Cancel, Back, "not now". */
export const Secondary: Story = { args: { variant: 'secondary' } };

/** Full-width: the sheet/CTA placement, where the action owns the row. */
export const FullWidth: Story = { args: { variant: 'primary', fullWidth: true } };

/**
 * Disabled. The app's rule is that a disabled control must be honest about WHY
 * elsewhere on the surface — a disabled button alone explains nothing (the
 * `5.201`/`5.202` lesson: an affordance is a claim).
 */
export const Disabled: Story = { args: { variant: 'primary', disabled: true } };

/** Both variants side by side — the pair users actually see in a sheet. */
export const Pair: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
      <Button {...args} variant="primary">
        Confirm
      </Button>
      <Button {...args} variant="secondary">
        Cancel
      </Button>
    </div>
  ),
};
