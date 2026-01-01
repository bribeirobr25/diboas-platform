'use client';

/**
 * Share Screen
 *
 * Final screen - share results and CTA to join waitlist
 */

import React, { useState, useCallback } from 'react';
import { useIntl } from 'react-intl';
import { useDreamMode } from '../DreamModeProvider';
import { ShareButtons } from '@/components/Share';
import { CardRenderer, type SharePlatform, type DreamCardData, getShareUrl } from '@/lib/share';
import { formatCurrency, getCurrencyLocale } from '@/lib/calculator';
import { analyticsService } from '@/lib/analytics';
import styles from './screens.module.css';

interface ShareScreenProps {
  /** Callback when waitlist CTA is clicked */
  onJoinWaitlist?: () => void;
}

export function ShareScreen({ onJoinWaitlist }: ShareScreenProps) {
  const intl = useIntl();
  const { state, reset, previousScreen } = useDreamMode();
  const [isSharing, setIsSharing] = useState(false);
  const [cardUrl, setCardUrl] = useState<string | null>(null);

  const t = (key: string) => intl.formatMessage({ id: `dreamMode.share.${key}` });

  const currencyLocale = getCurrencyLocale(state.input.currency);
  const result = state.result;

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
          // Copy result text with UTM tracking
          const shareUrl = getShareUrl('dream', platform);
          const text = `${t('shareText')} ${formatCurrency(result?.defiBalance || 0, state.input.currency, currencyLocale)} #WhileISlept\n${shareUrl}`;
          await navigator.clipboard.writeText(text);
        } else {
          // Social share with UTM tracking
          const shareUrl = getShareUrl('dream', platform);
          const shareText = `${t('shareText')} ${formatCurrency(result?.defiBalance || 0, state.input.currency, currencyLocale)} #WhileISlept`;

          let url = '';
          switch (platform) {
            case 'twitter':
              url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
              break;
            case 'whatsapp':
              url = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
              break;
            case 'linkedin':
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
        console.error('Share failed:', error);
      } finally {
        setIsSharing(false);
      }
    },
    [generateCard, result, state.input, currencyLocale, t]
  );

  // Handle join waitlist
  const handleJoinWaitlist = () => {
    analyticsService.track({
      name: 'dream_mode_waitlist_click',
      parameters: {
        initialAmount: state.input.initialAmount,
        defiResult: result?.defiBalance,
        timeframe: state.input.timeframe,
      },
    });

    onJoinWaitlist?.();
  };

  // Handle try again
  const handleTryAgain = () => {
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
          <span className={styles.celebrationEmoji}>🎉</span>
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

        {/* CTAs */}
        <div className={styles.ctaSection}>
          <button onClick={handleJoinWaitlist} className={styles.primaryButton}>
            {t('joinWaitlist')}
          </button>
          <button onClick={handleTryAgain} className={styles.secondaryButton}>
            {t('tryAgain')}
          </button>
        </div>

        {/* Disclaimer */}
        <p className={styles.disclaimer}>{t('disclaimer')}</p>
      </div>
    </div>
  );
}
