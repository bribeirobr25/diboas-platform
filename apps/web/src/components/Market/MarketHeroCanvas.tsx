'use client';

/**
 * MarketHeroCanvas — decorative soft teal particle field behind the editorial
 * "Adelaide Daily" masthead (replicates 02-editorial-motion's hero canvas).
 *
 * Reuses the shared `useWebGLScene` engine (particles scene, light theme →
 * calm teal points, normal-blended for the cream paper). The canvas is
 * `aria-hidden`; the masthead text is real SSR DOM in the page. WebGL failure /
 * reduced-motion degrades to the cream background underneath.
 *
 * `'use client'` MUST be the first line (Next 16 + Turbopack hydration).
 */

import { useWebGLScene } from '@/components/Sections/CinematicHero/scenes/useWebGLScene';
import styles from './MarketEditorial.module.css';

export function MarketHeroCanvas() {
  const { canvasRef, containerRef, failed } = useWebGLScene({ scene: 'particles', theme: 'lighter' });

  return (
    <div ref={containerRef} className={styles.heroCanvas} aria-hidden="true">
      {!failed && <canvas ref={canvasRef} className={styles.heroCanvasEl} />}
    </div>
  );
}
