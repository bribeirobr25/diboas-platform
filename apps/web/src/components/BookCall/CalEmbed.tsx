/**
 * CalEmbed Component
 *
 * Full-page embed of Cal.com calendar for booking calls.
 * Renders an inline calendar view without modal.
 *
 * Usage:
 * ```tsx
 * <CalEmbed
 *   config={{ calLink: "diboas/sales-call" }}
 *   height={600}
 *   onBookingComplete={(data) => console.log('Booked:', data)}
 * />
 * ```
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import type { CalEmbedProps, BookingData } from './types';
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

export function CalEmbed({
  config,
  height = 600,
  className,
  onBookingComplete,
  onLoad,
}: CalEmbedProps) {
  const intl = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get cal link from env or config
  const calLink = config.calLink || process.env.NEXT_PUBLIC_CAL_LINK;

  useEffect(() => {
    if (!calLink) {
      setError(intl.formatMessage({ id: 'bookCall.notConfigured' }));
      return;
    }

    // Load Cal.com embed script
    const loadCalScript = () => {
      return new Promise<void>((resolve, reject) => {
        // Check if already loaded
        if (window.Cal?.loaded) {
          resolve();
          return;
        }

        // Check if script is already in DOM
        const existingScript = document.querySelector(`script[src="${CAL_EMBED_SCRIPT}"]`);
        if (existingScript) {
          existingScript.addEventListener('load', () => resolve());
          return;
        }

        // Load script
        const script = document.createElement('script');
        script.src = CAL_EMBED_SCRIPT;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Cal.com embed'));
        document.head.appendChild(script);
      });
    };

    const initializeEmbed = async () => {
      try {
        await loadCalScript();

        // Initialize Cal embed
        if (window.Cal && containerRef.current) {
          const namespace = 'diboas-embed';

          // Initialize namespace
          window.Cal('init', namespace, { origin: 'https://app.cal.com' });

          // Configure embed
          window.Cal(namespace, 'inline', {
            elementOrSelector: containerRef.current,
            calLink: calLink,
            config: {
              theme: config.theme || 'auto',
              hideEventTypeDetails: false,
              layout: config.layout || 'month_view',
              ...(config.email && { email: config.email }),
              ...(config.name && { name: config.name }),
              ...(config.notes && { notes: config.notes }),
              ...(config.metadata && { metadata: config.metadata }),
            },
          });

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
          onLoad?.();
        }
      } catch (err) {
        console.error('[CalEmbed] Failed to initialize:', err);
        setError(err instanceof Error ? err.message : 'Failed to load calendar');
      }
    };

    initializeEmbed();
  }, [calLink, config, onBookingComplete, onLoad]);

  // Error state
  if (error) {
    return (
      <div className={`${styles.embedContainer} ${styles.embedError} ${className || ''}`}>
        <p>{intl.formatMessage({ id: 'bookCall.loadError' })}</p>
        <p className={styles.errorDetail}>{error}</p>
      </div>
    );
  }

  // Not configured state
  if (!calLink) {
    return (
      <div className={`${styles.embedContainer} ${styles.embedPlaceholder} ${className || ''}`}>
        <p>{intl.formatMessage({ id: 'bookCall.notConfigured' })}</p>
        <p className={styles.placeholderNote}>{intl.formatMessage({ id: 'bookCall.contactDirectly' })}</p>
      </div>
    );
  }

  return (
    <div className={`${styles.embedWrapper} ${className || ''}`}>
      {!isLoaded && (
        <div className={styles.embedLoading}>
          <div className={styles.loadingSpinner} />
          <p>{intl.formatMessage({ id: 'bookCall.loading' })}</p>
        </div>
      )}
      <div
        ref={containerRef}
        className={styles.embedContainer}
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      />
    </div>
  );
}

export default CalEmbed;
