/**
 * Supported arithmetic operators for CalcEngine.
 */
export type Operator = "+" | "-" | "*" | "/";

/**
 * Snapshot representation of the CalcEngine's internal register state.
 */
export interface CalcEngineState {
  /** Pending accumulator value or null if not yet initiated */
  accumulator: number | null;
  /** Active input buffer string representing the current number or error */
  currentBuffer: string;
  /** Currently pending operator waiting for next operand, or null */
  pendingOperator: Operator | null;
  /** True when the next digit/decimal entry starts a fresh operand buffer */
  isWaitingForOperand: boolean;
  /** True if engine is locked following an arithmetic error (e.g. division by zero) */
  isLocked: boolean;
  /** Explicit error message if in error state, otherwise null */
  errorMessage: string | null;
  /** Formatted string ready for display rendering */
  display: string;
  /** Stored value in the memory register */
  memory: number;
  /** True if memory register contains a non-zero value */
  hasMemory: boolean;
  /** Calculation history tape records (up to 50 entries) */
  history: CalculationRecord[];
}

/**
 * Record of a completed calculation evaluation.
 */
export interface CalculationRecord {
  operand1: number;
  operator: Operator;
  operand2: number;
  result: number;
  timestamp: number;
  /** Formatted expression string (e.g. '2 + 3 = 5') */
  expression: string;
}
