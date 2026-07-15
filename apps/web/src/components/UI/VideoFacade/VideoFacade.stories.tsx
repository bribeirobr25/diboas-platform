/**
 * VideoFacade Storybook Stories
 *
 * Click-to-load YouTube-nocookie facade (Phase 3 Slice B, D-1). No iframe
 * exists before the click; the click is both the performance moment and the
 * privacy-disclosure moment. In production it renders only when a talk's
 * registry entry carries a youtube id for the active locale (ships dark).
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { VideoFacadeFactory } from './VideoFacadeFactory';

const meta: Meta<typeof VideoFacadeFactory> = {
  title: 'UI/VideoFacade',
  component: VideoFacadeFactory,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# VideoFacade

Idle: own thumbnail + native play button + privacy note (no YouTube
request of any kind). Click: swaps in the youtube-nocookie iframe and
fires \`learn_video_started\`. If the iframe never loads (~4s), the honest
fallback + "Watch on YouTube" link take over. Watch-time completion is
deliberately not tracked (YouTube Studio owns that KPI).
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
type Story = StoryObj<typeof VideoFacadeFactory>;

export const Idle: Story = {
  args: {
    videoId: 'dQw4w9WgXcQ',
    title: 'How Money Really Grows',
    thumbnailSrc: '/assets/navigation/learn-banner.avif',
    lessonId: 'compound-interest',
    videoLocale: 'en',
    enableAnalytics: false,
  },
};
