'use client';

/**
 * The "Cookie settings" control (market clean-up W-D1, D6 + F2; spec §3.8): reopens the cookie
 * banner so a choice can be changed, from every page that can show the banner (the minimal
 * footer's legal links, email preferences, delete-confirm and the landing error page). Exported
 * from no barrel: each placement imports it by name, so WITHDRAW-1's route walk can follow it.
 * `data-cookie-settings` lets the banner find a control to return focus to when the one that
 * opened it is gone.
 */
import type { MouseEvent } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { openCookieSettings } from './consentUtils';

interface CookieSettingsButtonProps {
  className?: string;
}

export function CookieSettingsButton({ className }: CookieSettingsButtonProps) {
  const intl = useTranslation();
  const open = (event: MouseEvent<HTMLButtonElement>) => openCookieSettings(event.currentTarget);
  return (
    <button type="button" className={className} onClick={open} data-cookie-settings="">
      {intl.formatMessage({ id: 'common.cookieConsent.settings' })}
    </button>
  );
}
