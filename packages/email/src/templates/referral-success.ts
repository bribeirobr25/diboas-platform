import { wrapInLayout } from './layout';
import type { ReferralSuccessEmailData } from '../types';
import { BRAND } from '../config';

const translations: Record<string, Record<string, string>> = {
  en: {
    subject: 'A friend just joined through your link!',
    greeting: 'Nice one{name}!',
    body: 'A friend just joined diBoaS using your referral link.',
    invitesUsedLabel: 'Invites used',
    invitesRemainingLabel: 'Remaining',
    cta: 'Keep sharing to help friends get early access!',
  },
  'pt-BR': {
    subject: 'Um amigo acabou de entrar pelo seu link!',
    greeting: 'Muito bem{name}!',
    body: 'Um amigo acabou de entrar no diBoaS usando seu link.',
    invitesUsedLabel: 'Convites usados',
    invitesRemainingLabel: 'Restantes',
    cta: 'Continue compartilhando para ajudar amigos a ter acesso antecipado!',
  },
  es: {
    subject: '¡Un amigo se unió con tu enlace!',
    greeting: '¡Bien hecho{name}!',
    body: 'Un amigo se acaba de unir a diBoaS usando tu enlace.',
    invitesUsedLabel: 'Invitaciones usadas',
    invitesRemainingLabel: 'Restantes',
    cta: '¡Sigue compartiendo para ayudar a amigos a tener acceso anticipado!',
  },
  de: {
    subject: 'Ein Freund ist über deinen Link beigetreten!',
    greeting: 'Gut gemacht{name}!',
    body: 'Ein Freund ist gerade über deinen Empfehlungslink diBoaS beigetreten.',
    invitesUsedLabel: 'Einladungen genutzt',
    invitesRemainingLabel: 'Verbleibend',
    cta: 'Teile weiter, um Freunden frühzeitigen Zugang zu ermöglichen!',
  },
};

export function renderReferralSuccess(data: ReferralSuccessEmailData): { subject: string; html: string } {
  const t = translations[data.locale] || translations.en;
  const namePart = data.name ? `, ${data.name}` : '';
  const greeting = t.greeting.replace('{name}', namePart);

  const content = `
    <h1 style="margin:0 0 8px;font-size:24px;color:${BRAND.textColor};">${greeting}</h1>
    <p style="margin:0 0 24px;font-size:16px;color:#475569;">${t.body}</p>

    <div style="display:flex;gap:16px;margin-bottom:24px;">
      <div style="flex:1;text-align:center;padding:16px;background-color:#f0fdfa;border-radius:8px;">
        <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;text-transform:uppercase;">${t.invitesUsedLabel}</p>
        <p style="margin:0;font-size:32px;font-weight:700;color:${BRAND.primaryColor};">${data.referralCount}</p>
      </div>
      <div style="flex:1;text-align:center;padding:16px;background-color:#f0fdfa;border-radius:8px;">
        <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;text-transform:uppercase;">${t.invitesRemainingLabel}</p>
        <p style="margin:0;font-size:32px;font-weight:700;color:${BRAND.primaryColor};">${data.invitesRemaining}</p>
      </div>
    </div>

    <p style="margin:0;font-size:14px;color:#475569;text-align:center;">${t.cta}</p>
  `;

  return { subject: t.subject, html: wrapInLayout(content, { locale: data.locale }) };
}
