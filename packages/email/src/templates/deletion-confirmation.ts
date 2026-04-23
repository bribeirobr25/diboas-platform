import { wrapInLayout } from './layout';
import type { DeletionConfirmationEmailData } from '../types';
import { BRAND } from '../config';
import { escapeHtml } from '../utils';

const translations: Record<string, Record<string, string>> = {
  en: {
    subject: 'Confirm your data deletion request',
    title: 'Confirm data deletion',
    greeting: 'Hi{name},',
    greetingNoName: 'Hi,',
    body: 'We received a request to permanently delete your data from the diBoaS waitlist. Click the button below to confirm.',
    ctaButton: 'Confirm deletion',
    expiry: 'This link expires in {minutes} minutes.',
    safety: "If you didn't request this, you can safely ignore this email. No data will be deleted.",
  },
  'pt-BR': {
    subject: 'Confirme sua solicitação de exclusão de dados',
    title: 'Confirmar exclusão de dados',
    greeting: 'Olá{name},',
    greetingNoName: 'Olá,',
    body: 'Recebemos uma solicitação para excluir permanentemente seus dados da lista de espera do diBoaS. Clique no botão abaixo para confirmar.',
    ctaButton: 'Confirmar exclusão',
    expiry: 'Este link expira em {minutes} minutos.',
    safety: 'Se você não fez esta solicitação, pode ignorar este email com segurança. Nenhum dado será excluído.',
  },
  es: {
    subject: 'Confirma tu solicitud de eliminación de datos',
    title: 'Confirmar eliminación de datos',
    greeting: 'Hola{name},',
    greetingNoName: 'Hola,',
    body: 'Recibimos una solicitud para eliminar permanentemente tus datos de la lista de espera de diBoaS. Haz clic en el botón de abajo para confirmar.',
    ctaButton: 'Confirmar eliminación',
    expiry: 'Este enlace expira en {minutes} minutos.',
    safety: 'Si no solicitaste esto, puedes ignorar este correo. No se eliminará ningún dato.',
  },
  de: {
    subject: 'Bestätige deine Datenlöschungsanfrage',
    title: 'Datenlöschung bestätigen',
    greeting: 'Hallo{name},',
    greetingNoName: 'Hallo,',
    body: 'Wir haben eine Anfrage erhalten, deine Daten dauerhaft von der diBoaS-Warteliste zu löschen. Klicke auf den Button unten, um zu bestätigen.',
    ctaButton: 'Löschung bestätigen',
    expiry: 'Dieser Link läuft in {minutes} Minuten ab.',
    safety: 'Wenn du dies nicht angefordert hast, kannst du diese E-Mail ignorieren. Es werden keine Daten gelöscht.',
  },
};

export function renderDeletionConfirmation(data: DeletionConfirmationEmailData): { subject: string; html: string } {
  const t = translations[data.locale] || translations.en;

  const greeting = data.name
    ? t.greeting.replace('{name}', ` ${escapeHtml(data.name)}`)
    : t.greetingNoName;

  const content = `
    <h1 style="margin:0 0 8px;font-size:24px;color:${BRAND.textColor};">${t.title}</h1>
    <p style="margin:0 0 8px;font-size:16px;color:#475569;">${greeting}</p>
    <p style="margin:0 0 24px;font-size:16px;color:#475569;">${t.body}</p>

    <div style="text-align:center;margin-bottom:24px;">
      <a href="${data.confirmationUrl}" style="display:inline-block;padding:14px 32px;background-color:#ef4444;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;border-radius:8px;">${t.ctaButton}</a>
    </div>

    <div style="padding:16px;background-color:#fef2f2;border-radius:8px;border-left:4px solid #ef4444;margin-bottom:16px;">
      <p style="margin:0;font-size:13px;color:#991b1b;">${t.expiry.replace('{minutes}', String(data.expiresInMinutes))}</p>
    </div>

    <p style="margin:0;font-size:13px;color:#94a3b8;">${t.safety}</p>
  `;

  return { subject: t.subject, html: wrapInLayout(content, { locale: data.locale }) };
}
