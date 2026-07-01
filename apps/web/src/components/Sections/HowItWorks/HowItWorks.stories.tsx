/**
 * HowItWorks Storybook Stories
 *
 * The three-up "How it works" section: product screens in phone frames with
 * one-line captions. `Placeholder` is the scaffold state (no images yet);
 * `WithImages` shows the filled state once the rendered mockups exist.
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { HowItWorks } from './HowItWorksFactory';
import type { HowItWorksConfig } from '@/config/howItWorks';

const meta: Meta<typeof HowItWorks> = {
  title: 'Sections/HowItWorks',
  component: HowItWorks,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# HowItWorks (three-up)

Three product screens in phone frames (side-by-side on desktop, stacked on
mobile), each with a one-line caption. An empty \`image\` renders a labelled
placeholder frame so the section is previewable before the rendered mockups
land in \`public/assets/images/how-it-works/\`.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof HowItWorks>;

const BASE_STEPS = [
  {
    caption: 'Pick a job for your money.',
    imageAlt: 'A diBoaS screen for setting a savings goal.',
  },
  {
    caption: 'See the path first.',
    imageAlt: 'A diBoaS screen showing the projected savings path.',
  },
  { caption: "Move when you're ready.", imageAlt: 'A diBoaS screen for adding money.' },
];

const makeConfig = (images: string[]): HowItWorksConfig => ({
  variant: 'threeUp',
  content: {
    header: 'How it works',
    steps: BASE_STEPS.map((s, i) => ({ ...s, image: images[i] ?? '' })),
  },
  seo: { ariaLabel: 'How it works' },
  analytics: { sectionId: 'how-it-works-visual-b2c', category: 'landing-b2c' },
});

export const Placeholder: Story = {
  args: { config: makeConfig(['', '', '']) },
};

export const WithImages: Story = {
  args: {
    config: makeConfig([
      '/assets/images/seamless-exchange.avif',
      '/assets/images/money-simplified.avif',
      '/assets/images/future-in-hand.avif',
    ]),
  },
};
