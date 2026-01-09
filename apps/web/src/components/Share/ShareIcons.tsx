/**
 * Share Modal Icon Components
 *
 * SVG icons used in the ShareModal and related components
 * Extracted for reusability and cleaner component code
 *
 * Code Reusability: Shared icon components
 * File Decoupling: Icons separated from logic
 */

import React from 'react';

interface IconProps {
  /** Width of the icon */
  width?: number;
  /** Height of the icon */
  height?: number;
  /** Additional class name */
  className?: string;
}

export function CloseIcon({ width = 24, height = 24, className }: IconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function DownloadIcon({ width = 20, height = 20, className }: IconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
