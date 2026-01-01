'use client';

/**
 * Minimal Navigation Component
 *
 * A simplified navigation variant for landing pages that displays:
 * - Logo (linked to home)
 * - Landing page links (For Business, Strategies, Future You)
 * - Language switcher
 * - CTA button (opens waiting list modal)
 *
 * Used for B2C/B2B landing pages where full navigation is not needed.
 *
 * @see docs/handoffs/cmo/FINAL-B2C-Landing-Page-v4.md - Navigation Structure spec
 */

import Image from 'next/image';
import { useIntl } from 'react-intl';
import { Button } from '@diboas/ui';
import { Container, FlexBetween, LocaleLink } from '@/components/UI';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useWaitingListModal } from '@/components/WaitingList';
import { ASSET_PATHS } from '@/config/assets';
import { BRAND_CONFIG } from '@/config/brand';
import { DEFAULT_CTA_PROPS } from '@/config/cta';
import { ROUTES } from '@/config/routes';

/**
 * Landing page navigation links configuration
 * Following the spec: For Business | Strategies | Future You
 */
const LANDING_NAV_LINKS = [
  {
    id: 'for-business',
    labelKey: 'common.navigation.landing.forBusiness',
    href: ROUTES.BUSINESS_LANDING,
  },
  {
    id: 'strategies',
    labelKey: 'common.navigation.landing.strategies',
    href: ROUTES.STRATEGIES,
  },
  {
    id: 'future-you',
    labelKey: 'common.navigation.landing.futureYou',
    href: ROUTES.FUTURE_YOU,
  },
] as const;

export default function MinimalNavigation() {
  const intl = useIntl();
  const { openModal } = useWaitingListModal();

  return (
    <nav className="minimal-navigation-bar" aria-label="Main navigation">
      <Container>
        <FlexBetween className="minimal-navigation-content">
          {/* Logo */}
          <LocaleLink href="/" className="brand-logo" aria-label={`${BRAND_CONFIG.NAME} Home`}>
            <Image
              src={ASSET_PATHS.LOGOS.ICON}
              alt={BRAND_CONFIG.NAME}
              width={76}
              height={76}
              style={{ width: 'auto', height: 'auto', maxHeight: '76px' }}
              priority
            />
          </LocaleLink>

          {/* Landing Page Navigation Links */}
          <div className="minimal-nav-links">
            {LANDING_NAV_LINKS.map((link) => (
              <LocaleLink
                key={link.id}
                href={link.href}
                className="minimal-nav-link"
              >
                {intl.formatMessage({ id: link.labelKey })}
              </LocaleLink>
            ))}
          </div>

          {/* Actions: Language Switcher + CTA */}
          <div className="minimal-nav-actions">
            <LanguageSwitcher variant="dropdown" size="sm" />
            <Button
              variant={DEFAULT_CTA_PROPS.variant}
              size="sm"
              trackable={DEFAULT_CTA_PROPS.trackable}
              onClick={openModal}
              className="minimal-nav-cta"
            >
              {intl.formatMessage({ id: 'common.navigation.landing.joinWaitlist' })}
            </Button>
          </div>
        </FlexBetween>
      </Container>
    </nav>
  );
}
