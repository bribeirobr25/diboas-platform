/**
 * Site Footer Component
 * 
 * Performance & SEO Optimization: Optimized footer with external links
 * Error Handling: Graceful icon loading fallbacks
 * Accessibility: Full keyboard navigation and screen reader support
 * Responsive Design: Mobile accordions, desktop grid layout
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { FOOTER_CONFIG, type FooterConfig, type FooterSection } from '@/config/footer';
import { ASSET_PATHS } from '@/config/assets';
import { BRAND_CONFIG } from '@/config/brand';
import styles from './SiteFooter.module.css';

// Dynamic icon imports for better performance
const IconComponents = {
  Instagram: () => import('lucide-react').then(mod => mod.Instagram),
  Twitter: () => import('lucide-react').then(mod => mod.Twitter),
  Youtube: () => import('lucide-react').then(mod => mod.Youtube),
  Linkedin: () => import('lucide-react').then(mod => mod.Linkedin),
};

interface SiteFooterProps {
  /**
   * Override default footer configuration
   */
  config?: FooterConfig;
}

interface AccordionSectionProps {
  section: FooterSection;
  isOpen: boolean;
  onToggle: () => void;
}

interface SocialIconProps {
  iconName: string;
  label: string;
  href: string;
}

export function SiteFooter({ config = FOOTER_CONFIG }: SiteFooterProps) {
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
        
        {/* Mobile Logo */}
        <div className={styles.mobileLogoSection}>
          <Image
            src={ASSET_PATHS.LOGOS.WORDMARK}
            alt={BRAND_CONFIG.NAME}
            width={120}
            height={32}
            className={styles.logoImage}
          />
        </div>

        {/* Desktop Grid / Mobile Accordions */}
        <div className={styles.contentGrid}>
          
          {/* Desktop Logo Column */}
          <div className={styles.desktopLogoSection}>
            <Image
              src={ASSET_PATHS.LOGOS.WORDMARK}
              alt={BRAND_CONFIG.NAME}
              width={160}
              height={42}
              className={styles.logoImage}
            />
          </div>

          {/* Footer Sections */}
          {config.sections.map((section) => (
            <div key={section.title}>
              
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
                  {section.title}
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
                          {link.label}
                        </a>
                      ) : (
                        <Link href={link.href} className={styles.link}>
                          {link.label}
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
                label={social.label}
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
              {config.legal.brandName}
            </span>
            <span className={styles.copyright}>
              {config.legal.copyrightText}
            </span>
          </div>
          
          {/* Desktop Social Links */}
          <div className={styles.desktopSocialSection}>
            <div className={styles.socialIcons}>
              {config.socialLinks.map((social) => (
                <SocialIcon
                  key={social.id}
                  iconName={social.icon}
                  label={social.label}
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

// Accordion Section Component
function AccordionSection({ section, isOpen, onToggle }: AccordionSectionProps) {
  return (
    <>
      <button
        onClick={onToggle}
        className={styles.accordionButton}
        aria-expanded={isOpen}
        aria-controls={`footer-section-${section.title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <span className={styles.accordionTitle}>
          {section.title}
        </span>
        {isOpen ? (
          <ChevronUp className={styles.accordionIcon} aria-hidden="true" />
        ) : (
          <ChevronDown className={styles.accordionIcon} aria-hidden="true" />
        )}
      </button>
      
      {isOpen && (
        <div
          id={`footer-section-${section.title.toLowerCase().replace(/\s+/g, '-')}`}
          className={styles.accordionContent}
        >
          <ul className={styles.accordionLinksList}>
            {section.links.map((link) => (
              <li key={link.id}>
                {link.external ? (
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.accordionLink}
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link href={link.href} className={styles.accordionLink}>
                    {link.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
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

  // Lazy load icons
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

  // Error Handling: Fallback to generic icon or letter
  if (hasError || !IconComponent) {
    return (
      <span className={styles.socialFallback}>
        {iconName.charAt(0).toUpperCase()}
      </span>
    );
  }

  return <IconComponent className={styles.socialIcon} />;
}