/**
 * ShareLinkSection Storybook Stories
 *
 * Demonstrates the copyable share link component.
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { ShareLinkSection } from './ShareLinkSection';

const meta: Meta<typeof ShareLinkSection> = {
  title: 'Share/ShareLinkSection',
  component: ShareLinkSection,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    copySuccess: {
      control: 'boolean',
      description: 'Whether copy was successful (shows "Copied!" state)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ShareLinkSection>;

const DEFAULT_LABELS = {
  shareLink: 'Share link',
  copyLink: 'Copy link',
  copied: 'Copied!',
};

/**
 * Default state
 */
export const Default: Story = {
  args: {
    url: 'https://diboas.com/invite/abc123',
    copySuccess: false,
    onCopy: () => {},
    labels: DEFAULT_LABELS,
  },
};

/**
 * Copy success state
 */
export const CopySuccess: Story = {
  args: {
    url: 'https://diboas.com/invite/abc123',
    copySuccess: true,
    onCopy: () => {},
    labels: DEFAULT_LABELS,
  },
};

/**
 * Long URL
 */
export const LongUrl: Story = {
  args: {
    url: 'https://diboas.com/invite/abc123def456ghi789?ref=storybook&campaign=testing',
    copySuccess: false,
    onCopy: () => {},
    labels: DEFAULT_LABELS,
  },
};
