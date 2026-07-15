/**
 * TalkQuiz Storybook Stories
 *
 * Retrieval-practice quiz for talk pages (Phase 3, Slice A). Correctness
 * comes from the lesson registry (`blocks.quiz.correctIndexes`); all display
 * strings resolve from i18n (`learn.quiz.*` chrome + the talk namespace's
 * `quiz.*` content), so the locale switcher exercises all 4 locales.
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { LESSONS } from '@/lib/learn';
import { TalkQuizFactory } from './TalkQuizFactory';

const meta: Meta<typeof TalkQuizFactory> = {
  title: 'Sections/TalkQuiz',
  component: TalkQuizFactory,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# TalkQuiz

Two graded multiple-choice questions with instant honest feedback (no
retries-gating, no score-shaming), an ungraded reflection prompt (never a
data capture), and a copy-to-share line (never share-to-unlock). One
answer per question; the aggregate-only \`learn_quiz_submitted\` event
fires when the last graded answer lands.
        `,
      },
    },
  },
  argTypes: {
    enableAnalytics: {
      control: 'boolean',
      description: 'Enable analytics tracking',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TalkQuizFactory>;

export const Talk1: Story = {
  args: {
    lesson: LESSONS['compound-interest'],
    enableAnalytics: false,
  },
};
