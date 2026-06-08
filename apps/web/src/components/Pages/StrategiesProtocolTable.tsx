'use client';

/**
 * StrategiesProtocolTable
 *
 * Expandable protocol table showing where user money goes.
 * Desktop: full table. Mobile: card layout. Toggle at 768px via CSS.
 * ARIA: role="button", aria-expanded, keyboard accessible.
 */

import { useState, useCallback } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { LocaleLink } from '@/components/UI';
import styles from './StrategiesPageContent.module.css';

const I18N_PREFIX = 'strategies';

// safeHttpsUrl() helper removed 2026-05-08 (lint cleanup) — was defined but
// never called. Re-add if/when external protocol URLs become user-supplied
// (currently all PROTOCOL URLs are hardcoded in translation files).

const PROTOCOL_IDS = [
  'skySsr',
  'aaveV3',
  'compoundV3',
  'sanctumInf',
  'jupiterJlp',
  'jito',
] as const;

const PROTOCOL_FIELDS = ['type', 'chain', 'asset', 'cryptoExposure', 'operatingSince'] as const;

export function StrategiesProtocolTable() {
  const intl = useTranslation();
  const t = (key: string) => intl.formatMessage({ id: `${I18N_PREFIX}.${key}` });
  const [expandedProtocol, setExpandedProtocol] = useState<string | null>(null);

  const toggleProtocol = useCallback((protocolId: string) => {
    setExpandedProtocol((prev) => (prev === protocolId ? null : protocolId));
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, protocolId: string) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleProtocol(protocolId);
      }
    },
    [toggleProtocol]
  );

  return (
    <>
      <h2 className={styles.sectionTitle}>{t('protocols.header')}</h2>
      <p className={styles.sectionSubtitle}>{t('protocols.intro')}</p>

      {/* Desktop table (hidden on mobile) */}
      <div className={styles.protocolTableDesktop}>
        <div className={styles.tableWrapper}>
          <table className={styles.protocolTable}>
            <thead>
              <tr className={styles.tableHeaderRow}>
                <th className={styles.tableHeaderGoal}>{t('protocols.columnHeaders.protocol')}</th>
                <th className={styles.tableHeaderGoal}>{t('protocols.columnHeaders.type')}</th>
                <th className={styles.tableHeaderGoal}>{t('protocols.columnHeaders.chain')}</th>
                <th className={styles.tableHeaderGoal}>{t('protocols.columnHeaders.asset')}</th>
                <th className={styles.tableHeaderGoal}>
                  {t('protocols.columnHeaders.cryptoExposure')}
                </th>
                <th className={styles.tableHeaderGoal}>
                  {t('protocols.columnHeaders.operatingSince')}
                </th>
              </tr>
            </thead>
            <tbody>
              {PROTOCOL_IDS.map((protocolId) => {
                const isExpanded = expandedProtocol === protocolId;
                return (
                  <ProtocolDesktopRow
                    key={protocolId}
                    protocolId={protocolId}
                    isExpanded={isExpanded}
                    onToggle={() => toggleProtocol(protocolId)}
                    onKeyDown={(e) => handleKeyDown(e, protocolId)}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards (hidden on desktop) */}
      <div className={styles.protocolTableMobile}>
        {PROTOCOL_IDS.map((protocolId) => {
          const isExpanded = expandedProtocol === protocolId;
          return (
            <div key={protocolId} className={styles.mobileProtocolCard}>
              <div
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                aria-controls={`protocol-detail-mobile-${protocolId}`}
                className={styles.mobileProtocolHeader}
                onClick={() => toggleProtocol(protocolId)}
                onKeyDown={(e) => handleKeyDown(e, protocolId)}
              >
                <span className={styles.mobileProtocolName}>
                  {t(`protocols.items.${protocolId}.name`)}
                </span>
                <span className={styles.expandIcon}>{isExpanded ? '\u25BC' : '\u25B6'}</span>
              </div>
              <p className={styles.mobileProtocolSubtitle}>
                {t(`protocols.items.${protocolId}.type`)} &middot;{' '}
                {t(`protocols.items.${protocolId}.chain`)}
              </p>
              {PROTOCOL_FIELDS.filter((f) => f !== 'type' && f !== 'chain').map((field) => (
                <p key={field} className={styles.mobileProtocolField}>
                  {t(`protocols.columnHeaders.${field}`)}:{' '}
                  {t(`protocols.items.${protocolId}.${field}`)}
                </p>
              ))}
              <div
                id={`protocol-detail-mobile-${protocolId}`}
                role="region"
                className={`${styles.protocolDetail} ${isExpanded ? styles.protocolDetailOpen : ''}`}
              >
                <p className={styles.protocolSummary}>
                  {t(`protocols.items.${protocolId}.summary`)}
                </p>
                <div className={styles.protocolLinks}>
                  <LocaleLink
                    href="/protocols"
                    className={styles.protocolExternalLink}
                    prefetch={false}
                  >
                    {t('protocols.checkProtocolsPage')}
                  </LocaleLink>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className={styles.belowTable}>{t('protocols.belowTable')}</p>

      <p className={styles.honestLimitation}>{t('protocols.honestLimitation')}</p>
    </>
  );
}

/**
 * Desktop table row with expandable detail
 */
function ProtocolDesktopRow({
  protocolId,
  isExpanded,
  onToggle,
  onKeyDown,
}: {
  protocolId: string;
  isExpanded: boolean;
  onToggle: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}) {
  const intl = useTranslation();
  const t = (key: string) => intl.formatMessage({ id: `${I18N_PREFIX}.${key}` });
  return (
    <>
      <tr
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-controls={`protocol-detail-${protocolId}`}
        className={styles.protocolRow}
        onClick={onToggle}
        onKeyDown={onKeyDown}
      >
        <td className={styles.tableCellGoal}>{t(`protocols.items.${protocolId}.name`)}</td>
        <td className={styles.tableCellGoal}>{t(`protocols.items.${protocolId}.type`)}</td>
        <td className={styles.tableCellGoal}>{t(`protocols.items.${protocolId}.chain`)}</td>
        <td className={styles.tableCellGoal}>{t(`protocols.items.${protocolId}.asset`)}</td>
        <td className={styles.tableCellGoal}>
          {t(`protocols.items.${protocolId}.cryptoExposure`)}
        </td>
        <td className={styles.tableCellGoal}>
          {t(`protocols.items.${protocolId}.operatingSince`)}
        </td>
      </tr>
      <tr id={`protocol-detail-${protocolId}`} role="region" className={styles.protocolDetailRow}>
        <td colSpan={6}>
          <div
            className={`${styles.protocolDetail} ${isExpanded ? styles.protocolDetailOpen : ''}`}
          >
            <p className={styles.protocolSummary}>{t(`protocols.items.${protocolId}.summary`)}</p>
            <div className={styles.protocolLinks}>
              <LocaleLink
                href="/protocols"
                className={styles.protocolExternalLink}
                prefetch={false}
              >
                {t('protocols.checkProtocolsPage')}
              </LocaleLink>
            </div>
          </div>
        </td>
      </tr>
    </>
  );
}
