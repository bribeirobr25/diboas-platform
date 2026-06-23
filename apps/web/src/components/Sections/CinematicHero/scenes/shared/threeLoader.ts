/**
 * threeLoader — the ONE module that imports `three` and `gsap`.
 *
 * Reached only via dynamic `import()` inside useWebGLScene, so Turbopack emits a
 * single shared async chunk used by every cinematic hero (keeps the bundle
 * budget intact). Only the named exports the scenes actually use are imported,
 * so tree-shaking drops loaders/controls/examples.
 */

import {
  Scene,
  OrthographicCamera,
  PerspectiveCamera,
  WebGLRenderer,
  PlaneGeometry,
  BufferGeometry,
  BufferAttribute,
  Float32BufferAttribute,
  ShaderMaterial,
  Mesh,
  Points,
  Vector2,
  Color,
  AdditiveBlending,
  NormalBlending,
} from 'three';
import { gsap } from 'gsap';

import type { SceneKind } from '../../types';
import {
  QUAD_VERTEX,
  FLUID_FRAGMENT,
  DAWN_FRAGMENT,
  TERRAIN_VERTEX,
  TERRAIN_FRAGMENT,
  PARTICLE_VERTEX,
  PARTICLE_FRAGMENT,
} from './shaders';

export interface SceneColors {
  /** hex strings sourced from design tokens at runtime */
  a: string;
  b: string;
  c: string;
}

export interface SceneController {
  /** Advance + render one frame. `elapsed` in seconds, `mouse` normalised 0..1. */
  frame(elapsed: number, mouse: { x: number; y: number }): void;
  resize(width: number, height: number, dpr: number): void;
  dispose(): void;
  /** Gently fade the canvas in once the first frame is painted (GSAP). */
  reveal(canvas: HTMLCanvasElement, reduced: boolean): void;
}

type Uniforms = Record<string, { value: unknown }>;

function makeRenderer(canvas: HTMLCanvasElement, dpr: number): WebGLRenderer {
  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'low-power',
  });
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);
  return renderer;
}

/**
 * Build a renderer + the requested scene. Throws if WebGL is unavailable —
 * the caller catches and falls back to the CSS gradient/poster.
 */
export function createSceneController(
  canvas: HTMLCanvasElement,
  sceneKind: SceneKind,
  colors: SceneColors,
  size: { width: number; height: number; dpr: number },
  light = false
): SceneController {
  const renderer = makeRenderer(canvas, size.dpr);
  renderer.setSize(size.width, size.height, false);

  const cA = new Color(colors.a);
  const cB = new Color(colors.b);
  const cC = new Color(colors.c);
  const scene = new Scene();

  if (sceneKind === 'fluid' || sceneKind === 'dawn-water') {
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const uniforms: Uniforms = {
      uTime: { value: 0 },
      uRes: { value: new Vector2(size.width, size.height) },
      uMouse: { value: new Vector2(0.5, 0.5) },
      uColorA: { value: cA },
      uColorB: { value: cB },
      uColorC: { value: cC },
      uLight: { value: light ? 1 : 0 },
    };
    const material = new ShaderMaterial({
      vertexShader: QUAD_VERTEX,
      fragmentShader: sceneKind === 'fluid' ? FLUID_FRAGMENT : DAWN_FRAGMENT,
      uniforms,
      depthWrite: false,
    });
    const mesh = new Mesh(new PlaneGeometry(2, 2), material);
    scene.add(mesh);

    return {
      frame(elapsed, mouse) {
        uniforms.uTime.value = elapsed;
        (uniforms.uMouse.value as Vector2).set(mouse.x, mouse.y);
        renderer.render(scene, camera);
      },
      resize(w, h, dpr) {
        renderer.setPixelRatio(dpr);
        renderer.setSize(w, h, false);
        (uniforms.uRes.value as Vector2).set(w, h);
      },
      dispose() {
        mesh.geometry.dispose();
        material.dispose();
        renderer.dispose();
      },
      reveal(c, reduced) {
        gsap.fromTo(
          c,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: reduced ? 0 : 1.2, ease: 'power2.out' }
        );
      },
    };
  }

  if (sceneKind === 'wireframe-terrain') {
    // data-cinematic/landing camera: low angle looking slightly down at the plane.
    const camera = new PerspectiveCamera(55, size.width / size.height, 0.1, 100);
    camera.position.set(0, 3.0, 6.2);
    camera.lookAt(0, -0.4, 0);
    const uniforms: Uniforms = {
      uTime: { value: 0 },
      uColorA: { value: cA },
      uColorB: { value: cB },
    };
    const geometry = new PlaneGeometry(14, 14, 120, 120);
    geometry.rotateX(-Math.PI / 2);
    const material = new ShaderMaterial({
      vertexShader: TERRAIN_VERTEX,
      fragmentShader: TERRAIN_FRAGMENT,
      uniforms,
      wireframe: true,
      transparent: true,
      depthWrite: false,
    });
    const mesh = new Mesh(geometry, material);
    scene.add(mesh);

    return {
      frame(elapsed) {
        uniforms.uTime.value = elapsed;
        mesh.rotation.y = Math.sin(elapsed * 0.05) * 0.06;
        renderer.render(scene, camera);
      },
      resize(w, h, dpr) {
        renderer.setPixelRatio(dpr);
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      },
      dispose() {
        geometry.dispose();
        material.dispose();
        renderer.dispose();
      },
      reveal(c, reduced) {
        gsap.fromTo(
          c,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: reduced ? 0 : 1.4, ease: 'power2.out' }
        );
      },
    };
  }

  // particles — data-cinematic/market rising field. Box x±9, y±6, z±5; camera z=8.
  const camera = new PerspectiveCamera(60, size.width / size.height, 0.1, 100);
  camera.position.set(0, 0, 8);
  const COUNT = 900;
  const positions = new Float32Array(COUNT * 3);
  const seeds = new Float32Array(COUNT);
  const fract = (x: number) => Math.abs(x - Math.floor(x));
  for (let i = 0; i < COUNT; i++) {
    positions[i * 3] = fract(Math.sin(i * 12.9898) * 43758.5453) * 18 - 9;
    positions[i * 3 + 1] = fract(Math.sin(i * 78.233) * 43758.5453) * 12 - 6;
    positions[i * 3 + 2] = fract(Math.sin(i * 37.719) * 43758.5453) * 10 - 5;
    seeds[i] = fract(Math.sin(i * 4.21) * 43758.5453);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('aSeed', new Float32BufferAttribute(seeds, 1));
  const uniforms: Uniforms = {
    uTime: { value: 0 },
    uSize: { value: 90 * size.dpr },
    uColorA: { value: cA },
    uColorB: { value: cB },
  };
  const material = new ShaderMaterial({
    vertexShader: PARTICLE_VERTEX,
    fragmentShader: PARTICLE_FRAGMENT,
    uniforms,
    transparent: true,
    depthWrite: false,
    // Additive glow reads well on dark heroes; on light/cream surfaces it washes
    // out, so use normal blending there (market editorial + tools).
    blending: light ? NormalBlending : AdditiveBlending,
  });
  const points = new Points(geometry, material);
  scene.add(points);

  return {
    frame(elapsed) {
      uniforms.uTime.value = elapsed;
      points.rotation.y = Math.sin(elapsed * 0.1) * 0.15;
      renderer.render(scene, camera);
    },
    resize(w, h, dpr) {
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
      uniforms.uSize.value = 90 * dpr;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
    reveal(c, reduced) {
      gsap.fromTo(
        c,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: reduced ? 0 : 1.4, ease: 'power2.out' }
      );
    },
  };
}
