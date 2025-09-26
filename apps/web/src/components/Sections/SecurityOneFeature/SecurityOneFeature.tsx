/**
 * SecurityOneFeature Section Component
 * 
 * Domain-Driven Design: Security features domain with interactive presentation
 * Service Agnostic Abstraction: Reusable security showcase for multiple pages
 * Code Reusability & DRY: Unified security feature cards with consistent styling
 * Performance & SEO Optimization: Optimized images and Core Web Vitals compliance
 * Accessibility: Full keyboard navigation, semantic HTML, and screen reader support
 * Error Handling & System Recovery: Graceful image loading fallbacks
 * No Hardcoded Values: All content configurable through props and config
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import styles from './SecurityOneFeature.module.css';

export interface SecurityFeature {
  readonly id: string;
  readonly title: string;
  readonly isPrimary?: boolean;
  readonly href: string;
  readonly target?: '_blank' | '_self';
}

export interface SecurityOneFeatureProps {
  /**
   * Main section title
   */
  title?: string;
  
  /**
   * Section subtitle/description
   */
  subtitle?: string;
  
  /**
   * Security features to display
   */
  features?: SecurityFeature[];
  
  /**
   * CTA button configuration
   */
  cta?: {
    text: string;
    href: string;
    target?: '_blank' | '_self';
  };
  
  /**
   * Custom CSS classes for styling extensions
   */
  className?: string;
  
  /**
   * Custom section background color
   */
  backgroundColor?: string;
  
  /**
   * Enable animations and transitions
   */
  enableAnimations?: boolean;
}

// Default configuration following project patterns
const DEFAULT_FEATURES: SecurityFeature[] = [
  {
    id: 'me-roubaram',
    title: 'Me Roubaram',
    isPrimary: true,
    href: '/security/fraud-report',
    target: '_self'
  },
  {
    id: 'canal-denuncias',
    title: 'Canal de Denúncias',
    href: '/security/reports',
    target: '_self'
  },
  {
    id: 'central-protecao',
    title: 'Central de Proteção',
    href: '/security/protection',
    target: '_self'
  },
  {
    id: 'canais-atendimento',
    title: 'Canais de Atendimento',
    href: '/security/support',
    target: '_self'
  }
];

const DEFAULT_CTA = {
  text: 'Conheça nossas soluções',
  href: '/security',
  target: '_self' as const
};

/**
 * SecurityOneFeature Section - Reusable security showcase with 3D safe icon
 * Monitoring & Observability: Built-in loading states and error tracking
 */
export function SecurityOneFeature({
  title = 'Segurança é prioridade',
  subtitle = 'Estamos aqui para te dar suporte completo e garantir a proteção do seu dinheiro.',
  features = DEFAULT_FEATURES,
  cta = DEFAULT_CTA,
  className = '',
  backgroundColor,
  enableAnimations = true
}: SecurityOneFeatureProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Handle client-side mounting for animations
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle image loading states
  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const sectionStyle = backgroundColor ? { backgroundColor } : {};
  const sectionClasses = [styles.section, className].filter(Boolean).join(' ');

  return (
    <section 
      className={sectionClasses}
      style={sectionStyle}
      aria-labelledby="security-title"
      role="region"
    >
      {/* Hero Image - 3D Safe - positioned 50% above container */}
      <div className={styles.heroImageWrapper}>
        <div className={styles.heroImageContainer}>
          {!imageError ? (
            <Image
              src="/assets/socials/drawing/safe.avif"
              alt="3D security vault illustration"
              width={250}
              height={250}
              priority
              className={`${styles.heroImage} ${
                imageLoaded && enableAnimations ? styles.heroImageLoaded : ''
              }`}
              onLoad={handleImageLoad}
              onError={handleImageError}
              sizes="(max-width: 768px) 200px, 250px"
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
        <h2 
          id="security-title" 
          className={styles.title}
        >
          {title}
        </h2>
        
        {/* Subtitle */}
        <p className={styles.subtitle}>
          {subtitle}
        </p>
        
        {/* Feature Cards Grid */}
        <div className={styles.featuresGrid}>
          {features.map((feature, index) => (
            <div
              key={feature.id}
              className={`${styles.featureCard} ${
                feature.isPrimary ? styles.featureCardPrimary : styles.featureCardSecondary
              } ${
                isMounted && enableAnimations ? styles.featureCardAnimated : ''
              }`}
              style={{
                animationDelay: enableAnimations ? `${index * 100}ms` : undefined
              }}
            >
              {feature.target === '_blank' ? (
                <a
                  href={feature.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.featureLink}
                  aria-label={`${feature.title} - Abre em nova aba`}
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
        <div className={styles.ctaContainer}>
          {cta.target === '_blank' ? (
            <a
              href={cta.href}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.ctaButton}
              aria-label={`${cta.text} - Abre em nova aba`}
            >
              {cta.text}
            </a>
          ) : (
            <Link
              href={cta.href}
              className={styles.ctaButton}
            >
              {cta.text}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

export default SecurityOneFeature;