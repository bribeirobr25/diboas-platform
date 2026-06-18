/**
 * GLSL sources for the CinematicHero scenes (plain strings — no loaders).
 *
 * Colours arrive as uniforms (uColorA/B/C) sourced from design tokens at
 * runtime (see useWebGLScene), so nothing here is a hard-coded brand colour.
 * All scenes are calm/slow and read tasteful at low alpha behind a scrim.
 */

/** Shared noise helpers (compact value-noise + fbm). */
const NOISE = /* glsl */ `
  float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
  float vnoise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    float a = hash(i), b = hash(i+vec2(1.,0.)), c = hash(i+vec2(0.,1.)), d = hash(i+vec2(1.,1.));
    vec2 u = f*f*(3.-2.*f);
    return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
  }
  float fbm(vec2 p){
    float v = 0.0, amp = 0.5;
    for(int i=0;i<5;i++){ v += amp*vnoise(p); p *= 2.02; amp *= 0.5; }
    return v;
  }
`;

/** Fullscreen-quad vertex shader (clip-space, passes uv). */
export const QUAD_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

/** "fluid" — two-stage domain-warped flow with gold filaments (liquid-capital).
 *  uLight=0 → dark scene (vignette darkening, business); uLight=1 → calm light
 *  scene (stays bright over a pale base, learn). */
export const FLUID_FRAGMENT = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse;
  uniform vec3 uColorA; uniform vec3 uColorB; uniform vec3 uColorC;
  uniform float uLight;
  ${NOISE}
  void main(){
    vec2 uv = vUv;
    vec2 p = uv; p.x *= uRes.x/uRes.y;
    float t = uTime*0.05;
    vec2 m = (uMouse - 0.5) * 0.5;
    // two-stage domain warp (IQ-style)
    vec2 q = vec2(fbm(p*2.0 + vec2(0.0, t)), fbm(p*2.0 + vec2(5.2, 1.3 - t)));
    vec2 r = vec2(fbm(p*2.0 + 1.8*q + vec2(1.7, 9.2) + m + t*0.5),
                  fbm(p*2.0 + 1.8*q + vec2(8.3, 2.8) - m));
    float f = fbm(p*2.2 + 2.0*r);
    // More contrast so the base (ink) shows through as dark veins/channels
    // (liquid-capital is moody, not uniformly lit).
    float flow = clamp(f*1.15 - 0.05, 0.0, 1.0);
    // thin gold filaments along the warp ridges — kept subtle (was prominent)
    float fil = pow(1.0 - abs(sin((r.x + r.y)*6.2831 + uTime*0.4)), 3.0);
    vec3 col = mix(uColorA, uColorB, flow);
    col = mix(col, uColorC, clamp(fil*pow(r.x + 0.3, 2.0), 0.0, 0.42));
    // brightness: dark → deeper vignette (moodier); light → stays calm & bright
    float vig = smoothstep(1.25, 0.25, length(uv - vec2(0.4, 0.42)));
    float darkB = (0.42 + 0.55*vig) * (0.55 + 0.5*f);
    float lightB = 0.88 + 0.16*f;
    col *= mix(darkB, lightB, uLight);
    gl_FragColor = vec4(col, 1.0);
  }
`;

/** "dawn-water" — sunrise glow rising over rippling water (coastal). */
export const DAWN_FRAGMENT = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform vec2 uRes; uniform float uTime;
  uniform vec3 uColorA; uniform vec3 uColorB; uniform vec3 uColorC;
  ${NOISE}
  void main(){
    vec2 uv = vUv;
    float horizon = 0.46;
    // Sky: deep base -> warm dawn glow rising from the horizon, off to one side.
    vec3 sky = mix(uColorA, uColorB, smoothstep(0.0, 1.0, uv.y));
    vec2 sun = vec2(0.72, horizon + 0.04);
    float glow = exp(-6.0*length((uv-sun)*vec2(1.0,1.6)));
    sky += uColorC * glow * (0.9 + 0.1*sin(uTime*0.3));
    // Water: mirror + slow ripples + a soft reflected glow column.
    vec2 w = vec2(uv.x, horizon - (uv.y - horizon));
    float ripple = fbm(vec2(w.x*6.0, w.y*22.0) + vec2(0.0, uTime*0.25));
    vec3 water = mix(uColorA*0.6, uColorB*0.7, smoothstep(0.0,1.0,w.y));
    water += uColorC * exp(-9.0*abs(uv.x-sun.x)) * 0.5 * (0.8+0.4*ripple);
    water *= 0.85 + 0.15*ripple;
    vec3 col = uv.y > horizon ? sky : water;
    gl_FragColor = vec4(col, 1.0);
  }
`;

/** "wireframe-terrain" — layered-sine "growth wave" rising toward +x, displaced
 *  on Y (height). Replicates data-cinematic/landing. Plane is rotated flat in
 *  threeLoader so `position.xz` is the ground and `position.y` is height. */
export const TERRAIN_VERTEX = /* glsl */ `
  uniform float uTime; varying float vH;
  void main(){
    vec3 p = position;
    float W = 14.0;
    float grow = clamp((p.x + W*0.5)/W, 0.0, 1.0);
    float t = uTime*0.7;
    float h = (sin(p.x*0.6 + t)*0.45
             + sin(p.z*0.8 + t*0.7)*0.35
             + sin((p.x + p.z)*0.4 + t*1.3)*0.25) * (0.55 + grow*1.35);
    p.y += h;
    vH = h;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;
export const TERRAIN_FRAGMENT = /* glsl */ `
  precision highp float;
  varying float vH; uniform vec3 uColorA; uniform vec3 uColorB;
  void main(){
    // Bright, mostly-emerald wireframe (uColorA); terracotta (uColorB) only in
    // the deepest troughs — matches data-cinematic's dense bright mesh.
    float h01 = clamp(vH*0.5 + 0.5, 0.0, 1.0);
    vec3 col = mix(uColorB, uColorA, smoothstep(0.0, 0.4, h01));
    gl_FragColor = vec4(col, 0.5 + 0.45*h01);
  }
`;

/** "particles" — a soft field of points that rise and wrap (data-cinematic
 *  market). Each point drifts up on Y at a per-seed speed and recycles. */
export const PARTICLE_VERTEX = /* glsl */ `
  uniform float uTime; uniform float uSize; attribute float aSeed; varying float vA;
  void main(){
    vec3 p = position;
    // rise on Y at a per-particle speed, wrapping within [-6, 6]
    p.y = mod(p.y + 6.0 + uTime*(0.35 + aSeed*0.9), 12.0) - 6.0;
    vA = 0.45 + 0.45*aSeed;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = uSize * (1.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
export const PARTICLE_FRAGMENT = /* glsl */ `
  precision highp float;
  uniform vec3 uColorA; uniform vec3 uColorB; varying float vA;
  void main(){
    vec2 c = gl_PointCoord - 0.5;
    float d = 1.0 - smoothstep(0.0, 0.5, length(c));
    if(d <= 0.0) discard;
    vec3 col = mix(uColorA, uColorB, vA);
    gl_FragColor = vec4(col, d * vA * 0.9);
  }
`;
