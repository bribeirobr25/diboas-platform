import { wrapInLayout } from './layout';
import type { ReferralSuccessEmailData } from '../types';
import { BRAND } from '../config';

const translations: Record<string, Record<string, string>> = {
  en: {
    subject: 'Someone joined through your link!',
    greeting: 'Nice one{name}!',
    body: 'A friend just joined diBoaS using your referral link.',
    totalLabel: 'Total referrals',
    positionLabel: 'Your position',
    cta: 'Keep sharing — every referral moves you up 10 spots!',
  },
  'pt-BR': {
    subject: 'Alguém entrou pelo seu link!',
    greeting: 'Muito bem{name}!',
    body: 'Um amigo acabou de entrar no diBoaS usando seu link.',
    totalLabel: 'Total de indicações',
    positionLabel: 'Sua posição',
    cta: 'Continue indicando — cada indicação te sobe 10 posições!',
  },
  es: {
    subject: '¡Alguien se unió con tu enlace!',
    greeting: '¡Bien hecho{name}!',
    body: 'Un amigo se acaba de unir a diBoaS usando tu enlace.',
    totalLabel: 'Total de referidos',
    positionLabel: 'Tu posición',
    cta: '¡Sigue compartiendo — cada referido te sube 10 puestos!',
  },
  de: {
    subject: 'Jemand ist über deinen Link beigetreten!',
    greeting: 'Gut gemacht{name}!',
    body: 'Ein Freund ist gerade über deinen Empfehlungslink diBoaS beigetreten.',
    totalLabel: 'Empfehlungen gesamt',
    positionLabel: 'Deine Position',
    cta: 'Teile weiter — jede Empfehlung bringt dich 10 Plätze nach vorne!',
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
        <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;text-transform:uppercase;">${t.totalLabel}</p>
        <p style="margin:0;font-size:32px;font-weight:700;color:${BRAND.primaryColor};">${data.referralCount}</p>
      </div>
      <div style="flex:1;text-align:center;padding:16px;background-color:#f0fdfa;border-radius:8px;">
        <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;text-transform:uppercase;">${t.positionLabel}</p>
        <p style="margin:0;font-size:32px;font-weight:700;color:${BRAND.primaryColor};">#${data.newPosition}</p>
      </div>
    </div>

    <p style="margin:0;font-size:14px;color:#475569;text-align:center;">${t.cta}</p>
  `;

  return { subject: t.subject, html: wrapInLayout(content, { locale: data.locale }) };
}
