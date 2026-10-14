/**
 * src/engine/types.ts
 *
 * Core type contracts for the StayCalc precision arithmetic engine.
 */

export type Operator = '+' | '-' | '*' | '/' | '^';

export type AngleUnit = 'DEG' | 'RAD';
export type CalculatorMode = 'standard' | 'scientific';

export interface CalculationHistoryEntry {
  readonly id: string;
  readonly expression: string;
  readonly result: string;
  readonly timestamp: number;
}

export type ActionType =
  | 'DIGIT'
  | 'DECIMAL'
  | 'OPERATOR'
  | 'EQUALS'
  | 'CLEAR'
  | 'ALL_CLEAR'
  | 'BACKSPACE'
  | 'NEGATE'
  | 'MEMORY_ADD'
  | 'MEMORY_SUBTRACT'
  | 'MEMORY_RECALL'
  | 'MEMORY_CLEAR'
  | 'CLEAR_HISTORY'
  | 'LOAD_HISTORY_ENTRY'
  | 'SQUARE_ROOT'
  | 'SQUARE'
  | 'SIN'
  | 'COS'
  | 'TAN'
  | 'LOAD_CONSTANT'
  | 'TOGGLE_ANGLE_UNIT'
  | 'TOGGLE_MODE';

export interface CalculatorAction {
  readonly type: ActionType;
  readonly digit?: string;
  readonly operator?: Operator;
  readonly entry?: CalculationHistoryEntry | string;
  readonly entryId?: string;
  readonly constant?: 'pi' | 'e';
}

export interface CalculatorState {
  readonly display: string;
  readonly accumulator: number | null;
  readonly pendingOperator: Operator | null;
  readonly waitingForOperand: boolean;
  readonly error: string | null;
  readonly isLocked: boolean;
  readonly memory: number;
  readonly hasActiveMemory: boolean;
  readonly history: readonly CalculationHistoryEntry[];
  readonly mode: CalculatorMode;
  readonly angleUnit: AngleUnit;
}

export interface CalculationResult {
  readonly success: boolean;
  readonly value?: number;
  readonly formatted?: string;
  readonly error?: string;
}
