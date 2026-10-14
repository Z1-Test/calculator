/**
 * src/engine/calculator-engine.ts
 *
 * Deterministic precision arithmetic calculation engine adhering to:
 * - Immediate execution pocket calculator model (left-to-right evaluation: 2 + 3 * 4 = 20)
 * - Decimal precision eliminating IEEE 754 float inaccuracies (0.1 + 0.2 = 0.3, 0.7 + 0.1 = 0.8)
 * - Division by zero protection ("Cannot divide by zero") with input locking (RULE-CALC-001)
 * - Operator replacement on consecutive operator entry (5 + * 2 = 10, 2 + ^ 3 = 8) (RULE-CALC-008)
 * - Register management: C (buffer reset) and AC (full reset) (RULE-CALC-009)
 * - Trigonometric angle unit mode (DEG/RAD) with exact cardinal precision (RULE-CALC-003)
 * - 32-bit signed integer bitwise operations and multi-base conversions (HEX, DEC, OCT, BIN) (RULE-CALC-004)
 * - Memory and state persistence across mode toggles (RULE-CALC-006)
 * - Zero dynamic code evaluation (NEVER-CALC-001)
 * - Zero external runtime dependencies
 */

import type {
  CalculatorAction,
  CalculatorState,
  CalculationResult,
  CalculationHistoryEntry,
  HistoryExportFormat,
  HistoryExportResult,
  Operator,
  CalculatorMode,
  AngleUnit,
  Radix,
  MultiRadixValues,
  CalculatorTheme,
} from './types.ts';

export const MAX_DISPLAY_DIGITS = 10;
export const DIVISION_BY_ZERO_ERROR = 'Cannot divide by zero';
export const INVALID_INPUT_ERROR = 'Invalid input';

let historyCounter = 0;
export function generateHistoryId(): string {
  historyCounter += 1;
  return `hist_${Date.now()}_${historyCounter}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Computes multi-radix representations for a 32-bit signed integer.
 */
export function computeMultiRadix(val: number): MultiRadixValues {
  const int32 = val | 0;
  return {
    hex: (int32 >>> 0).toString(16).toUpperCase(),
    dec: int32.toString(10),
    oct: (int32 >>> 0).toString(8),
    bin: (int32 >>> 0).toString(2),
  };
}

/**
 * Formats a 32-bit signed integer to a specific radix string representation.
 */
export function formatRadixValue(val: number, radix: Radix): string {
  const int32 = val | 0;
  switch (radix) {
    case 'HEX':
      return (int32 >>> 0).toString(16).toUpperCase();
    case 'DEC':
      return int32.toString(10);
    case 'OCT':
      return (int32 >>> 0).toString(8);
    case 'BIN':
      return (int32 >>> 0).toString(2);
  }
}

/**
 * Parses a display string into a 32-bit signed integer according to active radix.
 */
export function parseDisplayToInteger(display: string, radix: Radix): number {
  if (!display || display === '0' || display === '-0') return 0;
  let parsed: number;
  switch (radix) {
    case 'HEX':
      parsed = parseInt(display, 16);
      break;
    case 'OCT':
      parsed = parseInt(display, 8);
      break;
    case 'BIN':
      parsed = parseInt(display, 2);
      break;
    case 'DEC':
    default:
      parsed = parseInt(display, 10);
      break;
  }
  return Number.isNaN(parsed) ? 0 : (parsed | 0);
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
 * Formats calculation history tape into plain text audit format.
 */
export function exportHistoryToText(history: readonly CalculationHistoryEntry[]): string {
  const total = history.reduce((acc, entry) => {
    const val = parseFloat(entry.result);
    return acc + (Number.isFinite(val) ? val : 0);
  }, 0);

  const lines: string[] = ['--- StayCalc Calculation History ---'];
  history.forEach((entry, index) => {
    const iso = new Date(entry.timestamp).toISOString();
    lines.push(`[${index + 1}] ${entry.expression} = ${entry.result} (${iso})`);
  });
  lines.push(`Total calculations: ${history.length} | Summary total: ${formatNumber(total)}`);
  return lines.join('\n');
}

/**
 * Formats calculation history tape into RFC-compliant CSV format.
 */
export function exportHistoryToCsv(history: readonly CalculationHistoryEntry[]): string {
  const lines: string[] = ['"Index","Expression","Result","Timestamp","ISO"'];
  history.forEach((entry, index) => {
    const iso = new Date(entry.timestamp).toISOString();
    lines.push(`${index + 1},"${entry.expression}","${entry.result}",${entry.timestamp},"${iso}"`);
  });
  return lines.join('\n');
}


/**
 * Pure evaluation function for basic binary arithmetic and bitwise operations.
 * Strictly avoids dynamic evaluation (NEVER-CALC-001).
 */
export function evaluateBinary(
  a: number,
  op: Operator,
  b: number,
  mode: CalculatorMode = 'standard',
  radix: Radix = 'DEC'
): CalculationResult {
  if (mode === 'programmer') {
    const intA = a | 0;
    const intB = b | 0;
    let res: number;
    switch (op) {
      case '+':
        res = (intA + intB) | 0;
        break;
      case '-':
        res = (intA - intB) | 0;
        break;
      case '*':
        res = Math.imul(intA, intB);
        break;
      case '/':
        if (intB === 0) {
          return { success: false, error: DIVISION_BY_ZERO_ERROR };
        }
        res = (intA / intB) | 0;
        break;
      case 'AND':
      case '&':
        res = (intA & intB) | 0;
        break;
      case 'OR':
      case '|':
        res = (intA | intB) | 0;
        break;
      case 'XOR':
      case '^':
        res = (intA ^ intB) | 0;
        break;
      case 'LSH':
      case '<<':
        res = (intA << intB) | 0;
        break;
      case 'RSH':
      case '>>':
        res = (intA >> intB) | 0;
        break;
      default:
        return { success: false, error: `Unknown operator: ${op}` };
    }
    const formatted = formatRadixValue(res, radix);
    return {
      success: true,
      value: res,
      formatted,
    };
  }

  // Standard and Scientific modes
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
    case '^': {
      if (a === 0 && b < 0) {
        return {
          success: false,
          error: DIVISION_BY_ZERO_ERROR,
        };
      }
      result = Math.pow(a, b);
      if (!Number.isFinite(result) || Number.isNaN(result)) {
        return {
          success: false,
          error: INVALID_INPUT_ERROR,
        };
      }
      break;
    }
    case 'AND':
    case '&':
      result = (a | 0) & (b | 0);
      break;
    case 'OR':
    case '|':
      result = (a | 0) | (b | 0);
      break;
    case 'XOR':
      result = (a | 0) ^ (b | 0);
      break;
    case 'LSH':
    case '<<':
      result = (a | 0) << (b | 0);
      break;
    case 'RSH':
    case '>>':
      result = (a | 0) >> (b | 0);
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
 * Evaluates trigonometric functions respecting active AngleUnit (DEG or RAD)
 * and cardinal angle precision boundaries.
 */
export function evaluateTrig(
  func: 'sin' | 'cos' | 'tan',
  value: number,
  angleUnit: AngleUnit
): CalculationResult {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return { success: false, error: INVALID_INPUT_ERROR };
  }

  if (angleUnit === 'DEG') {
    // Normalize degree to [0, 360) for cardinal angle checks
    const normalizedDeg = ((value % 360) + 360) % 360;

    if (func === 'sin') {
      if (normalizedDeg === 0 || normalizedDeg === 180) {
        return { success: true, value: 0, formatted: '0' };
      }
      if (normalizedDeg === 90) {
        return { success: true, value: 1, formatted: '1' };
      }
      if (normalizedDeg === 270) {
        return { success: true, value: -1, formatted: '-1' };
      }
      if (normalizedDeg === 30 || normalizedDeg === 150) {
        return { success: true, value: 0.5, formatted: '0.5' };
      }
      if (normalizedDeg === 210 || normalizedDeg === 330) {
        return { success: true, value: -0.5, formatted: '-0.5' };
      }
    } else if (func === 'cos') {
      if (normalizedDeg === 90 || normalizedDeg === 270) {
        return { success: true, value: 0, formatted: '0' };
      }
      if (normalizedDeg === 0) {
        return { success: true, value: 1, formatted: '1' };
      }
      if (normalizedDeg === 180) {
        return { success: true, value: -1, formatted: '-1' };
      }
      if (normalizedDeg === 60 || normalizedDeg === 300) {
        return { success: true, value: 0.5, formatted: '0.5' };
      }
      if (normalizedDeg === 120 || normalizedDeg === 240) {
        return { success: true, value: -0.5, formatted: '-0.5' };
      }
    } else if (func === 'tan') {
      if (normalizedDeg === 90 || normalizedDeg === 270) {
        return { success: false, error: INVALID_INPUT_ERROR };
      }
      if (normalizedDeg === 0 || normalizedDeg === 180) {
        return { success: true, value: 0, formatted: '0' };
      }
      if (normalizedDeg === 45 || normalizedDeg === 225) {
        return { success: true, value: 1, formatted: '1' };
      }
      if (normalizedDeg === 135 || normalizedDeg === 315) {
        return { success: true, value: -1, formatted: '-1' };
      }
    }

    const rad = (value * Math.PI) / 180;
    let res: number;
    if (func === 'sin') res = Math.sin(rad);
    else if (func === 'cos') res = Math.cos(rad);
    else res = Math.tan(rad);

    if (Math.abs(res) < 1e-15) res = 0;
    if (!Number.isFinite(res) || Number.isNaN(res)) {
      return { success: false, error: INVALID_INPUT_ERROR };
    }
    const formatted = normalizePrecision(res);
    return { success: true, value: parseFloat(formatted), formatted };
  } else {
    // RAD mode
    let res: number;
    if (func === 'sin') {
      res = Math.sin(value);
    } else if (func === 'cos') {
      res = Math.cos(value);
    } else {
      const cosVal = Math.cos(value);
      if (Math.abs(cosVal) < 1e-15) {
        return { success: false, error: INVALID_INPUT_ERROR };
      }
      res = Math.tan(value);
    }

    if (Math.abs(res) < 1e-15) res = 0;
    if (!Number.isFinite(res) || Number.isNaN(res)) {
      return { success: false, error: INVALID_INPUT_ERROR };
    }
    const formatted = normalizePrecision(res);
    return { success: true, value: parseFloat(formatted), formatted };
  }
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
    mode: 'standard',
    angleUnit: 'DEG',
    radix: 'HEX',
    multiRadix: {
      hex: '0',
      dec: '0',
      oct: '0',
      bin: '0',
    },
    theme: 'dark',
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
  // Theme changes are preserved without unlocking or altering error state (NEVER-CALC-002)
  if (state.isLocked) {
    if (action.type === 'SET_THEME') {
      return {
        ...state,
        theme: action.theme ?? 'dark',
      };
    }
    if (action.type === 'CYCLE_THEME') {
      let nextTheme: CalculatorTheme;
      if (state.theme === 'dark') nextTheme = 'light';
      else if (state.theme === 'light') nextTheme = 'high-contrast';
      else nextTheme = 'dark';
      return {
        ...state,
        theme: nextTheme,
      };
    }
    if (action.type === 'CLEAR') {
      return {
        ...createInitialState(),
        theme: state.theme,
        memory: state.memory,
        hasActiveMemory: state.hasActiveMemory,
        history: state.history,
        mode: state.mode,
        angleUnit: state.angleUnit,
        radix: state.radix,
        multiRadix: computeMultiRadix(0),
      };
    }
    if (action.type === 'ALL_CLEAR') {
      return {
        ...createInitialState(),
        theme: state.theme,
        history: state.history,
        mode: state.mode,
        angleUnit: state.angleUnit,
        radix: state.radix,
        multiRadix: computeMultiRadix(0),
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
    case 'DIGIT':
    case 'INPUT_HEX_DIGIT': {
      const rawDigit = (action.digit ?? action.hexDigit ?? '').toUpperCase();
      if (!rawDigit) return state;

      // In programmer mode, enforce dynamic radix gating on digits
      if (state.mode === 'programmer') {
        let isAllowed = false;
        switch (state.radix) {
          case 'BIN':
            isAllowed = /^[01]$/.test(rawDigit);
            break;
          case 'OCT':
            isAllowed = /^[0-7]$/.test(rawDigit);
            break;
          case 'DEC':
            isAllowed = /^[0-9]$/.test(rawDigit);
            break;
          case 'HEX':
            isAllowed = /^[0-9A-F]$/.test(rawDigit);
            break;
        }

        if (!isAllowed) {
          return state;
        }

        if (state.waitingForOperand || state.display === '0') {
          const intVal = parseDisplayToInteger(rawDigit, state.radix);
          return {
            ...state,
            display: rawDigit,
            multiRadix: computeMultiRadix(intVal),
            waitingForOperand: false,
          };
        }

        // Limit maximum digits per radix in 32-bit integer mode
        let maxLen = 8;
        if (state.radix === 'BIN') maxLen = 32;
        else if (state.radix === 'OCT') maxLen = 11;
        else if (state.radix === 'DEC') maxLen = 10;
        else if (state.radix === 'HEX') maxLen = 8;

        if (state.display.length >= maxLen) {
          return state;
        }

        const nextDisplay = `${state.display}${rawDigit}`;
        const intVal = parseDisplayToInteger(nextDisplay, state.radix);
        return {
          ...state,
          display: nextDisplay,
          multiRadix: computeMultiRadix(intVal),
          waitingForOperand: false,
        };
      }

      // Standard and scientific modes: only digits 0-9 allowed
      if (!/^[0-9]$/.test(rawDigit)) {
        return state;
      }

      if (state.waitingForOperand) {
        const numVal = parseFloat(rawDigit);
        return {
          ...state,
          display: rawDigit,
          multiRadix: computeMultiRadix(numVal),
          waitingForOperand: false,
        };
      }

      if (state.display === '0') {
        const numVal = parseFloat(rawDigit);
        return {
          ...state,
          display: rawDigit,
          multiRadix: computeMultiRadix(numVal),
        };
      }

      if (state.display === '-0') {
        const nextDisp = `-${rawDigit}`;
        const numVal = parseFloat(nextDisp);
        return {
          ...state,
          display: nextDisp,
          multiRadix: computeMultiRadix(numVal),
        };
      }

      // Check display digit capacity (exclude sign and decimal point)
      const digitsOnly = state.display.replace(/[^0-9]/g, '');
      if (digitsOnly.length >= MAX_DISPLAY_DIGITS) {
        return state;
      }

      const nextDisp = `${state.display}${rawDigit}`;
      const numVal = parseFloat(nextDisp);
      return {
        ...state,
        display: nextDisp,
        multiRadix: computeMultiRadix(numVal),
      };
    }

    case 'DECIMAL': {
      // In programmer mode, decimal point is strictly disabled (integer-only arithmetic)
      if (state.mode === 'programmer') {
        return state;
      }

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

    case 'SET_RADIX': {
      const nextRadix = action.radix ?? 'HEX';
      if (state.radix === nextRadix) {
        return state;
      }

      // Format current active integer value in target radix
      const nextDisplay = state.multiRadix[nextRadix.toLowerCase() as keyof MultiRadixValues];
      return {
        ...state,
        radix: nextRadix,
        display: nextDisplay,
      };
    }

    case 'BITWISE_NOT': {
      const currentVal =
        state.mode === 'programmer'
          ? parseDisplayToInteger(state.display, state.radix)
          : parseFloat(state.display);
      const res = ~(currentVal | 0);
      const formatted =
        state.mode === 'programmer'
          ? formatRadixValue(res, state.radix)
          : normalizePrecision(res);
      const multiRadix = computeMultiRadix(res);

      return {
        ...state,
        display: formatted,
        accumulator: res,
        multiRadix,
        waitingForOperand: true,
        error: null,
        isLocked: false,
      };
    }

    case 'OPERATOR': {
      const op = action.operator;
      const validOps = [
        '+',
        '-',
        '*',
        '/',
        '^',
        'AND',
        'OR',
        'XOR',
        'LSH',
        'RSH',
        '&',
        '|',
        '<<',
        '>>',
      ];
      if (!op || !validOps.includes(op)) {
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

      const currentVal =
        state.mode === 'programmer'
          ? parseDisplayToInteger(state.display, state.radix)
          : parseFloat(state.display);

      // Immediate execution model (RULE-CALC-007):
      // If there is an existing accumulator and pending operator, evaluate now
      if (state.pendingOperator !== null && state.accumulator !== null && !state.waitingForOperand) {
        const res = evaluateBinary(
          state.accumulator,
          state.pendingOperator,
          currentVal,
          state.mode,
          state.radix
        );
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

        const nextMulti = computeMultiRadix(res.value!);
        return {
          ...state,
          display: res.formatted!,
          accumulator: res.value!,
          pendingOperator: op,
          waitingForOperand: true,
          error: null,
          isLocked: false,
          multiRadix: nextMulti,
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
        const currentVal =
          state.mode === 'programmer'
            ? parseDisplayToInteger(state.display, state.radix)
            : parseFloat(state.display);
        const res = evaluateBinary(
          state.accumulator,
          state.pendingOperator,
          currentVal,
          state.mode,
          state.radix
        );
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

        const nextMulti = computeMultiRadix(res.value!);
        const exprA =
          state.mode === 'programmer'
            ? formatRadixValue(state.accumulator, state.radix)
            : formatNumber(state.accumulator);
        const exprB =
          state.mode === 'programmer'
            ? formatRadixValue(currentVal, state.radix)
            : formatNumber(currentVal);

        const newEntry: CalculationHistoryEntry = {
          id: generateHistoryId(),
          expression: `${exprA} ${state.pendingOperator} ${exprB}`,
          result: res.formatted!,
          timestamp: Date.now(),
          radix: nextMulti,
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
          multiRadix: nextMulti,
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
        multiRadix: computeMultiRadix(0),
      };
    }

    case 'ALL_CLEAR': {
      // All Clear (AC) completely resets accumulator, pending operator, and buffer (RULE-CALC-009)
      // History, mode, radix, angle unit, and theme are preserved (RULE-CALC-006, RULE-CALC-008, NEVER-CALC-002)
      return {
        ...createInitialState(),
        theme: state.theme,
        history: state.history,
        mode: state.mode,
        angleUnit: state.angleUnit,
        radix: state.radix,
        multiRadix: computeMultiRadix(0),
      };
    }

    case 'BACKSPACE': {
      if (state.waitingForOperand) {
        return state;
      }

      if (state.display.length > 1) {
        const sliced = state.display.slice(0, -1);
        const nextDisp = sliced === '' || sliced === '-' ? '0' : sliced;
        const val =
          state.mode === 'programmer'
            ? parseDisplayToInteger(nextDisp, state.radix)
            : parseFloat(nextDisp);
        return {
          ...state,
          display: nextDisp,
          multiRadix: computeMultiRadix(val),
        };
      }

      return {
        ...state,
        display: '0',
        multiRadix: computeMultiRadix(0),
      };
    }

    case 'NEGATE': {
      if (state.mode === 'programmer') {
        const currentInt = parseDisplayToInteger(state.display, state.radix);
        const negVal = (-currentInt) | 0;
        const formatted = formatRadixValue(negVal, state.radix);
        return {
          ...state,
          display: formatted,
          multiRadix: computeMultiRadix(negVal),
        };
      }

      const val = parseFloat(state.display);
      if (val === 0 && !state.display.includes('.')) {
        return state;
      }

      let nextDisp: string;
      if (state.display.startsWith('-')) {
        nextDisp = state.display.slice(1);
      } else {
        nextDisp = `-${state.display}`;
      }

      const nextVal = parseFloat(nextDisp);
      return {
        ...state,
        display: nextDisp,
        multiRadix: computeMultiRadix(nextVal),
      };
    }

    case 'MEMORY_ADD': {
      const currentVal =
        state.mode === 'programmer'
          ? parseDisplayToInteger(state.display, state.radix)
          : parseFloat(state.display);
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
      const currentVal =
        state.mode === 'programmer'
          ? parseDisplayToInteger(state.display, state.radix)
          : parseFloat(state.display);
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
      const formatted =
        state.mode === 'programmer'
          ? formatRadixValue(state.memory, state.radix)
          : normalizePrecision(state.memory);
      return {
        ...state,
        display: formatted,
        multiRadix: computeMultiRadix(state.memory),
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
        const val =
          state.mode === 'programmer'
            ? parseDisplayToInteger(resultVal, state.radix)
            : parseFloat(resultVal);
        return {
          ...state,
          display: resultVal,
          multiRadix: computeMultiRadix(val),
          waitingForOperand: true,
          error: null,
          isLocked: false,
        };
      }

      return state;
    }

    case 'SQUARE_ROOT': {
      const currentVal = parseFloat(state.display);
      if (Number.isNaN(currentVal) || currentVal < 0) {
        return {
          ...state,
          display: INVALID_INPUT_ERROR,
          accumulator: null,
          pendingOperator: null,
          waitingForOperand: true,
          error: INVALID_INPUT_ERROR,
          isLocked: true,
        };
      }
      const res = Math.sqrt(currentVal);
      const formatted = normalizePrecision(res);
      return {
        ...state,
        display: formatted,
        multiRadix: computeMultiRadix(res),
        waitingForOperand: true,
        error: null,
        isLocked: false,
      };
    }

    case 'SQUARE': {
      const currentVal = parseFloat(state.display);
      if (Number.isNaN(currentVal)) {
        return state;
      }
      const res = currentVal * currentVal;
      if (!Number.isFinite(res) || Number.isNaN(res)) {
        return {
          ...state,
          display: INVALID_INPUT_ERROR,
          accumulator: null,
          pendingOperator: null,
          waitingForOperand: true,
          error: INVALID_INPUT_ERROR,
          isLocked: true,
        };
      }
      const formatted = normalizePrecision(res);
      return {
        ...state,
        display: formatted,
        multiRadix: computeMultiRadix(res),
        waitingForOperand: true,
        error: null,
        isLocked: false,
      };
    }

    case 'SIN':
    case 'COS':
    case 'TAN': {
      const func = action.type.toLowerCase() as 'sin' | 'cos' | 'tan';
      const currentVal = parseFloat(state.display);
      const res = evaluateTrig(func, currentVal, state.angleUnit);
      if (!res.success) {
        return {
          ...state,
          display: res.error || INVALID_INPUT_ERROR,
          accumulator: null,
          pendingOperator: null,
          waitingForOperand: true,
          error: res.error || INVALID_INPUT_ERROR,
          isLocked: true,
        };
      }
      return {
        ...state,
        display: res.formatted!,
        multiRadix: computeMultiRadix(res.value!),
        waitingForOperand: true,
        error: null,
        isLocked: false,
      };
    }

    case 'LOAD_CONSTANT': {
      const constant = action.constant;
      let val: number;
      if (constant === 'pi') {
        val = Math.PI;
      } else if (constant === 'e') {
        val = Math.E;
      } else {
        return state;
      }
      const formatted = normalizePrecision(val);
      return {
        ...state,
        display: formatted,
        multiRadix: computeMultiRadix(val),
        waitingForOperand: true,
        error: null,
        isLocked: false,
      };
    }

    case 'TOGGLE_ANGLE_UNIT': {
      const nextUnit: AngleUnit = state.angleUnit === 'DEG' ? 'RAD' : 'DEG';
      return {
        ...state,
        angleUnit: nextUnit,
      };
    }

    case 'SET_MODE': {
      const nextMode = action.mode ?? 'standard';
      if (state.mode === nextMode) {
        return state;
      }

      if (nextMode === 'programmer') {
        const intVal = (Math.trunc(parseFloat(state.display)) || 0) | 0;
        const nextMulti = computeMultiRadix(intVal);
        const nextDisplay = formatRadixValue(intVal, state.radix);
        return {
          ...state,
          mode: 'programmer',
          display: nextDisplay,
          multiRadix: nextMulti,
        };
      }

      if (state.mode === 'programmer') {
        const decDisplay = state.multiRadix.dec;
        return {
          ...state,
          mode: nextMode,
          display: decDisplay,
        };
      }

      return {
        ...state,
        mode: nextMode,
      };
    }

    case 'CYCLE_MODE': {
      let nextMode: CalculatorMode;
      if (state.mode === 'standard') nextMode = 'scientific';
      else if (state.mode === 'scientific') nextMode = 'programmer';
      else nextMode = 'standard';

      if (nextMode === 'programmer') {
        const intVal = (Math.trunc(parseFloat(state.display)) || 0) | 0;
        const nextMulti = computeMultiRadix(intVal);
        const nextDisplay = formatRadixValue(intVal, state.radix);
        return {
          ...state,
          mode: 'programmer',
          display: nextDisplay,
          multiRadix: nextMulti,
        };
      }

      if (state.mode === 'programmer') {
        const decDisplay = state.multiRadix.dec;
        return {
          ...state,
          mode: nextMode,
          display: decDisplay,
        };
      }

      return {
        ...state,
        mode: nextMode,
      };
    }

    case 'TOGGLE_MODE': {
      // Toggle between standard and scientific modes for backward compatibility,
      // or return to standard if in programmer mode.
      const targetMode = action.mode;
      if (targetMode) {
        return calculatorReducer(state, { type: 'SET_MODE', mode: targetMode });
      }

      let nextMode: CalculatorMode;
      if (state.mode === 'standard') {
        nextMode = 'scientific';
      } else {
        nextMode = 'standard';
      }

      if (state.mode === 'programmer') {
        const decDisplay = state.multiRadix.dec;
        return {
          ...state,
          mode: nextMode,
          display: decDisplay,
        };
      }

      return {
        ...state,
        mode: nextMode,
      };
    }

    case 'SET_THEME': {
      const nextTheme = action.theme ?? 'dark';
      return {
        ...state,
        theme: nextTheme,
      };
    }

    case 'CYCLE_THEME': {
      let nextTheme: CalculatorTheme;
      if (state.theme === 'dark') {
        nextTheme = 'light';
      } else if (state.theme === 'light') {
        nextTheme = 'high-contrast';
      } else {
        nextTheme = 'dark';
      }
      return {
        ...state,
        theme: nextTheme,
      };
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

  public inputHexDigit(digit: string): CalculatorState {
    return this.dispatch({ type: 'INPUT_HEX_DIGIT', digit });
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

  public exportHistoryAsText(): string {
    return exportHistoryToText(this.state.history);
  }

  public exportHistoryAsCsv(): string {
    return exportHistoryToCsv(this.state.history);
  }

  public exportHistory(format: HistoryExportFormat = 'text'): HistoryExportResult {
    const history = this.state.history;
    const content = format === 'csv' ? this.exportHistoryAsCsv() : this.exportHistoryAsText();
    const total = history.reduce((acc, entry) => {
      const val = parseFloat(entry.result);
      return acc + (Number.isFinite(val) ? val : 0);
    }, 0);
    return {
      format: format === 'csv' ? 'csv' : 'text',
      content,
      count: history.length,
      total: parseFloat(formatNumber(total)),
    };
  }


  public setMode(mode: CalculatorMode): CalculatorState {
    return this.dispatch({ type: 'SET_MODE', mode });
  }

  public cycleMode(): CalculatorState {
    return this.dispatch({ type: 'CYCLE_MODE' });
  }

  public toggleMode(): CalculatorState {
    return this.dispatch({ type: 'TOGGLE_MODE' });
  }

  public toggleAngleUnit(): CalculatorState {
    return this.dispatch({ type: 'TOGGLE_ANGLE_UNIT' });
  }

  public getMode(): CalculatorMode {
    return this.state.mode;
  }

  public getAngleUnit(): AngleUnit {
    return this.state.angleUnit;
  }

  public setRadix(radix: Radix): CalculatorState {
    return this.dispatch({ type: 'SET_RADIX', radix });
  }

  public getRadix(): Radix {
    return this.state.radix;
  }

  public getMultiRadix(): MultiRadixValues {
    return this.state.multiRadix;
  }

  public getTheme(): CalculatorTheme {
    return this.state.theme;
  }

  public setTheme(theme: CalculatorTheme): CalculatorState {
    return this.dispatch({ type: 'SET_THEME', theme });
  }

  public cycleTheme(): CalculatorState {
    return this.dispatch({ type: 'CYCLE_THEME' });
  }

  public bitwiseNot(): CalculatorState {
    return this.dispatch({ type: 'BITWISE_NOT' });
  }

  public squareRoot(): CalculatorState {
    return this.dispatch({ type: 'SQUARE_ROOT' });
  }

  public square(): CalculatorState {
    return this.dispatch({ type: 'SQUARE' });
  }

  public sin(): CalculatorState {
    return this.dispatch({ type: 'SIN' });
  }

  public cos(): CalculatorState {
    return this.dispatch({ type: 'COS' });
  }

  public tan(): CalculatorState {
    return this.dispatch({ type: 'TAN' });
  }

  public loadConstant(constant: 'pi' | 'e'): CalculatorState {
    return this.dispatch({ type: 'LOAD_CONSTANT', constant });
  }

  /**
   * Helper to execute a sequence of keys sequentially for rapid execution and testing.
   */
  public executeSequence(sequence: string): CalculatorState {
    for (const char of sequence) {
      if (/[0-9]/.test(char)) {
        this.pressDigit(char);
      } else if (/[a-fA-F]/.test(char) && this.state.mode === 'programmer') {
        this.inputHexDigit(char);
      } else if (char === '.') {
        this.pressDecimal();
      } else if (['+', '-', '*', '/', '^'].includes(char)) {
        this.pressOperator(char as Operator);
      } else if (char === '&') {
        this.pressOperator('AND');
      } else if (char === '|') {
        this.pressOperator('OR');
      } else if (char === '~') {
        this.bitwiseNot();
      } else if (char === '=' || char === '\n') {
        this.pressEquals();
      } else if (char === 'C' || char === 'c') {
        this.pressClear();
      }
    }
    return this.state;
  }
}
