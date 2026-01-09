'use client';

/**
 * Protocols Grid Section
 *
 * Displays all protocols organized by category
 */

import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import { ProtocolCard } from '../ProtocolCard';
import { PROTOCOL_DATA } from '../protocolsData';
import type { ProtocolLabels } from '../types';

interface ProtocolsGridSectionProps {
  labels: ProtocolLabels;
  getCategoryTitle: (categoryId: string) => string;
  getCategoryDescription: (categoryId: string) => string;
}

export function ProtocolsGridSection({
  labels,
  getCategoryTitle,
  getCategoryDescription,
}: ProtocolsGridSectionProps) {
  return (
    <SectionErrorBoundary
      sectionId="protocols-section"
      sectionType="ProtocolsGrid"
      enableReporting={true}
      context={{ page: 'protocols' }}
    >
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 text-center mb-4">
              The 26 Protocols
            </h2>
            <p className="text-lg text-slate-600 text-center mb-12 max-w-2xl mx-auto">
              Organized by category for easy reference
            </p>

            {PROTOCOL_DATA.map((category) => (
              <div key={category.id} className="mb-16">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                  {getCategoryTitle(category.id)}
                </h3>
                <p className="text-slate-600 mb-8">
                  {getCategoryDescription(category.id)}
                </p>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.protocols.map((protocol) => (
                    <ProtocolCard
                      key={protocol.id}
                      protocol={protocol}
                      labels={labels}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SectionErrorBoundary>
  );
}
