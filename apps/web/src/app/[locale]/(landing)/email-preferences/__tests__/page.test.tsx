/**
 * The email preferences page (unsubscribe; W-D1 note removal, F1 + G4, spec §3.6).
 *
 * - Unsubscribe posts only the unsubscribe action; success redirects home after 3 s, a refusal
 *   or a network failure shows the error with its own retry.
 * - Removing the note posts to `/api/waitlist/note-removal` only, never unsubscribes, and has its
 *   own outcomes: removed, nothing to remove, and an error whose retry is a removal again.
 * - A link without its id and token reads as invalid, with no buttons.
 *
 * @vitest-environment happy-dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

const secrets = vi.hoisted(() => ({
  value: { id: 'hash', token: 'tok' } as Record<string, string | null>,
}));
vi.mock('@/hooks/useUrlSecrets', () => ({ useUrlSecrets: () => secrets.value }));
vi.mock('@diboas/i18n/client', () => ({
  useTranslation: () => ({ formatMessage: ({ id }: { id: string }) => id }),
}));
vi.mock('@/components/Providers', () => ({ useLocale: () => ({ locale: 'en' }) }));
const track = vi.hoisted(() => vi.fn());
vi.mock('@/lib/analytics', () => ({ analyticsService: { track } }));
vi.mock('@/lib/utils/fetchWithRetry', () => ({ fetchWithRetry: vi.fn() }));

import { fetchWithRetry } from '@/lib/utils/fetchWithRetry';
import EmailPreferencesPage from '../page';

const K = 'common.emailPreferences.';
const reply = (status: number, body: unknown) =>
  ({ ok: status < 400, status, json: async () => body }) as unknown as Response;
let fetchMock: ReturnType<typeof vi.fn>;
let assigned: string[];

beforeEach(() => {
  secrets.value = { id: 'hash', token: 'tok' };
  vi.mocked(fetchWithRetry).mockReset();
  track.mockReset();
  fetchMock = vi.fn(async () => reply(200, { success: true }));
  vi.stubGlobal('fetch', fetchMock);
  assigned = [];
  vi.spyOn(window, 'location', 'get').mockReturnValue({
    ...window.location,
    set href(value: string) {
      assigned.push(value);
    },
  } as Location);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('the email preferences page: unsubscribe', () => {
  it('should read as invalid, with no action buttons, when the link carries no id or token', () => {
    secrets.value = { id: null, token: null };
    render(<EmailPreferencesPage />);
    expect(screen.getByText(`${K}invalidLink`)).toBeTruthy();
    expect(screen.queryByText(`${K}unsubscribeButton`)).toBeNull();
    expect(screen.queryByText(`${K}removeNoteButton`)).toBeNull();
    expect(screen.getByText('common.cookieConsent.settings')).toBeTruthy();
  });

  it('should post only the unsubscribe action and redirect home 3 seconds after success', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<EmailPreferencesPage />);
    fireEvent.click(screen.getByText(`${K}unsubscribeButton`));
    await waitFor(() => expect(screen.getByText(`${K}successUnsubscribed`)).toBeTruthy());
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/email/unsubscribe',
      expect.objectContaining({
        body: JSON.stringify({ id: 'hash', token: 'tok', action: 'unsubscribe' }),
      })
    );
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    expect(assigned.at(-1)).toMatch(/^\/en\/\?utm_source=email.*unsubscribed_redirect$/);
    expect(track).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'email_unsubscribed_redirect' })
    );
  });

  it('should show the error with a retry on a refusal and on a network failure', async () => {
    fetchMock.mockResolvedValueOnce(reply(400, { success: false }));
    render(<EmailPreferencesPage />);
    fireEvent.click(screen.getByText(`${K}unsubscribeButton`));
    await waitFor(() => expect(screen.getByText(`${K}error`)).toBeTruthy());
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    fireEvent.click(screen.getByText(`${K}tryAgainButton`));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(screen.getByText(`${K}error`)).toBeTruthy();
  });

  it('should send the stay-subscribed choice home with its event', () => {
    render(<EmailPreferencesPage />);
    fireEvent.click(screen.getByText(`${K}staySubscribedButton`));
    expect(track).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'email_stay_subscribed_clicked' })
    );
    expect(assigned.at(-1)).toMatch(/stay_subscribed$/);
  });
});

describe('the email preferences page: removing the note (W-D1)', () => {
  const removeButton = () => screen.getByText(`${K}removeNoteButton`);

  it('should post to the note-removal route only, and say when the note was removed', async () => {
    vi.mocked(fetchWithRetry).mockResolvedValueOnce(reply(200, { success: true, removed: true }));
    render(<EmailPreferencesPage />);
    fireEvent.click(removeButton());
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe(`${K}noteRemoved`));
    expect(fetchWithRetry).toHaveBeenCalledWith(
      '/api/waitlist/note-removal',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ id: 'hash', token: 'tok' }),
      })
    );
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText(`${K}unsubscribeButton`)).toBeTruthy();
  });

  it('should say there was nothing to remove when the signup had no note', async () => {
    vi.mocked(fetchWithRetry).mockResolvedValueOnce(reply(200, { success: true, removed: false }));
    render(<EmailPreferencesPage />);
    fireEvent.click(removeButton());
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe(`${K}noNote`));
  });

  it('should offer a retry that removes again, never unsubscribes, after a refusal or a failure', async () => {
    vi.mocked(fetchWithRetry)
      .mockResolvedValueOnce(reply(403, { success: false }))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(reply(200, { success: true, removed: true }));
    render(<EmailPreferencesPage />);
    fireEvent.click(removeButton());
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe(`${K}noteRemovalError`));
    fireEvent.click(screen.getByText(`${K}tryAgainButton`));
    await waitFor(() => expect(fetchWithRetry).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    fireEvent.click(screen.getByText(`${K}tryAgainButton`));
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe(`${K}noteRemoved`));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should ignore a second press while a removal is in flight', async () => {
    let finish: (r: Response) => void = () => {};
    vi.mocked(fetchWithRetry).mockReturnValueOnce(new Promise((resolve) => (finish = resolve)));
    render(<EmailPreferencesPage />);
    fireEvent.click(removeButton());
    const busy = removeButton().closest('button')!;
    expect(busy.disabled).toBe(true);
    expect(busy.getAttribute('aria-busy')).toBe('true');
    fireEvent.click(busy);
    expect(fetchWithRetry).toHaveBeenCalledTimes(1);
    await act(async () => finish(reply(200, { success: true, removed: true })));
    await waitFor(() => expect(screen.getByRole('status')).toBeTruthy());
  });
});
