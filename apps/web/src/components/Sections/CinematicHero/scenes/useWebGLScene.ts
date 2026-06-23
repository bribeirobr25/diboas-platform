'use client';

/**
 * useWebGLScene — SSR-safe orchestration for the cinematic hero canvas.
 *
 * - `three`/`gsap` are pulled in via dynamic `import()` INSIDE the effect, so
 *   they never touch SSR or the critical path (and form one shared chunk).
 * - prefers-reduced-motion → render exactly one static frame, no rAF loop.
 * - WebGL unavailable / context-loss → `failed=true` → caller shows the CSS
 *   gradient (+ optional poster) fallback.
 * - rAF paused when offscreen (IntersectionObserver) or tab hidden; DPR capped
 *   ≤ 2; ResizeObserver keeps the canvas crisp. Scene colours come from design
 *   tokens (no hard-coded brand colours).
 */

import { useEffect, useRef, useState } from 'react';
import type { SceneColors } from './shared/threeLoader';
import type { SceneKind, HeroTheme } from '../types';

function readToken(el: HTMLElement, name: string, fallback: string): string {
  const v = getComputedStyle(el).getPropertyValue(name).trim();
  return v || fallback;
}

function colorsFor(el: HTMLElement, scene: SceneKind, theme: HeroTheme): SceneColors {
  const brand = readToken(el, '--brand-primary', '#14b8a6');
  const gold = readToken(el, '--accent-gold', '#c8a24b');
  const ink = readToken(el, '--accent-ink', '#0b1f24');
  const tealDeep = readToken(el, '--teal-deep-800', '#134e4a');
  // Scene palette sourced from the awwwards prototypes the heroes replicate.
  const sceneInk = readToken(el, '--scene-ink', '#06120f');
  const sceneGold = readToken(el, '--scene-gold', '#e8b873');
  const emerald = readToken(el, '--scene-emerald', '#34d399');
  const terra = readToken(el, '--scene-terra', '#e0735e');
  const paper = readToken(el, '--scene-paper', '#e8efe9');
  const paperTeal = readToken(el, '--scene-paper-teal', '#a9d8cd');
  const light = theme !== 'dark';
  switch (scene) {
    case 'fluid':
      // dark (business) = liquid-capital ink/teal/gold; light (learn) = calm light base
      return light ? { a: paper, b: paperTeal, c: brand } : { a: sceneInk, b: brand, c: sceneGold };
    case 'dawn-water':
      // B2C + About — both dark photo-band heroes
      return { a: ink, b: tealDeep, c: gold };
    case 'wireframe-terrain':
      // strategies = data-cinematic landing: emerald peaks, terracotta troughs
      return { a: emerald, b: terra, c: terra };
    case 'particles':
    default:
      // protocols (dark) = emerald points; tools (light) = calm teal points
      return light ? { a: brand, b: emerald, c: emerald } : { a: emerald, b: emerald, c: emerald };
  }
}

export interface UseWebGLSceneArgs {
  scene: SceneKind;
  theme: HeroTheme;
  /** Skip WebGL entirely (e.g. forced fallback). */
  enabled?: boolean;
}

export function useWebGLScene({ scene, theme, enabled = true }: UseWebGLSceneArgs) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !enabled) return;

    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let disposed = false;
    let running = false;
    let raf = 0;
    let controller: import('./shared/threeLoader').SceneController | null = null;
    let io: IntersectionObserver | null = null;
    let ro: ResizeObserver | null = null;
    let onVis: (() => void) | null = null;
    const start =
      typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
    const mouse = { x: 0.5, y: 0.5 };

    const size = () => ({ width: container.clientWidth, height: container.clientHeight, dpr });
    const onMove = (e: PointerEvent) => {
      const r = container.getBoundingClientRect();
      if (!r.width || !r.height) return;
      mouse.x = (e.clientX - r.left) / r.width;
      mouse.y = 1 - (e.clientY - r.top) / r.height;
    };

    (async () => {
      let createSceneController: typeof import('./shared/threeLoader').createSceneController;
      try {
        ({ createSceneController } = await import('./shared/threeLoader'));
      } catch {
        if (!disposed) setFailed(true);
        return;
      }
      if (disposed) return;

      let started = false;
      const now = () =>
        (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()) -
        start;
      const renderOne = () => controller?.frame(now() / 1000, mouse);
      const loop = () => {
        if (disposed || !running) return;
        renderOne();
        raf = requestAnimationFrame(loop);
      };
      const startLoop = () => {
        if (running || reduced || disposed || !controller) return;
        running = true;
        raf = requestAnimationFrame(loop);
      };
      const stopLoop = () => {
        running = false;
        cancelAnimationFrame(raf);
      };

      // Create the scene the first time the container actually has a size.
      // (On fast hydration the effect can run before layout; the ResizeObserver
      // below retries instead of giving up permanently — the prior bug.)
      const tryInit = () => {
        if (started || disposed) return;
        const s = size();
        if (!s.width || !s.height) return;
        try {
          controller = createSceneController(
            canvas,
            scene,
            colorsFor(container, scene, theme),
            s,
            theme !== 'dark'
          );
        } catch {
          if (!disposed) setFailed(true);
          return;
        }
        started = true;
        renderOne(); // paint the first frame immediately
        controller.reveal(canvas, reduced);
        if (!reduced) {
          container.addEventListener('pointermove', onMove, { passive: true });
          io = new IntersectionObserver(
            (entries) => {
              if (entries[0]?.isIntersecting && !document.hidden) startLoop();
              else stopLoop();
            },
            { threshold: 0.01 }
          );
          io.observe(container);
          onVis = () => (document.hidden ? stopLoop() : startLoop());
          document.addEventListener('visibilitychange', onVis);
        }
      };

      ro = new ResizeObserver(() => {
        if (!started) {
          tryInit();
          return;
        }
        const s2 = size();
        if (s2.width && s2.height) {
          controller?.resize(s2.width, s2.height, dpr);
          if (reduced) renderOne();
        }
      });
      ro.observe(container);
      tryInit();
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      io?.disconnect();
      ro?.disconnect();
      if (onVis) document.removeEventListener('visibilitychange', onVis);
      container.removeEventListener('pointermove', onMove);
      controller?.dispose();
    };
  }, [scene, theme, enabled]);

  return { canvasRef, containerRef, failed };
}
