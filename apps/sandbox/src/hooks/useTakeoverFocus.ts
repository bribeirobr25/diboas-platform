'use client';

import { useEffect, useRef } from 'react';

/** Nearest scrollable ancestor, or null if the element scrolls with the page. */
function scrollParent(el: HTMLElement): HTMLElement | null {
  let node = el.parentElement;
  while (node) {
    const overflowY = getComputedStyle(node).overflowY;
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

/**
 * Move focus to a full-screen takeover's heading when it mounts.
 *
 * The sandbox swaps whole views in place (the G4 completion screen, the G7 exit
 * ceremony) rather than navigating. The control that opened the view unmounts
 * with the view behind it, so without this a keyboard or screen-reader user is
 * dropped onto `<body>`: the next Tab restarts at the top of the page and
 * nothing announces that the screen changed. Focusing the heading announces the
 * new context and puts the tab order at the start of it.
 *
 * `preventScroll` is load-bearing, not a nicety. A plain `focus()` scrolls the
 * heading into view, and because the app chrome scrolls its own content area
 * (not the window), that left the takeover mounted ~53px down — with the Back
 * control scrolled out of sight above the heading on every single open. So:
 * focus WITHOUT scrolling, then put the view at its own top explicitly, which
 * is what "a new screen just opened" should mean anyway. The outgoing screen's
 * scroll position must never be inherited by the incoming one.
 *
 * Mount-only by design — a re-render must never yank focus back off whatever
 * the reader has since moved to. The target needs `tabIndex={-1}` so it can
 * receive programmatic focus without entering the tab order.
 */
export function useTakeoverFocus<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus({ preventScroll: true });
    const parent = scrollParent(el);
    if (parent) parent.scrollTop = 0;
    else window.scrollTo(0, 0);
  }, []);
  return ref;
}
