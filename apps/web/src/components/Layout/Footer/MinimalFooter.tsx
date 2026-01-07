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
import { FOOTER_CONFIG } from '@/config/footer';
import styles from './MinimalFooter.module.css';

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
  const [IconComponent, setIconComponent] = useState<React.ComponentType<any> | null>(null);
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
        console.error(`Failed to load icon: ${iconName}`, error);
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
