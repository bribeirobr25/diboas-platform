/**
 * The deletion confirmation page (plan P14, E11′; register `5.863`).
 *
 * A confirmed deletion also removes the address the Money Jobs gate kept in this browser
 * (`diboas_waitlist_email`), which the server cannot reach; blocked storage is not an error.
 * A refused link reads as expired, a server failure as an error.
 *
 * @vitest-environment happy-dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

let token: string | null = 'tok';
vi.mock('@/hooks/useUrlSecrets', () => ({ useUrlSecrets: () => token }));
vi.mock('@diboas/i18n/client', () => ({
  useTranslation: () => ({ formatMessage: ({ id }: { id: string }) => id }),
}));
vi.mock('@/components/Providers', () => ({ useLocale: () => ({ locale: 'en' }) }));

import DeleteConfirmPage from '../page';
import { POSITION_STORAGE_KEYS } from '@/lib/waitingList/constants';

const K = 'waitlist.deletion.';
const answer = (status: number, body: unknown) =>
  vi.fn(async () => ({ ok: status < 400, status, json: async () => body }));

describe('the deletion confirmation page', () => {
  beforeEach(() => {
    token = 'tok';
    window.localStorage.setItem(POSITION_STORAGE_KEYS.email, 'ana@example.com');
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it('should show the expired state and no button when the link carries no token', () => {
    token = null;
    render(<DeleteConfirmPage />);
    expect(screen.getByText(`${K}expired`)).toBeTruthy();
    expect(screen.queryByText(`${K}confirmButton`)).toBeNull();
  });

  it('should remove the address kept in this browser when the deletion is confirmed', async () => {
    const fetchMock = answer(200, { success: true });
    vi.stubGlobal('fetch', fetchMock);
    render(<DeleteConfirmPage />);
    fireEvent.click(screen.getByText(`${K}confirmButton`));
    await waitFor(() => expect(screen.getByText(`${K}success`)).toBeTruthy());
    expect(window.localStorage.getItem(POSITION_STORAGE_KEYS.email)).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/waitlist/delete',
      expect.objectContaining({ method: 'DELETE', body: JSON.stringify({ token: 'tok' }) })
    );
  });

  it('should still show success when this browser blocks storage', async () => {
    vi.stubGlobal('fetch', answer(200, { success: true }));
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    render(<DeleteConfirmPage />);
    fireEvent.click(screen.getByText(`${K}confirmButton`));
    await waitFor(() => expect(screen.getByText(`${K}success`)).toBeTruthy());
  });

  it.each([
    ['expired', 400, { success: false }],
    ['error', 500, { success: false }],
  ])(
    'should show the %s state and keep the browser copy when the server answers %s',
    async (state, status, body) => {
      vi.stubGlobal('fetch', answer(status, body));
      render(<DeleteConfirmPage />);
      fireEvent.click(screen.getByText(`${K}confirmButton`));
      await waitFor(() => expect(screen.getByText(`${K}${state}`)).toBeTruthy());
      expect(window.localStorage.getItem(POSITION_STORAGE_KEYS.email)).toBe('ana@example.com');
    }
  );

  it('should show the error state when the request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline');
      })
    );
    render(<DeleteConfirmPage />);
    fireEvent.click(screen.getByText(`${K}confirmButton`));
    await waitFor(() => expect(screen.getByText(`${K}error`)).toBeTruthy());
  });
});
