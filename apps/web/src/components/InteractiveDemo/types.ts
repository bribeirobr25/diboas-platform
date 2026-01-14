/**
 * InteractiveDemo Type Definitions
 *
 * Domain-Driven Design: Interactive demo flow types
 * Service Agnostic Abstraction: Pure type definitions
 */

/**
 * Demo Screen Identifiers
 */
export type DemoScreen = 'pain' | 'hope' | 'action' | 'reward';

/**
 * Amount options for deposit selection
 */
export interface AmountOption {
  value: number;
  label: string;
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
  | 'demo_exit';

/**
 * InteractiveDemo Props
 */
export interface InteractiveDemoProps {
  /** Locale for content */
  locale?: string;
  /** Optional callback when demo completes */
  onComplete?: () => void;
  /** Optional callback for analytics events */
  onAnalyticsEvent?: (event: DemoAnalyticsEvent, data?: Record<string, unknown>) => void;
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
}
