'use client';

/**
 * Minimal Footer Component
 *
 * A simplified footer variant for landing pages that displays only:
 * - Legal info (brand name, copyright)
 * - Language switcher
 * - Social media links
 * - Risk disclaimer (optional)
 *
 * Used for B2C/B2B landing pages where full footer navigation is not needed.
 */

import { useState, useEffect } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { LocaleLink } from '@/components/UI';
import { FOOTER_CONFIG } from '@/config/footer';
import { ROUTES } from '@/config/routes';
import styles from './MinimalFooter.module.css';

/**
 * Legal links configuration for minimal footer
 * Shows Privacy, Terms, and Cookies links
 */
const LEGAL_LINKS = [
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

// Dynamic icon imports for better performance
const IconComponents = {
  Instagram: () => import('lucide-react').then(mod => mod.Instagram),
  Twitter: () => import('lucide-react').then(mod => mod.Twitter),
  Youtube: () => import('lucide-react').then(mod => mod.Youtube),
  Linkedin: () => import('lucide-react').then(mod => mod.Linkedin),
};

interface MinimalFooterProps {
  /**
   * Optional disclaimer text translation key
   */
  disclaimerKey?: string;
}

interface SocialIconProps {
  iconName: string;
  label: string;
  href: string;
}

export function MinimalFooter({ disclaimerKey }: MinimalFooterProps) {
  const intl = useTranslation();
  const config = FOOTER_CONFIG;

  return (
    <footer aria-label="Site footer" className={styles.footer}>
      <div className={styles.container}>
        {/* Disclaimer */}
        {disclaimerKey && (
          <div className={styles.disclaimer}>
            <p className={styles.disclaimerText}>
              {intl.formatMessage({ id: disclaimerKey })}
            </p>
          </div>
        )}

        {/* Divider */}
        <div className={styles.divider} />

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
              {intl.formatMessage({ id: config.legal.copyrightText })}
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

// Social Icon Component with Error Handling
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

// Dynamic Icon Renderer with Fallback
function SocialIconRenderer({ iconName }: { iconName: string }) {
  const [IconComponent, setIconComponent] = useState<React.ComponentType<{ className?: string }> | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const loadIcon = async () => {
      try {
        if (iconName in IconComponents) {
          const Component = await IconComponents[iconName as keyof typeof IconComponents]();
          setIconComponent(() => Component);
        } else {
          setHasError(true);
        }
      } catch (error) {
        // Icon load failed: ${iconName}`, error);
        setHasError(true);
      }
    };

    loadIcon();
  }, [iconName]);

  if (hasError || !IconComponent) {
    return (
      <span className={styles.socialFallback}>
        {iconName.charAt(0).toUpperCase()}
      </span>
    );
  }

  return <IconComponent className={styles.socialIcon} />;
}

export default MinimalFooter;
