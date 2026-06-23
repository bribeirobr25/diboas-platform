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

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@diboas/i18n/client';
import { Button } from '@diboas/ui';
import { Container, FlexBetween, LocaleLink } from '@/components/UI';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { BRAND_CONFIG } from '@/config/brand';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { DEFAULT_CTA_PROPS } from '@/config/cta';
import { ROUTES } from '@/config/routes';

/**
 * Landing page navigation links configuration
 * For Business | Money Tools | Adelaide Daily | Learn | About
 */
const LANDING_NAV_LINKS = [
  {
    id: 'for-business',
    labelKey: 'common.navigation.landing.forBusiness',
    href: ROUTES.BUSINESS_LANDING,
  },
  {
    id: 'money-tools',
    // Surfaced in the nav (redesign Phase 1) — previously reachable only by URL,
    // which the growth plan flagged as the #1 acquisition gap.
    labelKey: 'common.navigation.landing.moneyTools',
    href: ROUTES.TOOLS,
  },
  {
    id: 'adelaide-daily',
    labelKey: 'common.navigation.landing.adelaideDaily',
    // 2026-05-13: route renamed to `/market`; label "Adelaide Daily" stays.
    href: ROUTES.MARKET,
  },
  {
    id: 'learn',
    labelKey: 'common.navigation.landing.learn',
    href: ROUTES.LEARN,
  },
  {
    id: 'about',
    labelKey: 'common.navigation.landing.about',
    href: ROUTES.ABOUT,
  },
] as const;

/**
 * Cinematic redesign — pages whose hero is a full-bleed CinematicHero get an
 * adaptive nav: transparent over the hero (top of page), solid once scrolled.
 * The theme picks link contrast over the hero (over-dark = white links;
 * over-light = dark links via `nav-transparent--on-light`). Any route NOT listed
 * keeps the existing always-solid nav (zero regression on non-hero pages).
 * Keys are the locale-stripped path ('' = home/B2C).
 */
const HERO_NAV_THEME: Record<string, 'over-dark' | 'over-light'> = {
  '': 'over-dark', // home (B2C — dawn-water dark)
  '/business': 'over-dark', // B2B — fluid dark (liquid-capital)
  '/protocols': 'over-dark', // particles dark (data-cinematic market)
  '/strategies': 'over-dark', // wireframe-terrain dark (data-cinematic landing)
  '/about': 'over-dark', // dawn-water dark (B2C-style, white text)
  '/tools': 'over-light', // particles lighter
  '/learn': 'over-light', // fluid lighter (calm)
  '/market': 'over-light', // editorial re-skin — cream/paper hero, dark nav links
};

/** Strip the locale segment: `/en` → '', `/pt-BR/business` → '/business'. */
function stripLocale(pathname: string): string {
  const match = pathname.match(/^\/[a-zA-Z-]+(\/.*)?$/);
  return match?.[1] ?? '';
}

export default function MinimalNavigation() {
  const intl = useTranslation();
  const pathname = usePathname();
  const heroTheme = HERO_NAV_THEME[stripLocale(pathname)];
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  useFocusTrap(mobileMenuRef, isMobileMenuOpen, { returnFocus: true });

  // Only hero pages toggle transparent/solid; others stay solid.
  useEffect(() => {
    if (!heroTheme) return;
    const onScroll = () => setScrolled(window.scrollY > 72);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [heroTheme]);

  // Solid when: not a hero page, scrolled past the hero top, or the mobile menu
  // is open (the dropdown needs an opaque surface).
  const isSolid = !heroTheme || scrolled || isMobileMenuOpen;
  const navClassName = [
    'minimal-navigation-bar',
    'nav-cinematic',
    isSolid ? 'nav-solid' : 'nav-transparent',
    !isSolid && heroTheme === 'over-light' ? 'nav-transparent--on-light' : '',
  ]
    .filter(Boolean)
    .join(' ');

  /**
   * Close mobile menu on navigation
   */
  const handleCtaClick = useCallback(() => {
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
    <nav
      className={navClassName}
      aria-label={intl.formatMessage({ id: 'common.accessibility.mainNavigation' })}
    >
      <Container>
        <FlexBetween className="minimal-navigation-content">
          {/* Logo */}
          <LocaleLink
            href="/"
            className="brand-logo"
            aria-label={intl.formatMessage(
              { id: 'common.accessibility.homeLink' },
              { brand: BRAND_CONFIG.NAME }
            )}
          >
            {/* Cinematic redesign (#1): text wordmark, per 04-data-cinematic. */}
            <span className="brand-wordmark">{BRAND_CONFIG.NAME}</span>
          </LocaleLink>

          {/* Desktop Navigation Links */}
          {/* W7 (audit/2026-05-08): prefetch={false} so Next.js doesn't
           * preemptively load CSS for routes that secondary-nav users
           * rarely click. The LearnIndex CSS in particular was flagged by
           * the browser as "preloaded but not used within a few seconds"
           * because every page rendered the nav and prefetched /learn.
           * Trade: marginally slower navigation when these links are
           * actually clicked; gain: no spurious browser console warnings
           * and ~2.5KB less wasted bandwidth per page load. */}
          <div className="minimal-nav-links">
            {LANDING_NAV_LINKS.map((link) => (
              <LocaleLink
                key={link.id}
                href={link.href}
                className="minimal-nav-link"
                prefetch={false}
              >
                {intl.formatMessage({ id: link.labelKey })}
              </LocaleLink>
            ))}
          </div>

          {/* Mobile CTA — centered between logo and hamburger */}
          <div className="minimal-nav-mobile-center">
            <LocaleLink href={ROUTES.DEMO} onClick={handleCtaClick}>
              <Button
                variant={DEFAULT_CTA_PROPS.variant}
                size="sm"
                trackable={DEFAULT_CTA_PROPS.trackable}
                className="minimal-nav-cta"
              >
                {intl.formatMessage({ id: 'common.navigation.landing.tryDemo' })}
              </Button>
            </LocaleLink>
          </div>

          {/* Right Actions */}
          <div className="minimal-nav-actions">
            {/* Desktop CTA */}
            <LocaleLink href={ROUTES.DEMO} className="minimal-nav-cta-desktop">
              <Button
                variant={DEFAULT_CTA_PROPS.variant}
                size="sm"
                trackable={DEFAULT_CTA_PROPS.trackable}
                className="minimal-nav-cta"
              >
                {intl.formatMessage({ id: 'common.navigation.landing.tryDemo' })}
              </Button>
            </LocaleLink>

            {/* Language Switcher — desktop nav bar only */}
            <div className="minimal-nav-lang-desktop">
              <LanguageSwitcher variant="dropdown" size="sm" />
            </div>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              className="minimal-nav-hamburger"
              onClick={toggleMobileMenu}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={intl.formatMessage({
                id: isMobileMenuOpen ? 'common.aria.closeMenu' : 'common.aria.openMenu',
              })}
            >
              {isMobileMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
            </button>
          </div>
        </FlexBetween>
      </Container>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div id="mobile-menu" ref={mobileMenuRef} className="minimal-nav-mobile-menu">
          <Container>
            <div className="minimal-nav-mobile-links">
              {LANDING_NAV_LINKS.map((link) => (
                <LocaleLink
                  key={link.id}
                  href={link.href}
                  className="minimal-nav-mobile-link"
                  onClick={handleLinkClick}
                  prefetch={false}
                >
                  {intl.formatMessage({ id: link.labelKey })}
                </LocaleLink>
              ))}

              {/* Language Switcher — flags side by side in mobile menu */}
              <div className="minimal-nav-mobile-lang">
                <LanguageSwitcher variant="inline" size="md" />
              </div>
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
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
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
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
