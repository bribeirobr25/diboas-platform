/**
 * The landing waitlist form (market clean-up W-D1, F5, G1, G7; spec §3.3): no consent box (it
 * submits with an email only), the join notice with the Privacy Policy linked, and an unticked,
 * optional note box whose tick sends the box's text and version with the held note.
 *
 * @vitest-environment happy-dom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

vi.mock('@diboas/i18n/client', () => ({
  useTranslation: () => ({
    formatMessage: ({ id }: { id: string }, values?: Record<string, unknown>) => {
      const link = values?.link as ((chunks: string) => unknown) | undefined;
      return link ? [id, link('privacy')] : id;
    },
  }),
}));
vi.mock('@/components/Providers', () => ({ useLocale: () => ({ locale: 'en' }) }));
vi.mock('@/lib/analytics', () => ({ analyticsService: { track: vi.fn() } }));
vi.mock('@/lib/utils/fetchWithRetry', () => ({ fetchWithRetry: vi.fn() }));

import { fetchWithRetry } from '@/lib/utils/fetchWithRetry';
import { captureUtmFromUrl } from '@/lib/analytics/utmAttribution';
import { WaitlistForm } from '../WaitlistForm';

const ok = () =>
  vi.mocked(fetchWithRetry).mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => ({ position: 1, referralCode: 'R', referralUrl: 'u' }),
  } as unknown as Response);
const sent = () =>
  JSON.parse((vi.mocked(fetchWithRetry).mock.calls.at(-1)?.[1] as RequestInit).body as string);

beforeEach(() => {
  vi.mocked(fetchWithRetry).mockReset();
  delete (globalThis as Record<symbol, unknown>)[Symbol.for('diboas.attributionHold')];
  captureUtmFromUrl('/?utm_source=ig');
});

describe('WaitlistForm (W-D1)', () => {
  it('should show the join notice with the privacy link and an unticked optional note box, and no consent box', () => {
    const { container } = render(<WaitlistForm onSuccess={vi.fn()} />);
    expect(container.textContent).toContain('waitlist.form.joinNotice');
    expect(container.querySelector('a[href$="/legal/privacy"]')).not.toBeNull();
    const box = screen.getByRole('checkbox') as HTMLInputElement;
    expect(box.name).toBe('noteConsent');
    expect(box.checked).toBe(false);
    expect(box.required).toBe(false);
    expect(container.querySelector('input[name="gdprAccepted"]')).toBeNull();
    expect(screen.getByText('waitlist.form.noteConsent')).toBeTruthy();
  });

  it('should submit with an email only, sending no note', async () => {
    ok();
    const onSuccess = vi.fn();
    const { container } = render(<WaitlistForm onSuccess={onSuccess} />);
    fireEvent.change(container.querySelector('input[name="email"]')!, {
      target: { name: 'email', value: 'ana@example.com' },
    });
    fireEvent.submit(container.querySelector('form')!);
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(sent()).toMatchObject({ email: 'ana@example.com', gdprAccepted: true });
    expect(sent()).not.toHaveProperty('tags');
    expect(sent()).not.toHaveProperty('attributionConsent');
  });

  it('should send the note with the box text and version when the box is ticked', async () => {
    ok();
    const onSuccess = vi.fn();
    const { container } = render(<WaitlistForm onSuccess={onSuccess} />);
    fireEvent.change(container.querySelector('input[name="email"]')!, {
      target: { name: 'email', value: 'ana@example.com' },
    });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.submit(container.querySelector('form')!);
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(sent()).toMatchObject({
      tags: ['utm_source:ig'],
      attributionConsent: { text: 'note', version: 1 },
    });
  });
});
