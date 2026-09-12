import type { Meta, StoryObj } from '@storybook/react';
import { BottomNavigation } from './BottomNavigation';
import { destinationsFor } from './destinations';

/**
 * `BottomNavigation` state evidence (Minimum UI System §10.5, Shell Spec
 * §8/§9/§10/§25/§26).
 *
 * The five destinations and their order are the spec's own: Home · Goals ·
 * Move · Learn · Community — five intents, not five modules (§10).
 *
 * §25's state list is `DEFAULT · SELECTED · FOCUS · PRESSED · DISABLED /
 * UNAVAILABLE · BADGED (where valid)`, and it adds *"not every destination
 * should support every state"*. Selected and unavailable are below. Focus and
 * pressed are interaction states a reader exercises here with the keyboard and
 * the mouse rather than as separate stories. **Badged is absent on purpose**:
 * Alerts can be badged (§25), and Alerts is a header utility, not a
 * destination — badging a destination would be the gamification §10.5 and
 * §14.2 both refuse.
 *
 * **The story that matters most is the greyscale one.** `SHELL-2` and P01
 * `A11Y-01` require the selected state to survive without colour (§26:
 * *"selected state survives without color"*), so the last story strips colour:
 * the indicator bar and the heavier label must still say which destination the
 * user is on.
 */
const meta = {
  title: 'L2 Shell/BottomNavigation',
  component: BottomNavigation,
  parameters: { layout: 'padded' },
  args: { destinations: destinationsFor('en') },
} satisfies Meta<typeof BottomNavigation>;

export default meta;
type Story = StoryObj<typeof meta>;

/** On Home — the selected destination is the app root. */
export const HomeSelected: Story = { args: { current: '' } };

/** On Goals. */
export const GoalsSelected: Story = { args: { current: 'goals' } };

/**
 * Deep inside a task that keeps the navigation (Goal Detail): no destination is
 * selected, because the user is not ON a destination — Goal Detail belongs to
 * Goals but is its own surface (Spec §5.2, Shell Q-2).
 */
export const NoneSelected: Story = { args: { current: 'goals/[id]' } };

/**
 * The two unavailable destinations, which are unavailable differently.
 *
 * `Community` navigates to its controlled unavailable surface (approved copy,
 * `P-QA5`/`L-QA3`). `Learn` is inert, with the accessible reason supplied here
 * in English only: no approved wording exists in the four locales, so the live
 * shell passes none and Learn renders visible, labelled and inert — exactly as
 * it ships today. This story is where that state is proven.
 */
export const LearnInertWithReason: Story = {
  args: {
    current: '',
    destinations: destinationsFor('en').map((destination) =>
      destination.surface === 'learn'
        ? { ...destination, unavailableLabel: 'Learn — not available yet' }
        : destination
    ),
  },
};

/** §26 / `SHELL-2`: the selected state must survive with every colour removed. */
export const SelectedSurvivesGreyscale: Story = {
  args: { current: 'move' },
  render: (args) => (
    <div style={{ filter: 'grayscale(1)' }}>
      <BottomNavigation {...args} />
    </div>
  ),
};
