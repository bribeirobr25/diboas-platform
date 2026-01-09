'use client';

/**
 * Protocols TVL Section
 *
 * Displays total TVL statistics
 */

import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';

interface ProtocolsTvlSectionProps {
  header: string;
  paragraph1: string;
  amount: string;
  paragraph2: string;
  note: string;
}

export function ProtocolsTvlSection({
  header,
  paragraph1,
  amount,
  paragraph2,
  note,
}: ProtocolsTvlSectionProps) {
  return (
    <SectionErrorBoundary
      sectionId="tvl-section-protocols"
      sectionType="StatsSection"
      enableReporting={true}
      context={{ page: 'protocols' }}
    >
      <section className="py-16 md:py-24 bg-teal-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
            {header}
          </h2>
          <p className="text-xl text-slate-700 max-w-3xl mx-auto mb-2">
            {paragraph1}{' '}
            <span className="font-bold text-teal-700 text-3xl">{amount}</span>{' '}
            {paragraph2}
          </p>
          <p className="text-slate-600 max-w-2xl mx-auto">
            {note}
          </p>
        </div>
      </section>
    </SectionErrorBoundary>
  );
}
