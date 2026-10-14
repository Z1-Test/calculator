/**
 * src/engine/types.ts
 *
 * Core type contracts for the StayCalc precision arithmetic engine.
 */

export type Operator =
  | '+'
  | '-'
  | '*'
  | '/'
  | '^'
  | 'AND'
  | 'OR'
  | 'XOR'
  | 'LSH'
  | 'RSH'
  | '&'
  | '|'
  | '<<'
  | '>>';

export type AngleUnit = 'DEG' | 'RAD';
export type CalculatorMode = 'standard' | 'scientific' | 'programmer';
export type Radix = 'HEX' | 'DEC' | 'OCT' | 'BIN';
export type CalculatorTheme = 'dark' | 'light' | 'high-contrast';

export interface MultiRadixValues {
  readonly hex: string;
  readonly dec: string;
  readonly oct: string;
  readonly bin: string;
}

export interface CalculationHistoryEntry {
  readonly id: string;
  readonly expression: string;
  readonly result: string;
  readonly timestamp: number;
  readonly radix?: MultiRadixValues;
}

export type HistoryExportFormat = 'text' | 'csv';

export interface HistoryExportResult {
  readonly format: HistoryExportFormat;
  readonly content: string;
  readonly count: number;
  readonly total: number;
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
  | 'TOGGLE_MODE'
  | 'SET_MODE'
  | 'CYCLE_MODE'
  | 'SET_RADIX'
  | 'BITWISE_NOT'
  | 'INPUT_HEX_DIGIT'
  | 'SET_THEME'
  | 'CYCLE_THEME'
  | 'LOAD_BUFFER';

export interface LoadBufferAction {
  readonly type: 'LOAD_BUFFER';
  readonly value: string;
}

export interface CalculatorAction {
  readonly type: ActionType;
  readonly digit?: string;
  readonly hexDigit?: string;
  readonly operator?: Operator;
  readonly entry?: CalculationHistoryEntry | string;
  readonly entryId?: string;
  readonly constant?: 'pi' | 'e';
  readonly mode?: CalculatorMode;
  readonly radix?: Radix;
  readonly theme?: CalculatorTheme;
  readonly value?: string;
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
  readonly radix: Radix;
  readonly multiRadix: MultiRadixValues;
  readonly theme: CalculatorTheme;
}

export interface CalculationResult {
  readonly success: boolean;
  readonly value?: number;
  readonly formatted?: string;
  readonly error?: string;
}

export type UnitCategory = 'length' | 'mass' | 'temperature';
export type LengthUnit = 'cm' | 'm' | 'km' | 'in' | 'ft';
export type MassUnit = 'g' | 'kg' | 'oz' | 'lb';
export type TemperatureUnit = 'C' | 'F' | 'K';
export type ConversionUnit = LengthUnit | MassUnit | TemperatureUnit;

export interface ConversionResult {
  readonly value: number;
  readonly formatted: string;
  readonly error?: string;
}
