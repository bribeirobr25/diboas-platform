import { wrapInLayout } from './layout';
import type { WelcomeEmailData } from '../types';
import { BRAND } from '../config';

const translations: Record<string, Record<string, string>> = {
  en: {
    subject: "Welcome to diBoaS — You're #{position} on the waitlist",
    greeting: 'Hey {name}!',
    greetingNoName: 'Hey there!',
    intro: "You're officially on the diBoaS waitlist.",
    positionLabel: 'Your position',
    referralTitle: 'Want to move up?',
    referralBody: 'Share your personal link. For every friend who joins, you move up 10 spots.',
    referralCta: 'Copy your referral link',
    whatNext: "What's next?",
    whatNextBody: "We'll keep you posted on our progress and let you know when it's your turn. In the meantime, share your link and climb the list!",
  },
  'pt-BR': {
    subject: 'Bem-vindo ao diBoaS — Você é o #{position} na lista de espera',
    greeting: 'Olá {name}!',
    greetingNoName: 'Olá!',
    intro: 'Você está oficialmente na lista de espera do diBoaS.',
    positionLabel: 'Sua posição',
    referralTitle: 'Quer subir na fila?',
    referralBody: 'Compartilhe seu link pessoal. Para cada amigo que entrar, você sobe 10 posições.',
    referralCta: 'Copie seu link de indicação',
    whatNext: 'Próximos passos',
    whatNextBody: 'Manteremos você informado sobre nosso progresso. Enquanto isso, compartilhe seu link e suba na lista!',
  },
  es: {
    subject: 'Bienvenido a diBoaS — Eres el #{position} en la lista de espera',
    greeting: '¡Hola {name}!',
    greetingNoName: '¡Hola!',
    intro: 'Estás oficialmente en la lista de espera de diBoaS.',
    positionLabel: 'Tu posición',
    referralTitle: '¿Quieres subir?',
    referralBody: 'Comparte tu enlace personal. Por cada amigo que se una, subes 10 puestos.',
    referralCta: 'Copia tu enlace de referencia',
    whatNext: '¿Qué sigue?',
    whatNextBody: 'Te mantendremos informado. Mientras tanto, comparte tu enlace y sube en la lista.',
  },
  de: {
    subject: 'Willkommen bei diBoaS — Du bist #{position} auf der Warteliste',
    greeting: 'Hallo {name}!',
    greetingNoName: 'Hallo!',
    intro: 'Du bist jetzt offiziell auf der diBoaS-Warteliste.',
    positionLabel: 'Deine Position',
    referralTitle: 'Möchtest du nach vorne rücken?',
    referralBody: 'Teile deinen persönlichen Link. Für jeden Freund, der beitritt, rückst du 10 Plätze vor.',
    referralCta: 'Empfehlungslink kopieren',
    whatNext: 'Wie geht es weiter?',
    whatNextBody: 'Wir halten dich auf dem Laufenden. In der Zwischenzeit, teile deinen Link und rücke in der Liste vor!',
  },
};

export function renderWelcome(data: WelcomeEmailData): { subject: string; html: string } {
  const t = translations[data.locale] || translations.en;
  const greeting = data.name
    ? t.greeting.replace('{name}', data.name)
    : t.greetingNoName;
  const subject = t.subject.replace('{position}', String(data.position));

  const content = `
    <h1 style="margin:0 0 8px;font-size:24px;color:${BRAND.textColor};">${greeting}</h1>
    <p style="margin:0 0 24px;font-size:16px;color:#475569;">${t.intro}</p>

    <div style="text-align:center;padding:24px;background-color:#f0fdfa;border-radius:8px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:13px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">${t.positionLabel}</p>
      <p style="margin:0;font-size:48px;font-weight:700;color:${BRAND.primaryColor};">#${data.position}</p>
    </div>

    <h2 style="margin:0 0 8px;font-size:18px;color:${BRAND.textColor};">${t.referralTitle}</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#475569;">${t.referralBody}</p>

    <div style="padding:12px 16px;background-color:#f1f5f9;border-radius:8px;margin-bottom:24px;word-break:break-all;">
      <p style="margin:0;font-size:13px;color:${BRAND.primaryColor};font-weight:600;">${data.referralUrl}</p>
    </div>

    <h2 style="margin:0 0 8px;font-size:18px;color:${BRAND.textColor};">${t.whatNext}</h2>
    <p style="margin:0;font-size:14px;color:#475569;">${t.whatNextBody}</p>
  `;

  return { subject, html: wrapInLayout(content, { locale: data.locale }) };
}
