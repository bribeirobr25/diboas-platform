'use client';

/**
 * ScrollReveal Component
 *
 * Shared utility for scroll-triggered reveal animations (IntersectionObserver,
 * reduced-motion-safe). The reveal styling is tokenized in
 * `semantic-components.css` (`.scroll-reveal-base` / `.scroll-reveal-stagger`)
 * so this component only toggles `.is-visible`.
 *
 * Default usage fades the wrapper up (byte-compatible with the original).
 * `stagger` instead reveals the DIRECT CHILDREN in sequence — use it AS the
 * grid/list container (pass `as` + the grid `className`) so the children are the
 * staggered items:
 *
 * ```tsx
 * <ScrollReveal>            // wrapper fade-up
 *   <Section />
 * </ScrollReveal>
 *
 * <ScrollReveal stagger as="ul" className={styles.cardGrid}>  // children stagger
 *   {cards}
 * </ScrollReveal>
 * ```
 */

import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  /** Element to render (default `div`). Use the grid/list tag when `stagger`. */
  as?: ElementType;
  /** Reveal direct children in sequence instead of fading the wrapper. */
  stagger?: boolean;
  /** Per-child delay in ms (default 80). */
  staggerDelay?: number;
  /** Single-element reveal offset in ms (non-stagger mode). */
  delay?: number;
  threshold?: number;
  rootMargin?: string;
}

export function ScrollReveal({
  children,
  className,
  as: Tag = 'div',
  stagger = false,
  staggerDelay = 80,
  delay,
  threshold = 0.15,
  rootMargin = '0px 0px -50px 0px',
}: ScrollRevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reduced motion: reveal immediately (CSS also forces the final state, so
    // there is no hidden flash before JS runs).
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('is-visible');
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible');
          observer.unobserve(el);
        }
      },
      { threshold, rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  const style: CSSProperties = {};
  if (stagger) (style as Record<string, string>)['--stagger-step'] = `${staggerDelay}ms`;
  if (delay != null) style.transitionDelay = `${delay}ms`;

  const cls = [stagger ? 'scroll-reveal-stagger' : 'scroll-reveal-base', className]
    .filter(Boolean)
    .join(' ');

  return (
    <Tag ref={ref} className={cls} style={style}>
      {children}
    </Tag>
  );
}
