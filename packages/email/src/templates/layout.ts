import { BRAND } from '../config';

/**
 * Locale-specific regulatory disclaimers.
 * Mirrors the MinimalFooter pattern from the web app.
 *
 * CLO Board compliance:
 * - pt-BR: CVM Resolution 88 (3 warnings) + BCB regulation
 * - de: MiCA (EU Markets in Crypto-Assets Regulation)
 * - es: General financial services disclaimer
 * - en: US SEC/FINRA standard disclaimer
 */
const REGULATORY_DISCLAIMERS: Record<string, string> = {
  'pt-BR':
    'Investimentos envolvem riscos. Rentabilidade passada não garante rentabilidade futura. Serviços regulados conforme CVM e BCB.',
  de: 'Investitionen sind mit Risiken verbunden. Vergangene Renditen garantieren keine zukünftigen Ergebnisse. Krypto-Assets unterliegen der MiCA-Verordnung (EU) 2023/1114.',
  es: 'Las inversiones implican riesgos. El rendimiento pasado no garantiza resultados futuros.',
  en: 'Investments involve risk. Past performance does not guarantee future results. Not FDIC insured.',
};

function getDisclaimer(locale: string): string {
  return REGULATORY_DISCLAIMERS[locale] || REGULATORY_DISCLAIMERS['en'];
}

export function wrapInLayout(
  content: string,
  options?: { unsubscribeUrl?: string; locale?: string }
): string {
  const unsubscribeUrl = options?.unsubscribeUrl;
  const locale = options?.locale || 'en';
  const disclaimer = getDisclaimer(locale);

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${BRAND.name}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:${BRAND.bgColor};border-radius:12px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;text-align:center;background-color:${BRAND.headerColor};">
              <span style="font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">${BRAND.name}</span>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:32px 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background-color:${BRAND.footerBg};border-top:1px solid #e2e8f0;">
              <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;text-align:center;">
                &copy; ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.
              </p>
              <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;text-align:center;">
                <a href="${BRAND.privacyUrl}" style="color:#94a3b8;text-decoration:underline;">Privacy Policy</a>
                &nbsp;&bull;&nbsp;
                <a href="${BRAND.termsUrl}" style="color:#94a3b8;text-decoration:underline;">Terms of Service</a>
                ${unsubscribeUrl ? `&nbsp;&bull;&nbsp;<a href="${unsubscribeUrl}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a>` : ''}
              </p>
              <p style="margin:0 0 8px;font-size:11px;color:#64748b;text-align:center;">
                ${disclaimer}
              </p>
              <p style="margin:0;font-size:11px;color:#64748b;text-align:center;">
                This is a transactional email related to your diBoaS waitlist membership.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
