/**
 * OneFeatureDefault Variant Component
 * 
 * Domain-Driven Design: Isolated default feature showcase variant
 * Service Agnostic Abstraction: Pure component focused on feature showcase
 * Code Reusability: Can be composed into other feature variants
 * No Hardcoded Values: Uses design tokens and configuration
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Button } from '@diboas/ui';
import { DEFAULT_CTA_PROPS } from '@/config/cta';
import { SectionContainer } from '@/components/Sections/SectionContainer';
import { Logger } from '@/lib/monitoring/Logger';
import type { OneFeatureVariantProps } from '../types';
import styles from './OneFeatureDefault.module.css';

export function OneFeatureDefault({ 
  config, 
  className = '', 
  enableAnalytics = true,
  priority = true,
  backgroundColor,
  onFeatureClick,
  onCTAClick
}: OneFeatureVariantProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
    Logger.warn('Security hero image failed to load', { 
      image: config.assets.heroImage 
    });
  }, [config.assets.heroImage]);

  const handleFeatureClick = useCallback((featureId: string, href: string) => {
    onFeatureClick?.(featureId, href);
    
    if (enableAnalytics && config.analytics?.enabled) {
      Logger.info('Security feature clicked', {
        section: 'SecurityOneFeature',
        featureId,
        href,
        variant: config.variant
      });
    }
  }, [onFeatureClick, enableAnalytics, config.analytics?.enabled, config.variant]);

  const handleCTAClick = useCallback(() => {
    onCTAClick?.(config.content.cta.href);
    
    if (enableAnalytics && config.analytics?.enabled) {
      Logger.info('Security CTA clicked', {
        section: 'SecurityOneFeature',
        href: config.content.cta.href,
        variant: config.variant
      });
    }
  }, [onCTAClick, config.content.cta.href, enableAnalytics, config.analytics?.enabled, config.variant]);

  return (
    <SectionContainer
      variant="standard"
      padding="standard"
      backgroundColor={backgroundColor}
      className={className}
      ariaLabelledBy="security-title"
      role={config.seo.region}
    >
      <div className={styles.outerContainer}>
        {/* Hero Image - 3D Safe - positioned to float half outside container */}
        <div className={styles.heroImageWrapper}>
          <div className={styles.heroImageContainer}>
            {!imageError ? (
              <Image
                src={config.assets.heroImage}
                alt={config.assets.heroImageAlt}
                width={250}
                height={250}
                priority={priority && config.settings.imageLoadPriority}
                className={`${styles.heroImage} ${
                  imageLoaded && config.settings.enableAnimations ? styles.heroImageLoaded : ''
                }`}
                onLoad={handleImageLoad}
                onError={handleImageError}
                sizes="(max-width: 768px) 250px, 250px"
              />
            ) : (
              <div className={styles.imageFallback} aria-hidden="true">
                🔒
              </div>
            )}
          </div>
        </div>

        <div className={styles.container}>
          {/* Main Title */}
          <h2 id="security-title" className={styles.title}>
            {config.content.title}
          </h2>

        {/* Subtitle */}
        <p className={styles.subtitle}>
          {config.content.subtitle}
        </p>

        {/* Feature Cards Grid */}
        <div className={styles.featuresGrid}>
          {config.content.features.map((feature, index) => (
            <div
              key={feature.id}
              className={`${styles.featureCard} ${
                feature.isPrimary ? styles.featureCardPrimary : styles.featureCardSecondary
              } ${
                isMounted && config.settings.enableAnimations ? styles.featureCardAnimated : ''
              }`}
              style={{
                animationDelay: config.settings.enableAnimations 
                  ? `${index * config.settings.animationDelay}ms` 
                  : undefined
              }}
            >
              {feature.target === '_blank' ? (
                <a
                  href={feature.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.featureLink}
                  aria-label={`${feature.title} - Abre em nova aba`}
                  onClick={() => handleFeatureClick(feature.id, feature.href)}
                >
                  <span className={styles.featureTitle}>
                    {feature.title}
                  </span>
                  <ChevronRight
                    className={`${styles.featureIcon} ${
                      feature.isPrimary ? styles.featureIconPrimary : styles.featureIconSecondary
                    }`}
                    aria-hidden="true"
                  />
                </a>
              ) : (
                <Link
                  href={feature.href}
                  className={styles.featureLink}
                  aria-label={feature.title}
                  onClick={() => handleFeatureClick(feature.id, feature.href)}
                >
                  <span className={styles.featureTitle}>
                    {feature.title}
                  </span>
                  <ChevronRight
                    className={`${styles.featureIcon} ${
                      feature.isPrimary ? styles.featureIconPrimary : styles.featureIconSecondary
                    }`}
                    aria-hidden="true"
                  />
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className={styles.ctaWrapper}>
          {config.content.cta.target === '_blank' ? (
            <a
              href={config.content.cta.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${config.content.cta.text} - Abre em nova aba`}
              onClick={handleCTAClick}
            >
              <Button
                variant={DEFAULT_CTA_PROPS.variant}
                size={DEFAULT_CTA_PROPS.size}
                trackable={DEFAULT_CTA_PROPS.trackable}
                className={styles.ctaButton}
              >
                {config.content.cta.text}
              </Button>
            </a>
          ) : (
            <Link
              href={config.content.cta.href}
              onClick={handleCTAClick}
            >
              <Button
                variant={DEFAULT_CTA_PROPS.variant}
                size={DEFAULT_CTA_PROPS.size}
                trackable={DEFAULT_CTA_PROPS.trackable}
                className={styles.ctaButton}
              >
                {config.content.cta.text}
              </Button>
            </Link>
          )}
        </div>
      </div>
      </div>
    </SectionContainer>
  );
}