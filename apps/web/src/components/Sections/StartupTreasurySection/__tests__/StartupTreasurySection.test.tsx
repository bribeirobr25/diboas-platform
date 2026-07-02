/**
 * StartupTreasurySection — render contract.
 *
 * Static, config-driven B2B section. With useConfigTranslation mocked to identity
 * (the mock config already carries literal copy), we assert the intro (eyebrow +
 * headline + subhead), every body paragraph, the 3-beat mechanic cards (icon +
 * label), the supporting image, the bridge line, and both CTAs with their hrefs.
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...(props as Record<string, never>)} />;
  },
}));

// Identity — the mock config below carries literal strings, not i18n keys.
vi.mock('@/lib/i18n/config-translator', () => ({
  useConfigTranslation: (c: unknown) => c,
}));

vi.mock('@/components/UI/LocaleLink', () => ({
  LocaleLink: ({
    href,
    children,
    onClick,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
  }) => (
    <a href={href} onClick={onClick} className={className} data-cta="secondary">
      {children}
    </a>
  ),
}));

vi.mock('@/components/UI/CTAButtonLink', () => ({
  CTAButtonLink: ({
    href,
    children,
    onClick,
  }: {
    href: string;
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <a href={href} onClick={onClick} data-cta="primary">
      {children}
    </a>
  ),
}));

vi.mock('@/components/UI/LucideIcon', () => ({
  ArrowRight: () => <span data-icon="arrow" />,
  ShieldCheck: () => <span data-icon="shield" />,
  Zap: () => <span data-icon="zap" />,
  RefreshCw: () => <span data-icon="refresh" />,
}));

import { StartupTreasurySection } from '../StartupTreasurySection';
import type { StartupTreasurySectionConfig } from '@/config/startupTreasury';

const CONFIG: StartupTreasurySectionConfig = {
  content: {
    eyebrow: 'FOR FUNDED STARTUPS',
    headline: "You didn't raise it to watch it sit still.",
    subheadline: 'Most of your round is runway you won’t touch for months.',
    body: ['A round lands.', 'It waits at one bank.', 'diBoaS puts the excess to work.'],
  },
  steps: [
    { id: 'set-floor', label: 'Set the floor' },
    { id: 'put-to-work', label: 'Put the excess to work' },
    { id: 'pull-back', label: 'Pull it back anytime' },
  ],
  image: { src: '/treasury.avif', alt: 'The floor control', position: 'right' },
  cta: {
    bridgeLine: 'Run it on your own runway.',
    secondary: { text: 'See what your idle cash could do', href: '/tools/idle-cash' },
    primary: { text: 'Talk to Bar', href: '#founder' },
  },
  style: { backgroundColor: 'var(--section-bg-neutral)', verticalPadding: 'generous' },
  seo: { ariaLabel: 'Startup treasury' },
  analytics: { sectionId: 'startup-treasury-b2b', trackingPrefix: 'startup_treasury' },
};

describe('StartupTreasurySection', () => {
  it('should render the intro and every body paragraph', () => {
    render(<StartupTreasurySection config={CONFIG} enableAnalytics={false} />);
    expect(screen.getByText('FOR FUNDED STARTUPS')).toBeTruthy();
    expect(
      screen.getByRole('heading', { level: 2, name: "You didn't raise it to watch it sit still." })
    ).toBeTruthy();
    // Subhead is rendered in two breakpoint-toggled copies (intro + body lead);
    // CSS shows only one, but both are in the DOM under happy-dom.
    expect(
      screen.getAllByText('Most of your round is runway you won’t touch for months.').length
    ).toBeGreaterThanOrEqual(1);
    ['A round lands.', 'It waits at one bank.', 'diBoaS puts the excess to work.'].forEach((t) =>
      expect(screen.getByText(t)).toBeTruthy()
    );
  });

  it('should render the 3-beat mechanic as three cards with icons and labels', () => {
    const { container } = render(
      <StartupTreasurySection config={CONFIG} enableAnalytics={false} />
    );
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    // one icon per beat (protect → work → retrieve)
    expect(container.querySelectorAll('li [data-icon]')).toHaveLength(3);
    ['Set the floor', 'Put the excess to work', 'Pull it back anytime'].forEach((t) =>
      expect(screen.getByRole('heading', { level: 3, name: t })).toBeTruthy()
    );
  });

  it('should render both CTAs with the correct hrefs and the bridge line', () => {
    const { container } = render(
      <StartupTreasurySection config={CONFIG} enableAnalytics={false} />
    );
    expect(screen.getByText('Run it on your own runway.')).toBeTruthy();
    const secondary = container.querySelector('a[data-cta="secondary"]');
    const primary = container.querySelector('a[data-cta="primary"]');
    expect(secondary?.getAttribute('href')).toBe('/tools/idle-cash');
    expect(secondary?.textContent).toContain('See what your idle cash could do');
    expect(primary?.getAttribute('href')).toBe('#founder');
    expect(primary?.textContent).toContain('Talk to Bar');
  });

  it('should render the supporting image with its alt text', () => {
    const { container } = render(
      <StartupTreasurySection config={CONFIG} enableAnalytics={false} />
    );
    const img = container.querySelector('img');
    expect(img?.getAttribute('alt')).toBe('The floor control');
  });
});
