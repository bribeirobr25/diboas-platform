/**
 * InteractiveDemo Constants
 *
 * Configuration values for the interactive demo
 */

// Amount options by region - 3 options for simplicity
export const AMOUNT_OPTIONS = {
  DEFAULT: [5, 50, 100],    // USD/EUR
  BRAZIL: [10, 50, 100],    // BRL (higher minimum due to currency value)
};

// APY rate for calculations (diBoaS rate)
export const APY_RATE = 0.08;

// Initial balance for Screen 1 (base amount in EUR/USD)
export const INITIAL_BALANCE = 247.52;

// Bank rates by region (annual)
export const BANK_RATES = {
  // US/EU: Traditional savings ~0.4%
  DEFAULT: {
    bankPaysRate: 0.004,    // What bank pays you (0.4%)
    bankEarnsRate: 0.07,    // What bank earns with your money (7%)
  },
  // Brazil: Poupança pays more but currency depreciates
  BRAZIL: {
    bankPaysRate: 0.07,     // Poupança rate (~7%)
    bankEarnsRate: 0.15,    // Banks earn more in Brazil (~15% CDI)
    currencyDepreciation: 0.06, // BRL loses ~6% vs USD annually
  },
};

// Calculate derived values (for backwards compatibility)
export const INITIAL_INTEREST = INITIAL_BALANCE * BANK_RATES.DEFAULT.bankPaysRate;

// Animation timing (ms) for reward screen progressive reveal
export const REWARD_ANIMATION_TIMINGS = [800, 1600, 2400];

// Growth amounts for reward animation
export const GROWTH_STEPS = [0.03, 0.07, 0.12];
