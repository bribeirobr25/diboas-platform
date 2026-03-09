'use client';

/**
 * Minimal Footer Component
 *
 * A simplified footer variant for landing pages that displays:
 * - Tagline
 * - Product nav links
 * - Legal info (brand name, copyright)
 * - Language switcher
 * - Social media links
 * - Full disclosure block with locale-conditional disclaimers
 */

import { useTranslation } from '@diboas/i18n/client';
import { useLocale } from '@/components/Providers';
import { Instagram, Twitter, Youtube, Linkedin } from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { LocaleLink } from '@/components/UI';
import { FOOTER_CONFIG } from '@/config/footer';
import { ROUTES } from '@/config/routes';
import styles from './MinimalFooter.module.css';

/**
 * Legal links configuration for minimal footer
 */
const LEGAL_LINKS = [
  {
    id: 'security',
    labelKey: 'common.footer.sections.transparency.links.security',
    href: '/security',
  },
  {
    id: 'privacy',
    labelKey: 'common.footer.sections.transparency.links.privacy',
    href: ROUTES.LEGAL.PRIVACY,
  },
  {
    id: 'terms',
    labelKey: 'common.footer.sections.transparency.links.terms',
    href: ROUTES.LEGAL.TERMS,
  },
  {
    id: 'cookies',
    labelKey: 'common.footer.sections.legal.links.cookies',
    href: ROUTES.LEGAL.COOKIES,
  },
] as const;

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
};

interface NavLink {
  readonly id: string;
  readonly labelKey: string;
  readonly href: string;
}

interface MinimalFooterProps {
  disclaimerKey?: string;
  taglineKey?: string;
  copyrightKey?: string;
  navLinks?: readonly NavLink[];
  disclosureKeys?: {
    general?: string;
    crypto?: string;
    stories?: string;
    ai?: string;
    closing?: string;
    mica?: string;
    micaArticle7?: string;
    cvm?: string;
    bcb?: string;
    us?: string;
  };
}

interface SocialIconProps {
  iconName: string;
  label: string;
  href: string;
}

/**
 * Locale-conditional disclosure logic
 * - general, crypto, stories, ai, closing: ALL locales
 * - mica: DE, ES, PT-BR only
 * - cvm, bcb: PT-BR only
 * - us: EN only
 */
function getDisclosureKeysForLocale(
  locale: string,
  keys: NonNullable<MinimalFooterProps['disclosureKeys']>
): string[] {
  const result: string[] = [];

  if (keys.general) result.push(keys.general);
  if (keys.crypto) result.push(keys.crypto);

  // MiCA Article 68: DE, ES only (not PT-BR, they use CVM)
  if (keys.mica && ['de', 'es'].includes(locale)) {
    result.push(keys.mica);
  }

  // MiCA Article 7: EN, ES, DE only
  if (keys.micaArticle7 && ['en', 'es', 'de'].includes(locale)) {
    result.push(keys.micaArticle7);
  }

  // CVM + BCB: PT-BR only
  if (keys.cvm && locale === 'pt-BR') result.push(keys.cvm);
  if (keys.bcb && locale === 'pt-BR') result.push(keys.bcb);

  // US regulatory: EN only
  if (keys.us && locale === 'en') result.push(keys.us);

  if (keys.stories) result.push(keys.stories);
  if (keys.ai) result.push(keys.ai);
  if (keys.closing) result.push(keys.closing);

  return result;
}

export function MinimalFooter({
  disclaimerKey,
  taglineKey,
  copyrightKey = 'landing-b2c.footer.copyright',
  navLinks,
  disclosureKeys,
}: MinimalFooterProps) {
  const intl = useTranslation();
  const { locale } = useLocale();
  const config = FOOTER_CONFIG;

  const disclosures = disclosureKeys
    ? getDisclosureKeysForLocale(locale, disclosureKeys)
    : [];

  return (
    <footer aria-label="Site footer" className={styles.footer}>
      <div className={styles.container}>
        {/* Tagline */}
        {taglineKey && (
          <p className={styles.tagline}>
            {intl.formatMessage({ id: taglineKey })}
          </p>
        )}

        {/* Product Nav Links */}
        {navLinks && navLinks.length > 0 && (
          <nav className={styles.productNav} aria-label="Product navigation">
            {navLinks.map((link) => (
              <LocaleLink
                key={link.id}
                href={link.href}
                className={styles.productNavLink}
              >
                {intl.formatMessage({ id: link.labelKey })}
              </LocaleLink>
            ))}
          </nav>
        )}

        {/* Divider */}
        <div className={styles.divider} />

        {/* Locale-conditional Disclosures */}
        {disclosures.length > 0 && (
          <div className={styles.disclosures}>
            {disclosures.map((key, index) => {
              const text = intl.formatMessage({ id: key });
              if (!text || text === key) return null;
              return (
                <p key={index} className={styles.disclosureText}>
                  {text}
                </p>
              );
            })}
          </div>
        )}

        {/* Legacy single disclaimer */}
        {!disclosureKeys && disclaimerKey && (
          <div className={styles.disclaimer}>
            <p className={styles.disclaimerText}>
              {intl.formatMessage({ id: disclaimerKey })}
            </p>
          </div>
        )}

        {/* Divider */}
        {(disclosures.length > 0 || disclaimerKey) && (
          <div className={styles.divider} />
        )}

        {/* Legal Links Section */}
        <nav className={styles.legalLinks} aria-label="Legal pages">
          {LEGAL_LINKS.map((link) => (
            <LocaleLink
              key={link.id}
              href={link.href}
              className={styles.legalLink}
            >
              {intl.formatMessage({ id: link.labelKey })}
            </LocaleLink>
          ))}
        </nav>

        {/* Divider between legal links and bottom section */}
        <div className={styles.divider} />

        {/* Bottom Section */}
        <div className={styles.bottomSection}>
          <div className={styles.legalInfo}>
            <span className={styles.brandName}>
              {intl.formatMessage({ id: config.legal.brandName })}
            </span>
            <span className={styles.copyright}>
              {intl.formatMessage({ id: copyrightKey })}
            </span>
          </div>

          {/* Language Switcher */}
          <div className={styles.footerLanguageSwitcher}>
            <LanguageSwitcher variant="dropdown" size="sm" theme="dark" />
          </div>

          {/* Social Links */}
          <div className={styles.socialSection}>
            <div className={styles.socialIcons}>
              {config.socialLinks.map((social) => (
                <SocialIcon
                  key={social.id}
                  iconName={social.icon}
                  label={intl.formatMessage({ id: social.label })}
                  href={social.href}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Social Icon Component
function SocialIcon({ iconName, label, href }: SocialIconProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.socialLink}
      aria-label={label}
    >
      <SocialIconRenderer iconName={iconName} />
    </a>
  );
}

// Static Icon Renderer with Fallback
function SocialIconRenderer({ iconName }: { iconName: string }) {
  const IconComponent = ICON_MAP[iconName];

  if (!IconComponent) {
    return (
      <span className={styles.socialFallback}>
        {iconName.charAt(0).toUpperCase()}
      </span>
    );
  }

  return <IconComponent className={styles.socialIcon} />;
}

export default MinimalFooter;
