import { wrapInLayout } from './layout';
import type { PositionUpdateEmailData } from '../types';
import { BRAND } from '../config';

const translations: Record<string, Record<string, string>> = {
  en: {
    subject: 'You moved up! New position: #{newPosition}',
    greeting: 'Great news{name}!',
    body: 'Someone joined through your referral link and you moved up {spotsGained} spots on the waitlist.',
    oldLabel: 'Was',
    newLabel: 'Now',
    cta: 'Keep sharing to move up even more!',
  },
  'pt-BR': {
    subject: 'Você subiu! Nova posição: #{newPosition}',
    greeting: 'Ótimas notícias{name}!',
    body: 'Alguém entrou pelo seu link e você subiu {spotsGained} posições na lista.',
    oldLabel: 'Antes',
    newLabel: 'Agora',
    cta: 'Continue compartilhando para subir ainda mais!',
  },
  es: {
    subject: '¡Subiste! Nueva posición: #{newPosition}',
    greeting: '¡Buenas noticias{name}!',
    body: 'Alguien se unió con tu enlace y subiste {spotsGained} puestos.',
    oldLabel: 'Antes',
    newLabel: 'Ahora',
    cta: '¡Sigue compartiendo para subir más!',
  },
  de: {
    subject: 'Du bist aufgerückt! Neue Position: #{newPosition}',
    greeting: 'Tolle Neuigkeiten{name}!',
    body: 'Jemand ist über deinen Link beigetreten und du bist {spotsGained} Plätze vorgerückt.',
    oldLabel: 'Vorher',
    newLabel: 'Jetzt',
    cta: 'Teile weiter, um noch weiter vorzurücken!',
  },
};

export function renderPositionUpdate(data: PositionUpdateEmailData): { subject: string; html: string } {
  const t = translations[data.locale] || translations.en;
  const subject = t.subject.replace('{newPosition}', String(data.newPosition));
  const namePart = data.name ? `, ${data.name}` : '';
  const greeting = t.greeting.replace('{name}', namePart);
  const body = t.body.replace('{spotsGained}', String(data.spotsGained));

  const content = `
    <h1 style="margin:0 0 8px;font-size:24px;color:${BRAND.textColor};">${greeting}</h1>
    <p style="margin:0 0 24px;font-size:16px;color:#475569;">${body}</p>

    <div style="display:flex;gap:16px;margin-bottom:24px;">
      <div style="flex:1;text-align:center;padding:16px;background-color:#fef2f2;border-radius:8px;">
        <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;text-transform:uppercase;">${t.oldLabel}</p>
        <p style="margin:0;font-size:32px;font-weight:700;color:#ef4444;text-decoration:line-through;">#${data.oldPosition}</p>
      </div>
      <div style="flex:1;text-align:center;padding:16px;background-color:#f0fdfa;border-radius:8px;">
        <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;text-transform:uppercase;">${t.newLabel}</p>
        <p style="margin:0;font-size:32px;font-weight:700;color:${BRAND.primaryColor};">#${data.newPosition}</p>
      </div>
    </div>

    <p style="margin:0;font-size:14px;color:#475569;text-align:center;">${t.cta}</p>
  `;

  return { subject, html: wrapInLayout(content, { locale: data.locale }) };
}
