import styles from './Sparkline.module.css';

/**
 * Sparkline primitive (Phase B — the "character over number" friendly now-vs-past
 * visual of the dual-view design language). A soft line with NO axes, gridlines,
 * or percent-ticks — it supports the plain-language meaning, it does not replace
 * it. HONESTY (non-negotiable, SANDBOX_DESIGN_LANGUAGE §5): it renders the series
 * as given, INCLUDING down/flat periods — never smoothed to only-up. The caller
 * passes a series that honestly reflects the strategy's character (steady = gentle;
 * growth = real swings). A11y: the meaning lives in the caller's TEXT; the SVG is
 * aria-hidden (decorative support), never the sole carrier of meaning.
 *
 * Pure/presentational: given the same series it always renders the same path
 * (deterministic — no Math.random, no Date).
 */
export function Sparkline({
  series,
  width = 320,
  height = 96,
}: {
  /** the value series, oldest → newest; length >= 2. */
  series: number[];
  width?: number;
  height?: number;
}) {
  if (series.length < 2) return null;

  const min = Math.min(...series);
  const max = Math.max(...series);
  // A flat series has no span; `|| 1` avoids a divide-by-zero and draws it along the BOTTOM
  // edge (y = pad + 1·(h − 2·pad)). Centring it is a UX decision, not made here (lane audit 2026-10-21, Z8).
  const span = max - min || 1;
  const pad = 4;
  const stepX = (width - pad * 2) / (series.length - 1);

  const points = series.map((v, i) => {
    const x = pad + i * stepX;
    // invert Y (SVG origin top-left); higher value → higher on screen
    const y = pad + (1 - (v - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });

  const line = points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
  const area = `${pad},${height - pad} ${line} ${width - pad},${height - pad}`;

  return (
    <svg
      className={styles.svg}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden
      focusable="false"
    >
      <polygon className={styles.fill} points={area} />
      <polyline className={styles.line} points={line} />
    </svg>
  );
}
