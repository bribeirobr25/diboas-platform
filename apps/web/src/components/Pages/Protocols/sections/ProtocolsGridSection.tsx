'use client';

/**
 * Protocols Grid Section
 *
 * Displays all protocols organized by category
 */

import { useTranslation } from '@diboas/i18n/client';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import { SectionContainer } from '@/components/Sections/SectionContainer';
import { ProtocolCard } from '../ProtocolCard';
import { PROTOCOL_DATA } from '../protocolsData';
import styles from './ProtocolsGridSection.module.css';

const I18N_PREFIX = 'protocols';

export function ProtocolsGridSection() {
  const intl = useTranslation();
  const t = (key: string) => intl.formatMessage({ id: `${I18N_PREFIX}.${key}` });

  // Protocol labels for card rendering
  const labels = {
    founded: t('protocolLabels.founded'),
    tvl: t('protocolLabels.tvl'),
    blockchains: t('protocolLabels.blockchains'),
    audits: t('protocolLabels.audits'),
    regulatory: t('protocolLabels.regulatory'),
    showLess: t('protocolLabels.showLess'),
    showMore: t('protocolLabels.showMore'),
    websiteLink: t('protocolLabels.websiteLink'),
    twitterLink: t('protocolLabels.twitterLink'),
  };

  // Resolve translated content for a protocol card
  const getI18nContent = (protocolId: string) => ({
    name: t(`cards.${protocolId}.name`),
    description: t(`cards.${protocolId}.description`),
    founded: t(`cards.${protocolId}.details.founded`),
    tvl: t(`cards.${protocolId}.details.tvl`),
    blockchains: t(`cards.${protocolId}.details.blockchains`),
    audits: t(`cards.${protocolId}.details.audits`),
    regulatory: t(`cards.${protocolId}.details.regulatory`),
  });

  // Category translation helpers
  const getCategoryTitle = (categoryId: string) => t(`categories.${categoryId}.title`);
  const getCategoryDescription = (categoryId: string) => t(`categories.${categoryId}.description`);

  // Exception note getter — only protocols with hasExceptionNote in protocolsData.ts
  const getExceptionNote = (protocolId: string): string | undefined => {
    const allProtocols = PROTOCOL_DATA.flatMap((cat) => cat.protocols);
    const protocol = allProtocols.find((p) => p.id === protocolId);
    if (protocol?.hasExceptionNote) {
      return t(`cards.${protocolId}.exceptionNote`);
    }
    return undefined;
  };

  // Used-in-strategies getter — only protocols with usedInStrategies in protocolsData.ts
  const getUsedInStrategies = (protocolId: string): string | undefined => {
    const allProtocols = PROTOCOL_DATA.flatMap((cat) => cat.protocols);
    const protocol = allProtocols.find((p) => p.id === protocolId);
    if (protocol?.usedInStrategies && protocol.usedInStrategies.length > 0) {
      return t(`cards.${protocolId}.usedInStrategies`);
    }
    return undefined;
  };

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
          <h2 className={styles.sectionTitle}>
            {t('grid.h2')}
          </h2>
          <p className={styles.sectionSubtitle}>
            {t('grid.subtitle')}
          </p>
          <p className={styles.tvlFreshness}>
            {t('grid.tvlFreshness')}
          </p>

          {PROTOCOL_DATA.map((category) => (
            <div key={category.id} className={styles.categoryGroup}>
              <h3 className={styles.categoryTitle}>
                {getCategoryTitle(category.id)}
              </h3>
              <p className={styles.categoryDescription}>
                {getCategoryDescription(category.id)}
              </p>

              <div className={styles.grid}>
                {category.protocols.map((protocol) => (
                  <ProtocolCard
                    key={protocol.id}
                    protocol={protocol}
                    labels={labels}
                    i18nContent={getI18nContent(protocol.id)}
                    exceptionNote={getExceptionNote(protocol.id)}
                    usedInStrategiesText={getUsedInStrategies(protocol.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionContainer>
    </SectionErrorBoundary>
  );
}
