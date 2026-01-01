/**
 * BookCall Component Types
 *
 * Type definitions for Cal.com integration components
 */

/**
 * Cal.com embed configuration
 */
export interface CalEmbedConfig {
  /** Cal.com calendar link (e.g., "diboas/sales-call") */
  calLink: string;
  /** Hide branding */
  hideBranding?: boolean;
  /** Theme: light, dark, or auto */
  theme?: 'light' | 'dark' | 'auto';
  /** Layout: month_view, week_view, column_view */
  layout?: 'month_view' | 'week_view' | 'column_view';
  /** Pre-fill guest email */
  email?: string;
  /** Pre-fill guest name */
  name?: string;
  /** Pre-fill notes */
  notes?: string;
  /** Custom metadata to attach to booking */
  metadata?: Record<string, string>;
}

/**
 * CalEmbed component props
 */
export interface CalEmbedProps {
  /** Cal.com configuration */
  config: CalEmbedConfig;
  /** Container height */
  height?: string | number;
  /** Optional class name */
  className?: string;
  /** Callback when booking is complete */
  onBookingComplete?: (data: BookingData) => void;
  /** Callback when embed loads */
  onLoad?: () => void;
}

/**
 * CalButton component props
 */
export interface CalButtonProps {
  /** Cal.com calendar link */
  calLink: string;
  /** Button label */
  children: React.ReactNode;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'outline';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Pre-fill guest email */
  email?: string;
  /** Pre-fill guest name */
  name?: string;
  /** Custom metadata */
  metadata?: Record<string, string>;
  /** Optional class name */
  className?: string;
  /** Callback when booking is complete */
  onBookingComplete?: (data: BookingData) => void;
}

/**
 * Booking completion data
 */
export interface BookingData {
  /** Booking ID from Cal.com */
  bookingId?: string;
  /** Event type */
  eventType?: string;
  /** Scheduled time */
  startTime?: string;
  /** Guest email */
  email?: string;
  /** Success flag */
  confirmed: boolean;
}

/**
 * Cal.com analytics events
 */
export type CalAnalyticsEvent =
  | 'cal_embed_loaded'
  | 'cal_modal_opened'
  | 'cal_modal_closed'
  | 'cal_booking_started'
  | 'cal_booking_complete'
  | 'cal_booking_cancelled';
