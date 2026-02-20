'use client';

import { useTranslation } from '@diboas/i18n/client';
import { usePreDemo } from '../PreDemoProvider';
import { DemoHeader } from '../components/DemoHeader';
import { DemoFooter } from '../components/DemoFooter';
import { BalanceCard } from '../components/BalanceCard';
import { QuickActions } from '../components/QuickActions';
import { ActivityFeed } from '../components/ActivityFeed';
import styles from '../PreDemo.module.css';

export function HomeScreen() {
  const intl = useTranslation();
  const { setScreen } = usePreDemo();

  const t = (key: string) => intl.formatMessage({ id: key });

  return (
    <div className={styles.screen}>
      <DemoHeader />

      <div className={styles.screenContent}>
        {/* Balance card - clickable to wallet details */}
        <button
          type="button"
          onClick={() => setScreen('wallet-details')}
          className={styles.clickable}
        >
          <BalanceCard />
        </button>

        {/* Quick actions */}
        <QuickActions />

        {/* Activity feed */}
        <ActivityFeed />
      </div>

      <DemoFooter />
    </div>
  );
}
