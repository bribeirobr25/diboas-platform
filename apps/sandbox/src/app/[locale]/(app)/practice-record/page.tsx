import { notFound } from 'next/navigation';
import { PracticeRecord } from '@/components/PracticeRecord';
import { isPracticeAccountsEnabled } from '@/lib/capabilities';

/**
 * Practice record (R3; W-11). Inside the app shell.
 *
 * `5.202` — 404 unless `PRACTICE_ACCOUNTS_ENABLED`. The screen presented a
 * Toggle labelled "Show milestones on your public page" wired to `useState`
 * alone: nothing persisted, and no public page exists. Sharper than `5.201`
 * because it reads as a PRIVACY control — a user could believe they had
 * switched public sharing off, or on, and the switch was inert.
 *
 * The capability is PRESERVED (P-Q2). Public-visibility persistence arrives
 * with the account model; the surface returns behind the flag at that point.
 */
export default function PracticeRecordPage() {
  if (!isPracticeAccountsEnabled()) notFound();
  return <PracticeRecord />;
}
