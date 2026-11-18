/**
 * Waiting List Types
 *
 * Re-export domain types and add presentation-layer specific types
 */

import type { WaitlistSource } from './store/types';

export * from './domain/WaitingListDomain';

// Presentation Layer Types
export interface WaitingListFormData {
  name: string;
  email: string;
  xAccount: string;
  gdprAccepted: boolean;
}

export interface WaitingListFormErrors {
  name?: string;
  email?: string;
  xAccount?: string;
  gdprAccepted?: string;
  general?: string;
}

export interface WaitingListModalState {
  isOpen: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  submittedEmail?: string;
  errors: WaitingListFormErrors;
}

export interface WaitingListContextValue {
  isOpen: boolean;
  /**
   * Opens the modal. The source is the path that opened it and is REQUIRED (`5.979`, plan
   * P11 D1): Dream Mode passes `dream_mode`, the app-link interceptor `app_link`.
   */
  openModal: (source: WaitlistSource) => void;
  closeModal: () => void;
  /**
   * True once a modal signup was stored on this page (plan P11 D5). In memory only, so it
   * lasts until the page reloads; no storage is written (`5.973`, `5.993`).
   */
  joined: boolean;
}
