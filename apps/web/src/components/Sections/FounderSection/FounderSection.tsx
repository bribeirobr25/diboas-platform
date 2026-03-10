'use client';

import { memo, useState, useCallback } from 'react';
import Image from 'next/image';
import { SectionContainer } from '@/components/Sections/SectionContainer';
import { useConfigTranslation } from '@/lib/i18n/config-translator';
import type { FounderSectionConfig } from '@/config/founderSection';
import styles from './FounderSection.module.css';

interface FounderSectionProps {
  config: FounderSectionConfig;
  enableAnalytics?: boolean;
  className?: string;
}

export const FounderSection = memo(function FounderSection({
  config,
  enableAnalytics = true,
  className = '',
}: FounderSectionProps) {
  const translated = useConfigTranslation(config);
  const [imgFailed, setImgFailed] = useState(false);

  const handleImageError = useCallback(() => {
    setImgFailed(true);
  }, []);

  const hasImage = translated.image?.src && !imgFailed;

  return (
    <SectionContainer
      variant="standard"
      padding="standard"
      backgroundColor={translated.style?.backgroundColor}
      ariaLabel={translated.seo.ariaLabel}
      className={className}
    >
      <div className={hasImage ? styles.withImage : styles.textOnly}>
        {hasImage ? (
          <div className={styles.imageColumn}>
            <Image
              src={translated.image!.src}
              alt={translated.image!.alt}
              width={280}
              height={280}
              className={styles.photo}
              loading="lazy"
              onError={handleImageError}
            />
          </div>
        ) : null}

        <div className={styles.textColumn}>
          <h2 className={styles.header}>{translated.content.header}</h2>

          {translated.content.paragraphs.map((paragraph: string, index: number) => (
            <p key={index} className={styles.paragraph}>{paragraph}</p>
          ))}

          {translated.content.socialLinks ? (
            <div className={styles.socialLinks}>
              {translated.content.socialLinks.map((link: { label: string; href: string; icon: string }) => (
                <a
                  key={link.icon}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                >
                  {link.label}
                </a>
              ))}
            </div>
          ) : translated.content.emailHref ? (
            <a
              href={translated.content.emailHref}
              className={styles.emailLink}
            >
              {translated.content.emailText}
            </a>
          ) : null}
        </div>
      </div>
    </SectionContainer>
  );
});

FounderSection.displayName = 'FounderSection';
