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
 * Implements pure immediate execution calculator logic with zero external dependencies.
 * Satisfies RULE-CALC-001, RULE-CALC-002, RULE-CALC-007..010, NEVER-CALC-001.
 */
export class PrecisionArithmeticEngine {
  private accumulator: number | null = null;
  private currentBuffer: string = "0";
  private pendingOperator: StandardOperator | null = null;
  private error: string | null = null;
  private isNewInput: boolean = true;
  private waitingForOperand: boolean = false;
  private memoryRegister: number = 0;

  constructor() {
    this.allClear();
    this.memoryRegister = 0;
  }

  /** Resets all registers, pending operations, and errors to initial state (AC). Memory is preserved. */
  public allClear(): string {
    this.accumulator = null;
    this.currentBuffer = "0";
    this.pendingOperator = null;
    this.error = null;
    this.isNewInput = true;
    this.waitingForOperand = false;
    return this.getDisplay();
  }

  /** Resets active buffer to "0" preserving accumulator, pending operator, and memory (C). */
  public clear(): string {
    this.currentBuffer = "0";
    this.error = null;
    this.isNewInput = true;
    this.waitingForOperand = this.pendingOperator !== null;
    return this.getDisplay();
  }

  /** Returns current visible display string. */
  public getDisplay(): string {
    return this.error !== null ? this.error : this.currentBuffer;
  }

  /** Returns a copy of the internal engine state. */
  public getState(): Readonly<EngineState> {
    return {
      accumulator: this.accumulator,
      currentBuffer: this.currentBuffer,
      pendingOperator: this.pendingOperator,
      error: this.error,
      isNewInput: this.isNewInput,
      waitingForOperand: this.waitingForOperand,
      memory: this.memoryRegister,
    };
  }

  /** Adds current display value to memory register with high-precision normalization (M+). */
  public memoryAdd(): string {
    if (this.error !== null) return this.getDisplay();
    const currentVal = Number(this.currentBuffer);
    if (!Number.isFinite(currentVal)) {
      this.error = ERR_INVALID_INPUT;
      return this.getDisplay();
    }
    const sum = this.memoryRegister + currentVal;
    const rounded = Math.round((sum + Number.EPSILON) * 1e12) / 1e12;
    this.memoryRegister = Object.is(rounded, -0) || rounded === 0 ? 0 : rounded;
    this.isNewInput = true;
    return this.getDisplay();
  }

  /** Subtracts current display value from memory register with high-precision normalization (M-). */
  public memorySubtract(): string {
    if (this.error !== null) return this.getDisplay();
    const currentVal = Number(this.currentBuffer);
    if (!Number.isFinite(currentVal)) {
      this.error = ERR_INVALID_INPUT;
      return this.getDisplay();
    }
    const diff = this.memoryRegister - currentVal;
    const rounded = Math.round((diff + Number.EPSILON) * 1e12) / 1e12;
    this.memoryRegister = Object.is(rounded, -0) || rounded === 0 ? 0 : rounded;
    this.isNewInput = true;
    return this.getDisplay();
  }

  /** Recalls memory register value into active input buffer without modifying memory (MR). */
  public memoryRecall(): string {
    if (this.error !== null) return this.getDisplay();
    this.currentBuffer = PrecisionArithmeticEngine.formatNumber(this.memoryRegister);
    this.isNewInput = true;
    this.waitingForOperand = false;
    return this.getDisplay();
  }

  /** Resets memory register to zero (MC). */
  public memoryClear(): string {
    this.memoryRegister = 0;
    return this.getDisplay();
  }

  /** Returns current numerical value of the memory register. */
  public getMemory(): number {
    return this.memoryRegister;
  }

  /** Checks if memory register contains a non-zero value. */
  public hasMemory(): boolean {
    return this.memoryRegister !== 0;
  }


  /** Inputs a single numeric digit ('0'-'9') or decimal point ('.'). */
  public inputDigit(digit: string): string {
    if (this.error !== null) return this.getDisplay();
    if (digit === ".") return this.inputDecimal();
    if (!/^[0-9]$/.test(digit)) {
      this.error = ERR_INVALID_INPUT;
      return this.getDisplay();
    }
    if (this.isNewInput) {
      this.currentBuffer = digit;
      this.isNewInput = false;
    } else {
      const numericDigits = this.currentBuffer.replace(/[^0-9]/g, "");
      if (numericDigits.length >= MAX_DISPLAY_DIGITS) return this.getDisplay();
      this.currentBuffer = this.currentBuffer === "0" ? digit : this.currentBuffer + digit;
    }
    this.waitingForOperand = false;
    return this.getDisplay();
  }

  /** Inputs a decimal point with single-point guarding. */
  public inputDecimal(): string {
    if (this.error !== null) return this.getDisplay();
    if (this.isNewInput) {
      this.currentBuffer = "0.";
      this.isNewInput = false;
      return this.getDisplay();
    }
    if (!this.currentBuffer.includes(".")) {
      this.currentBuffer += ".";
    }
    this.waitingForOperand = false;
    return this.getDisplay();
  }

  /** Inputs an arithmetic operator (+, -, *, /, ×, ÷) with operator replacement. */
  public inputOperator(op: Operator | string): string {
    if (this.error !== null) return this.getDisplay();
    const normalizedOp = PrecisionArithmeticEngine.normalizeOperator(op);
    if (!normalizedOp) {
      this.error = ERR_INVALID_INPUT;
      return this.getDisplay();
    }
    // Consecutive operator replacement
    if (this.pendingOperator !== null && this.waitingForOperand) {
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
      if (this.error !== null) return this.getDisplay();
      this.accumulator = result;
      this.currentBuffer = PrecisionArithmeticEngine.formatNumber(result);
    } else {
      this.accumulator = currentVal;
    }
    this.pendingOperator = normalizedOp;
    this.isNewInput = true;
    this.waitingForOperand = true;
    return this.getDisplay();
  }

  /** Evaluates pending operation and finalizes calculation (=). */
  public calculate(): string {
    if (this.error !== null) return this.getDisplay();
    if (this.pendingOperator === null || this.accumulator === null) return this.getDisplay();
    const currentVal = Number(this.currentBuffer);
    if (!Number.isFinite(currentVal)) {
      this.error = ERR_INVALID_INPUT;
      return this.getDisplay();
    }
    const result = this.executeMath(this.accumulator, currentVal, this.pendingOperator);
    if (this.error !== null) return this.getDisplay();
    this.currentBuffer = PrecisionArithmeticEngine.formatNumber(result);
    this.accumulator = null;
    this.pendingOperator = null;
    this.isNewInput = true;
    this.waitingForOperand = false;
    return this.getDisplay();
  }

  /** Alias for calculate(). */
  public equals(): string {
    return this.calculate();
  }

  /** Toggles sign (+/-) of current input buffer. */
  public toggleSign(): string {
    if (this.error !== null || this.currentBuffer === "0") return this.getDisplay();
    this.currentBuffer = this.currentBuffer.startsWith("-")
      ? this.currentBuffer.slice(1)
      : `-${this.currentBuffer}`;
    return this.getDisplay();
  }

  /** Divides current buffer by 100 for percentage calculation. */
  public inputPercent(): string {
    if (this.error !== null) return this.getDisplay();
    const currentVal = Number(this.currentBuffer);
    if (!Number.isFinite(currentVal)) {
      this.error = ERR_INVALID_INPUT;
      return this.getDisplay();
    }
    this.currentBuffer = PrecisionArithmeticEngine.formatNumber(currentVal / 100);
    this.isNewInput = true;
    this.waitingForOperand = false;
    return this.getDisplay();
  }

  /** Feeds a sequence of token presses into the engine. */
  public inputSequence(tokens: string[]): string {
    for (const token of tokens) {
      if (token === "C" || token === "c") this.clear();
      else if (token === "AC" || token === "ac") this.allClear();
      else if (token === "=" || token === "Enter") this.calculate();
      else if (token === "M+" || token === "m+") this.memoryAdd();
      else if (token === "M-" || token === "m-") this.memorySubtract();
      else if (token === "MR" || token === "mr") this.memoryRecall();
      else if (token === "MC" || token === "mc") this.memoryClear();
      else if (["+", "-", "*", "/", "×", "÷"].includes(token)) this.inputOperator(token as Operator);
      else if (token === ".") this.inputDecimal();
      else if (token === "+/-") this.toggleSign();
      else if (token === "%") this.inputPercent();
      else {
        for (const ch of token) this.inputDigit(ch);
      }
    }
    return this.getDisplay();
  }

  /** Canonical operator normalization. */
  public static normalizeOperator(op: string): StandardOperator | null {
    switch (op) {
      case "+": return "+";
      case "-": return "-";
      case "*":
      case "×": return "*";
      case "/":
      case "÷": return "/";
      default: return null;
    }
  }

  /** High-precision decimal formatter eliminating IEEE 754 precision noise. */
  public static formatNumber(val: number, maxDigits: number = MAX_DISPLAY_DIGITS): string {
    if (val === 0 || Object.is(val, -0)) return "0";
    if (!Number.isFinite(val)) return ERR_INVALID_INPUT;
    const rounded = Math.round((val + Number.EPSILON) * 1e12) / 1e12;
    if (Number.isInteger(rounded) && Math.abs(rounded) < Math.pow(10, maxDigits)) {
      return String(rounded);
    }
    if (Math.abs(rounded) >= Math.pow(10, maxDigits) || (Math.abs(rounded) < 1e-6 && rounded !== 0)) {
      return rounded.toExponential(4);
    }
    let str = rounded.toPrecision(maxDigits);
    if (str.includes(".")) {
      str = str.replace(/0+$/, "").replace(/\.$/, "");
    }
    return str;
  }

  /** Executes binary arithmetic with division by zero guard. */
  private executeMath(a: number, b: number, op: StandardOperator): number {
    switch (op) {
      case "+": return a + b;
      case "-": return a - b;
      case "*": return a * b;
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
