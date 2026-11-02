import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  PrecisionArithmeticEngine,
  ERR_DIVISION_BY_ZERO,
  ERR_INVALID_INPUT,
  MAX_DISPLAY_DIGITS,
} from "../../src/engine/index.ts";

describe("PrecisionArithmeticEngine", () => {
  it("CASE-CALC-01: immediate execution evaluates sequential operations left-to-right (2 + 3 * 4 = 20)", () => {
    const calc = new PrecisionArithmeticEngine();
    assert.equal(calc.getDisplay(), "0");

    calc.inputDigit("2");
    assert.equal(calc.getDisplay(), "2");

    calc.inputOperator("+");
    calc.inputDigit("3");
    assert.equal(calc.getDisplay(), "3");

    // Pressing * evaluates intermediate 2 + 3 = 5
    calc.inputOperator("*");
    assert.equal(calc.getDisplay(), "5");

    calc.inputDigit("4");
    assert.equal(calc.getDisplay(), "4");

    calc.calculate();
    assert.equal(calc.getDisplay(), "20");
  });

  it("CASE-CALC-02: consecutive operator presses replace the pending operator in place (5 + * 2 = 10)", () => {
    const calc = new PrecisionArithmeticEngine();

    calc.inputDigit("5");
    calc.inputOperator("+");
    // Operator replaced by *
    calc.inputOperator("*");
    assert.equal(calc.getDisplay(), "5");

    calc.inputDigit("2");
    calc.calculate();
    assert.equal(calc.getDisplay(), "10");

    // Multiple rapid replacements: 8 + - * / 2 = 4
    calc.allClear();
    calc.inputDigit("8");
    calc.inputOperator("+");
    calc.inputOperator("-");
    calc.inputOperator("*");
    calc.inputOperator("/");
    calc.inputDigit("2");
    calc.calculate();
    assert.equal(calc.getDisplay(), "4");
  });

  it("CASE-CALC-03: IEEE 754 floating-point precision inaccuracies eliminated (0.1 + 0.2 = 0.3)", () => {
    const calc = new PrecisionArithmeticEngine();

    calc.inputDigit("0");
    calc.inputDecimal();
    calc.inputDigit("1");
    calc.inputOperator("+");
    calc.inputDigit("0");
    calc.inputDecimal();
    calc.inputDigit("2");
    calc.calculate();
    assert.equal(calc.getDisplay(), "0.3");

    // 0.7 + 0.1 = 0.8
    calc.allClear();
    calc.inputSequence(["0.7", "+", "0.1", "="]);
    assert.equal(calc.getDisplay(), "0.8");

    // 0.3 - 0.2 = 0.1
    calc.allClear();
    calc.inputSequence(["0.3", "-", "0.2", "="]);
    assert.equal(calc.getDisplay(), "0.1");

    // 0.15 + 0.15 = 0.3
    calc.allClear();
    calc.inputSequence(["0.15", "+", "0.15", "="]);
    assert.equal(calc.getDisplay(), "0.3");
  });

  it("CASE-CALC-04: maximum 10 display digits enforced with clean rounding", () => {
    const calc = new PrecisionArithmeticEngine();

    // 1 / 3 rounded cleanly to 10 significant digits
    calc.inputSequence(["1", "/", "3", "="]);
    assert.equal(calc.getDisplay(), "0.3333333333");
    assert.ok(calc.getDisplay().length <= 12); // "0." + 10 digits

    // 2 / 3 rounded cleanly
    calc.allClear();
    calc.inputSequence(["2", "/", "3", "="]);
    assert.equal(calc.getDisplay(), "0.6666666667");

    // Input buffer digit capping at 10 digits
    calc.allClear();
    for (let i = 1; i <= 15; i++) {
      calc.inputDigit("9");
    }
    assert.equal(calc.getDisplay(), "9999999999");
    assert.equal(calc.getDisplay().length, MAX_DISPLAY_DIGITS);
  });

  it("CASE-CALC-05: Clear Entry (C) resets active buffer to 0 while preserving pending operator and accumulator", () => {
    const calc = new PrecisionArithmeticEngine();

    calc.inputDigit("5");
    calc.inputOperator("+");
    calc.inputDigit("9");
    assert.equal(calc.getDisplay(), "9");

    // Clear Entry
    calc.clear();
    assert.equal(calc.getDisplay(), "0");

    // Accumulator and pending operator remain intact
    const state = calc.getState();
    assert.equal(state.accumulator, 5);
    assert.equal(state.pendingOperator, "+");

    // Enter replacement operand and complete
    calc.inputDigit("3");
    calc.calculate();
    assert.equal(calc.getDisplay(), "8");
  });

  it("CASE-CALC-06: All Clear (AC) resets accumulator, buffer, and pending operator to initial state", () => {
    const calc = new PrecisionArithmeticEngine();

    calc.inputDigit("7");
    calc.inputOperator("*");
    calc.inputDigit("6");
    calc.calculate();
    assert.equal(calc.getDisplay(), "42");

    calc.allClear();
    const state = calc.getState();
    assert.equal(state.accumulator, null);
    assert.equal(state.currentBuffer, "0");
    assert.equal(state.pendingOperator, null);
    assert.equal(state.error, null);
    assert.equal(state.isNewInput, true);
    assert.equal(calc.getDisplay(), "0");
  });

  it("CASE-CALC-07: division by zero returns 'Cannot divide by zero' and locks further input", () => {
    const calc = new PrecisionArithmeticEngine();

    calc.inputDigit("5");
    calc.inputOperator("/");
    calc.inputDigit("0");
    calc.calculate();

    assert.equal(calc.getDisplay(), ERR_DIVISION_BY_ZERO);

    // Engine is locked against digits and operators
    calc.inputDigit("9");
    assert.equal(calc.getDisplay(), ERR_DIVISION_BY_ZERO);

    calc.inputOperator("+");
    assert.equal(calc.getDisplay(), ERR_DIVISION_BY_ZERO);

    // Clear Entry unlocks the engine
    calc.clear();
    assert.equal(calc.getDisplay(), "0");

    // Normal calculation resumes
    calc.inputDigit("4");
    calc.inputOperator("+");
    calc.inputDigit("6");
    calc.calculate();
    assert.equal(calc.getDisplay(), "10");

    // All Clear also clears division by zero lock
    calc.inputSequence(["8", "/", "0", "="]);
    assert.equal(calc.getDisplay(), ERR_DIVISION_BY_ZERO);
    calc.allClear();
    assert.equal(calc.getDisplay(), "0");
  });

  it("CASE-CALC-08: domain errors return 'Invalid input'", () => {
    const calc = new PrecisionArithmeticEngine();

    // Invalid digit entry
    calc.inputDigit("x");
    assert.equal(calc.getDisplay(), ERR_INVALID_INPUT);

    calc.allClear();

    // Invalid operator entry
    calc.inputOperator("^");
    assert.equal(calc.getDisplay(), ERR_INVALID_INPUT);

    // Static formatNumber domain guard
    assert.equal(PrecisionArithmeticEngine.formatNumber(NaN), ERR_INVALID_INPUT);
    assert.equal(PrecisionArithmeticEngine.formatNumber(Infinity), ERR_INVALID_INPUT);
  });

  it("handles Unicode operators (× and ÷)", () => {
    const calc = new PrecisionArithmeticEngine();

    calc.inputSequence(["6", "×", "7", "="]);
    assert.equal(calc.getDisplay(), "42");

    calc.allClear();
    calc.inputSequence(["100", "÷", "4", "="]);
    assert.equal(calc.getDisplay(), "25");
  });

  it("handles multiple consecutive decimal points safely", () => {
    const calc = new PrecisionArithmeticEngine();

    calc.inputDigit("3");
    calc.inputDecimal();
    calc.inputDigit("1");
    calc.inputDecimal(); // Ignored
    calc.inputDigit("4");
    assert.equal(calc.getDisplay(), "3.14");
  });

  it("handles sign toggling (+/-)", () => {
    const calc = new PrecisionArithmeticEngine();

    calc.inputDigit("5");
    calc.toggleSign();
    assert.equal(calc.getDisplay(), "-5");

    calc.toggleSign();
    assert.equal(calc.getDisplay(), "5");

    calc.allClear();
    calc.toggleSign();
    assert.equal(calc.getDisplay(), "0"); // Toggling 0 remains 0
  });

  it("handles percentage calculations", () => {
    const calc = new PrecisionArithmeticEngine();

    calc.inputSequence(["50", "%"]);
    assert.equal(calc.getDisplay(), "0.5");
  });

  it("chains calculations across equals (=)", () => {
    const calc = new PrecisionArithmeticEngine();

    // 10 + 5 = 15, then + 5 = 20
    calc.inputSequence(["10", "+", "5", "="]);
    assert.equal(calc.getDisplay(), "15");

    calc.inputOperator("+");
    calc.inputDigit("5");
    calc.calculate();
    assert.equal(calc.getDisplay(), "20");
  });

  it("CASE-CALC-09: M+ adds active display value to memory register with precision arithmetic", () => {
    const calc = new PrecisionArithmeticEngine();
    assert.equal(calc.getMemory(), 0);
    assert.equal(calc.hasMemory(), false);

    // Initial 10 into memory
    calc.inputDigit("1");
    calc.inputDigit("0");
    calc.memoryAdd();
    assert.equal(calc.getMemory(), 10);
    assert.equal(calc.hasMemory(), true);
    assert.equal(calc.getDisplay(), "10");

    // Float precision accumulation: 0.1 then 0.2
    calc.allClear();
    calc.memoryClear();
    calc.inputSequence(["0.1", "M+", "0.2", "M+"]);
    assert.equal(calc.getMemory(), 0.3);
    assert.equal(calc.hasMemory(), true);

    // Guard during error state
    calc.inputSequence(["1", "/", "0", "="]);
    assert.equal(calc.getDisplay(), ERR_DIVISION_BY_ZERO);
    calc.memoryAdd(); // Must be blocked
    assert.equal(calc.getMemory(), 0.3);
  });

  it("CASE-CALC-10: M- subtracts active display value from memory register", () => {
    const calc = new PrecisionArithmeticEngine();

    calc.inputSequence(["10", "M+"]);
    assert.equal(calc.getMemory(), 10);

    calc.inputSequence(["4", "M-"]);
    assert.equal(calc.getMemory(), 6);
    assert.equal(calc.hasMemory(), true);

    // Subtract remaining 6 -> returns to 0
    calc.inputSequence(["6", "M-"]);
    assert.equal(calc.getMemory(), 0);
    assert.equal(calc.hasMemory(), false);
  });

  it("CASE-CALC-11: MR recalls memory register value into active input buffer and allows immediate chained operations", () => {
    const calc = new PrecisionArithmeticEngine();

    calc.inputSequence(["42", "M+"]);
    calc.allClear(); // Clears display/accumulator, preserves memory
    assert.equal(calc.getDisplay(), "0");

    // Recall memory
    calc.memoryRecall();
    assert.equal(calc.getDisplay(), "42");
    assert.equal(calc.getMemory(), 42); // Memory preserved

    // Immediate chained operation: 42 * 2 = 84
    calc.inputOperator("*");
    calc.inputDigit("2");
    calc.calculate();
    assert.equal(calc.getDisplay(), "84");
    assert.equal(calc.getMemory(), 42);
  });

  it("CASE-CALC-12: MC resets memory register to 0", () => {
    const calc = new PrecisionArithmeticEngine();

    calc.inputSequence(["99", "M+"]);
    assert.equal(calc.getMemory(), 99);
    assert.equal(calc.hasMemory(), true);

    calc.memoryClear();
    assert.equal(calc.getMemory(), 0);
    assert.equal(calc.hasMemory(), false);
    assert.equal(calc.getState().memory, 0);

    // Verify token sequence handling
    calc.inputSequence(["50", "M+", "MC"]);
    assert.equal(calc.getMemory(), 0);
    assert.equal(calc.hasMemory(), false);
  });

  it("CASE-CALC-13: Memory register persists across chained operations, sign toggles, and Clear Entry (C) / All Clear (AC)", () => {
    const calc = new PrecisionArithmeticEngine();

    calc.inputSequence(["100", "M+"]);
    assert.equal(calc.getMemory(), 100);

    // Perform independent calculations
    calc.inputSequence(["5", "+", "5", "="]);
    assert.equal(calc.getDisplay(), "10");
    assert.equal(calc.getMemory(), 100);

    // Clear Entry (C)
    calc.inputDigit("9");
    calc.clear();
    assert.equal(calc.getDisplay(), "0");
    assert.equal(calc.getMemory(), 100);

    // All Clear (AC)
    calc.allClear();
    assert.equal(calc.getDisplay(), "0");
    assert.equal(calc.getMemory(), 100);
    assert.equal(calc.hasMemory(), true);

    // Sign toggle on display does not alter stored memory
    calc.inputDigit("7");
    calc.toggleSign();
    assert.equal(calc.getDisplay(), "-7");
    assert.equal(calc.getMemory(), 100);

    // Recalled memory
    calc.memoryRecall();
    assert.equal(calc.getDisplay(), "100");
  });
});

