'use client';

/**
 * Protocols Grid Section
 *
 * Displays all protocols organized by category using ExpandableCard pattern.
 * Multi-expand: users can expand multiple protocols to compare.
 */

import { useTranslation } from '@diboas/i18n/client';
import { AlertTriangle, CheckCircle } from '@/components/UI/LucideIcon';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import { SectionContainer } from '@/components/Sections/SectionContainer';
import { ExpandableCard, ExpandableCardGrid } from '@/components/UI/ExpandableCard';
import { PROTOCOL_DATA } from '../protocolsData';
import styles from './ProtocolsGridSection.module.css';

const I18N_PREFIX = 'protocols';

export function ProtocolsGridSection() {
  const intl = useTranslation();
  const t = (key: string) => intl.formatMessage({ id: `${I18N_PREFIX}.${key}` });
  const expandLabel = intl.formatMessage({ id: 'common.expandable.showMore' });
  const collapseLabel = intl.formatMessage({ id: 'common.expandable.showLess' });

  const labels = {
    founded: t('protocolLabels.founded'),
    tvl: t('protocolLabels.tvl'),
    blockchains: t('protocolLabels.blockchains'),
    audits: t('protocolLabels.audits'),
    regulatory: t('protocolLabels.regulatory'),
    websiteLink: t('protocolLabels.websiteLink'),
    twitterLink: t('protocolLabels.twitterLink'),
  };

  const getI18n = (id: string) => ({
    name: t(`cards.${id}.name`),
    description: t(`cards.${id}.description`),
    founded: t(`cards.${id}.details.founded`),
    tvl: t(`cards.${id}.details.tvl`),
    blockchains: t(`cards.${id}.details.blockchains`),
    audits: t(`cards.${id}.details.audits`),
    regulatory: t(`cards.${id}.details.regulatory`),
  });

  const getExceptionNote = (protocolId: string): string | undefined => {
    const all = PROTOCOL_DATA.flatMap((cat) => cat.protocols);
    const p = all.find((x) => x.id === protocolId);
    return p?.hasExceptionNote ? t(`cards.${protocolId}.exceptionNote`) : undefined;
  };

  const getUsedInStrategies = (protocolId: string): string | undefined => {
    const all = PROTOCOL_DATA.flatMap((cat) => cat.protocols);
    const p = all.find((x) => x.id === protocolId);
    return p?.usedInStrategies?.length ? t(`cards.${protocolId}.usedInStrategies`) : undefined;
  };

  const getCategoryTitle = (id: string) => t(`categories.${id}.title`);
  const getCategoryDescription = (id: string) => t(`categories.${id}.description`);

  return (
    <SectionErrorBoundary
      sectionId="protocols-section"
      sectionType="ProtocolsGrid"
      enableReporting={true}
      context={{ page: 'protocols' }}
    >
      <SectionContainer
        variant="wide"
        padding="standard"
        backgroundColor="var(--bc-color-section-bg)"
      >
        <div className={styles.content}>
          <h2 className={styles.sectionTitle}>{t('grid.h2')}</h2>
          <p className={styles.sectionSubtitle}>{t('grid.subtitle')}</p>
          <p className={styles.tvlFreshness}>{t('grid.tvlFreshness')}</p>

          {PROTOCOL_DATA.map((category) => (
            <div key={category.id} className={styles.categoryGroup}>
              <h3 className={styles.categoryTitle}>{getCategoryTitle(category.id)}</h3>
              <p className={styles.categoryDescription}>{getCategoryDescription(category.id)}</p>

              <ExpandableCardGrid multiExpand={true}>
                {({ isExpanded, onToggle }) => (
                  <>
                    {category.protocols.map((protocol) => {
                      const i18n = getI18n(protocol.id);
                      const exceptionNote = getExceptionNote(protocol.id);
                      const usedInStrategies = getUsedInStrategies(protocol.id);

                      return (
                        <ExpandableCard
                          key={protocol.id}
                          id={protocol.id}
                          title={i18n.name}
                          titleSummary={i18n.tvl}
                          expandLabel={expandLabel}
                          collapseLabel={collapseLabel}
                          isExpanded={isExpanded(protocol.id)}
                          onToggle={onToggle}
                        >
                          {/* Badge */}
                          {protocol.badge === 'warning' ? (
                            <span className={styles.badgeWarning}>
                              <AlertTriangle className={styles.badgeIcon} aria-hidden="true" />
                            </span>
                          ) : null}
                          {protocol.badge === 'success' ? (
                            <span className={styles.badgeSuccess}>
                              <CheckCircle className={styles.badgeIcon} aria-hidden="true" />
                            </span>
                          ) : null}

                          {/* Description */}
                          <p className={styles.protocolDescription}>{i18n.description}</p>

                          {exceptionNote ? (
                            <p className={styles.exceptionNote}>{exceptionNote}</p>
                          ) : null}
                          {usedInStrategies ? (
                            <p className={styles.usedInStrategies}>{usedInStrategies}</p>
                          ) : null}

                          {/* Details */}
                          <div className={styles.protocolDetails}>
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>{labels.founded}</span>
                              <span className={styles.detailValue}>{i18n.founded}</span>
                            </div>
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>{labels.blockchains}</span>
                              <span className={styles.detailValue}>{i18n.blockchains}</span>
                            </div>
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>{labels.audits}</span>
                              <span className={styles.detailValue}>{i18n.audits}</span>
                            </div>
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>{labels.regulatory}</span>
                              <span className={styles.detailValue}>{i18n.regulatory}</span>
                            </div>
                          </div>

                          {/* Links */}
                          <div className={styles.protocolLinks}>
                            <a href={protocol.website} target="_blank" rel="noopener noreferrer" className={styles.protocolLink}>
                              {labels.websiteLink}
                            </a>
                            <a href={protocol.twitter} target="_blank" rel="noopener noreferrer" className={styles.protocolLink}>
                              {labels.twitterLink}
                            </a>
                          </div>
                        </ExpandableCard>
                      );
                    })}
                  </>
                )}
              </ExpandableCardGrid>
            </div>
          ))}
        </div>
      </SectionContainer>
    </SectionErrorBoundary>
  );
}
