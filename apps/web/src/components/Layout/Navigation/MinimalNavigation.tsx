'use client';

/**
 * Minimal Navigation Component
 *
 * A simplified navigation variant for landing pages that displays:
 * - Logo (linked to home)
 * - Landing page links (For Business, Strategies, Future You)
 * - Language switcher
 * - CTA button (scrolls to waitlist section)
 * - Hamburger menu for mobile/tablet
 *
 * Used for B2C/B2B landing pages where full navigation is not needed.
 *
 * @see docs/handoffs/cmo/FINAL-B2C-Landing-Page-v4.md - Navigation Structure spec
 */

import { useCallback, useState } from 'react';
import Image from 'next/image';
import { useIntl } from 'react-intl';
import { Button } from '@diboas/ui';
import { Container, FlexBetween, LocaleLink } from '@/components/UI';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  /**
   * Scroll to waitlist section with smooth behavior
   */
  const scrollToWaitlist = useCallback(() => {
    const waitlistSection = document.getElementById('waitlist');
    if (waitlistSection) {
      waitlistSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setIsMobileMenuOpen(false);
  }, []);

  /**
   * Toggle mobile menu
   */
  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  /**
   * Close mobile menu when clicking a link
   */
  const handleLinkClick = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

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

          {/* Desktop Navigation Links */}
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

          {/* Desktop Actions: Language Switcher + CTA */}
          <div className="minimal-nav-actions">
            <LanguageSwitcher variant="dropdown" size="sm" />
            <Button
              variant={DEFAULT_CTA_PROPS.variant}
              size="sm"
              trackable={DEFAULT_CTA_PROPS.trackable}
              onClick={scrollToWaitlist}
              className="minimal-nav-cta hidden md:inline-flex"
            >
              {intl.formatMessage({ id: 'common.navigation.landing.joinWaitlist' })}
            </Button>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              className="minimal-nav-hamburger"
              onClick={toggleMobileMenu}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMobileMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
            </button>
          </div>
        </FlexBetween>
      </Container>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div id="mobile-menu" className="minimal-nav-mobile-menu">
          <Container>
            <div className="minimal-nav-mobile-links">
              {LANDING_NAV_LINKS.map((link) => (
                <LocaleLink
                  key={link.id}
                  href={link.href}
                  className="minimal-nav-mobile-link"
                  onClick={handleLinkClick}
                >
                  {intl.formatMessage({ id: link.labelKey })}
                </LocaleLink>
              ))}
              <Button
                variant={DEFAULT_CTA_PROPS.variant}
                size="default"
                trackable={DEFAULT_CTA_PROPS.trackable}
                onClick={scrollToWaitlist}
                className="minimal-nav-mobile-cta"
              >
                {intl.formatMessage({ id: 'common.navigation.landing.joinWaitlist' })}
              </Button>
            </div>
          </Container>
        </div>
      )}
    </nav>
  );
}

/**
 * Hamburger icon for mobile menu
 */
function HamburgerIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

/**
 * Close icon for mobile menu
 */
function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
