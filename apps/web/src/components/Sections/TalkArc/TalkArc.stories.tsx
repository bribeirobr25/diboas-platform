/**
 * TalkArc Storybook Stories
 *
 * The registry-driven 7-talk series arc (Phase 2 of the learn redesign).
 * Live talks render as linked cards; announced talks render as honest
 * non-interactive coming-soon cards. Copy resolves from `learn.arc.*`.
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { TalkArcFactory } from './TalkArcFactory';

const meta: Meta<typeof TalkArcFactory> = {
  title: 'Sections/TalkArc',
  component: TalkArcFactory,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# TalkArc

The 7-talk "Real Talk" series spine, in registry (prev/next) order.
Series position, status, slug, and read time all come from the lesson
registry; titles and tagline lines come from \`learn.arc.<lessonId>.*\`.
Announced cards carry no interactive semantics (a11y B-2) and emit a
one-shot impression event at >=50% visibility.
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default'],
      description: 'Arc layout variant',
    },
    enableAnalytics: {
      control: 'boolean',
      description: 'Enable analytics tracking',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TalkArcFactory>;

export const Default: Story = {
  args: {
    variant: 'default',
    enableAnalytics: false,
  },
};
