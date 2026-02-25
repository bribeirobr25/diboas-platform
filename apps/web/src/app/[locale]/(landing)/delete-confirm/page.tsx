'use client';

/**
 * GDPR Deletion Confirmation Page
 *
 * Users arrive here from the deletion confirmation email.
 * Reads the token from the URL and lets them confirm deletion.
 */

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from '@diboas/i18n/client';

type DeletionState = 'idle' | 'confirming' | 'success' | 'expired' | 'error';

export default function DeleteConfirmPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const intl = useTranslation();
  const [state, setState] = useState<DeletionState>(token ? 'idle' : 'error');

  const t = (key: string) => {
    return intl.formatMessage({ id: `waitlist.deletion.${key}` });
  };

  const handleConfirm = async () => {
    if (!token) return;
    setState('confirming');

    try {
      const response = await fetch('/api/waitlist/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setState('success');
      } else if (response.status === 400) {
        setState('expired');
      } else {
        setState('error');
      }
    } catch {
      setState('error');
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
      {state === 'idle' && (
        <>
          <h1 style={{ fontSize: 24, marginBottom: 16 }}>{t('confirmTitle')}</h1>
          <p style={{ color: '#475569', marginBottom: 32 }}>{t('confirmBody')}</p>
          <button
            onClick={handleConfirm}
            style={{
              padding: '14px 32px',
              backgroundColor: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {t('confirmButton')}
          </button>
        </>
      )}

      {state === 'confirming' && (
        <p style={{ color: '#475569' }}>{t('confirming')}</p>
      )}

      {state === 'success' && (
        <>
          <h1 style={{ fontSize: 24, marginBottom: 16, color: '#16a34a' }}>{t('success')}</h1>
          <p style={{ color: '#475569' }}>{t('successBody')}</p>
        </>
      )}

      {state === 'expired' && (
        <>
          <h1 style={{ fontSize: 24, marginBottom: 16, color: '#f59e0b' }}>{t('expired')}</h1>
          <p style={{ color: '#475569' }}>{t('expiredBody')}</p>
        </>
      )}

      {state === 'error' && (
        <>
          <h1 style={{ fontSize: 24, marginBottom: 16, color: '#ef4444' }}>{t('error')}</h1>
          <p style={{ color: '#475569' }}>{t('errorBody')}</p>
        </>
      )}
    </div>
  );
}
