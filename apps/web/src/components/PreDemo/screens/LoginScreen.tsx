'use client';

import { useCallback } from 'react';
import Image from 'next/image';
import { useTranslation } from '@diboas/i18n/client';
import { ASSET_PATHS } from '@/config/assets';
import { DemoHeader } from '../components/DemoHeader';
import { DemoFooter } from '../components/DemoFooter';
import { GoogleIcon, XIcon, MetaMaskIcon } from '../components/Icons';
import { analyticsService } from '@/lib/analytics';
import {
  applicationEventBus,
  ApplicationEventType,
} from '@/lib/events/ApplicationEventBus';
import type { TransitionStep } from '../hooks';
import styles from '../PreDemo.module.css';

interface LoginScreenProps {
  onExit?: () => void;
  runSequence: (steps: TransitionStep[]) => void;
}

export function LoginScreen({ onExit, runSequence }: LoginScreenProps) {
  const intl = useTranslation();

  const t = (key: string) => intl.formatMessage({ id: key });

  // Login flow timer sequence — owned by PreDemoContent via runSequence
  // so timers survive LoginScreen unmount when screen changes to 'creating-account'
  const handleProceed = useCallback(() => {
    analyticsService.track({ name: 'pre_demo_login_start', parameters: {} });

    runSequence([
      { screen: 'creating-account', delayMs: 0 },
      { screen: 'creating-wallet', delayMs: 2000 },
      {
        screen: 'home',
        delayMs: 4000,
        onReach: () => {
          applicationEventBus.emit(ApplicationEventType.PRE_DEMO_STARTED, {
            source: 'preDemo',
            timestamp: Date.now(),
          });
        },
      },
    ]);
  }, [runSequence]);

  return (
    <div className={styles.screen}>
      <DemoHeader showAvatar={false} />

      <div className={`${styles.screenCenter} ${styles.screenCenterFlex}`}>
        <div className={`${styles.screenCard} ${styles.screenCardNarrow}`}>
          {/* Logo */}
          <div className={styles.logoCircle}>
            <Image
              src={ASSET_PATHS.LOGOS.ICON}
              alt="diBoaS"
              width={48}
              height={48}
              className={styles.logoImage}
            />
          </div>

          {/* Title + Subtitle with reduced gap */}
          <div className={styles.textCenter}>
            <h1 className={styles.screenTitle}>
              {t('preDemo.login.title')}
            </h1>
            <p className={`${styles.screenSubtitle} ${styles.subtitleClose}`}>
              {t('preDemo.login.subtitle')}
            </p>
          </div>

          {/* Login Card — includes button inside */}
          <div className={styles.loginCard}>
            {/* Email input (pre-filled, disabled) */}
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>
                {t('preDemo.login.emailLabel')}
              </label>
              <input
                type="email"
                value="guest@diboas.com"
                disabled
                className={styles.inputField}
              />
            </div>

            {/* Password input (pre-filled, disabled) */}
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>
                {t('preDemo.login.passwordLabel')}
              </label>
              <input
                type="password"
                value="123456"
                disabled
                className={styles.inputField}
              />
            </div>

            {/* Divider */}
            <div className={styles.divider}>
              <span className={styles.dividerText}>
                {t('preDemo.login.orContinueWith')}
              </span>
            </div>

            {/* OAuth buttons with branded icons */}
            <div className={styles.oauthGrid}>
              <button disabled className={styles.oauthButton}>
                <GoogleIcon />
                <span>Google</span>
              </button>
              <button disabled className={styles.oauthButton}>
                <XIcon />
                <span>X</span>
              </button>
              <button disabled className={styles.oauthButton}>
                <MetaMaskIcon />
                <span>Wallet</span>
              </button>
            </div>

            {/* Start Demo button (inside card) */}
            <button
              onClick={handleProceed}
              className={styles.primaryButton}
              data-autofocus
            >
              {t('preDemo.login.startDemo')}
            </button>
          </div>

        </div>
      </div>

      <DemoFooter />
    </div>
  );
}
