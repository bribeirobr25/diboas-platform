import { wrapInLayout } from './layout';
import type { DeletionCompleteEmailData } from '../types';
import { BRAND } from '../config';

const translations: Record<string, Record<string, string>> = {
  en: {
    subject: 'Your waitlist data has been deleted',
    title: 'Data deletion complete',
    body: 'As you asked, we deleted your diBoaS waitlist entry and the records tied to your email address.',
    deletedTitle: 'What was deleted:',
    deletedItems:
      'Your email address, name, waitlist position, invite code, email delivery records and deletion links.',
    keptTitle: 'Kept for a limited time:',
    keptItems:
      'Security logs with your IP address (up to 90 days), database backups (cleared within a day) and copies held by our email provider under its own retention rules. If you invited friends, your invite code stays on their entries.',
    contact: 'If you have questions or believe this was done in error, please contact us at',
    farewell: 'We wish you all the best.',
  },
  'pt-BR': {
    subject: 'Seus dados da lista de espera foram excluídos',
    title: 'Exclusão de dados concluída',
    body: 'Conforme solicitado, excluímos sua inscrição na lista de espera do diBoaS e os registros ligados ao seu endereço de e-mail.',
    deletedTitle: 'O que foi excluído:',
    deletedItems:
      'Seu endereço de e-mail, nome, posição na lista, código de convite, registros de envio de e-mail e links de exclusão.',
    keptTitle: 'Mantido por um tempo limitado:',
    keptItems:
      'Registros de segurança com seu endereço IP (até 90 dias), backups do banco de dados (apagados em até um dia) e cópias mantidas pelo nosso provedor de e-mail conforme as regras de retenção dele. Se você convidou amigos, seu código de convite permanece nas inscrições deles.',
    contact:
      'Se tiver dúvidas ou acreditar que isso foi feito por engano, entre em contato conosco em',
    farewell: 'Desejamos tudo de bom.',
  },
  es: {
    subject: 'Tus datos de la lista de espera han sido eliminados',
    title: 'Eliminación de datos completada',
    body: 'Como solicitaste, eliminamos tu inscripción en la lista de espera de diBoaS y los registros vinculados a tu dirección de correo.',
    deletedTitle: 'Lo que se eliminó:',
    deletedItems:
      'Tu dirección de correo, nombre, posición en la lista, código de invitación, registros de envío de correo y enlaces de eliminación.',
    keptTitle: 'Se conserva por un tiempo limitado:',
    keptItems:
      'Registros de seguridad con tu dirección IP (hasta 90 días), copias de seguridad de la base de datos (se borran en un día) y copias que guarda nuestro proveedor de correo según sus normas de retención. Si invitaste a amigos, tu código de invitación sigue en sus inscripciones.',
    contact: 'Si tienes preguntas o crees que fue un error, contáctanos en',
    farewell: 'Te deseamos lo mejor.',
  },
  de: {
    subject: 'Deine Wartelisten-Daten wurden gelöscht',
    title: 'Datenlöschung abgeschlossen',
    body: 'Wie gewünscht haben wir deinen diBoaS-Wartelisteneintrag und die mit deiner E-Mail-Adresse verknüpften Einträge gelöscht.',
    deletedTitle: 'Was gelöscht wurde:',
    deletedItems:
      'Deine E-Mail-Adresse, dein Name, deine Wartelistenposition, dein Einladungscode, deine E-Mail-Versandprotokolle und deine Löschlinks.',
    keptTitle: 'Für begrenzte Zeit aufbewahrt:',
    keptItems:
      'Sicherheitsprotokolle mit deiner IP-Adresse (bis zu 90 Tage), Datenbank-Backups (innerhalb eines Tages gelöscht) und Kopien, die unser E-Mail-Anbieter nach seinen eigenen Aufbewahrungsregeln speichert. Wenn du Freunde eingeladen hast, bleibt dein Einladungscode in deren Einträgen.',
    contact: 'Bei Fragen oder wenn dies irrtümlich geschah, kontaktiere uns unter',
    farewell: 'Wir wünschen dir alles Gute.',
  },
};

export function renderDeletionComplete(data: DeletionCompleteEmailData): {
  subject: string;
  html: string;
} {
  const t = translations[data.locale] || translations.en;

  const content = `
    <h1 style="margin:0 0 8px;font-size:24px;color:${BRAND.textColor};">${t.title}</h1>
    <p style="margin:0 0 24px;font-size:16px;color:#475569;">${t.body}</p>

    <div style="padding:16px;background-color:#f8fafc;border-radius:8px;border-left:4px solid #94a3b8;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:${BRAND.textColor};">${t.deletedTitle}</p>
      <p style="margin:0;font-size:14px;color:#475569;">${t.deletedItems}</p>
    </div>

    <div style="padding:16px;background-color:#f8fafc;border-radius:8px;border-left:4px solid #cbd5e1;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:${BRAND.textColor};">${t.keptTitle}</p>
      <p style="margin:0;font-size:14px;color:#475569;">${t.keptItems}</p>
    </div>

    <p style="margin:0 0 8px;font-size:14px;color:#475569;">
      ${t.contact} <a href="mailto:support@diboas.com" style="color:${BRAND.primaryColor};">support@diboas.com</a>.
    </p>
    <p style="margin:0;font-size:14px;color:#475569;">${t.farewell}</p>
  `;

  return { subject: t.subject, html: wrapInLayout(content, { locale: data.locale }) };
}
