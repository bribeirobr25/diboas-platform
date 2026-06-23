'use client';

/**
 * SceneCanvas — decorative WebGL layer for the cinematic hero.
 *
 * A plain `'use client'` component imported DIRECTLY (never via
 * `dynamic({ ssr: false })` — that is the F20 silent-hydration footgun on
 * Next 16 + Turbopack). It SSRs an empty, `aria-hidden` canvas host with a
 * token-driven gradient painted underneath; `three`/`gsap` load only inside the
 * effect (see useWebGLScene). The hero `<h1>`/copy are real SSR DOM elsewhere.
 *
 * NOTE: `'use client'` MUST be the file's first line — a leading comment before
 * it makes Next 16 + Turbopack treat the module as server-only (no hydration).
 */

import { useWebGLScene } from './useWebGLScene';
import type { SceneKind, HeroTheme } from '../types';
import styles from '../CinematicHero.module.css';

export interface SceneCanvasProps {
  scene: SceneKind;
  theme: HeroTheme;
}

export function SceneCanvas({ scene, theme }: SceneCanvasProps) {
  const { canvasRef, containerRef, failed } = useWebGLScene({ scene, theme });

  return (
    <div ref={containerRef} className={styles.canvasHost} aria-hidden="true">
      {/* The gradient fallback is painted by .canvasHost::before and always
          visible beneath the canvas — so first paint is never blank and a
          WebGL failure degrades invisibly. */}
      {!failed && <canvas ref={canvasRef} className={styles.canvas} />}
    </div>
  );
}

export default SceneCanvas;
