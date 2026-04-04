/**
 * Share Platform URL Builders
 *
 * Shared utilities for building social share URLs and clipboard operations.
 * Used by both WaitingList/ReferralLink and PreDream/ShareDreamSection.
 *
 * Consolidates duplicate URL-building logic that previously existed in:
 * - components/WaitingList/shareUtils.ts (inline functions)
 * - components/PreDream/components/ShareDreamSection.tsx (inline template strings)
 * - lib/share/platformHandlers.ts (deleted — was dead code)
 */

/**
 * Build a Twitter/X share intent URL.
 */
export function getTwitterShareUrl(text: string, url: string): string {
  const params = new URLSearchParams({ text: `${text} ${url}` });
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

/**
 * Build a WhatsApp share URL.
 */
export function getWhatsAppShareUrl(text: string, url: string): string {
  const fullText = `${text} ${url}`;
  return `https://wa.me/?text=${encodeURIComponent(fullText)}`;
}

/**
 * Build a LinkedIn share URL.
 * Note: LinkedIn doesn't support pre-filled text via URL — the text must be
 * copied to clipboard separately. This URL opens the share dialog with the link.
 */
export function getLinkedInShareUrl(url: string): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
}

/**
 * Build a Telegram share URL.
 */
export function getTelegramShareUrl(text: string, url: string): string {
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}

/**
 * Open a share URL in a centered popup window.
 */
export function openShareWindow(url: string, name: string = 'share'): void {
  const width = 600;
  const height = 400;
  const left = Math.round(window.screenX + (window.innerWidth - width) / 2);
  const top = Math.round(window.screenY + (window.innerHeight - height) / 2);
  window.open(url, name, `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`);
}

/**
 * Copy text to clipboard with fallback for older browsers.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  } catch {
    return false;
  }
}
