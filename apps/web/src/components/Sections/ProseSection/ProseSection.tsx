'use client';

import React, { memo, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { SectionContainer } from '@/components/Sections/SectionContainer';
import { useLocale } from '@/components/Providers';
import { useConfigTranslation } from '@/lib/i18n/config-translator';
import { marketDataService } from '@/lib/market-data';
import { buildAllFeeValues } from '@/lib/market-data/feeComparisonValues';
import type { ProseSectionConfig } from '@/config/proseSection';
import styles from './ProseSection.module.css';

interface ProseSectionProps {
  config: ProseSectionConfig;
  enableAnalytics?: boolean;
  className?: string;
  headingLevel?: 'h2' | 'h3';
  /** Optional kicker rendered above the header (editorial eyebrow). */
  eyebrow?: string;
}

export const ProseSection = memo(function ProseSection({
  config,
  enableAnalytics: _enableAnalytics = true,
  className = '',
  headingLevel: Heading = 'h2',
  eyebrow,
}: ProseSectionProps) {
  const { locale } = useLocale();
  const valuesByKey = useMemo(
    () => buildAllFeeValues(marketDataService.getSync().platformFees, locale),
    [locale]
  );
  const translated = useConfigTranslation(config, undefined, valuesByKey);
  const [imgFailed, setImgFailed] = useState(false);

  const handleImageError = useCallback(() => {
    setImgFailed(true);
  }, []);

  // Eyebrow may come from the prop (explicit override) or the config content.
  const eyebrowText = eyebrow ?? translated.content.eyebrow;
  const isGenerous = translated.style.verticalPadding === 'generous';
  const hasImage = translated.image?.src && !imgFailed;
  const imagePosition = translated.image?.position || 'right';
  const isPortrait = translated.image?.aspectRatio === 'portrait';
  const isCenteredHeader = translated.style.headerStyle === 'centered';

  const textContent = (
    <div
      className={`${styles.prose} ${isGenerous ? styles.generous : ''}`}
      style={hasImage ? undefined : { maxWidth: translated.style.maxWidth || '680px' }}
    >
      {/* Only render transitionHook here when there is no image.
          With an image, standaloneHeader (mobile) / centeredHeader (desktop) handles it. */}
      {!hasImage && translated.content.transitionHook ? (
        <p className={styles.transitionHook}>{translated.content.transitionHook}</p>
      ) : null}

      {translated.content.header && !(hasImage && isCenteredHeader) && (
        <>
          {eyebrowText ? <p className={`u-eyebrow ${styles.eyebrow}`}>{eyebrowText}</p> : null}
          <Heading
            className={`u-section-heading ${styles.header} ${hasImage ? `${styles.headerWithImage} ${styles.headerInline}` : ''}`}
          >
            {translated.content.header}
          </Heading>
        </>
      )}

      {translated.content.paragraphs.map((paragraph: string, index: number) => {
        // Phase 8 Item B (CC8 closeout): when `feeParagraph` is configured
        // and `feeParagraphAt[locale]` matches this index, REPLACE the
        // positional paragraph with the parameterized fee citation.
        const feeIndex = translated.content.feeParagraphAt?.[locale];
        const showFeeHere = translated.content.feeParagraph && feeIndex === index;
        const renderedText = showFeeHere ? translated.content.feeParagraph! : paragraph;
        return (
          // Stable: paragraphs come from translation file, never reorder.
          // eslint-disable-next-line react/no-array-index-key
          <React.Fragment key={index}>
            <p className={styles.paragraph}>{renderedText}</p>
            {index === 0 && translated.content.earlyEmphasisLine ? (
              <p className={styles.emphasis}>{translated.content.earlyEmphasisLine}</p>
            ) : null}
          </React.Fragment>
        );
      })}

      {translated.content.signatureLine && (
        <p className={styles.signature}>{translated.content.signatureLine}</p>
      )}

      {translated.content.emphasisLine && (
        <p className={styles.emphasis}>{translated.content.emphasisLine}</p>
      )}
    </div>
  );

  if (hasImage) {
    const imageEl = (
      <div className={`u-image-zoom ${styles.imageColumn}`}>
        <Image
          src={translated.image!.src}
          alt={translated.image!.alt}
          width={640}
          height={800}
          className={`${styles.sectionImage} ${isPortrait ? styles.sectionImagePortrait : ''}`}
          sizes="(max-width: 768px) 100vw, 40vw"
          onError={handleImageError}
        />
      </div>
    );

    // Centered header renders above the two-column layout
    const centeredHeader =
      isCenteredHeader && translated.content.header ? (
        <>
          {translated.content.transitionHook ? (
            <p className={styles.transitionHook}>{translated.content.transitionHook}</p>
          ) : null}
          {eyebrowText ? (
            <p className={`u-eyebrow ${styles.eyebrow} ${styles.eyebrowCentered}`}>{eyebrowText}</p>
          ) : null}
          <Heading className={`u-section-heading ${styles.header} ${styles.headerCentered}`}>
            {translated.content.header}
          </Heading>
        </>
      ) : null;

    // Standalone header for mobile reorder (title → image → text) — only when not centered
    const standaloneHeader =
      !isCenteredHeader && translated.content.header ? (
        <div className={styles.headerStandalone}>
          {translated.content.transitionHook ? (
            <p className={styles.transitionHook}>{translated.content.transitionHook}</p>
          ) : null}
          {eyebrowText ? <p className={`u-eyebrow ${styles.eyebrow}`}>{eyebrowText}</p> : null}
          <Heading className={`u-section-heading ${styles.header} ${styles.headerWithImage}`}>
            {translated.content.header}
          </Heading>
        </div>
      ) : null;

    return (
      <SectionContainer
        variant="wide"
        padding="standard"
        backgroundColor={translated.style.backgroundColor}
        ariaLabel={translated.seo.ariaLabel}
        className={className}
      >
        {centeredHeader}
        <div className={`${styles.withImage} ${isGenerous ? styles.generous : ''}`}>
          {standaloneHeader}
          {imagePosition === 'left' ? (
            <>
              {imageEl}
              <div className={styles.textColumn}>{textContent}</div>
            </>
          ) : (
            <>
              <div className={styles.textColumn}>{textContent}</div>
              {imageEl}
            </>
          )}
        </div>
      </SectionContainer>
    );
  }

  return (
    <SectionContainer
      variant="narrow"
      padding="standard"
      backgroundColor={translated.style.backgroundColor}
      ariaLabel={translated.seo.ariaLabel}
      className={className}
    >
      {textContent}
    </SectionContainer>
  );
});

ProseSection.displayName = 'ProseSection';
