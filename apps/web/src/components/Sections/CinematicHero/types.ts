/**
 * CinematicHero — shared types
 *
 * Domain-Driven Design: a reusable animated hero family (GSAP + Three.js).
 * Service Agnostic Abstraction: the WebGL "scene" is pluggable + lazily loaded.
 * No Hardcoded Values: content arrives as already-resolved strings; visual
 * behaviour is driven by `scene` + `theme` tokens.
 */

import type { Ref } from 'react';

/** Pluggable WebGL scenes, shared across every hero surface. */
export type SceneKind = 'fluid' | 'dawn-water' | 'wireframe-terrain' | 'particles';

/** Light/dark treatment — switches overlay + foreground tokens via `data-theme`. */
export type HeroTheme = 'dark' | 'light' | 'lighter';

export interface CinematicHeroCta {
  readonly label: string;
  readonly href: string;
  readonly target?: '_blank' | '_self';
  /** Fired (fire-and-forget) when the CTA is activated. */
  readonly onClick?: () => void;
}

export interface CinematicHeroProps {
  /** Mono eyebrow / kicker (already-resolved string). */
  readonly eyebrow?: string;
  /** The SSR `<h1>` — server-rendered for SEO/LCP. */
  readonly headline: string;
  /** Accent the trailing word(s) of the headline (gold over dark, teal over light). */
  readonly accentHeadline?: boolean;
  /** Lead/standfirst under the headline. */
  readonly subheadline?: string;
  /** Optional secondary line (e.g. Protocols trust line). */
  readonly subheadline2?: string;
  readonly primaryCta?: CinematicHeroCta;
  readonly secondaryCta?: CinematicHeroCta;

  /** Which WebGL scene to render behind the content. */
  readonly scene: SceneKind;
  /** Light/dark treatment. */
  readonly theme: HeroTheme;
  /** Content alignment. */
  readonly align?: 'center' | 'left';

  /**
   * Optional self-hosted AVIF poster shown beneath the canvas (under the
   * overlay) — also the reduced-motion / WebGL-unavailable fallback image.
   */
  readonly posterImage?: string;
  /** Alt text for the poster (decorative band heroes only; '' otherwise). */
  readonly posterAlt?: string;
  /** Apply a brand duotone treatment to the poster ("band" heroes). */
  readonly posterDuotone?: boolean;

  /** Above-the-fold priority (poster eager-loads, canvas inits sooner). */
  readonly priority?: boolean;
  readonly className?: string;
  /** Stable id for the section landmark. */
  readonly sectionId?: string;
  /** Optional ref on the `<section>` (e.g. for impression tracking from a client adapter). */
  readonly rootRef?: Ref<HTMLElement>;
}
