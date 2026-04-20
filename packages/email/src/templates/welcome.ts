import { wrapInLayout } from './layout';
import type { WelcomeEmailData, WaitlistTier } from '../types';
import { BRAND } from '../config';

interface TierTranslations {
  subject: string;
  greeting: string;
  greetingNoName: string;
  intro: string;
  tierBadge: Record<WaitlistTier, string>;
  tierMessage: Record<WaitlistTier, string>;
  foundingMemberBenefits: string[];
  referralCta: string;
  shareText: string;
  demoCta: string;
  whatNext: string;
  whatNextBody: string;
  spotsRemaining: string;
  memberNumber: string; // template: "#{position} of 1,200"
}

const translations: Record<string, TierTranslations> = {
  en: {
    subject: "Welcome to diBoaS — You're on the waitlist!",
    greeting: 'Hey {name}!',
    greetingNoName: 'Hey there!',
    intro: "You're officially on the diBoaS waitlist.",
    tierBadge: {
      founding_member: 'Founding Member',
      early_member: 'Early Member',
      priority_waitlist: 'Priority Waitlist',
      standard: 'Waitlist',
    },
    tierMessage: {
      founding_member: "You're a Founding Member! You're among the first 1,200. Share your link — you have 5 invites to give friends Founding Member status.",
      early_member: "You're an Early Member! Invited by a Founding Member. Share your link to help friends get early access.",
      priority_waitlist: "You're on the waitlist! Share your link to help friends get early access.",
      standard: "You're on the waitlist! Share your link to help friends get early access.",
    },
    foundingMemberBenefits: [
      'Permanent Founding Member badge (#{position} of 1,200)',
      'Your name on the Founders Wall',
      '5 personal invites',
      'Future exclusive benefits for Founding Members only',
    ],
    referralCta: 'Copy your referral link',
    shareText: 'I just found an easy and fair access to grow and move money. It is so good, that I have to share it',
    demoCta: 'Try the Interactive Demo',
    whatNext: "What's next?",
    whatNextBody: "We'll keep you posted on our progress and let you know when it's your turn.",
    spotsRemaining: '{spots} founding member spots remaining',
    memberNumber: '#{position} of 1,200',
  },
  'pt-BR': {
    subject: 'Bem-vindo ao diBoaS — Você está na lista de espera!',
    greeting: 'Olá {name}!',
    greetingNoName: 'Olá!',
    intro: 'Você está oficialmente na lista de espera do diBoaS.',
    tierBadge: {
      founding_member: 'Membro Fundador',
      early_member: 'Membro Antecipado',
      priority_waitlist: 'Lista Prioritária',
      standard: 'Lista de Espera',
    },
    tierMessage: {
      founding_member: 'Você é um Membro Fundador! Está entre os primeiros 1.200. Compartilhe seu link — você tem 5 convites para dar status de Membro Fundador aos seus amigos.',
      early_member: 'Você é um Membro Antecipado! Convidado por um Membro Fundador. Compartilhe seu link para ajudar amigos a ter acesso antecipado.',
      priority_waitlist: 'Você está na lista de espera! Compartilhe seu link para ajudar amigos a ter acesso antecipado.',
      standard: 'Você está na lista de espera! Compartilhe seu link para ajudar amigos a ter acesso antecipado.',
    },
    foundingMemberBenefits: [
      'Selo permanente de Membro Fundador (#{position} de 1.200)',
      'Seu nome no Mural dos Fundadores',
      '5 convites pessoais',
      'Benefícios exclusivos futuros só pra Membros Fundadores',
    ],
    referralCta: 'Copie seu link de indicação',
    shareText: 'Acabei de encontrar um jeito fácil e justo de fazer o dinheiro crescer e se mover. É tão bom que preciso compartilhar',
    demoCta: 'Experimente a Demo Interativa',
    whatNext: 'Próximos passos',
    whatNextBody: 'Manteremos você informado sobre nosso progresso e avisaremos quando for sua vez.',
    spotsRemaining: '{spots} vagas de membro fundador restantes',
    memberNumber: '#{position} de 1.200',
  },
  es: {
    subject: 'Bienvenido a diBoaS — ¡Estás en la lista de espera!',
    greeting: '¡Hola {name}!',
    greetingNoName: '¡Hola!',
    intro: 'Estás oficialmente en la lista de espera de diBoaS.',
    tierBadge: {
      founding_member: 'Miembro Fundador',
      early_member: 'Miembro Anticipado',
      priority_waitlist: 'Lista Prioritaria',
      standard: 'Lista de Espera',
    },
    tierMessage: {
      founding_member: '¡Eres Miembro Fundador! Estás entre los primeros 1,200. Comparte tu enlace — tienes 5 invitaciones para dar estatus de Miembro Fundador a tus amigos.',
      early_member: '¡Eres Miembro Anticipado! Invitado por un Miembro Fundador. Comparte tu enlace para ayudar a amigos a tener acceso anticipado.',
      priority_waitlist: '¡Estás en la lista de espera! Comparte tu enlace para ayudar a amigos a tener acceso anticipado.',
      standard: '¡Estás en la lista de espera! Comparte tu enlace para ayudar a amigos a tener acceso anticipado.',
    },
    foundingMemberBenefits: [
      'Insignia permanente de Miembro Fundador (#{position} de 1.200)',
      'Tu nombre en el Muro de los Fundadores',
      '5 invitaciones personales',
      'Beneficios exclusivos futuros solo para Miembros Fundadores',
    ],
    referralCta: 'Copia tu enlace de referencia',
    shareText: 'Acabo de encontrar una forma fácil y justa de hacer crecer y mover mi dinero. Es tan bueno que tengo que compartirlo',
    demoCta: 'Prueba la Demo Interactiva',
    whatNext: '¿Qué sigue?',
    whatNextBody: 'Te mantendremos informado y te avisaremos cuando sea tu turno.',
    spotsRemaining: '{spots} lugares de miembro fundador restantes',
    memberNumber: '#{position} de 1.200',
  },
  de: {
    subject: 'Willkommen bei diBoaS — Du bist auf der Warteliste!',
    greeting: 'Hallo {name}!',
    greetingNoName: 'Hallo!',
    intro: 'Du bist jetzt offiziell auf der diBoaS-Warteliste.',
    tierBadge: {
      founding_member: 'Gründungsmitglied',
      early_member: 'Frühes Mitglied',
      priority_waitlist: 'Prioritäts-Warteliste',
      standard: 'Warteliste',
    },
    tierMessage: {
      founding_member: 'Du bist Gründungsmitglied! Du gehörst zu den ersten 1.200. Teile deinen Link — du hast 5 Einladungen, um Freunden den Gründungsmitglied-Status zu geben.',
      early_member: 'Du bist ein Frühes Mitglied! Von einem Gründungsmitglied eingeladen. Teile deinen Link, um Freunden frühzeitigen Zugang zu ermöglichen.',
      priority_waitlist: 'Du bist auf der Warteliste! Teile deinen Link, um Freunden frühzeitigen Zugang zu ermöglichen.',
      standard: 'Du bist auf der Warteliste! Teile deinen Link, um Freunden frühzeitigen Zugang zu ermöglichen.',
    },
    foundingMemberBenefits: [
      'Permanentes Gründungsmitglied-Abzeichen (#{position} von 1.200)',
      'Dein Name auf der Gründerwand',
      '5 persönliche Einladungen',
      'Zukünftige exklusive Vorteile nur für Gründungsmitglieder',
    ],
    referralCta: 'Empfehlungslink kopieren',
    shareText: 'Ich habe einen einfachen und fairen Weg gefunden, Geld wachsen zu lassen und zu bewegen. Es ist so gut, dass ich es teilen muss',
    demoCta: 'Interaktive Demo ausprobieren',
    whatNext: 'Wie geht es weiter?',
    whatNextBody: 'Wir halten dich auf dem Laufenden und informieren dich, wenn du an der Reihe bist.',
    spotsRemaining: '{spots} Gründungsmitglied-Plätze verbleibend',
    memberNumber: '#{position} von 1.200',
  },
};

/**
 * Render social share buttons for email (table-based for email client compatibility).
 * Supports WhatsApp, X/Twitter, Facebook, LinkedIn.
 */
function renderSocialShareButtons(shareText: string, referralUrl: string): string {
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(referralUrl);
  const twitterText = encodeURIComponent(`${shareText} @diboasfi`);

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

function renderTierBadge(tier: WaitlistTier, label: string): string {
  const colors: Record<WaitlistTier, { bg: string; text: string }> = {
    founding_member: { bg: '#fef3c7', text: '#92400e' },
    early_member: { bg: '#dbeafe', text: '#1e40af' },
    priority_waitlist: { bg: '#f0fdfa', text: '#115e59' },
    standard: { bg: '#f1f5f9', text: '#475569' },
  };
  const { bg, text } = colors[tier];
  return `<span style="display:inline-block;padding:4px 12px;background-color:${bg};color:${text};border-radius:9999px;font-size:13px;font-weight:600;letter-spacing:0.5px;">${label}</span>`;
}

export function renderWelcome(data: WelcomeEmailData): { subject: string; html: string } {
  const t = translations[data.locale] || translations.en;
  const greeting = data.name
    ? t.greeting.replace('{name}', data.name)
    : t.greetingNoName;

  const tierBadge = renderTierBadge(data.tier, t.tierBadge[data.tier]);
  const tierMessage = t.tierMessage[data.tier];

  const positionLine = data.tier === 'founding_member'
    ? `<p style="margin:8px 0 0;font-size:14px;font-weight:600;color:#115e59;">${t.memberNumber.replace('{position}', String(data.position))}</p>`
    : '';

  const spotsSection = data.tier === 'founding_member' && data.foundingMemberSpotsRemaining != null
    ? `<p style="margin:8px 0 0;font-size:13px;color:#94a3b8;">${t.spotsRemaining.replace('{spots}', String(data.foundingMemberSpotsRemaining))}</p>`
    : '';

  const benefitsSection = data.tier === 'founding_member'
    ? `<ul style="margin:0 0 16px;padding:0;list-style:none;">${t.foundingMemberBenefits.map(
        (b) => `<li style="margin:0 0 8px;font-size:14px;color:#475569;padding-left:24px;position:relative;"><span style="position:absolute;left:0;color:#0d9488;">&#10003;</span>${b.replace('{position}', String(data.position))}</li>`,
      ).join('')}</ul>`
    : '';

  const demoUrl = `${BRAND.url}/${data.locale}/demo?utm_source=email&utm_medium=transactional&utm_campaign=welcome_email&utm_content=predemo_cta`;
  const demoSection = `
    <div style="text-align:center;margin:24px 0;">
      <a href="${demoUrl}" style="display:inline-block;padding:14px 32px;background-color:${BRAND.headerColor};color:#ffffff;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">${t.demoCta}</a>
    </div>
  `;

  const content = `
    <h1 style="margin:0 0 8px;font-size:24px;color:${BRAND.textColor};">${greeting}</h1>
    <p style="margin:0 0 16px;font-size:16px;color:#475569;">${t.intro}</p>

    <div style="text-align:center;padding:24px;background-color:#f0fdfa;border-radius:8px;margin-bottom:24px;">
      ${tierBadge}
      ${positionLine}
      ${spotsSection}
    </div>

    ${benefitsSection}

    <p style="margin:0 0 16px;font-size:14px;color:#475569;">${tierMessage}</p>

    <div style="padding:12px 16px;background-color:#f1f5f9;border-radius:8px;margin-bottom:16px;word-break:break-all;">
      <p style="margin:0;font-size:13px;color:${BRAND.primaryColor};font-weight:600;">${data.referralUrl}</p>
    </div>

    ${renderSocialShareButtons(t.shareText, data.referralUrl)}

    ${demoSection}

    <h2 style="margin:0 0 8px;font-size:18px;color:${BRAND.textColor};">${t.whatNext}</h2>
    <p style="margin:0;font-size:14px;color:#475569;">${t.whatNextBody}</p>
  `;

  return { subject: t.subject, html: wrapInLayout(content, { locale: data.locale, unsubscribeUrl: data.unsubscribeUrl }) };
}
