/**
 * src/engine/types.ts
 *
 * Core type contracts for the StayCalc precision arithmetic engine.
 */

export type Operator = '+' | '-' | '*' | '/';

export type ActionType =
  | 'DIGIT'
  | 'DECIMAL'
  | 'OPERATOR'
  | 'EQUALS'
  | 'CLEAR'
  | 'ALL_CLEAR'
  | 'BACKSPACE'
  | 'NEGATE';

export interface CalculatorAction {
  readonly type: ActionType;
  readonly digit?: string;
  readonly operator?: Operator;
}

export interface CalculatorState {
  readonly display: string;
  readonly accumulator: number | null;
  readonly pendingOperator: Operator | null;
  readonly waitingForOperand: boolean;
  readonly error: string | null;
  readonly isLocked: boolean;
}

export interface CalculationResult {
  readonly success: boolean;
  readonly value?: number;
  readonly formatted?: string;
  readonly error?: string;
}
