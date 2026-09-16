import type { Chain, DataStamp } from './types';

/**
 * Transaction archetypes — the MODELLED step between a chain observation and a
 * user-facing network fee (M&E §1/§2, 2026-09-15).
 *
 * ## Why this module exists at all
 *
 * Measured against the live endpoints, neither required RPC method returns the
 * cost of a transaction:
 *
 * - Arbitrum `eth_feeHistory` returns `baseFeePerGas` (wei) — and its `reward`
 *   array came back all zeros, so there is no meaningful priority component to
 *   model. A fee needs GAS UNITS, which the observation does not contain.
 * - Solana `getRecentPrioritizationFees` returns a RATE (micro-lamports per
 *   compute unit), not a cost. A fee needs a SIGNATURE COUNT and a COMPUTE-UNIT
 *   budget, neither of which the observation contains.
 *
 * So the ruling's truth model is not a formality: `observed fee + modelled
 * archetype = MODELLED network-fee result`, and the result must never be
 * presented as though the RPC returned it.
 *
 * ## What this module deliberately does NOT do
 *
 * It does not supply the modelled quantities. §2 forbids introducing generic
 * gas units, a generic transaction percentage, a hidden flat fee, a diBoaS
 * pricing assumption or an arbitrary safety markup — and a plausible-looking
 * constant invented here would be exactly the first of those. The quantities
 * are therefore REQUIRED INPUTS with no defaults: absent them the fee is
 * UNAVAILABLE, never zero.
 *
 * They should be MEASURED rather than guessed. Blockscout is already approved
 * as an OBSERVED secondary for Arbitrum (§3), so the gas units for this
 * archetype can be read from real transactions of the same shape — which would
 * make that quantity observed, not modelled. Registered as the next step.
 */

/** A version is part of the identity: a methodology change creates a new one. */
export interface TransactionArchetype {
  methodologyId: string;
  methodologyVersion: number;
  network: Chain;
  /** The transaction class Practice actually simulates. */
  transactionArchetype: string;
  units: string;
  effectiveFrom: string;
  rationale: string;
  /** The quantities this archetype needs that no observation provides. */
  modelledInputs: readonly string[];
}

/** `methodologyId@version` — the string that rides on a stamp. */
export function methodologyRef(a: TransactionArchetype): string {
  return `${a.methodologyId}@${a.methodologyVersion}`;
}

export const ARBITRUM_STRATEGY_ENTRY_V1: TransactionArchetype = {
  methodologyId: 'arb-usdc-strategy-entry',
  methodologyVersion: 1,
  network: 'Arbitrum',
  transactionArchetype:
    'one USDC deposit into a lending protocol — the entry the ledger records as StrategyEntered on entryChain=Arbitrum',
  units: 'wei -> ETH -> USD -> ledger currency',
  effectiveFrom: 'PENDING_COLLECTOR_ACTIVATION',
  rationale:
    'eth_feeHistory reward measured at 0 on Arbitrum One (2026-09-15), so a tip would be invented cost; the fee is baseFeePerGas x gasUnits for this archetype. gasUnits is not in the observation.',
  modelledInputs: ['gasUnits'],
};

export const SOLANA_STRATEGY_ENTRY_V1: TransactionArchetype = {
  methodologyId: 'sol-usdc-strategy-entry',
  methodologyVersion: 1,
  network: 'Solana',
  transactionArchetype:
    'one USDC deposit into a staking/LP protocol — StrategyEntered on entryChain=Solana',
  units: 'lamports -> SOL -> USD -> ledger currency',
  effectiveFrom: 'PENDING_COLLECTOR_ACTIVATION',
  rationale:
    'getRecentPrioritizationFees returns a RATE (micro-lamports per compute unit), not a cost. Base fee is 5,000 lamports per signature (protocol constant). Signature count and compute-unit budget are not in the observation. ATA rent is NOT modelled: it is a refundable deposit, not a fee, and nothing in the corpus or the product defines it today.',
  modelledInputs: ['signatures', 'computeUnits'],
};

/** Solana's base fee per signature — a protocol constant, not an estimate. */
export const SOLANA_LAMPORTS_PER_SIGNATURE = 5000;
const LAMPORTS_PER_SOL = 1_000_000_000;
const WEI_PER_ETH = 1_000_000_000_000_000_000;
const MICRO_LAMPORTS_PER_LAMPORT = 1_000_000;

/** A raw chain observation, with its two timestamps kept apart (§5, §8.8). */
export interface GasObservation {
  chain: Chain;
  /** Arbitrum: baseFeePerGas in wei. Solana: prioritizationFee in micro-lamports/CU. */
  value: number;
  /** When the chain produced it — block time / slot time, not our fetch time. */
  observedAt: string;
  /** When we fetched it. */
  retrievedAt: string;
}

/** The modelled quantities an archetype needs. Nothing defaults. */
export interface ArchetypeInputs {
  gasUnits?: number;
  signatures?: number;
  computeUnits?: number;
}

export interface NetworkFeeDerivation {
  /** Fee in the chain's native unit (wei / lamports). */
  nativeAmount: number;
  /** Fee in USD, once the native-token price is applied. */
  usd: number;
  stamp: DataStamp;
}

/**
 * Derive a network fee from an observation, an archetype and a native-token
 * price — or `null` when any leg is missing.
 *
 * THREE independent evidence legs, each with its own source and vintage (§1/§3):
 * the fee observation, the modelled archetype, and the native-token price. A
 * missing leg makes the result unavailable; it never makes it zero.
 */
export function deriveNetworkFee(input: {
  observation: GasObservation;
  archetype: TransactionArchetype;
  inputs: ArchetypeInputs;
  /** USD price of the chain's native token — separate evidence, own vintage. */
  nativeTokenPriceUsd: number | null;
}): NetworkFeeDerivation | null {
  const { observation, archetype, inputs, nativeTokenPriceUsd } = input;
  if (observation.chain !== archetype.network) return null;
  if (nativeTokenPriceUsd === null || !Number.isFinite(nativeTokenPriceUsd)) return null;
  if (!Number.isFinite(observation.value) || observation.value < 0) return null;

  let nativeAmount: number;
  let perNative: number;

  if (archetype.network === 'Arbitrum') {
    const { gasUnits } = inputs;
    if (gasUnits === undefined || !Number.isFinite(gasUnits) || gasUnits <= 0) return null;
    nativeAmount = observation.value * gasUnits; // wei
    perNative = WEI_PER_ETH;
  } else if (archetype.network === 'Solana') {
    const { signatures, computeUnits } = inputs;
    if (signatures === undefined || !Number.isFinite(signatures) || signatures <= 0) return null;
    if (computeUnits === undefined || !Number.isFinite(computeUnits) || computeUnits <= 0) {
      return null;
    }
    const base = SOLANA_LAMPORTS_PER_SIGNATURE * signatures;
    const priority = Math.ceil((observation.value * computeUnits) / MICRO_LAMPORTS_PER_LAMPORT);
    nativeAmount = base + priority; // lamports
    perNative = LAMPORTS_PER_SOL;
  } else {
    // No archetype exists for this chain, and inventing one is the forbidden move.
    return null;
  }

  return {
    nativeAmount,
    usd: (nativeAmount / perNative) * nativeTokenPriceUsd,
    stamp: {
      source: 'fixture',
      /* MODELLED, not OBSERVED: an archetype stands between the chain reading
         and this number. Calling it observed is the misrepresentation §1
         forbids. */
      origin: 'MODELLED',
      asOf: observation.retrievedAt,
      observedAt: observation.observedAt,
      fallbackUsed: false,
      fixtureVersion: null,
      methodology: methodologyRef(archetype),
    },
  };
}

/** The archetype for a chain, or `undefined` where none is defined. */
export function archetypeFor(chain: Chain): TransactionArchetype | undefined {
  if (chain === 'Arbitrum') return ARBITRUM_STRATEGY_ENTRY_V1;
  if (chain === 'Solana') return SOLANA_STRATEGY_ENTRY_V1;
  return undefined;
}
