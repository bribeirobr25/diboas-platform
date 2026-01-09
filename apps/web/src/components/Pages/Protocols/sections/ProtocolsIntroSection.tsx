'use client';

/**
 * Protocols Intro Section
 *
 * Introduction explaining why this page exists
 */

import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';

interface ProtocolsIntroSectionProps {
  header: string;
  paragraph1: string;
  paragraph2: string;
  important: string;
  disclaimer: string;
}

export function ProtocolsIntroSection({
  header,
  paragraph1,
  paragraph2,
  important,
  disclaimer,
}: ProtocolsIntroSectionProps) {
  return (
    <SectionErrorBoundary
      sectionId="intro-section-protocols"
      sectionType="ContentSection"
      enableReporting={true}
      context={{ page: 'protocols' }}
    >
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8">
              {header}
            </h2>
            <div className="space-y-6 text-lg text-slate-700 leading-relaxed">
              <p>{paragraph1}</p>
              <p>{paragraph2}</p>
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
                <p className="font-medium text-amber-800">
                  {important} {disclaimer}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SectionErrorBoundary>
  );
}
