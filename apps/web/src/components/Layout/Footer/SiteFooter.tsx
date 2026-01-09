/**
 * Site Footer Component
 *
 * Performance & SEO Optimization: Optimized footer with external links
 * Error Handling: Graceful icon loading fallbacks
 * Accessibility: Full keyboard navigation and screen reader support
 * Responsive Design: Mobile accordions, desktop grid layout
 *
 * Refactored: Sub-components extracted for maintainability
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@diboas/i18n/client';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { FOOTER_CONFIG, type FooterConfig } from '@/config/footer';
import { AccordionSection, SocialIcon } from './components';
import styles from './SiteFooter.module.css';

interface SiteFooterProps {
  config?: FooterConfig;
}

export function SiteFooter({ config = FOOTER_CONFIG }: SiteFooterProps) {
  const intl = useTranslation();
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  const toggleSection = (title: string) => {
    setOpenSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(title)) {
        newSet.delete(title);
      } else {
        newSet.add(title);
      }
      return newSet;
    });
  };

  return (
    <footer aria-label="Site footer" className={styles.footer}>
      <div className={styles.container}>
        {/* Desktop Grid / Mobile Accordions */}
        <div className={styles.contentGrid}>
          {config.sections.map((section) => (
            <div key={section.title} className={styles.footerSection}>
              {/* Mobile Accordion */}
              <div className={styles.mobileAccordion}>
                <AccordionSection
                  section={section}
                  isOpen={openSections.has(section.title)}
                  onToggle={() => toggleSection(section.title)}
                />
              </div>

              {/* Desktop Column */}
              <div className={styles.desktopColumn}>
                <h3 className={styles.sectionTitle}>
                  {intl.formatMessage({ id: section.title })}
                </h3>
                <ul className={styles.linksList}>
                  {section.links.map((link) => (
                    <li key={link.id}>
                      {link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.link}
                        >
                          {intl.formatMessage({ id: link.label })}
                        </a>
                      ) : (
                        <Link href={link.href} className={styles.link}>
                          {intl.formatMessage({ id: link.label })}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Social Links */}
        <div className={styles.mobileSocialSection}>
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

        {/* Divider */}
        <div className={styles.divider} />

        {/* Bottom Bar */}
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

          {/* Desktop Social Links */}
          <div className={styles.desktopSocialSection}>
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
