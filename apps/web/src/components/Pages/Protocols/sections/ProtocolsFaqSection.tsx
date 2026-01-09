'use client';

/**
 * Protocols FAQ Section
 *
 * Frequently asked questions about the protocols
 */

import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';

interface FaqItem {
  question: string;
  answer: string;
}

interface ProtocolsFaqSectionProps {
  header: string;
  questions: FaqItem[];
}

export function ProtocolsFaqSection({ header, questions }: ProtocolsFaqSectionProps) {
  return (
    <SectionErrorBoundary
      sectionId="faq-section-protocols"
      sectionType="FAQSection"
      enableReporting={true}
      context={{ page: 'protocols' }}
    >
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8">
              {header}
            </h2>

            <div className="space-y-6">
              {questions.map((item, index) => (
                <div key={index}>
                  <h3 className="font-bold text-slate-900 mb-2">
                    {item.question}
                  </h3>
                  <p className="text-slate-600">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </SectionErrorBoundary>
  );
}
