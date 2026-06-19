import type { Meta, StoryObj } from '@storybook/nextjs';
import { ResultMoment } from './ResultMomentFactory';

/**
 * ResultMoment is purely presentational — every string/number is pre-resolved by
 * the calling calculator. These stories pass static mock values (no live market
 * data) to exercise the layout, chart, supporting rows, CTA, and share control.
 */
const meta: Meta<typeof ResultMoment> = {
  title: 'Sections/ResultMoment',
  component: ResultMoment,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof ResultMoment>;

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(n);

export const CurrencyDepreciation: Story = {
  args: {
    eyebrow: 'Currency depreciation',
    headlineValue: 16105,
    headlineFormatter: fmt,
    headlineCaption: 'Digital dollar at diBoaS',
    chart: {
      series: [
        { id: 'cash', label: 'If kept in cash', values: [10000, 7350], variant: 'muted' },
        { id: 'bank', label: 'Bank yield', values: [10000, 13380], variant: 'muted' },
        { id: 'diboas', label: 'diBoaS', values: [10000, 16105], variant: 'primary' },
      ],
      xCaptions: ['Today', 'In 5 years'],
      formatValue: fmt,
      ariaLabel:
        'Over 5 years, BRL kept in cash falls to R$7,350, a bank reaches R$13,380, and diBoaS reaches R$16,105.',
    },
    supportingPoints: [
      {
        id: 'cash',
        label: 'If kept in cash',
        value: fmt(7350),
        note: 'USD-equivalent after 6.0% / year change vs the dollar.',
        variant: 'muted',
      },
      {
        id: 'bank',
        label: 'Bank yield',
        value: fmt(13380),
        note: '6.00% local bank rate',
        variant: 'muted',
      },
      {
        id: 'diboas',
        label: 'Digital dollar at diBoaS',
        value: fmt(16105),
        note: '10% historical return, held in digital dollar',
        variant: 'primary',
      },
    ],
    disclaimer:
      'Forward depreciation: horizon-matched CAGR derived from the 5-year trailing FX window. Educational projection, not financial advice.',
    cta: {
      headline: 'This is what fair access changes.',
      body: 'Join the waitlist to put it to work for real.',
      label: 'Claim your spot',
      href: '/',
    },
    share: {
      onShare: () => {},
      label: 'Share this result',
      copiedLabel: 'Link copied!',
      copied: false,
    },
  },
};

export const Copied: Story = {
  args: {
    ...CurrencyDepreciation.args,
    share: {
      onShare: () => {},
      label: 'Share this result',
      copiedLabel: 'Link copied!',
      copied: true,
    },
  },
};
