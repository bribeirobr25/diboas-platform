'use client';

import { useState } from 'react';
import { LucideIcon, Check } from '@/components/UI/LucideIcon';
import { analyticsService } from '@/lib/analytics';
import styles from './investorForm.module.css';

interface FormLabels {
  name: string;
  company: string;
  email: string;
  investorType: string;
  ticketSize: string;
  thesis: string;
  message: string;
  emailHint: string;
}

interface InvestorRequestFormProps {
  locale: string;
  title: string;
  intro: string;
  labels: FormLabels;
  typeOptions: Record<string, string>;
  submit: string;
  submitting: string;
  success: string;
  error: string;
  privacyNote: string;
}

type Status = 'idle' | 'sending' | 'done' | 'error';

const EMPTY = {
  name: '',
  company: '',
  email: '',
  investorType: '',
  ticketSize: '',
  thesis: '',
  message: '',
  // Honeypot — must stay empty for real users.
  website: '',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Conversion-funnel event names (local registry — mirrors the VIDEO_EVENTS pattern).
const INVESTOR_EVENTS = {
  submit: 'investor_request_submit',
  success: 'investor_request_success',
  error: 'investor_request_error',
} as const;

export function InvestorRequestForm({
  locale,
  title,
  intro,
  labels,
  typeOptions,
  submit,
  submitting,
  success,
  error,
  privacyNote,
}: InvestorRequestFormProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [emailInvalid, setEmailInvalid] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });

  const set =
    (key: keyof typeof EMPTY) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'sending') return;

    // Honeypot: a filled hidden field means a bot — silently accept, never send.
    if (form.website) {
      setStatus('done');
      return;
    }

    // Lightweight client-side email check (server remains the source of truth).
    if (!EMAIL_RE.test(form.email)) {
      setEmailInvalid(true);
      return;
    }
    setEmailInvalid(false);

    setStatus('sending');
    // Consent-gated conversion funnel (no PII — never the email address).
    analyticsService.track({
      name: INVESTOR_EVENTS.submit,
      parameters: { locale, investorType: form.investorType || 'unset', hasTicket: !!form.ticketSize },
    });
    try {
      const { website: _honeypot, ...payload } = form;
      const res = await fetch('/api/investor-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'idempotency-key': crypto.randomUUID(),
        },
        body: JSON.stringify({ ...payload, locale }),
      });
      const data = (await res.json().catch(() => ({}))) as { success?: boolean };
      const ok = res.ok && data.success;
      setStatus(ok ? 'done' : 'error');
      analyticsService.track({
        name: ok ? INVESTOR_EVENTS.success : INVESTOR_EVENTS.error,
        parameters: { locale },
      });
    } catch {
      setStatus('error');
      analyticsService.track({ name: INVESTOR_EVENTS.error, parameters: { locale } });
    }
  }

  if (status === 'done') {
    return (
      <p className={styles.success} role="status">
        <LucideIcon icon={Check} size="sm" />
        <span>{success}</span>
      </p>
    );
  }

  const sending = status === 'sending';

  return (
    <form onSubmit={onSubmit} className={styles.form} noValidate aria-busy={sending}>
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>{title}</legend>
        <p className={styles.intro}>{intro}</p>

        <label className={styles.field}>
          <span className={styles.label}>{labels.email} *</span>
          <input
            type="email"
            required
            value={form.email}
            onChange={set('email')}
            className={styles.input}
            autoComplete="email"
            aria-invalid={emailInvalid}
            aria-describedby={emailInvalid ? 'investor-email-hint' : undefined}
          />
          {emailInvalid ? (
            <span id="investor-email-hint" role="alert" className={styles.hint}>
              {labels.emailHint}
            </span>
          ) : null}
        </label>

        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>{labels.name}</span>
            <input type="text" value={form.name} onChange={set('name')} className={styles.input} />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>{labels.company}</span>
            <input
              type="text"
              value={form.company}
              onChange={set('company')}
              className={styles.input}
            />
          </label>
        </div>

        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>{labels.investorType}</span>
            <select
              value={form.investorType}
              onChange={set('investorType')}
              className={styles.input}
            >
              <option value="">—</option>
              {Object.entries(typeOptions).map(([value, text]) => (
                <option key={value} value={value}>
                  {text}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.label}>{labels.ticketSize}</span>
            <input
              type="text"
              value={form.ticketSize}
              onChange={set('ticketSize')}
              className={styles.input}
            />
          </label>
        </div>

        <label className={styles.field}>
          <span className={styles.label}>{labels.thesis}</span>
          <input
            type="text"
            value={form.thesis}
            onChange={set('thesis')}
            className={styles.input}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>{labels.message}</span>
          <textarea
            value={form.message}
            onChange={set('message')}
            rows={3}
            className={styles.input}
          />
        </label>

        {/* Honeypot — hidden from users; bots that fill it are dropped. */}
        <div className={styles.honeypot} aria-hidden="true">
          <label>
            Website
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={form.website}
              onChange={set('website')}
            />
          </label>
        </div>
      </fieldset>

      {status === 'error' ? (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      ) : null}

      <button type="submit" className={styles.submit} disabled={sending}>
        {sending ? <span className={styles.spinner} aria-hidden="true" /> : null}
        {sending ? submitting : submit}
      </button>
      <p className={styles.privacy}>{privacyNote}</p>
    </form>
  );
}
