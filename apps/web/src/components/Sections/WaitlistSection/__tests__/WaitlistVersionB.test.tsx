/**
 * WaitlistVersionB — the business page's waitlist (invite code, or the priority list).
 *
 * Plan P13 PR-2 deleted the waitlist modal and its provider from the landing layout. This
 * renders the section with no provider around it (the layout no longer gives one) and drives
 * both paths through the real form and hook; only the network edge and the analytics sink are
 * mocked. The exact source each form posts is WAITLIST-SOURCE-1 (`5.979`).
 *
 * @vitest-environment happy-dom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { WaitlistVersionB } from '../WaitlistVersionB';
import { fetchWithRetry } from '@/lib/utils/fetchWithRetry';
import { applicationEventBus, ApplicationEventType } from '@/lib/events/ApplicationEventBus';

vi.mock('@diboas/i18n/client', () => ({
  useTranslation: () => ({
    formatMessage: ({ id }: { id: string }, values?: Record<string, unknown>) =>
      values ? `${id} ${JSON.stringify(values)}` : id,
  }),
}));
vi.mock('@/components/Providers', () => ({ useLocale: () => ({ locale: 'en' }) }));
vi.mock('@/lib/analytics', () => ({ analyticsService: { track: vi.fn() } }));
vi.mock('@/lib/utils/fetchWithRetry', () => ({ fetchWithRetry: vi.fn() }));

const mockFetch = vi.mocked(fetchWithRetry);
const NS = 'landing-b2c.waitlist.versionB';

const json = (body: Record<string, unknown>, ok = true) =>
  ({ ok, json: async () => body }) as unknown as Response;

const signupBodies = () =>
  mockFetch.mock.calls
    .filter(([url]) => url === '/api/waitlist/signup')
    .map(([, init]) => JSON.parse(String((init as RequestInit).body)) as Record<string, unknown>);

function enterCode(container: HTMLElement, code: string) {
  fireEvent.change(container.querySelector('input[name="inviteCode"]') as HTMLInputElement, {
    target: { value: code },
  });
  fireEvent.click(screen.getByText(`${NS}.inviteSubmit`));
}

function submit(form: HTMLFormElement, email: string) {
  fireEvent.change(form.querySelector('input[name="email"]') as HTMLInputElement, {
    target: { name: 'email', value: email },
  });
  const consent = form.querySelector('input[name="gdprAccepted"]') as HTMLInputElement | null;
  if (consent) fireEvent.click(consent);
  fireEvent.submit(form);
}

describe('WaitlistVersionB (the business waitlist, no provider around it)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('should render the header, one priority form and a disabled invite button when no code is typed', () => {
    const { container } = render(<WaitlistVersionB source="landing_b2b" />);
    expect(screen.getByRole('heading', { level: 3 }).textContent).toBe(`${NS}.header`);
    expect(screen.getByText(`${NS}.description`)).toBeTruthy();
    expect(container.querySelectorAll('form')).toHaveLength(1);
    expect((screen.getByText(`${NS}.inviteSubmit`) as HTMLButtonElement).disabled).toBe(true);
  });

  it('should use the configured heading level, namespace and notes when a page passes them', () => {
    render(
      <WaitlistVersionB
        source="landing_b2b"
        config={{
          namespace: 'landing-b2b.waitlist.versionB',
          headingLevel: 'h2',
          belowCta: 'note.cta',
          belowCheckbox: 'note.checkbox',
        }}
      />
    );
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(
      'landing-b2b.waitlist.versionB.header'
    );
    expect(screen.getByText('note.checkbox')).toBeTruthy();
  });

  it('should open the invite form with the trimmed code when the code has invites left', async () => {
    mockFetch.mockResolvedValueOnce(json({ valid: true, referrer: { remainingInvites: 2 } }));
    const { container } = render(<WaitlistVersionB source="landing_b2b" />);
    enterCode(container, '  DIBOAS-AB12 ');
    await waitFor(() => expect(container.querySelectorAll('form')).toHaveLength(2));
    expect(mockFetch.mock.calls[0]![0]).toBe('/api/waitlist/referral?code=DIBOAS-AB12');
    expect(screen.queryByText('waitlist.referral.invalid')).toBeNull();
  });

  it.each([
    ['a code with no invites left', () => json({ valid: true, referrer: { remainingInvites: 0 } })],
    ['an unknown code', () => json({ valid: false })],
    ['a refused request', () => json({}, false)],
  ])('should say the code is invalid for %s', async (_case, response) => {
    mockFetch.mockResolvedValueOnce(response());
    const { container } = render(<WaitlistVersionB source="landing_b2b" />);
    enterCode(container, 'DIBOAS-ZZ99');
    expect(await screen.findByText('waitlist.referral.invalid')).toBeTruthy();
    expect(container.querySelectorAll('form')).toHaveLength(1);
  });

  it('should say the code is invalid when the request throws, and clear that when the code changes', async () => {
    mockFetch.mockRejectedValueOnce(new Error('offline'));
    const { container } = render(<WaitlistVersionB source="landing_b2b" />);
    enterCode(container, 'DIBOAS-ZZ99');
    expect(await screen.findByText('waitlist.referral.invalid')).toBeTruthy();
    fireEvent.change(container.querySelector('input[name="inviteCode"]') as HTMLInputElement, {
      target: { value: 'DIBOAS-ZZ9' },
    });
    expect(screen.queryByText('waitlist.referral.invalid')).toBeNull();
  });

  it('should post landing_b2b from the priority list and show the confirmation, with no referral', async () => {
    const emitted = vi.spyOn(applicationEventBus, 'emit');
    mockFetch.mockResolvedValueOnce(
      json({ success: true, position: 42, referralCode: 'DIBOAS-NEW1', referralUrl: 'u' })
    );
    const { container } = render(<WaitlistVersionB source="landing_b2b" />);
    submit(container.querySelector('form') as HTMLFormElement, 'b2b@example.com');
    await waitFor(() => expect(container.querySelector('form')).toBeNull());
    expect(signupBodies()).toHaveLength(1);
    expect(signupBodies()[0]).toMatchObject({ source: 'landing_b2b' });
    expect(signupBodies()[0]).not.toHaveProperty('referredBy');
    const done = emitted.mock.calls.find(
      ([type]) => type === ApplicationEventType.WAITLIST_SIGNUP_COMPLETED
    );
    expect(done?.[1]).toMatchObject({ metadata: { position: 42, hasReferral: false } });
    emitted.mockRestore();
  });

  it('should send the invite code with the signup and mark it referred when the invite form is used', async () => {
    const emitted = vi.spyOn(applicationEventBus, 'emit');
    mockFetch
      .mockResolvedValueOnce(json({ valid: true, referrer: { remainingInvites: 1 } }))
      .mockResolvedValueOnce(
        json({ success: true, position: 7, referralCode: 'DIBOAS-NEW2', referralUrl: 'u' })
      );
    const { container } = render(<WaitlistVersionB source="landing_b2b" />);
    enterCode(container, 'DIBOAS-AB12');
    await waitFor(() => expect(container.querySelectorAll('form')).toHaveLength(2));
    submit(container.querySelectorAll('form')[0] as HTMLFormElement, 'invited@example.com');
    await waitFor(() => expect(container.querySelector('form')).toBeNull());
    expect(signupBodies()[0]).toMatchObject({ source: 'landing_b2b', referredBy: 'DIBOAS-AB12' });
    const done = emitted.mock.calls.find(
      ([type]) => type === ApplicationEventType.WAITLIST_SIGNUP_COMPLETED
    );
    expect(done?.[1]).toMatchObject({ metadata: { position: 7, hasReferral: true } });
    emitted.mockRestore();
  });
});
