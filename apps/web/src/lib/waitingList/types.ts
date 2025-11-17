/**
 * Waiting List Types
 *
 * Re-export domain types and add presentation-layer specific types
 */

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
  openModal: () => void;
  closeModal: () => void;
}
