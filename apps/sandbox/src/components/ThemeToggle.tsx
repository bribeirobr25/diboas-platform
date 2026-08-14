'use client';

import { useIntl } from 'react-intl';
import { LucideIcon } from './LucideIcon';
import { useTheme } from './ThemeProvider';
import styles from './ThemeToggle.module.css';

/**
 * The light/dark chooser. Shows the icon of the design it will switch TO (moon
 * when currently light, sun when currently dark) and announces the target in
 * its accessible label. Sits over the Welcome hero and, later, in the app
 * chrome — a single control, one source of truth (the ThemeProvider).
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const intl = useIntl();
  const goingDark = theme === 'light';
  const target = intl.formatMessage({ id: goingDark ? 'theme.dark' : 'theme.light' });

  return (
    <button
      type="button"
      className={[styles.toggle, className].filter(Boolean).join(' ')}
      onClick={toggle}
      aria-label={intl.formatMessage({ id: 'theme.toggle' }, { target })}
    >
      <LucideIcon name={goingDark ? 'moon' : 'sun'} size={20} />
    </button>
  );
}
