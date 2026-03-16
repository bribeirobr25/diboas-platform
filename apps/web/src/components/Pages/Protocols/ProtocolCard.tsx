/**
 * Protocol Card Component
 *
 * Displays individual protocol information with details and links
 * Supports badge system (warning/success), usedInStrategies, and exceptionNote
 */

'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle } from '@/components/UI/LucideIcon';
import type { Protocol, ProtocolLabels, ProtocolI18nContent } from './types';
import styles from './ProtocolCard.module.css';

interface ProtocolCardProps {
  protocol: Protocol;
  labels: ProtocolLabels;
  i18nContent: ProtocolI18nContent;
  exceptionNote?: string;
  usedInStrategiesText?: string;
}

const LONG_REGULATORY_THRESHOLD = 200;

export function ProtocolCard({ protocol, labels, i18nContent, exceptionNote, usedInStrategiesText }: ProtocolCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const regulatoryClass = protocol.badge === 'warning'
    ? styles.regulatoryWarning
    : protocol.badge === 'success'
      ? styles.regulatorySuccess
      : styles.regulatoryDefault;

  const isLongRegulatory = i18nContent.regulatory.length > LONG_REGULATORY_THRESHOLD;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h4 className={styles.title}>{i18nContent.name}</h4>
        {protocol.badge === 'warning' ? (
          <span className={styles.badgeWarning} aria-label="Warning badge">
            <AlertTriangle className={styles.badgeIcon} aria-hidden="true" />
          </span>
        ) : null}
        {protocol.badge === 'success' ? (
          <span className={styles.badgeSuccess} aria-label="Compliance badge">
            <CheckCircle className={styles.badgeIcon} aria-hidden="true" />
          </span>
        ) : null}
      </div>

      <p className={styles.description}>{i18nContent.description}</p>

      {exceptionNote ? (
        <p className={styles.exceptionNote}>{exceptionNote}</p>
      ) : null}

      {usedInStrategiesText ? (
        <p className={styles.usedInStrategies}>{usedInStrategiesText}</p>
      ) : null}

      <div className={styles.details}>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>{labels.founded}</span>
          <span className={styles.detailValue}>{i18nContent.founded}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>{labels.tvl}</span>
          <span className={styles.detailValue}>{i18nContent.tvl}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>{labels.blockchains}</span>
          <span className={styles.detailValueRight}>{i18nContent.blockchains}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>{labels.audits}</span>
          <span className={styles.detailValue}>{i18nContent.audits}</span>
        </div>
        <div className={styles.detailRowLast}>
          <span className={styles.detailLabel}>{labels.regulatory}</span>
          <span className={`${styles.regulatoryValue} ${regulatoryClass}`}>
            {isLongRegulatory ? (
              <>
                <span className={isExpanded ? undefined : styles.regulatoryTruncated}>
                  {isExpanded ? i18nContent.regulatory : `${i18nContent.regulatory.slice(0, LONG_REGULATORY_THRESHOLD)}...`}
                </span>
                <button
                  type="button"
                  className={styles.expandToggle}
                  onClick={() => setIsExpanded(prev => !prev)}
                  aria-expanded={isExpanded}
                  aria-controls={`regulatory-${protocol.id}`}
                >
                  {isExpanded ? labels.showLess : labels.showMore}
                </button>
              </>
            ) : (
              i18nContent.regulatory
            )}
          </span>
        </div>
      </div>

      <div className={styles.links}>
        <a
          href={protocol.website}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.websiteLink}
        >
          {labels.websiteLink}
        </a>
        <a
          href={protocol.twitter}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.twitterLink}
        >
          {labels.twitterLink}
        </a>
      </div>
    </div>
  );
}

export default ProtocolCard;
