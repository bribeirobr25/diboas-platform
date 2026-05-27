import { wrapInLayout } from './layout';
import type { DeletionCompleteEmailData } from '../types';
import { BRAND } from '../config';

const translations: Record<string, Record<string, string>> = {
  en: {
    subject: 'Your data has been deleted',
    title: 'Data deletion complete',
    body: 'As requested, we have permanently deleted all your personal data from the diBoaS waitlist.',
    deletedTitle: 'What was deleted:',
    deletedItems:
      'Email address, name, waitlist position, referral data, and all associated records.',
    contact: 'If you have questions or believe this was done in error, please contact us at',
    farewell: 'We wish you all the best.',
  },
  'pt-BR': {
    subject: 'Seus dados foram excluídos',
    title: 'Exclusão de dados concluída',
    body: 'Conforme solicitado, excluímos permanentemente todos os seus dados pessoais da lista de espera do diBoaS.',
    deletedTitle: 'O que foi excluído:',
    deletedItems:
      'Endereço de e-mail, nome, posição na lista, dados de indicação e todos os registros associados.',
    contact:
      'Se tiver dúvidas ou acreditar que isso foi feito por engano, entre em contato conosco em',
    farewell: 'Desejamos tudo de bom.',
  },
  es: {
    subject: 'Tus datos han sido eliminados',
    title: 'Eliminación de datos completada',
    body: 'Como solicitaste, hemos eliminado permanentemente todos tus datos personales de la lista de espera de diBoaS.',
    deletedTitle: 'Lo que se eliminó:',
    deletedItems:
      'Dirección de correo, nombre, posición, datos de referidos y todos los registros asociados.',
    contact: 'Si tienes preguntas o crees que fue un error, contáctanos en',
    farewell: 'Te deseamos lo mejor.',
  },
  de: {
    subject: 'Deine Daten wurden gelöscht',
    title: 'Datenlöschung abgeschlossen',
    body: 'Wie gewünscht haben wir alle deine persönlichen Daten dauerhaft von der diBoaS-Warteliste gelöscht.',
    deletedTitle: 'Was gelöscht wurde:',
    deletedItems:
      'E-Mail-Adresse, Name, Wartelistenposition, Empfehlungsdaten und alle zugehörigen Einträge.',
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

    <p style="margin:0 0 8px;font-size:14px;color:#475569;">
      ${t.contact} <a href="mailto:support@diboas.com" style="color:${BRAND.primaryColor};">support@diboas.com</a>.
    </p>
    <p style="margin:0;font-size:14px;color:#475569;">${t.farewell}</p>
  `;

  return { subject: t.subject, html: wrapInLayout(content, { locale: data.locale }) };
}
