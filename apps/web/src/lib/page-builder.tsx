'use client';

import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { type PageSection } from './content/types';
import { cn } from '@diboas/ui';

// Lazy load section components for performance
import { HeroSection } from '@/components/Sections/EnhancedHeroSection';
import { FeaturesSection } from '@/components/Sections/FeaturesSection';
import { TrustSection } from '@/components/Sections/TrustSection';

// Additional sections can be added here when implemented
// const TestimonialsSection = lazy(() => import('@/components/sections/TestimonialsSection'));
// const PricingSection = lazy(() => import('@/components/sections/PricingSection'));
// const ComparisonSection = lazy(() => import('@/components/sections/ComparisonSection'));
// const CTASection = lazy(() => import('@/components/sections/CTASection'));

/**
 * Page Builder Component
 * 
 * DRY Principle: Single component that builds all marketing pages
 * Performance: Lazy loads components and tracks visibility
 * Accessibility: Ensures proper section landmarks
 * Analytics: Tracks section visibility and interactions
 */

// Placeholder components for unimplemented sections
const PlaceholderSection = ({ sectionId, type }: { sectionId?: string; type: string }) => (
  <div className="placeholder-section">
    <div className="placeholder-wrapper">
      <h2 className="placeholder-title">
        {type.charAt(0).toUpperCase() + type.slice(1)} Section
      </h2>
      <p className="placeholder-description">
        This section is coming soon. Stay tuned for updates!
      </p>
    </div>
  </div>
);

// Section component registry - Single Source of Truth
const SECTION_COMPONENTS = {
  hero: HeroSection,
  features: FeaturesSection,
  trust: TrustSection,
  testimonials: (props: any) => <PlaceholderSection {...props} type="testimonials" />,
  pricing: (props: any) => <PlaceholderSection {...props} type="pricing" />,
  comparison: (props: any) => <PlaceholderSection {...props} type="comparison" />,
  cta: (props: any) => <PlaceholderSection {...props} type="cta" />,
} as const;

interface PageBuilderProps {
  sections: PageSection[];
  locale?: string;
  className?: string;
}

interface SectionWrapperProps {
  section: PageSection;
  index: number;
  locale?: string;
}

// Performance: Individual section wrapper with lazy loading
function SectionWrapper({ section, index, locale }: SectionWrapperProps) {
  const Component = SECTION_COMPONENTS[section.type] as any;

  if (!Component) {
    console.warn(`Unknown section type: ${section.type}`);
    return null;
  }

  // Analytics: Track section visibility
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
    skip: !section.trackVisibility,
  });

  // Analytics: Report section view
  useEffect(() => {
    if (inView && section.trackVisibility) {
      // Product KPIs: Track which sections users view
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'section_view', {
          event_category: 'Page Builder',
          event_label: `${section.type}_${section.id}`,
          section_type: section.type,
          section_id: section.id,
          section_index: index,
          locale: locale || 'en',
        });
      }
    }
  }, [inView, section, index, locale]);

  // Accessibility: Section landmark
  const getLandmarkRole = (sectionType: string) => {
    switch (sectionType) {
      case 'hero':
        return 'banner';
      case 'features':
      case 'trust':
      case 'testimonials':
      case 'pricing':
      case 'comparison':
        return 'main';
      case 'cta':
        return 'complementary';
      default:
        return 'section';
    }
  };

  // Performance: Conditional lazy loading
  const shouldLazyLoad = section.lazyLoad && index > 0;

  if (shouldLazyLoad) {
    return (
      <section
        ref={ref}
        role={getLandmarkRole(section.type)}
        aria-labelledby={`section-${section.id}`}
        className="scroll-mt-16" // Accessibility: Scroll margin for skip links
      >
        <Suspense
          fallback={
            <SectionSkeleton
              type={section.type}
              height={getSectionHeight(section.type)}
            />
          }
        >
          <Component
            {...section.sectionConfig}
            content={section.sectionContent as any}
            sectionId={section.id}
            locale={locale}
          />
        </Suspense>
      </section>
    );
  }

  return (
    <section
      ref={section.trackVisibility ? ref : undefined}
      role={getLandmarkRole(section.type)}
      aria-labelledby={`section-${section.id}`}
      className="scroll-mt-16"
    >
      <Component
        {...section.sectionConfig}
        content={section.sectionContent as any}
        sectionId={section.id}
        locale={locale}
      />
    </section>
  );
}

// Performance: Section loading skeleton
function SectionSkeleton({ type, height }: { type: string; height: number }) {
  return (
    <div
      className="animate-pulse bg-neutral-100 rounded-lg"
      style={{ height }}
      role="presentation"
      aria-label={`Loading ${type} section`}
    >
      <div className="skeleton-container">
        {/* Title skeleton */}
        <div className="skeleton-title" />
        {/* Subtitle skeleton */}
        <div className="skeleton-subtitle" />
        {/* Content skeleton */}
        <div className="skeleton-grid">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton-item" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Performance: Estimated section heights for skeleton
function getSectionHeight(sectionType: string): number {
  const heights = {
    hero: 600,
    features: 800,
    trust: 600,
    testimonials: 500,
    pricing: 700,
    comparison: 600,
    cta: 400,
  };

  return heights[sectionType as keyof typeof heights] || 500;
}

export function PageBuilder({ sections, locale = 'en', className }: PageBuilderProps) {
  // Error Handling: Validate sections array
  if (!Array.isArray(sections) || sections.length === 0) {
    console.error('PageBuilder: sections prop must be a non-empty array');
    return (
      <div role="alert" className="error-container">
        <h2 className="error-title">
          Content Not Available
        </h2>
        <p className="error-message">
          This page is currently being updated. Please try again later.
        </p>
      </div>
    );
  }

  // Analytics: Track page composition
  useEffect(() => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_composition', {
        event_category: 'Page Builder',
        sections_count: sections.length,
        section_types: sections.map(s => s.type).join(','),
        locale,
      });
    }
  }, [sections, locale]);

  return (
    <main className={cn('min-h-screen', className)}>
      {/* Accessibility: Skip to main content */}
      <a
        href="#main-content"
        className="skip-link"
      >
        Skip to main content
      </a>

      <div id="main-content">
        {sections.map((section, index) => (
          <SectionWrapper
            key={section.id}
            section={section}
            index={index}
            locale={locale}
          />
        ))}
      </div>
    </main>
  );
}

// Performance: Custom hook for intersection observer
function useInView(options: {
  threshold?: number;
  triggerOnce?: boolean;
  skip?: boolean;
}) {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (options.skip || !ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (options.triggerOnce) {
            observer.unobserve(entry.target);
          }
        }
      },
      {
        threshold: options.threshold || 0.1,
        rootMargin: '50px',
      }
    );

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [options.threshold, options.triggerOnce, options.skip]);

  return { ref, inView };
}

// Export for external usage
export type { PageBuilderProps };