import type { WaitingListFormData } from './types';
import type { WaitlistSignupBody, WaitlistSource } from './store/types';

/**
 * The request body the waitlist modal posts (`5.979`, plan P11 D3). Kept out of the hook so
 * the route's own tests can post exactly this body: the whole body the modal sends, not a
 * hand-written copy of it, is what the route must accept.
 */
export function buildModalSignupBody(
  formData: Pick<WaitingListFormData, 'email' | 'name' | 'gdprAccepted'>,
  locale: string,
  source: WaitlistSource
): WaitlistSignupBody {
  return {
    email: formData.email.toLowerCase().trim(),
    name: formData.name || undefined,
    locale,
    gdprAccepted: formData.gdprAccepted,
    source,
  };
}
