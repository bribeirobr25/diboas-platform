/**
 * CarouselCard — individual slide card for ProductCarouselDefault
 * Extracted for file decoupling (≤150 lines).
 */

import Image from 'next/image';
import Link from 'next/link';
import { Logger } from '@/lib/monitoring/Logger';
import styles from './ProductCarouselDefault.module.css';

interface CarouselSlide {
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  imageAlt: string;
  ctaText?: string;
  ctaHref?: string;
  quote?: string;
}

interface CarouselCardProps {
  slide: CarouselSlide;
  index: number;
  currentSlideIndex: number;
  totalSlides: number;
  priority: boolean;
  priorityCount: number;
  imageSizes: string;
  failedImages: Set<string>;
  onImageLoad: (id: string) => void;
  onImageError: (id: string) => void;
  onImageFailed: (id: string) => void;
  onGoToSlide: (index: number) => void;
  onCTAClick?: (slideId: string, ctaHref: string) => void;
}

export function CarouselCard({
  slide,
  index,
  currentSlideIndex,
  totalSlides,
  priority,
  priorityCount,
  imageSizes,
  failedImages,
  onImageLoad,
  onImageError,
  onImageFailed,
  onGoToSlide,
  onCTAClick,
}: CarouselCardProps) {
  const isActive = index === currentSlideIndex;
  const isLeftSide = index === (currentSlideIndex - 1 + totalSlides) % totalSlides;
  const isRightSide = index === (currentSlideIndex + 1) % totalSlides;
  const isVisible = isActive || isLeftSide || isRightSide;

  return (
    <div
      key={slide.id}
      className={`${styles.card} ${isActive ? styles.cardActive : ''} ${isLeftSide ? styles.cardLeft : ''} ${isRightSide ? styles.cardRight : ''}`}
      style={{
        visibility: isVisible ? 'visible' : 'hidden',
        cursor: !isActive && isVisible ? 'pointer' : 'default'
      }}
      role="group"
      aria-label={`Slide ${index + 1} of ${totalSlides}: ${slide.title}`}
      aria-hidden={!isActive}
      onClick={() => {
        if (!isActive && isVisible) {
          onGoToSlide(index);
        }
      }}
    >
      <div className={styles.cardContent}>
        <div className={styles.imageWrapper}>
          {slide.image && !failedImages.has(slide.id) ? (
            <Image
              src={slide.image}
              alt={slide.imageAlt}
              fill
              data-slide-id={slide.id}
              priority={priority && index <= priorityCount}
              className={styles.cardImage}
              onLoad={() => onImageLoad(slide.id)}
              onError={() => {
                onImageError(slide.id);
                onImageFailed(slide.id);
              }}
              sizes={imageSizes}
              decoding="async"
              loading={index <= priorityCount ? 'eager' : 'lazy'}
            />
          ) : null}

          {/* Bottom Gradient Overlay */}
          <div className={styles.cardOverlay}>
            <div className={styles.cardInfo}>
              <h3 className={styles.cardTitle}>
                {slide.title}
              </h3>

              {slide.ctaText && slide.ctaHref && (
                <Link
                  href={slide.ctaHref}
                  className={styles.cardCTA}
                  target={slide.ctaHref.startsWith('http') ? '_blank' : '_self'}
                  rel={slide.ctaHref.startsWith('http') ? 'noopener noreferrer' : undefined}
                  tabIndex={isActive ? 0 : -1}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCTAClick?.(slide.id, slide.ctaHref!);
                    Logger.info('Product carousel CTA clicked', {
                      slideId: slide.id,
                      ctaHref: slide.ctaHref
                    });
                  }}
                >
                  {slide.ctaText}
                </Link>
              )}

              {slide.quote && (
                <blockquote className={styles.cardQuote}>
                  {slide.quote}
                </blockquote>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
