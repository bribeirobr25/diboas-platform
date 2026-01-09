/**
 * Waiting List Components - Public API
 *
 * Follows component extraction pattern for maintainability
 */

// Main components
export { WaitingListProvider, useWaitingListModal } from './WaitingListProvider';
export { WaitingListModal } from './WaitingListModal';
export { WaitlistForm } from './WaitlistForm';
export { WaitlistConfirmation } from './WaitlistConfirmation';
export { ReferralLink } from './ReferralLink';
export { WaitlistPosition } from './WaitlistPosition';

// Sub-components (extracted from WaitingListModal)
export { WaitlistModalForm } from './WaitlistModalForm';
export { WaitlistModalSuccess } from './WaitlistModalSuccess';

// Hooks
export { useWaitlistModalForm } from './hooks';

// Types
export type { WaitlistPositionProps } from './WaitlistPosition';
