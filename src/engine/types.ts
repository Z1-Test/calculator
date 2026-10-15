/**
 * Supported arithmetic and bitwise operators for CalcEngine.
 */
export type Operator =
  | "+"
  | "-"
  | "*"
  | "/"
  | "^"
  | "&"
  | "|"
  | "XOR"
  | "NOT"
  | "LSH"
  | "RSH"
  | "<<"
  | ">>";

/**
 * Supported radix numeral bases for Programmer Mode.
 */
export type RadixBase = "HEX" | "DEC" | "OCT" | "BIN";

/**
 * Supported bit-width word sizes for Programmer Mode.
 */
export type WordSize = 8 | 16 | 32 | 64;

/**
 * Real-time formatted string representations across all 4 radix bases.
 */
export interface MultiRadixState {
  hex: string;
  dec: string;
  oct: string;
  bin: string;
}

/**
 * Angle measurement mode for trigonometric operations.
 */
export type AngleMode = "DEG" | "RAD";

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
  /** Active angle mode for trigonometric calculations (DEG or RAD) */
  angleMode: AngleMode;
  /** Active radix base in Programmer Mode (HEX, DEC, OCT, BIN) */
  radix: RadixBase;
  /** Active word size bit width in Programmer Mode (8, 16, 32, 64) */
  wordSize: WordSize;
  /** Live formatted representations across all 4 radix bases */
  multiRadix: MultiRadixState;
  /** True if Programmer Mode is currently active */
  isProgrammerMode: boolean;
  /** Live formula expression string (e.g. '2 * (3 + 4)') */
  expression: string;
  /** Current nesting depth of unclosed parentheses */
  parenDepth: number;
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

/**
 * Supported file formats for calculation history tape export.
 */
export type ExportTapeFormat = "csv" | "txt";

/**
 * Options configuring calculation history tape serialization.
 */
export interface ExportTapeOptions {
  /** Column delimiter for CSV export (defaults to comma ',') */
  delimiter?: string;
  /** Whether to output the initial header row (defaults to true) */
  includeHeader?: boolean;
}
