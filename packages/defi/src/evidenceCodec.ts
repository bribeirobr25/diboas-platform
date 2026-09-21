/**
 * The persistence CODEC — the one boundary where a runtime value becomes a
 * stored representation and back.
 *
 * ```text
 * in-memory value   = number          (the banked ruling)
 * persisted value   = decimal string  (codec/store boundary ONLY)
 * Product components = storage-format agnostic
 * ```
 *
 * ⚑ THE PERSISTED STRING IS THE AUTHORITY. Encoding rounds ONCE, at a declared
 * scale, and says so; it does not pretend a float carried more precision than
 * it did. The invariant that matters for persistence fidelity is therefore
 * stated in terms of the string:
 *
 * ```text
 * decode(s) -> number -> encode(...) === s       for every canonical s
 * ```
 *
 * A number -> string -> number round-trip is exact only when the value is
 * representable at the declared scale; `0.1 + 0.2` is not, and encoding it as
 * `"0.3"` is the honest answer rather than persisting `0.30000000000000004`.
 *
 * ⚑ VALIDATION IS RUNTIME, NEVER A CAST. A `as number` on a value read from a
 * database is a claim about bytes nobody checked. Every decode parses, matches
 * the canonical pattern, and re-encodes to prove the round-trip, and throws
 * otherwise.
 */

/** The hard ceiling on declared scale. Beyond this a double carries no signal. */
export const DECIMAL_MAX_SCALE = 18;

/** The default scale for the money-shaped values this build persists. */
export const DECIMAL_DEFAULT_SCALE = 8;

/**
 * Canonical persisted form: optional sign, no leading zeros (except `0`), an
 * optional fractional part with no trailing zeros, no exponent, no `+`.
 * `-0` is not canonical — zero has one spelling.
 */
export const DECIMAL_STRING_PATTERN = /^-?(0|[1-9]\d*)(\.\d*[1-9])?$/;

export class EvidenceCodecError extends Error {}

/** Strip the trailing zeros `toFixed` adds, and the point if nothing remains. */
function trimCanonical(fixed: string): string {
  if (!fixed.includes('.')) return fixed;
  const trimmed = fixed.replace(/0+$/, '').replace(/\.$/, '');
  return trimmed === '-0' ? '0' : trimmed;
}

/**
 * number -> validated canonical decimal string.
 *
 * Rejects non-finite values outright: `NaN` and `Infinity` are not quantities,
 * and persisting either would put a value in the store that no later read could
 * interpret honestly (`MISSING != 0` applied at the codec).
 */
export function encodeDecimal(value: number, scale: number = DECIMAL_DEFAULT_SCALE): string {
  if (!Number.isInteger(scale) || scale < 0 || scale > DECIMAL_MAX_SCALE) {
    throw new EvidenceCodecError(
      `scale must be an integer in 0..${DECIMAL_MAX_SCALE}, got ${scale}`
    );
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new EvidenceCodecError(`value is not a finite number: ${String(value)}`);
  }
  if (Math.abs(value) > Number.MAX_SAFE_INTEGER) {
    throw new EvidenceCodecError(`value exceeds the safe integer range: ${String(value)}`);
  }
  const encoded = trimCanonical(value.toFixed(scale));
  /* Self-check: the encoder must produce what the decoder accepts. A guard
     against a future change to trimming that silently emits "1." or "-0". */
  if (!DECIMAL_STRING_PATTERN.test(encoded)) {
    throw new EvidenceCodecError(
      `encoder produced a non-canonical string: ${JSON.stringify(encoded)}`
    );
  }
  return encoded;
}

/**
 * persisted string -> validated number.
 *
 * Three checks, in order: the canonical pattern, finiteness after parsing, and
 * an exact re-encode. The third is what makes a silently-truncated or
 * hand-edited row fail loudly instead of becoming a plausible number.
 */
export function decodeDecimal(input: string, scale: number = DECIMAL_DEFAULT_SCALE): number {
  if (typeof input !== 'string' || !DECIMAL_STRING_PATTERN.test(input)) {
    throw new EvidenceCodecError(
      `persisted value is not a canonical decimal string: ${JSON.stringify(input)}`
    );
  }
  const value = Number(input);
  if (!Number.isFinite(value)) {
    throw new EvidenceCodecError(
      `persisted value does not parse to a finite number: ${JSON.stringify(input)}`
    );
  }
  const reEncoded = encodeDecimal(value, scale);
  if (reEncoded !== input) {
    throw new EvidenceCodecError(
      `persisted value does not round-trip at scale ${scale}: ${JSON.stringify(input)} -> ${JSON.stringify(reEncoded)}`
    );
  }
  return value;
}
