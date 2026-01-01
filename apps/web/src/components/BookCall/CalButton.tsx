/**
 * CalButton Component
 *
 * Button that opens Cal.com booking modal.
 * Lightweight alternative to full embed for CTAs.
 *
 * Usage:
 * ```tsx
 * <CalButton
 *   calLink="diboas/sales-call"
 *   email={userEmail}
 *   onBookingComplete={(data) => console.log('Booked:', data)}
 * >
 *   Book a Call
 * </CalButton>
 * ```
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import type { CalButtonProps, BookingData } from './types';
import styles from './BookCall.module.css';

// Cal.com embed script URL
const CAL_EMBED_SCRIPT = 'https://app.cal.com/embed/embed.js';

// Declare Cal global type
declare global {
  interface Window {
    Cal?: {
      (action: string, ...args: any[]): void;
      ns?: Record<string, any>;
      loaded?: boolean;
    };
  }
}

export function CalButton({
  calLink,
  children,
  variant = 'primary',
  size = 'md',
  email,
  name,
  metadata,
  className,
  onBookingComplete,
}: CalButtonProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Get cal link from env or props
  const effectiveCalLink = calLink || process.env.NEXT_PUBLIC_CAL_LINK;
  const namespace = 'diboas-modal';

  // Load Cal.com script
  useEffect(() => {
    if (!effectiveCalLink) return;

    const loadCalScript = async () => {
      // Check if already loaded
      if (window.Cal?.loaded) {
        setIsLoaded(true);
        return;
      }

      // Check if script is already in DOM
      const existingScript = document.querySelector(`script[src="${CAL_EMBED_SCRIPT}"]`);
      if (existingScript) {
        existingScript.addEventListener('load', () => setIsLoaded(true));
        return;
      }

      // Load script
      const script = document.createElement('script');
      script.src = CAL_EMBED_SCRIPT;
      script.async = true;
      script.onload = () => {
        // Initialize Cal
        if (window.Cal) {
          window.Cal('init', namespace, { origin: 'https://app.cal.com' });

          // Listen for booking complete
          window.Cal(namespace, 'on', {
            action: 'bookingSuccessful',
            callback: (e: any) => {
              const bookingData: BookingData = {
                bookingId: e.detail?.booking?.uid,
                eventType: e.detail?.eventType?.slug,
                startTime: e.detail?.booking?.startTime,
                email: e.detail?.booking?.email,
                confirmed: true,
              };
              onBookingComplete?.(bookingData);
            },
          });

          setIsLoaded(true);
        }
      };
      document.head.appendChild(script);
    };

    loadCalScript();
  }, [effectiveCalLink, onBookingComplete]);

  // Handle button click
  const handleClick = useCallback(() => {
    if (!isLoaded || !window.Cal || !effectiveCalLink) {
      console.warn('[CalButton] Cal.com not loaded or not configured');
      return;
    }

    setIsLoading(true);

    // Open modal
    window.Cal(namespace, 'modal', {
      calLink: effectiveCalLink,
      config: {
        theme: 'auto',
        ...(email && { email }),
        ...(name && { name }),
        ...(metadata && { metadata }),
      },
    });

    // Reset loading after modal opens
    setTimeout(() => setIsLoading(false), 500);
  }, [isLoaded, effectiveCalLink, email, name, metadata]);

  // Determine button classes
  const buttonClasses = [
    styles.calButton,
    styles[`variant-${variant}`],
    styles[`size-${size}`],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Not configured - render disabled button
  if (!effectiveCalLink) {
    return (
      <button className={buttonClasses} disabled title="Booking not configured">
        {children}
      </button>
    );
  }

  return (
    <button
      className={buttonClasses}
      onClick={handleClick}
      disabled={!isLoaded || isLoading}
      aria-busy={isLoading}
    >
      {isLoading ? (
        <span className={styles.buttonLoading}>
          <span className={styles.loadingDot} />
          <span className={styles.loadingDot} />
          <span className={styles.loadingDot} />
        </span>
      ) : (
        children
      )}
    </button>
  );
}

export default CalButton;
