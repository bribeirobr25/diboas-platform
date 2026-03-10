'use client';

/**
 * Protocols FAQ Section
 *
 * Frequently asked questions about the protocols
 */

import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import { SectionContainer } from '@/components/Sections/SectionContainer';
import styles from './ProtocolsFaqSection.module.css';

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
      <SectionContainer
        variant="narrow"
        padding="standard"
        backgroundColor="var(--section-bg-neutral)"
      >
        <div className={styles.content}>
          <h2 className={styles.title}>
            {header}
          </h2>

          <div className={styles.faqList}>
            {questions.map((item, index) => (
              <div key={index}>
                <h3 className={styles.faqQuestion}>
                  {item.question}
                </h3>
                <p className={styles.faqAnswer}>
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </SectionContainer>
    </SectionErrorBoundary>
  );
}
