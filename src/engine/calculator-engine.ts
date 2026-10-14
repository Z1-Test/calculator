/**
 * src/engine/calculator-engine.ts
 *
 * Deterministic precision arithmetic calculation engine adhering to:
 * - Immediate execution pocket calculator model (left-to-right evaluation: 2 + 3 * 4 = 20)
 * - Decimal precision eliminating IEEE 754 float inaccuracies (0.1 + 0.2 = 0.3, 0.7 + 0.1 = 0.8)
 * - Division by zero protection ("Cannot divide by zero") with input locking (RULE-CALC-001)
 * - Operator replacement on consecutive operator entry (5 + * 2 = 10) (RULE-CALC-008)
 * - Register management: C (buffer reset) and AC (full reset) (RULE-CALC-009)
 * - Zero dynamic code evaluation (NEVER-CALC-001)
 * - Zero external runtime dependencies
 */

import type {
  CalculatorAction,
  CalculatorState,
  CalculationResult,
  CalculationHistoryEntry,
  Operator,
} from './types.ts';

export const MAX_DISPLAY_DIGITS = 10;
export const DIVISION_BY_ZERO_ERROR = 'Cannot divide by zero';

let historyCounter = 0;
export function generateHistoryId(): string {
  historyCounter += 1;
  return `hist_${Date.now()}_${historyCounter}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Formats a numeric value or numeric string using precision normalization.
 */
export function formatNumber(val: number | string | null | undefined): string {
  if (val === null || val === undefined) return '0';
  const num = typeof val === 'number' ? val : parseFloat(val);
  return normalizePrecision(num);
}

/**
 * Normalizes a numeric value to eliminate IEEE 754 floating-point artifacts
 * while adhering to the maximum 10-digit display boundary.
 */
export function normalizePrecision(n: number, maxDigits: number = MAX_DISPLAY_DIGITS): string {
  if (Object.is(n, -0) || (n === 0 && Object.is(1 / n, -Infinity))) {
    return '0';
  }
  if (!Number.isFinite(n)) {
    return String(n);
  }

  // Pre-clean representation noise via 12-digit significant precision
  const clean = parseFloat(n.toPrecision(12));
  if (Object.is(clean, -0) || clean === 0) {
    return '0';
  }

  const rawStr = clean.toString();
  if (rawStr.includes('e') || rawStr.includes('E')) {
    return clean.toPrecision(maxDigits);
  }

  const isNegative = clean < 0;
  const parts = rawStr.split('.');
  const intPart = isNegative ? parts[0].slice(1) : parts[0];

  if (intPart.length > maxDigits) {
    return clean.toPrecision(maxDigits);
  }

  if (parts.length === 2) {
    const availableDecimals = Math.max(0, maxDigits - intPart.length);
    if (availableDecimals === 0) {
      return Math.round(clean).toString();
    }
    const rounded = parseFloat(clean.toFixed(availableDecimals));
    return rounded.toString();
  }

  return rawStr;
}

/**
 * Pure evaluation function for basic binary arithmetic operations.
 * Strictly avoids dynamic evaluation (NEVER-CALC-001).
 */
export function evaluateBinary(a: number, op: Operator, b: number): CalculationResult {
  if (op === '/' && b === 0) {
    return {
      success: false,
      error: DIVISION_BY_ZERO_ERROR,
    };
  }

  let result: number;
  switch (op) {
    case '+':
      result = a + b;
      break;
    case '-':
      result = a - b;
      break;
    case '*':
      result = a * b;
      break;
    case '/':
      result = a / b;
      break;
    default:
      return {
        success: false,
        error: `Unknown operator: ${op}`,
      };
  }

  const formatted = normalizePrecision(result);
  return {
    success: true,
    value: parseFloat(formatted),
    formatted,
  };
}

/**
 * Creates the initial, clean state for the calculator engine.
 */
export function createInitialState(): CalculatorState {
  return {
    display: '0',
    accumulator: null,
    pendingOperator: null,
    waitingForOperand: false,
    error: null,
    isLocked: false,
    memory: 0,
    hasActiveMemory: false,
    history: [],
  };
}

/**
 * Pure reducer function for calculator state transitions.
 */
export function calculatorReducer(
  state: CalculatorState,
  action: CalculatorAction
): CalculatorState {
  // If engine is locked due to error, only CLEAR or ALL_CLEAR can unlock it (RULE-CALC-001)
  if (state.isLocked) {
    if (action.type === 'CLEAR') {
      return {
        ...createInitialState(),
        memory: state.memory,
        hasActiveMemory: state.hasActiveMemory,
        history: state.history,
      };
    }
    if (action.type === 'ALL_CLEAR') {
      return {
        ...createInitialState(),
        history: state.history,
      };
    }
    if (action.type === 'CLEAR_HISTORY') {
      return {
        ...state,
        history: [],
      };
    }
    return state;
  }

  switch (action.type) {
    case 'DIGIT': {
      const digit = action.digit ?? '';
      if (!/^[0-9]$/.test(digit)) {
        return state;
      }

      if (state.waitingForOperand) {
        return {
          ...state,
          display: digit,
          waitingForOperand: false,
        };
      }

      if (state.display === '0') {
        return {
          ...state,
          display: digit,
        };
      }

      if (state.display === '-0') {
        return {
          ...state,
          display: `-${digit}`,
        };
      }

      // Check display digit capacity (exclude sign and decimal point)
      const digitsOnly = state.display.replace(/[^0-9]/g, '');
      if (digitsOnly.length >= MAX_DISPLAY_DIGITS) {
        return state;
      }

      return {
        ...state,
        display: `${state.display}${digit}`,
      };
    }

    case 'DECIMAL': {
      if (state.waitingForOperand) {
        return {
          ...state,
          display: '0.',
          waitingForOperand: false,
        };
      }

      if (state.display.includes('.')) {
        return state;
      }

      return {
        ...state,
        display: `${state.display}.`,
      };
    }

    case 'OPERATOR': {
      const op = action.operator;
      if (!op || !['+', '-', '*', '/'].includes(op)) {
        return state;
      }

      // Operator replacement invariant (RULE-CALC-008):
      // If waiting for operand and an operator is already pending, replace it
      if (state.waitingForOperand && state.pendingOperator !== null) {
        return {
          ...state,
          pendingOperator: op,
        };
      }

      const currentVal = parseFloat(state.display);

      // Immediate execution model (RULE-CALC-007):
      // If there is an existing accumulator and pending operator, evaluate now
      if (state.pendingOperator !== null && state.accumulator !== null && !state.waitingForOperand) {
        const res = evaluateBinary(state.accumulator, state.pendingOperator, currentVal);
        if (!res.success) {
          return {
            ...state,
            display: res.error || DIVISION_BY_ZERO_ERROR,
            accumulator: null,
            pendingOperator: null,
            waitingForOperand: true,
            error: res.error || DIVISION_BY_ZERO_ERROR,
            isLocked: true,
          };
        }

        return {
          ...state,
          display: res.formatted!,
          accumulator: res.value!,
          pendingOperator: op,
          waitingForOperand: true,
          error: null,
          isLocked: false,
        };
      }

      // Otherwise register first operand
      return {
        ...state,
        accumulator: currentVal,
        pendingOperator: op,
        waitingForOperand: true,
      };
    }

    case 'EQUALS': {
      if (state.pendingOperator !== null && state.accumulator !== null) {
        const currentVal = parseFloat(state.display);
        const res = evaluateBinary(state.accumulator, state.pendingOperator, currentVal);
        if (!res.success) {
          return {
            ...state,
            display: res.error || DIVISION_BY_ZERO_ERROR,
            accumulator: null,
            pendingOperator: null,
            waitingForOperand: true,
            error: res.error || DIVISION_BY_ZERO_ERROR,
            isLocked: true,
          };
        }

        const newEntry: CalculationHistoryEntry = {
          id: generateHistoryId(),
          expression: `${formatNumber(state.accumulator)} ${state.pendingOperator} ${formatNumber(currentVal)}`,
          result: formatNumber(res.value),
          timestamp: Date.now(),
        };

        const updatedHistory = [newEntry, ...state.history].slice(0, 100);

        return {
          ...state,
          display: res.formatted!,
          accumulator: res.value!,
          pendingOperator: null,
          waitingForOperand: true,
          error: null,
          isLocked: false,
          history: updatedHistory,
        };
      }

      // Idempotent repeated equals or equals without pending operator
      return {
        ...state,
        waitingForOperand: true,
      };
    }

    case 'CLEAR': {
      // Clear (C) resets active input buffer to "0" without flushing accumulator (RULE-CALC-009)
      return {
        ...state,
        display: '0',
        waitingForOperand: false,
      };
    }

    case 'ALL_CLEAR': {
      // All Clear (AC) completely resets accumulator, pending operator, and buffer (RULE-CALC-009)
      // History is preserved until explicitly cleared (RULE-CALC-008)
      return {
        ...createInitialState(),
        history: state.history,
      };
    }

    case 'BACKSPACE': {
      if (state.waitingForOperand) {
        return state;
      }

      if (state.display.length > 1) {
        const sliced = state.display.slice(0, -1);
        return {
          ...state,
          display: sliced === '' || sliced === '-' ? '0' : sliced,
        };
      }

      return {
        ...state,
        display: '0',
      };
    }

    case 'NEGATE': {
      const val = parseFloat(state.display);
      if (val === 0 && !state.display.includes('.')) {
        return state;
      }

      if (state.display.startsWith('-')) {
        return {
          ...state,
          display: state.display.slice(1),
        };
      }

      return {
        ...state,
        display: `-${state.display}`,
      };
    }

    case 'MEMORY_ADD': {
      const currentVal = parseFloat(state.display);
      if (isNaN(currentVal)) {
        return state;
      }
      const normalizedStr = normalizePrecision(state.memory + currentVal);
      const newMemory = parseFloat(normalizedStr);
      const cleanMemory = Object.is(newMemory, -0) || newMemory === 0 ? 0 : newMemory;
      return {
        ...state,
        memory: cleanMemory,
        hasActiveMemory: cleanMemory !== 0,
        waitingForOperand: true,
      };
    }

    case 'MEMORY_SUBTRACT': {
      const currentVal = parseFloat(state.display);
      if (isNaN(currentVal)) {
        return state;
      }
      const normalizedStr = normalizePrecision(state.memory - currentVal);
      const newMemory = parseFloat(normalizedStr);
      const cleanMemory = Object.is(newMemory, -0) || newMemory === 0 ? 0 : newMemory;
      return {
        ...state,
        memory: cleanMemory,
        hasActiveMemory: cleanMemory !== 0,
        waitingForOperand: true,
      };
    }

    case 'MEMORY_RECALL': {
      const formatted = normalizePrecision(state.memory);
      return {
        ...state,
        display: formatted,
        waitingForOperand: true,
      };
    }

    case 'MEMORY_CLEAR': {
      return {
        ...state,
        memory: 0,
        hasActiveMemory: false,
      };
    }

    case 'CLEAR_HISTORY': {
      return {
        ...state,
        history: [],
      };
    }

    case 'LOAD_HISTORY_ENTRY': {
      const target = action.entry ?? action.entryId;
      let resultVal: string | undefined;

      if (typeof target === 'object' && target !== null && 'result' in target) {
        resultVal = target.result;
      } else if (typeof target === 'string') {
        const found = state.history.find((e) => e.id === target);
        if (found) {
          resultVal = found.result;
        } else {
          resultVal = target;
        }
      }

      if (resultVal !== undefined) {
        return {
          ...state,
          display: resultVal,
          waitingForOperand: true,
          error: null,
          isLocked: false,
        };
      }

      return state;
    }

    default:
      return state;
  }
}

/**
 * CalculatorEngine encapsulates stateful operations for easy consumer and UI integration.
 */
export class CalculatorEngine {
  private state: CalculatorState;

  constructor(initialState?: Partial<CalculatorState>) {
    this.state = {
      ...createInitialState(),
      ...initialState,
    };
  }

  public getState(): CalculatorState {
    return this.state;
  }

  public dispatch(action: CalculatorAction): CalculatorState {
    this.state = calculatorReducer(this.state, action);
    return this.state;
  }

  public pressDigit(digit: string): CalculatorState {
    return this.dispatch({ type: 'DIGIT', digit });
  }

  public pressDecimal(): CalculatorState {
    return this.dispatch({ type: 'DECIMAL' });
  }

  public pressOperator(operator: Operator): CalculatorState {
    return this.dispatch({ type: 'OPERATOR', operator });
  }

  public pressEquals(): CalculatorState {
    return this.dispatch({ type: 'EQUALS' });
  }

  public pressClear(): CalculatorState {
    return this.dispatch({ type: 'CLEAR' });
  }

  public pressAllClear(): CalculatorState {
    return this.dispatch({ type: 'ALL_CLEAR' });
  }

  public pressBackspace(): CalculatorState {
    return this.dispatch({ type: 'BACKSPACE' });
  }

  public pressToggleSign(): CalculatorState {
    return this.dispatch({ type: 'NEGATE' });
  }

  public pressMemoryAdd(): CalculatorState {
    return this.dispatch({ type: 'MEMORY_ADD' });
  }

  public pressMemorySubtract(): CalculatorState {
    return this.dispatch({ type: 'MEMORY_SUBTRACT' });
  }

  public pressMemoryRecall(): CalculatorState {
    return this.dispatch({ type: 'MEMORY_RECALL' });
  }

  public pressMemoryClear(): CalculatorState {
    return this.dispatch({ type: 'MEMORY_CLEAR' });
  }

  public getHistory(): readonly CalculationHistoryEntry[] {
    return this.state.history;
  }

  public clearHistory(): CalculatorState {
    return this.dispatch({ type: 'CLEAR_HISTORY' });
  }

  public loadHistoryEntry(entryOrId: CalculationHistoryEntry | string): CalculatorState {
    if (typeof entryOrId === 'string') {
      return this.dispatch({ type: 'LOAD_HISTORY_ENTRY', entryId: entryOrId, entry: entryOrId });
    }
    return this.dispatch({ type: 'LOAD_HISTORY_ENTRY', entry: entryOrId });
  }

  /**
   * Helper to execute a sequence of keys sequentially for rapid execution and testing.
   */
  public executeSequence(sequence: string): CalculatorState {
    for (const char of sequence) {
      if (/[0-9]/.test(char)) {
        this.pressDigit(char);
      } else if (char === '.') {
        this.pressDecimal();
      } else if (['+', '-', '*', '/'].includes(char)) {
        this.pressOperator(char as Operator);
      } else if (char === '=' || char === '\n') {
        this.pressEquals();
      } else if (char === 'C' || char === 'c') {
        this.pressClear();
      }
    }
    return this.state;
  }
}
