import type { CalcEngineState, CalculationRecord, Operator } from "./types.ts";

/**
 * Truncates and normalizes IEEE-754 binary floating-point representation noise
 * to a clean fixed precision of up to 10 decimal digits per RULE-CALC-002.
 */
export function normalizePrecision(val: number): number {
  if (Object.is(val, -0) || val === 0) {
    return 0;
  }
  return parseFloat(Number(val).toFixed(10));
}

/**
 * Core precision arithmetic engine for StayCalc.
 *
 * Implements immediate left-to-right pocket calculator execution,
 * decimal precision normalization eliminating IEEE-754 float bugs (0.1 + 0.2 = 0.3),
 * division-by-zero error locking, consecutive operator replacement,
 * and Clear (C) vs All Clear (AC) register reset semantics.
 */
export class CalcEngine {
  private accumulator: number | null = null;
  private currentBuffer: string = "0";
  private pendingOperator: Operator | null = null;
  private isWaitingForOperand: boolean = false;
  private isLocked: boolean = false;
  private errorMessage: string | null = null;
  private memory: number = 0;

  /**
   * Appends a numeric digit (0-9) to the active input buffer.
   * If the engine is locked by an arithmetic error, input is rejected.
   */
  public inputDigit(digit: string): void {
    if (this.isLocked) {
      return;
    }

    if (!/^[0-9]$/.test(digit)) {
      return;
    }

    if (this.isWaitingForOperand) {
      this.currentBuffer = digit;
      this.isWaitingForOperand = false;
    } else {
      if (this.currentBuffer === "0") {
        this.currentBuffer = digit;
      } else {
        // Enforce maximum buffer length of 16 significant digits
        if (this.currentBuffer.replace(".", "").length < 16) {
          this.currentBuffer += digit;
        }
      }
    }
  }

  /**
   * Appends a decimal point to the active buffer.
   * Ignores redundant decimal points if one already exists in the buffer.
   */
  public inputDecimal(): void {
    if (this.isLocked) {
      return;
    }

    if (this.isWaitingForOperand) {
      this.currentBuffer = "0.";
      this.isWaitingForOperand = false;
    } else if (!this.currentBuffer.includes(".")) {
      this.currentBuffer += ".";
    }
  }

  /**
   * Removes the last entered character from the active buffer.
   * If the buffer only contains a single character or is waiting for an operand,
   * resets the buffer back to "0".
   */
  public backspace(): void {
    if (this.isLocked || this.isWaitingForOperand) {
      return;
    }

    if (this.currentBuffer.length > 1) {
      this.currentBuffer = this.currentBuffer.slice(0, -1);
      if (this.currentBuffer === "-" || this.currentBuffer === "") {
        this.currentBuffer = "0";
      }
    } else {
      this.currentBuffer = "0";
    }
  }

  /**
   * Ingests an arithmetic operator (+, -, *, /).
   *
   * In immediate execution mode:
   * - If an operator was already entered and no new digits followed,
   *   the new operator replaces the pending operator (e.g. 5 + * 2 -> 5 * 2).
   * - Otherwise, evaluates any pending operation immediately left-to-right.
   */
  public inputOperator(operator: Operator): void {
    if (this.isLocked) {
      return;
    }

    // Consecutive operator replacement
    if (this.pendingOperator !== null && this.isWaitingForOperand) {
      this.pendingOperator = operator;
      return;
    }

    const currentOperand = this.parseBuffer();

    if (this.accumulator === null) {
      this.accumulator = currentOperand;
    } else if (this.pendingOperator !== null) {
      // Immediate evaluation
      if (this.pendingOperator === "/" && currentOperand === 0) {
        this.setDivisionByZeroError();
        return;
      }

      const result = this.executeMath(this.accumulator, this.pendingOperator, currentOperand);
      this.accumulator = result;
      this.currentBuffer = String(result);
    } else {
      this.accumulator = currentOperand;
    }

    this.pendingOperator = operator;
    this.isWaitingForOperand = true;
  }

  /**
   * Executes the pending arithmetic calculation and updates registers.
   * Returns the final display string (result or error).
   */
  public calculate(): string {
    if (this.isLocked) {
      return this.errorMessage ?? "Cannot divide by zero";
    }

    if (this.pendingOperator === null || this.accumulator === null) {
      return this.getDisplay();
    }

    const currentOperand = this.parseBuffer();

    if (this.pendingOperator === "/" && currentOperand === 0) {
      this.setDivisionByZeroError();
      return "Cannot divide by zero";
    }

    const result = this.executeMath(this.accumulator, this.pendingOperator, currentOperand);
    this.accumulator = result;
    this.currentBuffer = String(result);
    this.pendingOperator = null;
    this.isWaitingForOperand = true;

    return this.currentBuffer;
  }

  /**
   * Clear Entry (C):
   * Clears the active input buffer back to "0" and unlocks error state,
   * while preserving the pending accumulator and operator.
   */
  public clear(): void {
    if (this.isLocked) {
      this.isLocked = false;
      this.errorMessage = null;
    }
    this.currentBuffer = "0";
    this.isWaitingForOperand = false;
  }

  /**
   * All Clear (AC):
   * Completely resets all registers and error states to initial clean state.
   */
  public allClear(): void {
    this.accumulator = null;
    this.pendingOperator = null;
    this.currentBuffer = "0";
    this.isWaitingForOperand = false;
    this.isLocked = false;
    this.errorMessage = null;
  }

  /**
   * Adds the current active buffer value to the memory register.
   * Normalizes precision to eliminate IEEE-754 representation noise.
   * If the engine is locked by an error, input is ignored.
   */
  public memoryAdd(): void {
    if (this.isLocked) {
      return;
    }
    const currentOperand = this.parseBuffer();
    this.memory = normalizePrecision(this.memory + currentOperand);
    this.isWaitingForOperand = true;
  }

  /**
   * Subtracts the current active buffer value from the memory register.
   * Normalizes precision to eliminate IEEE-754 representation noise.
   * If the engine is locked by an error, input is ignored.
   */
  public memorySubtract(): void {
    if (this.isLocked) {
      return;
    }
    const currentOperand = this.parseBuffer();
    this.memory = normalizePrecision(this.memory - currentOperand);
    this.isWaitingForOperand = true;
  }

  /**
   * Recalls the value stored in the memory register into the active buffer.
   * Sets isWaitingForOperand to false to enable immediate operand chaining.
   * If the engine is locked by an error, input is ignored.
   */
  public memoryRecall(): void {
    if (this.isLocked) {
      return;
    }
    this.currentBuffer = String(this.memory);
    this.isWaitingForOperand = false;
  }

  /**
   * Resets the memory register back to 0.
   * If the engine is locked by an error, input is ignored.
   */
  public memoryClear(): void {
    if (this.isLocked) {
      return;
    }
    this.memory = 0;
  }

  /**
   * Returns true if the memory register contains a non-zero value.
   */
  public hasMemory(): boolean {
    return this.memory !== 0;
  }

  /**
   * Returns the current numeric value stored in the memory register.
   */
  public getMemoryValue(): number {
    return this.memory;
  }

  /**
   * Returns the formatted string suitable for the calculator display.
   */
  public getDisplay(): string {
    if (this.errorMessage !== null) {
      return this.errorMessage;
    }
    return this.currentBuffer;
  }

  /**
   * Returns a snapshot of the current engine register state.
   */
  public getState(): CalcEngineState {
    return {
      accumulator: this.accumulator,
      currentBuffer: this.currentBuffer,
      pendingOperator: this.pendingOperator,
      isWaitingForOperand: this.isWaitingForOperand,
      isLocked: this.isLocked,
      errorMessage: this.errorMessage,
      display: this.getDisplay(),
      memory: this.memory,
      hasMemory: this.hasMemory(),
    };
  }

  /**
   * Parses the active buffer into a numeric value.
   */
  private parseBuffer(): number {
    const val = parseFloat(this.currentBuffer);
    return Number.isNaN(val) ? 0 : val;
  }

  /**
   * Executes binary arithmetic with precision normalization.
   */
  private executeMath(op1: number, operator: Operator, op2: number): number {
    switch (operator) {
      case "+":
        return normalizePrecision(op1 + op2);
      case "-":
        return normalizePrecision(op1 - op2);
      case "*":
        return normalizePrecision(op1 * op2);
      case "/":
        return normalizePrecision(op1 / op2);
    }
  }

  /**
   * Locks the engine in an error state on division by zero.
   */
  private setDivisionByZeroError(): void {
    this.isLocked = true;
    this.errorMessage = "Cannot divide by zero";
    this.currentBuffer = "Cannot divide by zero";
    this.accumulator = null;
    this.pendingOperator = null;
    this.isWaitingForOperand = false;
  }
}
