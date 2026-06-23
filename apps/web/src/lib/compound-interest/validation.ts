import { INPUT_BOUNDS } from './constants';
import { InvalidCalculatorInputError, type CalculatorInput } from './types';

/**
 * Shared input validation for the compound-interest calculator family
 * (forward `calculator.ts`, hedged `calculatorHedged.ts`, and path-dependent
 * retrospective `calculatorPathDependent.ts`).
 *
 * Extracted (D1 A-1) from three byte-identical local `validateInput` copies.
 * The only differences were the path-dependent variant's `years` upper bound
 * (`MAX_RETROSPECTIVE_YEARS` vs `INPUT_BOUNDS.years.max`) and its error message;
 * both are parameterised via `opts` so the three call sites stay behaviour-identical.
 */
export function validateCompoundCalculatorInput(
  input: CalculatorInput,
  opts?: { maxYears?: number; yearsMessage?: string }
): void {
  const maxYears = opts?.maxYears ?? INPUT_BOUNDS.years.max;
  const yearsMessage =
    opts?.yearsMessage ?? `must be between ${INPUT_BOUNDS.years.min} and ${INPUT_BOUNDS.years.max}`;

  if (!Number.isFinite(input.amount)) {
    throw new InvalidCalculatorInputError('amount', 'must be a finite number');
  }
  if (input.amount < INPUT_BOUNDS.amount.min || input.amount > INPUT_BOUNDS.amount.max) {
    throw new InvalidCalculatorInputError(
      'amount',
      `must be between ${INPUT_BOUNDS.amount.min} and ${INPUT_BOUNDS.amount.max}`
    );
  }
  if (!Number.isFinite(input.years) || !Number.isInteger(input.years)) {
    throw new InvalidCalculatorInputError('years', 'must be an integer');
  }
  if (input.years < INPUT_BOUNDS.years.min || input.years > maxYears) {
    throw new InvalidCalculatorInputError('years', yearsMessage);
  }
}
