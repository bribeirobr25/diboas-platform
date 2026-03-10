/**
 * CTA Attribution
 *
 * Tracks which CTA button drove the user to the waitlist section.
 * CTA sources call setCTASource() before scrolling to #waitlist.
 * The WaitlistForm reads it via getCTASource() on submission.
 */

const CTA_SOURCE_KEY = 'diboas-cta-source';

/**
 * Store the CTA source that triggered navigation to #waitlist.
 */
export function setCtaSource(source: string): void {
  try {
    sessionStorage.setItem(CTA_SOURCE_KEY, source);
  } catch {
    // sessionStorage unavailable
  }
}

/**
 * Read and clear the stored CTA source (consumed once on form submit).
 */
export function getCtaSource(): string | null {
  try {
    const source = sessionStorage.getItem(CTA_SOURCE_KEY);
    if (source) sessionStorage.removeItem(CTA_SOURCE_KEY);
    return source;
  } catch {
    return null;
  }
}
