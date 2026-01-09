'use client';

/**
 * Protocols Selection Process Section
 *
 * Explains the criteria for selecting protocols
 */

import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';

interface ProtocolsSelectionSectionProps {
  header: string;
  intro: string;
  criteria: {
    operation: string;
    audits: string;
    exploits: string;
    transparent: string;
    usage: string;
  };
  note: string;
}

export function ProtocolsSelectionSection({
  header,
  intro,
  criteria,
  note,
}: ProtocolsSelectionSectionProps) {
  return (
    <SectionErrorBoundary
      sectionId="selection-section-protocols"
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
            <p className="text-lg text-slate-700 mb-6">
              {intro}
            </p>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <span className="text-teal-500 mt-1">✓</span>
                <span className="text-slate-700">{criteria.operation}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-teal-500 mt-1">✓</span>
                <span className="text-slate-700">{criteria.audits}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-teal-500 mt-1">✓</span>
                <span className="text-slate-700">{criteria.exploits}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-teal-500 mt-1">✓</span>
                <span className="text-slate-700">{criteria.transparent}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-teal-500 mt-1">✓</span>
                <span className="text-slate-700">{criteria.usage}</span>
              </li>
            </ul>

            <p className="text-slate-600 italic">
              {note}
            </p>
          </div>
        </div>
      </section>
    </SectionErrorBoundary>
  );
}
