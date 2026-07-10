'use client';

/**
 * StickyMobileCTA Component
 *
 * Fixed bottom CTA bar for mobile viewports (<768px).
 * Appears after scrolling past the hero section.
 * Hides when the #waitlist section is visible.
 * Scrolls to #waitlist on click.
 *
 * Uses IntersectionObserver for performant visibility detection.
 * Respects prefers-reduced-motion for slide animation.
 */

import { useEffect, useState, useCallback, useRef, useSyncExternalStore } from 'react';
import { useTranslation } from '@diboas/i18n/client';

// A11Y-5: subscribe to prefers-reduced-motion via useSyncExternalStore (not a
// setState-in-effect) so it is hydration-safe and free of cascading renders.
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia(REDUCED_MOTION_QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

interface StickyMobileCTAProps {
  /** CSS selector for the element the CTA appears after (defaults to the B2C hero). */
  appearAfterSelector?: string;
  /** Element id that hides the CTA when it becomes visible (defaults to `waitlist`). */
  hideNearId?: string;
  /** Element id the CTA scrolls to on click (defaults to `waitlist`). */
  targetId?: string;
  /** i18n message id for the button label (defaults to the B2C mobile CTA). */
  ctaTextId?: string;
  /** Pre-resolved label string; when provided it bypasses `ctaTextId` (avoids needing the namespace client-side). */
  ctaText?: string;
}

export function StickyMobileCTA({
  appearAfterSelector = '[data-section-id="hero-section-b2c"]',
  hideNearId = 'waitlist',
  targetId = 'waitlist',
  ctaTextId = 'landing-b2c.nav.ctaMobile',
  ctaText,
}: StickyMobileCTAProps = {}) {
  const intl = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const heroVisibleRef = useRef(true);
  const waitlistVisibleRef = useRef(false);

  // A11Y-5: the slide transition below is applied inline, so a
  // `[data-reduced-motion]` stylesheet rule can't override it (inline
  // specificity wins) — gate the inline `transition` on this value instead.
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );

  const updateVisibility = useCallback(() => {
    const shouldShow = !heroVisibleRef.current && !waitlistVisibleRef.current;
    setIsVisible(shouldShow);
  }, []);

  useEffect(() => {
    const heroEl = document.querySelector(appearAfterSelector);
    const waitlistEl = document.getElementById(hideNearId);

    if (!heroEl) return;

    const heroObserver = new IntersectionObserver(
      ([entry]) => {
        heroVisibleRef.current = entry.isIntersecting;
        updateVisibility();
      },
      { threshold: 0 }
    );

    const waitlistObserver = new IntersectionObserver(
      ([entry]) => {
        waitlistVisibleRef.current = entry.isIntersecting;
        updateVisibility();
      },
      { threshold: 0 }
    );

    heroObserver.observe(heroEl);
    if (waitlistEl) {
      waitlistObserver.observe(waitlistEl);
    }

    return () => {
      heroObserver.disconnect();
      waitlistObserver.disconnect();
    };
  }, [updateVisibility, appearAfterSelector, hideNearId]);

  const handleClick = () => {
    const targetEl = document.getElementById(targetId);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const label = ctaText ?? intl.formatMessage({ id: ctaTextId });

  return (
    <div
      className="sticky-mobile-cta"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'var(--sticky-cta-height)',
        backgroundColor: 'var(--cta-bg-primary)',
        color: 'var(--cta-color-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
        transition: prefersReducedMotion ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: '0 -2px 10px var(--shadow-black-medium)',
      }}
      aria-hidden={!isVisible}
    >
      <button
        type="button"
        onClick={handleClick}
        style={{
          width: '100%',
          height: '100%',
          background: 'none',
          border: 'none',
          color: 'inherit',
          fontSize: 'var(--font-size-ui-button)',
          fontWeight: 'var(--font-weight-semibold)',
          fontFamily: 'var(--font-family-primary)',
          cursor: 'pointer',
          letterSpacing: 'var(--letter-spacing-wide)',
        }}
        tabIndex={isVisible ? 0 : -1}
        aria-label={label}
      >
        {label}
      </button>
    </div>
  );
}
