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
    referralShareText: 'My friends are already joining. Join us! Free your money and make it grow.',
  },
  'pt-BR': {
    subject: 'Um amigo acabou de entrar pelo seu link!',
    greeting: 'Muito bem{name}!',
    body: 'Um amigo acabou de entrar no diBoaS usando seu link.',
    invitesUsedLabel: 'Convites usados',
    invitesRemainingLabel: 'Restantes',
    cta: 'Continue compartilhando para ajudar amigos a ter acesso antecipado!',
    referralShareText: 'Meus amigos já estão entrando. Junte-se a nós! Liberte seu dinheiro e faça-o crescer.',
  },
  es: {
    subject: '¡Un amigo se unió con tu enlace!',
    greeting: '¡Bien hecho{name}!',
    body: 'Un amigo se acaba de unir a diBoaS usando tu enlace.',
    invitesUsedLabel: 'Invitaciones usadas',
    invitesRemainingLabel: 'Restantes',
    cta: '¡Sigue compartiendo para ayudar a amigos a tener acceso anticipado!',
    referralShareText: 'Mis amigos ya se están uniendo. ¡Únete! Libera tu dinero y hazlo crecer.',
  },
  de: {
    subject: 'Ein Freund ist über deinen Link beigetreten!',
    greeting: 'Gut gemacht{name}!',
    body: 'Ein Freund ist gerade über deinen Empfehlungslink diBoaS beigetreten.',
    invitesUsedLabel: 'Einladungen genutzt',
    invitesRemainingLabel: 'Verbleibend',
    cta: 'Teile weiter, um Freunden frühzeitigen Zugang zu ermöglichen!',
    referralShareText: 'Meine Freunde sind schon dabei. Mach mit! Befreie dein Geld und lass es wachsen.',
  },
};

/**
 * Render social share buttons for email (table-based for email client compatibility).
 */
function renderSocialShareButtons(shareText: string, referralUrl: string): string {
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(referralUrl);

  const platforms = [
    { name: 'WhatsApp', color: '#25D366', href: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${referralUrl}`)}` },
    { name: 'X', color: '#0f172a', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${shareText} @diboasfi ${referralUrl}`)}` },
    { name: 'Facebook', color: '#1877F2', href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}` },
    { name: 'LinkedIn', color: '#0A66C2', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
  ];

  const buttons = platforms.map(p =>
    `<td style="padding:0 6px;"><a href="${p.href}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:8px 16px;background-color:${p.color};color:#ffffff;border-radius:6px;font-size:12px;font-weight:600;text-decoration:none;min-width:60px;text-align:center;">${p.name}</a></td>`
  ).join('');

  return `
    <table role="presentation" style="margin:16px auto 24px;border-spacing:0;">
      <tr>${buttons}</tr>
    </table>
  `;
}

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

    <p style="margin:0 0 16px;font-size:14px;color:#475569;text-align:center;">${t.cta}</p>

    <div style="padding:12px 16px;background-color:#f1f5f9;border-radius:8px;margin-bottom:16px;word-break:break-all;">
      <p style="margin:0;font-size:13px;color:${BRAND.primaryColor};font-weight:600;">${data.referralUrl}</p>
    </div>

    ${renderSocialShareButtons(t.referralShareText, data.referralUrl)}
  `;

  return { subject: t.subject, html: wrapInLayout(content, { locale: data.locale, unsubscribeUrl: data.unsubscribeUrl }) };
}
