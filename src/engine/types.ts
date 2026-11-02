/**
 * Types and domain constants for StayCalc Precision Arithmetic Engine.
 */

export type StandardOperator = "+" | "-" | "*" | "/";
export type UnicodeOperator = "×" | "÷";
export type Operator = StandardOperator | UnicodeOperator;

export type MemoryAction = "memory-add" | "memory-subtract" | "memory-recall" | "memory-clear";

/**
 * Encapsulated state of the precision arithmetic engine.
 */
export interface EngineState {
  accumulator: number | null;
  currentBuffer: string;
  pendingOperator: StandardOperator | null;
  error: string | null;
  isNewInput: boolean;
  memory: number;
}

/**
 * Canonical error messages and domain limits.
 */
export const ERR_DIVISION_BY_ZERO = "Cannot divide by zero" as const;
export const ERR_INVALID_INPUT = "Invalid input" as const;
export const MAX_DISPLAY_DIGITS = 10 as const;
export const LIM_CALC_MEMORY_DEFAULT = 0 as const;

