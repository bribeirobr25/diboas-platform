/**
 * MoneyJobsGate — unlock-flow contract (spec §9: mock fetch → success /
 * ALREADY_REGISTERED / error; localStorage persistence; decision 5 mount
 * unlock from a previously-persisted email).
 *
 * useWaitlistForm runs REAL; only the network edge (`fetchWithRetry`) and
 * the analytics sink are mocked — so the GDPR-explicit validation path and
 * the ALREADY_REGISTERED onSuccess branch are exercised as shipped.
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MoneyJobsGate } from '../MoneyJobsGate';
import { POSITION_STORAGE_KEYS } from '@/lib/waitingList/constants';
import { fetchWithRetry } from '@/lib/utils/fetchWithRetry';

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

function jsonResponse(body: Record<string, unknown>, ok = true): Response {
  return { ok, json: async () => body } as unknown as Response;
}

function fillAndSubmit(email = 'gate-test@example.com') {
  fireEvent.change(screen.getByLabelText('tools-money-jobs.gate.emailPlaceholder'), {
    target: { name: 'email', value: email },
  });
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByText('tools-money-jobs.gate.cta'));
}

describe('MoneyJobsGate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('renders locked: title, 4 bullets, explicit GDPR checkbox, single submit CTA', () => {
    render(<MoneyJobsGate unlocked={false} onUnlocked={vi.fn()} />);
    expect(screen.getByText('tools-money-jobs.gate.title')).toBeTruthy();
    expect(screen.getAllByRole('listitem').length).toBe(4);
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
    expect(screen.getByText('tools-money-jobs.gate.cta')).toBeTruthy();
  });

  it('unlocks silently on mount when a waitlist email is already persisted (decision 5)', () => {
    window.localStorage.setItem(POSITION_STORAGE_KEYS.email, 'member@example.com');
    const onUnlocked = vi.fn();
    render(<MoneyJobsGate unlocked={false} onUnlocked={onUnlocked} />);
    expect(onUnlocked).toHaveBeenCalledWith(null);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('signup success → onUnlocked with data + email persisted to POSITION_STORAGE_KEYS.email', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        position: 1234,
        referralCode: 'REF123',
        referralUrl: 'https://diboas.com/?ref=REF123',
      })
    );
    const onUnlocked = vi.fn();
    render(<MoneyJobsGate unlocked={false} onUnlocked={onUnlocked} />);
    fillAndSubmit('Gate-Test@Example.com');
    await waitFor(() => expect(onUnlocked).toHaveBeenCalled());
    expect(onUnlocked.mock.calls[0]?.[0]).toMatchObject({ position: 1234 });
    // Decision 5: normalized email persisted (also repairs the dream-mode gate)
    expect(window.localStorage.getItem(POSITION_STORAGE_KEYS.email)).toBe('gate-test@example.com');
    const body = JSON.parse((mockFetch.mock.calls[0]?.[1]?.body as string) ?? '{}');
    expect(body.source).toBe('tool_money_jobs');
    expect(body.gdprAccepted).toBe(true);
  });

  it('ALREADY_REGISTERED (with position data) still unlocks', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(
        {
          errorCode: 'ALREADY_REGISTERED',
          position: 77,
          referralCode: 'OLD1',
          referralUrl: 'https://diboas.com/?ref=OLD1',
        },
        false
      )
    );
    const onUnlocked = vi.fn();
    render(<MoneyJobsGate unlocked={false} onUnlocked={onUnlocked} />);
    fillAndSubmit();
    await waitFor(() => expect(onUnlocked).toHaveBeenCalled());
    expect(onUnlocked.mock.calls[0]?.[0]).toMatchObject({ position: 77 });
  });

  it('generic API error → role=alert error, stays locked, nothing persisted', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ errorCode: 'RATE_LIMITED' }, false));
    const onUnlocked = vi.fn();
    render(<MoneyJobsGate unlocked={false} onUnlocked={onUnlocked} />);
    fillAndSubmit();
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(onUnlocked).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(POSITION_STORAGE_KEYS.email)).toBeNull();
    expect(screen.getByText('tools-money-jobs.gate.cta')).toBeTruthy();
  });

  it('unlocked without a fresh signup renders nothing (success line only after signup)', () => {
    const { container } = render(<MoneyJobsGate unlocked={true} onUnlocked={vi.fn()} />);
    expect(container.textContent).toBe('');
  });
});
