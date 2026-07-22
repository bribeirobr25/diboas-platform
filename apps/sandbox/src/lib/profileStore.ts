/**
 * Profile store — the user's illustrative context (net monthly income), kept
 * SEPARATE from the play-money ledger on purpose:
 *   - it is not a money movement, so it must never enter the ledger or its
 *     reconciliation invariant (plan F-A3);
 *   - income is more sensitive than a play balance, so it stays client-side
 *     (LocalStorage) and is NEVER transmitted to any provider/analytics/Sentry
 *     (plan F-A6). MVP-0 has no accounts and no PII surface (D-10 / SANDBOX_RULES).
 *
 * Same tiny external-store shape as the ledger client (useSyncExternalStore).
 */

const STORAGE_KEY = 'diboas-sandbox-profile';

export interface SandboxProfile {
  /** Net monthly take-home in the market's local currency; null = not provided. */
  netMonthlyIncome: number | null;
  /** Real monthly fixed costs (essentials); null = use the market-share default (4.3 recompute). */
  essentials: number | null;
}

const EMPTY: SandboxProfile = { netMonthlyIncome: null, essentials: null };

let cached: SandboxProfile | null = null;
const listeners = new Set<() => void>();

function read(): SandboxProfile {
  if (typeof window === 'undefined') return EMPTY;
  if (cached) return cached;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<SandboxProfile>) : null;
    const income = parsed?.netMonthlyIncome;
    const essentials = parsed?.essentials;
    cached = {
      netMonthlyIncome:
        typeof income === 'number' && Number.isFinite(income) && income > 0 ? income : null,
      essentials:
        typeof essentials === 'number' && Number.isFinite(essentials) && essentials >= 0
          ? essentials
          : null,
    };
  } catch {
    cached = EMPTY;
  }
  return cached;
}

function emit(next: SandboxProfile): void {
  cached = next;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage full / disabled — the in-memory cache still drives the session */
    }
  }
  for (const listener of listeners) listener();
}

export function subscribeProfile(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Client snapshot (stable reference between changes — safe for useSyncExternalStore). */
export function getProfile(): SandboxProfile {
  return read();
}

/** Server snapshot — always empty (income lives only in the browser). */
export function getServerProfile(): SandboxProfile {
  return EMPTY;
}

export function setNetMonthlyIncome(income: number): void {
  if (!(Number.isFinite(income) && income > 0)) return;
  emit({ ...read(), netMonthlyIncome: Math.round(income) });
}

/** Set (or clear, with null) the real fixed-costs override — the 4.3 recompute. */
export function setEssentials(essentials: number | null): void {
  if (essentials != null && !(Number.isFinite(essentials) && essentials >= 0)) return;
  emit({ ...read(), essentials: essentials == null ? null : Math.round(essentials) });
}

export function resetProfile(): void {
  cached = null;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
  for (const listener of listeners) listener();
}
