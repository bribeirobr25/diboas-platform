/**
 * MoneyJobsGate — unlock-flow contract (spec §9: mock fetch → success /
 * ALREADY_REGISTERED / error; localStorage persistence; decision 5 mount
 * unlock from a previously-persisted email).
 *
 * useWaitlistForm runs REAL; only the network edge (`fetchWithRetry`) and
 * the analytics sink are mocked — so the ALREADY_REGISTERED onSuccess branch is exercised as
 * shipped. W-D1 (F5, G1; 5.1005): no consent box (the gate submits with an email only), the join
 * notice and the optional campaign-only note box instead, and its errors are real `waitlist.*`
 * messages, never raw `common.waitingList.*` ids.
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
  fireEvent.click(screen.getByText('tools-money-jobs.gate.cta'));
}

describe('MoneyJobsGate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('renders locked: title, 4 bullets, the join notice, an unticked note box, single submit CTA', () => {
    const { container } = render(<MoneyJobsGate unlocked={false} onUnlocked={vi.fn()} />);
    expect(screen.getByText('tools-money-jobs.gate.title')).toBeTruthy();
    expect(screen.getAllByRole('listitem').length).toBe(4);
    expect(screen.getByText(/^waitlist\.form\.joinNotice/)).toBeTruthy();
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.name).toBe('noteConsent');
    expect(checkbox.checked).toBe(false);
    expect(checkbox.required).toBe(false);
    expect(screen.getByText('waitlist.form.noteConsentCampaignOnly')).toBeTruthy();
    expect(container.querySelector('input[name="gdprAccepted"]')).toBeNull();
    expect(screen.getByText('tools-money-jobs.gate.cta')).toBeTruthy();
  });

  it('submits with an email only, without the note or its consent field', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ position: 1, referralCode: 'R', referralUrl: 'https://diboas.com/?ref=R' })
    );
    const onUnlocked = vi.fn();
    render(<MoneyJobsGate unlocked={false} onUnlocked={onUnlocked} />);
    fillAndSubmit();
    await waitFor(() => expect(onUnlocked).toHaveBeenCalled());
    const body = JSON.parse((mockFetch.mock.calls[0]?.[1]?.body as string) ?? '{}');
    expect(body.gdprAccepted).toBe(true);
    expect(body).not.toHaveProperty('attributionConsent');
    expect(body).not.toHaveProperty('tags');
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
    // Decision 5: normalized email persisted (Dream Mode, which read it, was deleted in P13)
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
    // 5.1005: a real `waitlist` message id, which the page loads (never `common.waitingList.*`)
    expect(screen.getByRole('alert').textContent).toBe('waitlist.error.generic');
    expect(onUnlocked).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(POSITION_STORAGE_KEYS.email)).toBeNull();
    expect(screen.getByText('tools-money-jobs.gate.cta')).toBeTruthy();
  });

  it('unlocked without a fresh signup renders nothing (success line only after signup)', () => {
    const { container } = render(<MoneyJobsGate unlocked={true} onUnlocked={vi.fn()} />);
    expect(container.textContent).toBe('');
  });

  it('5.1005: every error the gate can show exists in all four locales, and the page loads it', async () => {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const root = join(__dirname, '../../../../../../../packages/i18n/translations');
    for (const locale of ['en', 'pt-BR', 'es', 'de']) {
      const errors = JSON.parse(readFileSync(join(root, locale, 'waitlist.json'), 'utf8')).error;
      for (const key of ['generic', 'invalidEmail', 'alreadyRegistered', 'network'])
        expect(typeof errors[key], `${locale} waitlist.error.${key}`).toBe('string');
    }
    const page = readFileSync(
      join(__dirname, '../../../../app/[locale]/(landing)/tools/money-jobs/page.tsx'),
      'utf8'
    );
    expect(page.slice(page.indexOf('loadPageNamespaces('))).toMatch(/^[^\]]*'waitlist'/);
  });
});
