/**
 * Benefits Carousel Component
 * 
 * Domain-Driven Design: Benefits-specific carousel wrapper
 * Service Agnostic Abstraction: Isolated from main ProductCarousel issues
 * Error Handling & System Recovery: Graceful loading with fallback
 */

'use client';

import { Suspense, lazy } from 'react';
import { BENEFITS_CAROUSEL_CONTENT } from '@/config/benefits-carousel';

// Lazy load the ProductCarousel to avoid module resolution issues
const ProductCarousel = lazy(() => 
  import('@/components/Sections/ProductCarousel/ProductCarousel').then(module => ({
    default: module.ProductCarousel
  }))
);

interface BenefitsCarouselProps {
  enableAnalytics?: boolean;
}

function CarouselFallback() {
  return (
    <div style={{
      minHeight: '400px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#fafafa',
      borderRadius: '8px',
      margin: '2rem 0'
    }}>
      <div style={{
        textAlign: 'center',
        color: '#666'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #e5e7eb',
          borderTop: '3px solid #8b5cf6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem'
        }} />
        <p>Loading Benefits...</p>
      </div>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export function BenefitsCarousel({ enableAnalytics = true }: BenefitsCarouselProps) {
  return (
    <Suspense fallback={<CarouselFallback />}>
      <ProductCarousel
        variant="compact"
        config={{
          content: BENEFITS_CAROUSEL_CONTENT,
          settings: {
            autoPlay: true,
            autoPlayInterval: 5000,
            transitionDuration: 800,
            pauseOnHover: true,
            enableKeyboard: true,
            enableTouch: true,
            enableDots: true,
            enablePlayPause: true
          },
          seo: {
            headingTag: 'Benefits Overview',
            ariaLabel: 'Carousel showcasing diBoaS benefits and features'
          },
          analytics: {
            trackingPrefix: 'benefits_carousel',
            enabled: true
          }
        }}
        enableAnalytics={enableAnalytics}
      />
    </Suspense>
  );
}