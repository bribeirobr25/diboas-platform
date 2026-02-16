'use client';

import { useCallback, useRef } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { usePreDemo } from '../PreDemoProvider';
import { DemoHeader } from '../components/DemoHeader';
import { DemoFooter } from '../components/DemoFooter';
import { GoogleIcon, XIcon, MetaMaskIcon } from '../components/Icons';
import { analyticsService } from '@/lib/analytics';
import styles from '../PreDemo.module.css';

export function LoginScreen({ onExit }: { onExit?: () => void }) {
  const intl = useTranslation();
  const { setScreen } = usePreDemo();
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const t = (key: string) => intl.formatMessage({ id: key });

  const handleProceed = useCallback(() => {
    analyticsService.track({ name: 'pre_demo_login_start', parameters: {} });
    timerRef.current.forEach(clearTimeout);
    timerRef.current = [];

    setScreen('creating-account');

    const t1 = setTimeout(() => {
      setScreen('creating-wallet');
    }, 2000);
    timerRef.current.push(t1);

    const t2 = setTimeout(() => {
      setScreen('home');
    }, 4000);
    timerRef.current.push(t2);
  }, [setScreen]);

  return (
    <div className={styles.screen}>
      <DemoHeader showAvatar={false} />

      <div className={styles.screenCenter} style={{ flex: 1, minHeight: 0 }}>
        <div className={styles.screenCard} style={{ maxWidth: 384 }}>
          {/* Logo */}
          <div className={styles.logoCircle}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/logos/logo-icon.avif"
              alt="diBoaS"
              className={styles.logoImage}
            />
          </div>

          {/* Title + Subtitle with reduced gap */}
          <div style={{ textAlign: 'center' }}>
            <h1 className={styles.screenTitle}>
              {t('preDemo.login.title')}
            </h1>
            <p className={styles.screenSubtitle} style={{ marginTop: 4 }}>
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
