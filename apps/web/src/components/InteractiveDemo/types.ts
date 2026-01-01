/**
 * InteractiveDemo Type Definitions
 *
 * Domain-Driven Design: Interactive demo flow types
 * Service Agnostic Abstraction: Pure type definitions
 */

/**
 * Demo Screen Identifiers
 */
export type DemoScreen = 'pain' | 'hope' | 'action' | 'reward' | 'invitation' | 'success';

/**
 * Amount options for deposit selection
 */
export interface AmountOption {
  value: number;
  label: string;
}

/**
 * Demo Content for a specific locale
 */
export interface DemoLocaleContent {
  /** Screen 1: Pain */
  pain: {
    header: string;
    balance: string;
    subtext: string;
    hook: string;
    cta: string;
  };
  /** Screen 2: Hope */
  hope: {
    header: string;
    startBalance: string;
    projectionLabel: string;
    projectedBalance: string;
    comparison: string;
    impact: string;
    cta: string;
  };
  /** Screen 3: Action */
  action: {
    header: string;
    prompt: string;
    reassurance1: string;
    reassurance2: string;
    cta: string;
  };
  /** Screen 4: Reward */
  reward: {
    header: string;
    delight: string;
    vision: string;
    sharePrompt: string;
    shareCta: string;
    continueCta: string;
  };
  /** Screen 5: Invitation */
  invitation: {
    header: string;
    subheader: string;
    callToAction: string;
    emailPlaceholder: string;
    submitButton: string;
    trustPoints: string[];
  };
  /** Post-signup */
  success: {
    header: string;
    positionLabel: string;
    incentiveHeader: string;
    incentiveMechanic: string;
    linkBoxLabel: string;
    shareLabel: string;
    prewrittenMessage: string;
  };
  /** Common */
  currency: {
    symbol: string;
    code: string;
  };
}

/**
 * Analytics event types
 */
export type DemoAnalyticsEvent =
  | 'demo_start'
  | 'demo_screen_2'
  | 'demo_screen_3'
  | 'demo_amount_select'
  | 'demo_deposit_click'
  | 'demo_screen_4'
  | 'demo_reward_continue_click'
  | 'demo_share_click'
  | 'demo_screen_5'
  | 'demo_signup_start'
  | 'demo_signup_complete'
  | 'demo_dream_mode_click'
  | 'demo_explore_click'
  | 'demo_waitlist_click'
  | 'demo_calculator_click'
  | 'demo_exit';

/**
 * User waitlist status for conditional rendering
 */
export interface WaitlistUserStatus {
  /** Whether the user is on the waitlist */
  isOnWaitlist: boolean;
  /** User's email (if on waitlist) */
  email?: string;
  /** User's position (if on waitlist) */
  position?: number;
  /** User's referral code (if on waitlist) */
  referralCode?: string;
}

/**
 * Screen5CTA component props
 */
export interface Screen5CTAProps {
  /** Whether the user is on the waitlist */
  isOnWaitlist: boolean;
  /** Callback when anonymous user clicks join waitlist */
  onJoinWaitlist: () => void;
  /** Callback when logged-in user clicks try dream mode */
  onTryDreamMode: () => void;
  /** Callback when logged-in user clicks explore */
  onExplore: () => void;
  /** Optional class name */
  className?: string;
}

/**
 * InteractiveDemo Props
 */
export interface InteractiveDemoProps {
  /** Locale for content */
  locale?: string;
  /** Optional callback when demo completes */
  onComplete?: () => void;
  /** Optional callback for analytics events */
  onAnalyticsEvent?: (event: DemoAnalyticsEvent, data?: Record<string, any>) => void;
  /** Optional class name */
  className?: string;
}

/**
 * Demo state
 */
export interface DemoState {
  currentScreen: DemoScreen;
  selectedAmount: number;
  animatedBalance: number;
  email: string;
  isSubmitting: boolean;
  waitlistPosition: number | null;
  referralCode: string | null;
}
