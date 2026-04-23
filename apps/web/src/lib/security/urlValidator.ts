const ALLOWED_SCHEMES = ['https:', 'http:', 'mailto:', 'tel:'];

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_SCHEMES.includes(parsed.protocol);
  } catch {
    return false;
  }
}

export function sanitizeUrl(url: string): string {
  return isValidUrl(url) ? url : '#';
}
