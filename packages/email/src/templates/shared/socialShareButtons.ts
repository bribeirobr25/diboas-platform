/**
 * Shared social share buttons for email templates.
 * Table-based HTML for maximum email client compatibility.
 * P4 DRY: Single source for WhatsApp, X/Twitter, Facebook, LinkedIn share buttons.
 */

export function renderSocialShareButtons(shareText: string, referralUrl: string): string {
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(referralUrl);

  const platforms = [
    {
      name: 'WhatsApp',
      color: '#25D366',
      href: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${referralUrl}`)}`,
    },
    {
      name: 'X',
      color: '#0f172a',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${shareText} @diboasfi ${referralUrl}`)}`,
    },
    {
      name: 'Facebook',
      color: '#1877F2',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
    },
    {
      name: 'LinkedIn',
      color: '#0A66C2',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
  ];

  const buttons = platforms
    .map(
      (p) =>
        `<td style="padding:0 6px;"><a href="${p.href}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:8px 16px;background-color:${p.color};color:#ffffff;border-radius:6px;font-size:12px;font-weight:600;text-decoration:none;min-width:60px;text-align:center;">${p.name}</a></td>`
    )
    .join('');

  return `
    <table role="presentation" style="margin:16px auto 24px;border-spacing:0;">
      <tr>${buttons}</tr>
    </table>
  `;
}
