/**
 * Brazil poupança regime-switch formula — Phase G (TOOLS_IMPROVEMENT.md, 2026-05-23).
 *
 * BCB rule (Lei nº 12.703/2012):
 *   - When Selic ≤ 8.5% p.a.: poupança yields 70% × Selic + TR (annualized).
 *   - When Selic > 8.5% p.a.: poupança yields 0.5%/month + TR (≈6.17%/yr + TR).
 *
 * The switch threshold is exposed as a named constant (P5 semantic naming —
 * no magic 8.5 inline). TR (Taxa Referencial, BCB SGS 7811) is currently
 * near-zero in the high-Selic regime; when it rises it adds linearly to the
 * annualized rate.
 *
 * Source: BCB poupança remuneration page; Lei nº 12.703/2012.
 * Reference Phase G decision: TOOLS_IMPROVEMENT.md decision register Decision P2.
 */

export const BRAZIL_POUPANCA_SELIC_THRESHOLD = 8.5;
export const BRAZIL_POUPANCA_HIGH_REGIME_MONTHLY = 0.005;  // 0.5%/month
export const BRAZIL_POUPANCA_LOW_REGIME_SELIC_FRACTION = 0.7;  // 70% of Selic

/**
 * Derives the annualized poupança rate from Selic and TR per BCB regime-switch rule.
 *
 * @param selicAnnualPct Selic policy rate as a percent (e.g., 14.50 for 14.5%).
 * @param trMonthlyPct TR (Taxa Referencial) as a monthly percent (e.g., 0 for current).
 * @returns Annualized poupança rate as a decimal (e.g., 0.0617 for 6.17%/yr).
 */
export function derivePoupancaRate(
  selicAnnualPct: number,
  trMonthlyPct: number = 0,
): number {
  if (!Number.isFinite(selicAnnualPct) || selicAnnualPct < 0) return 0;
  const trMonthlyDecimal = (trMonthlyPct ?? 0) / 100;

  if (selicAnnualPct > BRAZIL_POUPANCA_SELIC_THRESHOLD) {
    // High-Selic regime: 0.5%/month + TR
    const monthly = BRAZIL_POUPANCA_HIGH_REGIME_MONTHLY + trMonthlyDecimal;
    return Math.pow(1 + monthly, 12) - 1;
  }

  // Low-Selic regime: 70% × Selic + TR
  const selicComponent = BRAZIL_POUPANCA_LOW_REGIME_SELIC_FRACTION * (selicAnnualPct / 100);
  const trAnnual = Math.pow(1 + trMonthlyDecimal, 12) - 1;
  return selicComponent + trAnnual;
}
