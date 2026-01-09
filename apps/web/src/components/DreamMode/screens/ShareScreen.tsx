'use client';

/**
 * Share Screen
 *
 * Final screen - share results and CTA to try again
 *
 * Service Agnostic Abstraction: Uses centralized translation hook
 * Code Reusability & DRY: No inline translation helpers
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useDreamMode } from '../DreamModeProvider';
import { useDreamModeTranslation } from '../hooks';
import { ShareButtons } from '@/components/Share';
import { Button } from '@diboas/ui';
import { CardRenderer, type SharePlatform, type DreamCardData, getShareUrl } from '@/lib/share';
import { formatCurrency, getCurrencyLocale } from '@/lib/calculator';
import { analyticsService } from '@/lib/analytics';
import { SuccessCheckIcon } from '@/components/Icons';
import styles from './screens.module.css';

export function ShareScreen() {
  const { intl, getTranslator } = useDreamModeTranslation();
  const { state, reset, previousScreen } = useDreamMode();
  const [isSharing, setIsSharing] = useState(false);
  const [cardUrl, setCardUrl] = useState<string | null>(null);

  const t = getTranslator('share');

  const currencyLocale = getCurrencyLocale(state.input.currency);
  const result = state.result;

  // Get timeframe label for share text
  const timeframeLabel = useMemo(() => {
    return t(`in.${state.input.timeframe}`);
  }, [t, state.input.timeframe]);

  // Format share values for translation interpolation
  const shareValues = useMemo(() => {
    if (!result) return null;
    return {
      start: formatCurrency(state.input.initialAmount, state.input.currency, currencyLocale),
      end: formatCurrency(result.defiBalance, state.input.currency, currencyLocale),
      timeframe: timeframeLabel,
      bank: formatCurrency(result.bankBalance, state.input.currency, currencyLocale),
    };
  }, [result, state.input, currencyLocale, timeframeLabel]);

  // Generate share card
  const generateCard = useCallback(async () => {
    if (!result) return null;

    const cardData: DreamCardData = {
      initialAmount: state.input.initialAmount,
      monthlyContribution: state.input.monthlyContribution,
      growthAmount: result.defiBalance,
      bankBalance: result.bankBalance, // Include bank comparison for viral effect
      timeframe: state.input.timeframe,
      currency: state.input.currency,
      locale: (intl.locale as 'en' | 'de' | 'pt-BR' | 'es') || 'en',
    };

    const renderer = new CardRenderer();
    const card = await renderer.renderDreamCard(cardData);
    return card;
  }, [result, state.input, intl.locale]);

  // Handle share
  const handleShare = useCallback(
    async (platform: SharePlatform) => {
      setIsSharing(true);

      try {
        const card = await generateCard();

        analyticsService.track({
          name: 'dream_mode_share',
          parameters: {
            platform,
            initialAmount: state.input.initialAmount,
            defiResult: result?.defiBalance,
            timeframe: state.input.timeframe,
          },
        });

        if (platform === 'download' && card) {
          // Download card
          const link = document.createElement('a');
          link.href = card.dataUrl;
          link.download = 'diboas-dream-card.png';
          link.click();
        } else if (platform === 'copy') {
          // Copy result text with UTM tracking - pass interpolation values
          const shareUrl = getShareUrl('dream', platform);
          const shareTextWithValues = shareValues ? t('shareText', shareValues) : t('shareText');
          const text = `${shareTextWithValues}\n${shareUrl}`;
          await navigator.clipboard.writeText(text);
        } else {
          // Social share with UTM tracking - pass interpolation values
          const shareUrl = getShareUrl('dream', platform);
          const shareText = shareValues ? t('shareText', shareValues) : t('shareText');

          let url = '';
          switch (platform) {
            case 'twitter':
              url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
              break;
            case 'whatsapp':
              url = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
              break;
            case 'linkedin':
              // LinkedIn doesn't support pre-filled text, so copy it first
              try {
                await navigator.clipboard.writeText(shareText);
                alert(intl.formatMessage({ id: 'share.toast.linkedInCopied' }));
              } catch {
                // Clipboard failed, continue anyway
              }
              url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
              break;
          }

          if (url) {
            window.open(url, '_blank', 'width=600,height=400');
          }
        }

        if (card) {
          setCardUrl(card.dataUrl);
        }
      } catch (error) {
        // Share action failed;
      } finally {
        setIsSharing(false);
      }
    },
    [generateCard, result, state.input, currencyLocale, t, shareValues]
  );

  // Handle try again
  const handleTryAgain = () => {
    analyticsService.track({
      name: 'dream_mode_try_again',
      parameters: {
        initialAmount: state.input.initialAmount,
        defiResult: result?.defiBalance,
        timeframe: state.input.timeframe,
      },
    });
    reset();
  };

  if (!result) {
    return null;
  }

  return (
    <div className={styles.screen}>
      <div className={styles.content}>
        {/* Celebration header */}
        <div className={styles.celebrationHeader}>
          <SuccessCheckIcon size={48} className={styles.successIcon} />
          <h2 className={styles.headline}>{t('headline')}</h2>
          <p className={styles.subhead}>{t('subhead')}</p>
        </div>

        {/* Result summary card */}
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>{t('yourGrowth')}</div>
          <div className={styles.summaryValue}>
            {formatCurrency(result.defiBalance, state.input.currency, currencyLocale)}
          </div>
          <div className={styles.summaryGain}>
            +{formatCurrency(result.defiInterest, state.input.currency, currencyLocale)}
            <span>{t(`in.${state.input.timeframe}`)}</span>
          </div>
        </div>

        {/* Share section */}
        <div className={styles.shareSection}>
          <p className={styles.shareLabel}>{t('shareYourDream')}</p>
          <ShareButtons
            onShare={handleShare}
            platforms={['whatsapp', 'twitter', 'linkedin', 'download']}
            disabled={isSharing}
          />
        </div>

        {/* CTA - Single centered primary button */}
        <div className={styles.ctaSectionCentered}>
          <Button
            variant="primary"
            size="lg"
            onClick={handleTryAgain}
            className={styles.tryAgainButton}
          >
            {t('tryAgain')}
          </Button>
        </div>

        {/* Disclaimer */}
        <p className={styles.disclaimer}>{t('disclaimer')}</p>
      </div>
    </div>
  );
}
