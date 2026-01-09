'use client';

/**
 * Protocols Hero Section
 *
 * Hero section for the protocols page
 */

import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';

interface ProtocolsHeroSectionProps {
  title: string;
  subtitle: string;
}

export function ProtocolsHeroSection({ title, subtitle }: ProtocolsHeroSectionProps) {
  return (
    <SectionErrorBoundary
      sectionId="hero-section-protocols"
      sectionType="HeroSection"
      enableReporting={true}
      context={{ page: 'protocols', variant: 'centered' }}
    >
      <section className="py-16 md:py-24 bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            {title}
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto">
            {subtitle}
          </p>
        </div>
      </section>
    </SectionErrorBoundary>
  );
}
