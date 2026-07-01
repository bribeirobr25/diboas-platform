'use client';

import { useState } from 'react';
import { LucideIcon, Check } from '@/components/UI/LucideIcon';
import styles from './investorForm.module.css';

interface FormLabels {
  name: string;
  company: string;
  email: string;
  investorType: string;
  ticketSize: string;
  thesis: string;
  message: string;
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
};

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
  const [form, setForm] = useState({ ...EMPTY });

  const set =
    (key: keyof typeof EMPTY) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'sending') return;
    setStatus('sending');
    try {
      const res = await fetch('/api/investor-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'idempotency-key': crypto.randomUUID(),
        },
        body: JSON.stringify({ ...form, locale }),
      });
      const data = (await res.json().catch(() => ({}))) as { success?: boolean };
      setStatus(res.ok && data.success ? 'done' : 'error');
    } catch {
      setStatus('error');
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

  return (
    <form onSubmit={onSubmit} className={styles.form} noValidate>
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
          />
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
      </fieldset>

      {status === 'error' ? (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      ) : null}

      <button type="submit" className={styles.submit} disabled={status === 'sending'}>
        {status === 'sending' ? submitting : submit}
      </button>
      <p className={styles.privacy}>{privacyNote}</p>
    </form>
  );
}
