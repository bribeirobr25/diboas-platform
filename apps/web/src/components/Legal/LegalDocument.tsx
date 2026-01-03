'use client';

/**
 * Legal Document Component
 *
 * Renders legal content (Privacy Policy, Terms of Use, Cookie Policy)
 * in a professional, accessible format following WCAG 2.2 guidelines.
 *
 * Features:
 * - Semantic HTML structure for accessibility
 * - Responsive tables
 * - Proper heading hierarchy
 * - Print-friendly styles
 * - Design token colors
 */

import { ReactNode } from 'react';
import styles from './LegalDocument.module.css';

interface LegalDocumentProps {
  children: ReactNode;
}

interface LegalHeaderProps {
  title: string;
  lastUpdated: string;
  intro?: string;
}

interface LegalSectionProps {
  title: string;
  children: ReactNode;
  id?: string;
}

interface LegalTableProps {
  headers: string[];
  rows: string[][];
  caption?: string;
}

interface LegalListProps {
  items: string[];
  ordered?: boolean;
}

interface LegalSubsectionProps {
  title: string;
  children: ReactNode;
}

interface LegalHighlightProps {
  children: ReactNode;
  variant?: 'info' | 'warning' | 'important';
}

export function LegalDocument({ children }: LegalDocumentProps) {
  return (
    <article className={styles.document} aria-label="Legal document">
      {children}
    </article>
  );
}

export function LegalHeader({ title, lastUpdated, intro }: LegalHeaderProps) {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.lastUpdated}>{lastUpdated}</p>
      {intro && <p className={styles.intro}>{intro}</p>}
    </header>
  );
}

export function LegalSection({ title, children, id }: LegalSectionProps) {
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

export function LegalParagraph({ children }: { children: ReactNode }) {
  return <p className={styles.paragraph}>{children}</p>;
}

export function LegalTable({ headers, rows, caption }: LegalTableProps) {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        {caption && <caption className={styles.tableCaption}>{caption}</caption>}
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

export function LegalHighlight({ children, variant = 'info' }: LegalHighlightProps) {
  return (
    <div className={`${styles.highlight} ${styles[`highlight${variant.charAt(0).toUpperCase() + variant.slice(1)}`]}`}>
      {children}
    </div>
  );
}

export function LegalContactInfo({
  email,
  dpoEmail,
  emailLabel = 'Email:',
  dpoLabel = 'Data Protection:'
}: {
  email: string;
  dpoEmail?: string;
  emailLabel?: string;
  dpoLabel?: string;
}) {
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

export function LegalRetentionList({
  items
}: {
  items: Array<{ type: string; duration: string }>
}) {
  return (
    <ul className={styles.retentionList}>
      {items.map((item, index) => (
        <li key={index}>
          <strong>{item.type}</strong> {item.duration}
        </li>
      ))}
    </ul>
  );
}
