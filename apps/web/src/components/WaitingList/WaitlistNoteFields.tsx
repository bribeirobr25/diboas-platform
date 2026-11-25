'use client';

/**
 * The signup forms' join notice and note box (market clean-up W-D1, spec §3.3, §6.4; F3, F5, G1,
 * G4, G7). One component for both forms, so the two texts render the same way everywhere.
 *
 * - The **join notice** replaces the bundled consent box: joining brings the waitlist and launch
 *   emails (stoppable from every email) and the Privacy Policy is linked. No box: nothing to tick.
 * - The **note box** is its own unticked, optional checkbox (`name="noteConsent"`). Ticked, the
 *   signup also stores which button or campaign link brought the person (the landing forms,
 *   `note`), or which campaign link (the Money Jobs gate, `note-campaign`, which reads no button).
 *   Its label extends the checkbox's target (≥44 px).
 */
import type { ChangeEvent, ReactNode } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { LocaleLink } from '@/components/UI/LocaleLink';
import type { NoteConsentText } from '@/lib/waitingList/constants';

/** The note box's translation key per text (CONSENT-TEXT-1 versions each one). */
export const NOTE_BOX_KEYS: Readonly<Record<NoteConsentText, string>> = {
  note: 'waitlist.form.noteConsent',
  'note-campaign': 'waitlist.form.noteConsentCampaignOnly',
};
export const JOIN_NOTICE_KEY = 'waitlist.form.joinNotice';

interface WaitlistNoteFieldsProps {
  text: NoteConsentText;
  checked: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  id: string;
  classNames: { notice?: string; row?: string; checkbox?: string; label?: string };
}

export function WaitlistNoteFields({
  text,
  checked,
  onChange,
  disabled = false,
  id,
  classNames,
}: WaitlistNoteFieldsProps) {
  const intl = useTranslation();
  return (
    <>
      <p className={classNames.notice}>
        {intl.formatMessage(
          { id: JOIN_NOTICE_KEY },
          {
            link: (chunks: ReactNode) => (
              <LocaleLink key="privacy" href="/legal/privacy">
                {chunks}
              </LocaleLink>
            ),
          }
        )}
      </p>
      <label htmlFor={id} className={classNames.row}>
        <input
          id={id}
          type="checkbox"
          name="noteConsent"
          checked={checked}
          onChange={onChange}
          className={classNames.checkbox}
          disabled={disabled}
        />
        <span className={classNames.label}>{intl.formatMessage({ id: NOTE_BOX_KEYS[text] })}</span>
      </label>
    </>
  );
}
