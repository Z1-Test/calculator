import {
  ERR_DIVISION_BY_ZERO,
  ERR_INVALID_INPUT,
  MAX_DISPLAY_DIGITS,
} from "./types.ts";
import type {
  EngineState,
  Operator,
  StandardOperator,
} from "./types.ts";

/**
 * PrecisionArithmeticEngine
 *
 * Implements a pure, zero-dependency immediate execution pocket calculator engine.
 *
 * Invariants:
 * - RULE-CALC-001 (Zero Division Safeguard): n / 0 yields "Cannot divide by zero" and locks input.
 * - RULE-CALC-002 (Precision Normalization): Floats normalize to max 10 display digits without IEEE 754 noise.
 * - RULE-CALC-007 (Immediate Sequential Evaluation): Operations evaluate left-to-right (2 + 3 * 4 = 20).
 * - RULE-CALC-008 (Consecutive Operator Replacement): 5 + * 2 = 10 (second operator replaces first).
 * - RULE-CALC-009 (Clear Entry C Preservation): C resets active buffer to 0 while preserving accumulator & operator.
 * - RULE-CALC-010 (All Clear AC Full Reset): AC resets all registers to initial state.
 * - NEVER-CALC-001 (No Dynamic Eval): Pure deterministic lexical state transitions without eval().
 */
export class PrecisionArithmeticEngine {
  private accumulator: number | null = null;
  private currentBuffer: string = "0";
  private pendingOperator: StandardOperator | null = null;
  private error: string | null = null;
  private isNewInput: boolean = true;

  constructor() {
    this.allClear();
  }

  /**
   * Resets all registers, pending operations, and errors to initial state (AC).
   */
  public allClear(): string {
    this.accumulator = null;
    this.currentBuffer = "0";
    this.pendingOperator = null;
    this.error = null;
    this.isNewInput = true;
    return this.getDisplay();
  }

  /**
   * Resets active buffer to "0" while preserving accumulator and pending operator (C).
   * Also unlocks any active error state.
   */
  public clear(): string {
    this.currentBuffer = "0";
    this.error = null;
    this.isNewInput = true;
    return this.getDisplay();
  }

  /**
   * Returns current visible display string.
   */
  public getDisplay(): string {
    if (this.error !== null) {
      return this.error;
    }
    return this.currentBuffer;
  }

  /**
   * Returns a copy of the internal engine state.
   */
  public getState(): Readonly<EngineState> {
    return {
      accumulator: this.accumulator,
      currentBuffer: this.currentBuffer,
      pendingOperator: this.pendingOperator,
      error: this.error,
      isNewInput: this.isNewInput,
    };
  }

  /**
   * Inputs a single numeric digit ('0' through '9') or decimal point ('.').
   */
  public inputDigit(digit: string): string {
    if (this.error !== null) {
      return this.getDisplay();
    }

    if (digit === ".") {
      return this.inputDecimal();
    }

    if (!/^[0-9]$/.test(digit)) {
      this.error = ERR_INVALID_INPUT;
      return this.getDisplay();
    }

    if (this.isNewInput) {
      this.currentBuffer = digit;
      this.isNewInput = false;
    } else {
      const numericDigits = this.currentBuffer.replace(/[^0-9]/g, "");
      if (numericDigits.length >= MAX_DISPLAY_DIGITS) {
        // Enforce maximum 10 display digits cap
        return this.getDisplay();
      }

      if (this.currentBuffer === "0") {
        this.currentBuffer = digit;
      } else {
        this.currentBuffer += digit;
      }
    }

    return this.getDisplay();
  }

  /**
   * Inputs a decimal point with single-point guarding.
   */
  public inputDecimal(): string {
    if (this.error !== null) {
      return this.getDisplay();
    }

    if (this.isNewInput) {
      this.currentBuffer = "0.";
      this.isNewInput = false;
      return this.getDisplay();
    }

    if (!this.currentBuffer.includes(".")) {
      this.currentBuffer += ".";
    }

    return this.getDisplay();
  }

  /**
   * Inputs an arithmetic operator (+, -, *, /, ×, ÷).
   * Implements immediate execution and consecutive operator replacement.
   */
  public inputOperator(op: Operator | string): string {
    if (this.error !== null) {
      return this.getDisplay();
    }

    const normalizedOp = PrecisionArithmeticEngine.normalizeOperator(op);
    if (!normalizedOp) {
      this.error = ERR_INVALID_INPUT;
      return this.getDisplay();
    }

    // Consecutive operator replacement: if operator pressed again before new digits
    if (this.pendingOperator !== null && this.isNewInput) {
      this.pendingOperator = normalizedOp;
      return this.getDisplay();
    }

    const currentVal = Number(this.currentBuffer);
    if (!Number.isFinite(currentVal)) {
      this.error = ERR_INVALID_INPUT;
      return this.getDisplay();
    }

    // Evaluate pending intermediate operation
    if (this.accumulator !== null && this.pendingOperator !== null) {
      const result = this.executeMath(this.accumulator, currentVal, this.pendingOperator);
      if (this.error !== null) {
        return this.getDisplay();
      }
      this.accumulator = result;
      this.currentBuffer = PrecisionArithmeticEngine.formatNumber(result);
    } else {
      this.accumulator = currentVal;
    }

    this.pendingOperator = normalizedOp;
    this.isNewInput = true;
    return this.getDisplay();
  }

  /**
   * Evaluates pending operation and finalizes calculation (=).
   */
  public calculate(): string {
    if (this.error !== null) {
      return this.getDisplay();
    }

    if (this.pendingOperator === null || this.accumulator === null) {
      return this.getDisplay();
    }

    const currentVal = Number(this.currentBuffer);
    if (!Number.isFinite(currentVal)) {
      this.error = ERR_INVALID_INPUT;
      return this.getDisplay();
    }

    const result = this.executeMath(this.accumulator, currentVal, this.pendingOperator);
    if (this.error !== null) {
      return this.getDisplay();
    }

    this.currentBuffer = PrecisionArithmeticEngine.formatNumber(result);
    this.accumulator = null;
    this.pendingOperator = null;
    this.isNewInput = true;
    return this.getDisplay();
  }

  /**
   * Alias for calculate().
   */
  public equals(): string {
    return this.calculate();
  }

  /**
   * Toggles sign (+/-) of current input buffer.
   */
  public toggleSign(): string {
    if (this.error !== null || this.currentBuffer === "0") {
      return this.getDisplay();
    }

    if (this.currentBuffer.startsWith("-")) {
      this.currentBuffer = this.currentBuffer.slice(1);
    } else {
      this.currentBuffer = `-${this.currentBuffer}`;
    }

    return this.getDisplay();
  }

  /**
   * Divides current buffer by 100 for percentage calculation.
   */
  public inputPercent(): string {
    if (this.error !== null) {
      return this.getDisplay();
    }

    const currentVal = Number(this.currentBuffer);
    if (!Number.isFinite(currentVal)) {
      this.error = ERR_INVALID_INPUT;
      return this.getDisplay();
    }

    const percentVal = currentVal / 100;
    this.currentBuffer = PrecisionArithmeticEngine.formatNumber(percentVal);
    this.isNewInput = true;
    return this.getDisplay();
  }

  /**
   * Feeds a sequence of token presses into the engine.
   */
  public inputSequence(tokens: string[]): string {
    for (const token of tokens) {
      if (token === "C" || token === "c") {
        this.clear();
      } else if (token === "AC" || token === "ac") {
        this.allClear();
      } else if (token === "=" || token === "Enter") {
        this.calculate();
      } else if (token === "+" || token === "-" || token === "*" || token === "/" || token === "×" || token === "÷") {
        this.inputOperator(token as Operator);
      } else if (token === ".") {
        this.inputDecimal();
      } else if (token === "+/-") {
        this.toggleSign();
      } else if (token === "%") {
        this.inputPercent();
      } else {
        // Multi-character numbers or single digits
        for (const ch of token) {
          this.inputDigit(ch);
        }
      }
    }
    return this.getDisplay();
  }

  /**
   * Canonical operator normalization.
   */
  public static normalizeOperator(op: string): StandardOperator | null {
    switch (op) {
      case "+":
        return "+";
      case "-":
        return "-";
      case "*":
      case "×":
        return "*";
      case "/":
      case "÷":
        return "/";
      default:
        return null;
    }
  }

  /**
   * High-precision decimal formatter eliminating IEEE 754 precision noise.
   * Enforces 10 significant display digits with clean trailing zero trimming.
   */
  public static formatNumber(val: number, maxDigits: number = MAX_DISPLAY_DIGITS): string {
    if (val === 0 || Object.is(val, -0)) {
      return "0";
    }

    if (!Number.isFinite(val)) {
      return ERR_INVALID_INPUT;
    }

    // Eliminate IEEE 754 representation noise via epsilon-scaled rounding
    const rounded = Math.round((val + Number.EPSILON) * 1e12) / 1e12;

    // Small or zero-bounded integers
    if (Number.isInteger(rounded) && Math.abs(rounded) < Math.pow(10, maxDigits)) {
      return String(rounded);
    }

    // Overflow or microscopic decimals requiring scientific notation within 10 chars
    if (Math.abs(rounded) >= Math.pow(10, maxDigits) || (Math.abs(rounded) < 1e-6 && rounded !== 0)) {
      return rounded.toExponential(4);
    }

    // Format within significant digit budget
    let str = rounded.toPrecision(maxDigits);
    if (str.includes(".")) {
      str = str.replace(/0+$/, "").replace(/\.$/, "");
    }

    return str;
  }

  /**
   * Executes binary arithmetic with division by zero guard.
   */
  private executeMath(a: number, b: number, op: StandardOperator): number {
    switch (op) {
      case "+":
        return a + b;
      case "-":
        return a - b;
      case "*":
        return a * b;
      case "/":
        if (b === 0) {
          this.error = ERR_DIVISION_BY_ZERO;
          this.accumulator = null;
          this.pendingOperator = null;
          this.isNewInput = true;
          return 0;
        }
        return a / b;
      default:
        this.error = ERR_INVALID_INPUT;
        return 0;
    }
  }
}
