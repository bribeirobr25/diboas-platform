import type { Meta, StoryObj } from '@storybook/react';
import { ModeMarker } from './ModeMarker';

/**
 * `ModeMarker` state evidence (Minimum UI System §10.2).
 *
 * The labels below are the CANONICAL ones, quoted from the Shared App Shell
 * Spec §7.1/§7.2 — `PRACTICE · SIMULATED` and `REAL MONEY`. They live here, in
 * the evidence surface, rather than in the message catalogue: no
 * authority-approved wording exists for the other three locales yet, and the
 * label is Legal-adjacent (it *"must keep communicating no-real-value"*). The
 * live shell mounts the marker when that label is approved in all four; until
 * then this is where its states are proven.
 *
 * The states §10.2 closes are `light` · `dark` · `compact` · `standard`.
 * Light/dark are the toolbar's appearance switch (every story below can be read
 * in both, and in all three modes); compact/standard are the two stories.
 *
 * **Greyscale is the test that matters.** Mode distinction must survive without
 * colour (§7.5, `SHELL-2`, P01 `A11Y-01`), so the last story puts both markers
 * side by side under a greyscale filter: if the two are still tellable apart,
 * the words are doing the work, not the hue.
 */
const meta = {
  title: 'L2 Shell/ModeMarker',
  component: ModeMarker,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ModeMarker>;

export default meta;
type Story = StoryObj<typeof meta>;

const PRACTICE_LABEL = 'PRACTICE · SIMULATED';
const REAL_LABEL = 'REAL MONEY';

export const Practice: Story = {
  args: { mode: 'practice', label: PRACTICE_LABEL },
};

export const Real: Story = {
  args: { mode: 'real', label: REAL_LABEL },
};

export const Compact: Story = {
  args: { mode: 'practice', label: PRACTICE_LABEL, size: 'compact' },
};

/**
 * Neutral renders NOTHING — Welcome, Consent and Entry Readiness carry no
 * financial mode marker (Spec §7.3; Product `P-QA4`, Legal `L-QA2`). The story
 * exists so that "nothing" is an asserted state rather than an omission.
 */
export const NeutralRendersNothing: Story = {
  args: { mode: 'neutral', label: PRACTICE_LABEL },
  render: (args) => (
    <div data-testid="neutral-slot" style={{ border: '1px dashed var(--sb-border-default)' }}>
      <ModeMarker {...args} />
    </div>
  ),
};

/** The §7.5 check: still distinguishable with every colour removed. */
export const SurvivesGreyscale: Story = {
  args: { mode: 'practice', label: PRACTICE_LABEL },
  render: () => (
    <div style={{ filter: 'grayscale(1)', display: 'flex', gap: 'var(--spacing-md)' }}>
      <ModeMarker mode="practice" label={PRACTICE_LABEL} />
      <ModeMarker mode="real" label={REAL_LABEL} />
    </div>
  ),
};
