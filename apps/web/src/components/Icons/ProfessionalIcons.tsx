/**
 * Professional SVG Icon Components
 *
 * Design System Compliance: All icons follow the landing page design system
 * - Stroke width: 2px
 * - Stroke color: currentColor (inherits from parent)
 * - Fill: none (outline style)
 * - ViewBox: 0 0 24 24
 *
 * Accessibility: All icons support aria-label and aria-hidden
 */

import React from 'react';

interface IconProps {
  /** Icon size in pixels */
  size?: number;
  /** Additional CSS classes */
  className?: string;
  /** Accessibility label */
  'aria-label'?: string;
  /** Hide from screen readers when decorative */
  'aria-hidden'?: boolean;
}

const defaultProps: Partial<IconProps> = {
  size: 24,
  'aria-hidden': true,
};

/**
 * Lightning bolt icon - represents speed/quick (1 week timeframe)
 */
export function LightningIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

/**
 * Calendar icon - represents time/scheduling (1 month timeframe)
 */
export function CalendarIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

/**
 * Target/crosshair icon - represents goals/precision (1 year timeframe)
 */
export function TargetIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

/**
 * Rocket icon - represents growth/ambition (5 years timeframe)
 */
export function RocketIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}

/**
 * Shield icon - represents safety/security (Safety First path)
 */
export function ShieldIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

/**
 * Balance/scale icon - represents equilibrium (Balanced Growth path)
 */
export function BalanceIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M12 3v18" />
      <path d="M5 8l7-5 7 5" />
      <path d="M3 13h4l1 5H4l-1-5z" />
      <path d="M17 13h4l-1 5h-4l1-5z" />
    </svg>
  );
}

/**
 * Trend up icon - represents growth/maximum growth path
 */
export function TrendUpIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

/**
 * Alert triangle icon - represents warning/caution
 */
export function AlertTriangleIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

/**
 * Success check icon - represents success/completion (circle with checkmark)
 */
export function SuccessCheckIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

/**
 * Simple checkmark icon
 */
export function CheckIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/**
 * Timeframe icon component - maps timeframe type to appropriate icon
 */
export type TimeframeIconType = 'lightning' | 'calendar' | 'target' | 'rocket';

interface TimeframeIconProps extends IconProps {
  type: TimeframeIconType;
}

export function TimeframeIcon({ type, ...props }: TimeframeIconProps) {
  switch (type) {
    case 'lightning':
      return <LightningIcon {...props} />;
    case 'calendar':
      return <CalendarIcon {...props} />;
    case 'target':
      return <TargetIcon {...props} />;
    case 'rocket':
      return <RocketIcon {...props} />;
    default:
      return <CalendarIcon {...props} />;
  }
}

/**
 * Path icon component - maps path type to appropriate icon
 */
export type PathIconType = 'shield' | 'balance' | 'rocket' | 'safety' | 'growth';

interface PathIconProps extends IconProps {
  type: PathIconType;
}

export function PathIcon({ type, ...props }: PathIconProps) {
  switch (type) {
    case 'shield':
    case 'safety':
      return <ShieldIcon {...props} />;
    case 'balance':
      return <BalanceIcon {...props} />;
    case 'rocket':
    case 'growth':
      return <TrendUpIcon {...props} />;
    default:
      return <ShieldIcon {...props} />;
  }
}
