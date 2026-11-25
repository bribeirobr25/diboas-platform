/**
 * POST /api/waitlist/note-removal — remove a signup's note (market clean-up W-D1, F1, F6, G4;
 * spec §3.6; CONSENT-EVIDENCE-1, removal half).
 *
 * Called by the email-preferences page with the email link's `t` (or legacy `id` + `token`).
 * The same token check as unsubscribe; the page-mutation origin check (CSRF) and a rate limit;
 * one atomic store update. Answers `{ success, removed }`, which the page reads for its
 * "removed" and "nothing to remove" states; a repeat is a 200 with `removed: false`. Never
 * touches the email opt-out.
 */
import { NextRequest, NextResponse } from 'next/server';
import { applyCsrf, applyRateLimit, readJsonObject } from '@/lib/api/routeHelpers';
import { extractEmailLinkId, verifyEmailLinkToken } from '@/lib/email/emailLinkToken';
import { removeSignupNote } from '@/lib/waitingList/store/noteRemoval';
import { Logger } from '@/lib/monitoring/Logger';

export async function POST(request: NextRequest) {
  const forbidden = applyCsrf(request);
  if (forbidden) return forbidden;
  const limited = await applyRateLimit(request, 'note-removal', 'standard');
  if (limited) return limited;

  try {
    const body = await readJsonObject(request);
    const link = extractEmailLinkId(request.nextUrl.searchParams, body);
    if (!link || !verifyEmailLinkToken(link.id, link.token)) {
      return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
    }
    const { removed } = await removeSignupNote(link.id);
    return NextResponse.json({ success: true, removed });
  } catch (error) {
    // One report, through the logger's error path (R-14); the person sees a retryable error.
    Logger.error(
      'Note removal error',
      {},
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json({ success: false, error: 'An error occurred' }, { status: 500 });
  }
}
