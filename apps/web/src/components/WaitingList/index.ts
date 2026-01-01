/**
 * Waiting List Components - Public API
 */

// Legacy components (for existing modal implementation)
export { WaitingListProvider, useWaitingListModal } from './WaitingListProvider';
export { WaitingListModal } from './WaitingListModal';

// New waitlist components with position tracking and referral mechanics
export { WaitlistForm } from './WaitlistForm';
export { WaitlistConfirmation } from './WaitlistConfirmation';
export { ReferralLink } from './ReferralLink';
export { WaitlistPosition } from './WaitlistPosition';
export type { WaitlistPositionProps } from './WaitlistPosition';
