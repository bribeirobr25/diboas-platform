'use client';

/**
 * Legal Document Components
 *
 * Specialized components for legal content that leverage the platform's
 * existing reusable components (SectionContainer, ContentCard).
 *
 * Components in this file:
 * - LegalTableOfContents: Navigation for long documents
 * - LegalContentSection: Styled section with teal accent border
 * - LegalSubsection: H3 subsection within a content section
 * - LegalParagraph: Styled paragraph
 * - LegalTable: Accessible data table
 * - LegalList: Styled list (ordered or unordered)
 * - LegalContactInfo: Contact information block
 * - LegalRetentionList: Data retention display
 * - LegalBackToTop: Scroll to top navigation
 *
 * Note: Legal pages should use existing components for structure:
 * - PageHeroSection for the page header
 * - SectionContainer for the main content wrapper
 * - ContentCard for highlight boxes (info, warning, important)
 */

import { ReactNode, useId } from 'react';
import styles from './LegalDocument.module.css';

// ============================================
// TABLE OF CONTENTS
// ============================================

interface TOCItem {
  id: string;
  title: string;
}

interface LegalTableOfContentsProps {
  items: TOCItem[];
  title?: string;
}

export function LegalTableOfContents({ items, title = 'Contents' }: LegalTableOfContentsProps) {
  if (items.length === 0) return null;

  return (
    <nav className={styles.tableOfContents} aria-labelledby="toc-title">
      <h2 className={styles.tocTitle} id="toc-title">{title}</h2>
      <ol className={styles.tocList}>
        {items.map((item, index) => (
          <li key={item.id} className={styles.tocItem}>
            <a href={`#${item.id}`} className={styles.tocLink}>
              <span className={styles.tocNumber}>{index + 1}</span>
              {item.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

// ============================================
// CONTENT SECTION
// ============================================

interface LegalContentSectionProps {
  title: string;
  children: ReactNode;
  id?: string;
}

export function LegalContentSection({ title, children, id }: LegalContentSectionProps) {
  const sectionId = id || title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  return (
    <section className={styles.section} id={sectionId} aria-labelledby={`${sectionId}-title`}>
      <h2 className={styles.sectionTitle} id={`${sectionId}-title`}>{title}</h2>
      <div className={styles.sectionContent}>
        {children}
      </div>
    </section>
  );
}

// ============================================
// SUBSECTION
// ============================================

interface LegalSubsectionProps {
  title: string;
  children: ReactNode;
}

export function LegalSubsection({ title, children }: LegalSubsectionProps) {
  return (
    <div className={styles.subsection}>
      <h3 className={styles.subsectionTitle}>{title}</h3>
      <div className={styles.subsectionContent}>
        {children}
      </div>
    </div>
  );
}

// ============================================
// PARAGRAPH
// ============================================

export function LegalParagraph({ children }: { children: ReactNode }) {
  return <p className={styles.paragraph}>{children}</p>;
}

// ============================================
// TABLE
// ============================================

interface LegalTableProps {
  headers: string[];
  rows: string[][];
  caption?: string;
}

export function LegalTable({ headers, rows, caption }: LegalTableProps) {
  const tableId = useId();

  return (
    <div
      className={styles.tableWrapper}
      role="region"
      aria-labelledby={caption ? `${tableId}-caption` : undefined}
      tabIndex={0}
    >
      <table className={styles.table}>
        {caption && (
          <caption className={styles.tableCaption} id={`${tableId}-caption`}>
            {caption}
          </caption>
        )}
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={index} scope="col">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================
// LIST
// ============================================

interface LegalListProps {
  items: string[];
  ordered?: boolean;
}

export function LegalList({ items, ordered = false }: LegalListProps) {
  const ListTag = ordered ? 'ol' : 'ul';

  return (
    <ListTag className={styles.list}>
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ListTag>
  );
}

// ============================================
// CONTACT INFO
// ============================================

interface LegalContactInfoProps {
  email: string;
  dpoEmail?: string;
  emailLabel?: string;
  dpoLabel?: string;
}

export function LegalContactInfo({
  email,
  dpoEmail,
  emailLabel = 'Email:',
  dpoLabel = 'Data Protection:'
}: LegalContactInfoProps) {
  return (
    <address className={styles.contactInfo}>
      <div className={styles.contactItem}>
        <span className={styles.contactLabel}>{emailLabel}</span>
        <a href={`mailto:${email}`} className={styles.contactLink}>{email}</a>
      </div>
      {dpoEmail && (
        <div className={styles.contactItem}>
          <span className={styles.contactLabel}>{dpoLabel}</span>
          <a href={`mailto:${dpoEmail}`} className={styles.contactLink}>{dpoEmail}</a>
        </div>
      )}
    </address>
  );
}

// ============================================
// RETENTION LIST
// ============================================

interface LegalRetentionListProps {
  items: Array<{ type: string; duration: string }>;
}

export function LegalRetentionList({ items }: LegalRetentionListProps) {
  return (
    <ul className={styles.retentionList}>
      {items.map((item, index) => (
        <li key={index}>
          <strong>{item.type}</strong>
          <span>{item.duration}</span>
        </li>
      ))}
    </ul>
  );
}

// ============================================
// BACK TO TOP
// ============================================

interface LegalBackToTopProps {
  label?: string;
}

export function LegalBackToTop({ label = 'Back to top' }: LegalBackToTopProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <a
      href="#top"
      className={styles.backToTop}
      onClick={handleClick}
      aria-label={label}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M18 15l-6-6-6 6"/>
      </svg>
      {label}
    </a>
  );
}

// ============================================
// LEGACY EXPORTS (for backwards compatibility during migration)
// These will be removed after all pages are migrated
// ============================================

/** @deprecated Use PageHeroSection from @/components/Sections instead */
export function LegalHeader({ title, lastUpdated, intro }: { title: string; lastUpdated: string; intro?: string }) {
  // Deprecation: LegalHeader. Use PageHeroSection from @/components/Sections instead.');
  return (
    <header className={styles.header} id="top">
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.lastUpdated}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        {lastUpdated}
      </p>
      {intro && <p className={styles.intro}>{intro}</p>}
    </header>
  );
}

/** @deprecated Use SectionContainer from @/components/Sections instead */
export function LegalDocument({ children }: { children: ReactNode }) {
  // Deprecation: LegalDocument. Use SectionContainer from @/components/Sections instead.');
  return (
    <article className={styles.document} aria-label="Legal document">
      {children}
    </article>
  );
}

/** @deprecated Use ContentCard from @/components/ui instead */
export function LegalHighlight({ children, variant = 'info' }: { children: ReactNode; variant?: 'info' | 'warning' | 'important' }) {
  // Deprecation: LegalHighlight. Use ContentCard from @/components/ui instead.');
  const variantClass = `highlight${variant.charAt(0).toUpperCase() + variant.slice(1)}`;
  return (
    <div className={`${styles.highlight} ${styles[variantClass]}`} role={variant === 'warning' ? 'alert' : undefined}>
      {children}
    </div>
  );
}

// Alias for backwards compatibility
/** @deprecated Use LegalContentSection instead */
export const LegalSection = LegalContentSection;
