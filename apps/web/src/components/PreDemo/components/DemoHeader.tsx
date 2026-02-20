'use client';

/**
 * DemoHeader Component
 *
 * Sticky header with logo image + text, amber "Demo" badge, user avatar, and exit button
 */

import Image from 'next/image';
import { useTranslation } from '@diboas/i18n/client';
import { usePreDemo } from '../PreDemoProvider';
import styles from '../PreDemo.module.css';

interface DemoHeaderProps {
  showAvatar?: boolean;
}

export function DemoHeader({ showAvatar = true }: DemoHeaderProps) {
  const intl = useTranslation();
  const { onExit } = usePreDemo();
  const t = (key: string) => intl.formatMessage({ id: key });

  return (
    <header className={styles.demoHeader}>
      <div className={styles.demoHeaderContent}>
        {/* Logo image + text (clickable to exit) */}
        <div className={styles.demoHeaderLeft}>
          <button
            type="button"
            className={styles.demoHeaderLogoButton}
            onClick={onExit}
          >
            <Image
              src="/assets/logos/logo-icon.avif"
              alt="diBoaS"
              width={24}
              height={24}
              className={styles.demoHeaderLogoImage}
            />
            <span className={styles.demoHeaderLogo}>diBoaS</span>
          </button>
        </div>

        {/* Demo badge — absolutely centered */}
        <span className={styles.demoBadge}>{t('preDemo.header.demoBadge')}</span>

        {/* User avatar + Exit button */}
        <div className={styles.demoHeaderRight}>
          {showAvatar && (
            <div className={styles.userAvatar}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          )}
          {onExit && (
            <button
              type="button"
              className={styles.exitButton}
              onClick={onExit}
              aria-label={t('preDemo.header.exitDemo')}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
