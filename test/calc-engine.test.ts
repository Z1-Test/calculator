import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CalcEngine, normalizePrecision } from "../src/index.ts";

describe("Precision Arithmetic Engine (CalcEngine)", () => {
  describe("1. Initial State & Empty Buffer", () => {
    it("should initialize with display '0' and unlocked registers", () => {
      const engine = new CalcEngine();
      assert.equal(engine.getDisplay(), "0");

      const state = engine.getState();
      assert.equal(state.accumulator, null);
      assert.equal(state.currentBuffer, "0");
      assert.equal(state.pendingOperator, null);
      assert.equal(state.isWaitingForOperand, false);
      assert.equal(state.isLocked, false);
      assert.equal(state.errorMessage, null);
      assert.equal(state.display, "0");
      assert.equal(state.memory, 0);
      assert.equal(state.hasMemory, false);
    });
  });

  describe("2. Sequential Arithmetic Evaluation (Left-to-Right Pocket Calculator)", () => {
    it("should evaluate sequential arithmetic expressions correctly (2 + 3 * 4 = 20)", () => {
      const engine = new CalcEngine();
      // 2 + 3 * 4 = 20
      engine.inputDigit("2");
      engine.inputOperator("+");
      engine.inputDigit("3");
      engine.inputOperator("*"); // Triggers immediate evaluation 2 + 3 = 5
      assert.equal(engine.getDisplay(), "5");

      engine.inputDigit("4");
      const result = engine.calculate();
      assert.equal(result, "20");
      assert.equal(engine.getDisplay(), "20");
    });

    it("should evaluate basic addition (12 + 25 = 37)", () => {
      const engine = new CalcEngine();
      engine.inputDigit("1");
      engine.inputDigit("2");
      engine.inputOperator("+");
      engine.inputDigit("2");
      engine.inputDigit("5");
      assert.equal(engine.calculate(), "37");
    });

    it("should evaluate basic subtraction (100 - 42 = 58)", () => {
      const engine = new CalcEngine();
      engine.inputDigit("1");
      engine.inputDigit("0");
      engine.inputDigit("0");
      engine.inputOperator("-");
      engine.inputDigit("4");
      engine.inputDigit("2");
      assert.equal(engine.calculate(), "58");
    });

    it("should evaluate basic multiplication (7 * 8 = 56)", () => {
      const engine = new CalcEngine();
      engine.inputDigit("7");
      engine.inputOperator("*");
      engine.inputDigit("8");
      assert.equal(engine.calculate(), "56");
    });

    it("should evaluate basic division (84 / 4 = 21)", () => {
      const engine = new CalcEngine();
      engine.inputDigit("8");
      engine.inputDigit("4");
      engine.inputOperator("/");
      engine.inputDigit("4");
      assert.equal(engine.calculate(), "21");
    });

    it("should handle long chained calculations (1 + 2 + 3 + 4 + 5 = 15)", () => {
      const engine = new CalcEngine();
      const numbers = ["1", "2", "3", "4", "5"];
      for (let i = 0; i < numbers.length; i++) {
        engine.inputDigit(numbers[i]);
        if (i < numbers.length - 1) {
          engine.inputOperator("+");
        }
      }
      assert.equal(engine.calculate(), "15");
    });
  });

  describe("3. Decimal Precision & IEEE-754 Float Bug Normalization", () => {
    it("should calculate 0.1 + 0.2 equals 0.3 with clean rounding up to 10 decimal digits", () => {
      const engine = new CalcEngine();
      engine.inputDigit("0");
      engine.inputDecimal();
      engine.inputDigit("1");
      engine.inputOperator("+");
      engine.inputDigit("0");
      engine.inputDecimal();
      engine.inputDigit("2");
      assert.equal(engine.calculate(), "0.3");
      assert.equal(engine.getDisplay(), "0.3");
    });

    it("should normalize subtraction floating point precision (0.3 - 0.1 = 0.2)", () => {
      const engine = new CalcEngine();
      engine.inputDigit("0");
      engine.inputDecimal();
      engine.inputDigit("3");
      engine.inputOperator("-");
      engine.inputDigit("0");
      engine.inputDecimal();
      engine.inputDigit("1");
      assert.equal(engine.calculate(), "0.2");
    });

    it("should normalize multiplication floating point precision (0.1 * 0.2 = 0.02)", () => {
      const engine = new CalcEngine();
      engine.inputDigit("0");
      engine.inputDecimal();
      engine.inputDigit("1");
      engine.inputOperator("*");
      engine.inputDigit("0");
      engine.inputDecimal();
      engine.inputDigit("2");
      assert.equal(engine.calculate(), "0.02");
    });

    it("should round clean repeating decimals to at most 10 decimal digits (1 / 3 = 0.3333333333)", () => {
      const engine = new CalcEngine();
      engine.inputDigit("1");
      engine.inputOperator("/");
      engine.inputDigit("3");
      assert.equal(engine.calculate(), "0.3333333333");
    });

    it("normalizePrecision helper handles negative zero and zero correctly", () => {
      assert.equal(normalizePrecision(-0), 0);
      assert.equal(normalizePrecision(0), 0);
      assert.equal(normalizePrecision(0.1 + 0.2), 0.3);
    });
  });

  describe("4. Division by Zero Protection & Input Locking", () => {
    it("should return 'Cannot divide by zero' on direct calculate and lock input until cleared", () => {
      const engine = new CalcEngine();
      engine.inputDigit("5");
      engine.inputOperator("/");
      engine.inputDigit("0");
      const result = engine.calculate();

      assert.equal(result, "Cannot divide by zero");
      assert.equal(engine.getDisplay(), "Cannot divide by zero");
      assert.equal(engine.getState().isLocked, true);
      assert.equal(engine.getState().errorMessage, "Cannot divide by zero");

      // Verify input lock: further digit or operator inputs are rejected
      engine.inputDigit("9");
      assert.equal(engine.getDisplay(), "Cannot divide by zero");

      engine.inputDecimal();
      assert.equal(engine.getDisplay(), "Cannot divide by zero");

      engine.inputOperator("+");
      assert.equal(engine.getDisplay(), "Cannot divide by zero");

      assert.equal(engine.calculate(), "Cannot divide by zero");

      // Clear (C) unlocks the engine
      engine.clear();
      assert.equal(engine.getDisplay(), "0");
      assert.equal(engine.getState().isLocked, false);
      assert.equal(engine.getState().errorMessage, null);

      // Now accepting new calculations
      engine.inputDigit("8");
      engine.inputOperator("+");
      engine.inputDigit("2");
      assert.equal(engine.calculate(), "10");
    });

    it("should lock engine when division by zero occurs during chained operator input", () => {
      const engine = new CalcEngine();
      engine.inputDigit("1");
      engine.inputDigit("0");
      engine.inputOperator("/");
      engine.inputDigit("0");
      engine.inputOperator("+"); // Intermediate evaluation triggers zero-division lock

      assert.equal(engine.getDisplay(), "Cannot divide by zero");
      assert.equal(engine.getState().isLocked, true);

      // All Clear (AC) resets and unlocks
      engine.allClear();
      assert.equal(engine.getDisplay(), "0");
      assert.equal(engine.getState().isLocked, false);
    });
  });

  describe("5. Consecutive Operator Replacement", () => {
    it("should replace previous operator on consecutive operator entry (5 + * 2 = 10)", () => {
      const engine = new CalcEngine();
      engine.inputDigit("5");
      engine.inputOperator("+");
      engine.inputOperator("*"); // Overwrites '+' with '*'
      engine.inputDigit("2");
      assert.equal(engine.calculate(), "10");
    });

    it("should support multiple sequential operator replacements (10 + - * / 2 = 5)", () => {
      const engine = new CalcEngine();
      engine.inputDigit("1");
      engine.inputDigit("0");
      engine.inputOperator("+");
      engine.inputOperator("-");
      engine.inputOperator("*");
      engine.inputOperator("/"); // Final pending operator should be '/'
      engine.inputDigit("2");
      assert.equal(engine.calculate(), "5");
    });
  });

  describe("6. Clear Entry (C) vs All Clear (AC) Semantics", () => {
    it("C clears active buffer to 0 while preserving pending accumulator and operator", () => {
      const engine = new CalcEngine();
      engine.inputDigit("1");
      engine.inputDigit("0");
      engine.inputOperator("+");
      engine.inputDigit("4");

      // User realizes 4 was mistyped and presses C
      engine.clear();
      assert.equal(engine.getDisplay(), "0");

      // Verify pending accumulator (10) and operator (+) are preserved
      const state = engine.getState();
      assert.equal(state.accumulator, 10);
      assert.equal(state.pendingOperator, "+");

      // Enter corrected number 5 and evaluate
      engine.inputDigit("5");
      assert.equal(engine.calculate(), "15");
    });

    it("AC resets all registers to initial state", () => {
      const engine = new CalcEngine();
      engine.inputDigit("1");
      engine.inputDigit("0");
      engine.inputOperator("+");
      engine.inputDigit("4");

      // AC resets everything
      engine.allClear();
      assert.equal(engine.getDisplay(), "0");

      const state = engine.getState();
      assert.equal(state.accumulator, null);
      assert.equal(state.pendingOperator, null);
      assert.equal(state.currentBuffer, "0");
      assert.equal(state.isWaitingForOperand, false);
      assert.equal(state.isLocked, false);
      assert.equal(state.errorMessage, null);

      // Typing 5 now treats it as initial standalone operand
      engine.inputDigit("5");
      assert.equal(engine.calculate(), "5");
    });
  });

  describe("7. Input Formatting & Edge Cases", () => {
    it("should collapse multiple leading zeros into a single zero", () => {
      const engine = new CalcEngine();
      engine.inputDigit("0");
      engine.inputDigit("0");
      engine.inputDigit("0");
      assert.equal(engine.getDisplay(), "0");

      engine.inputDigit("7");
      assert.equal(engine.getDisplay(), "7");
    });

    it("should prefix decimal point with '0.' when pressed on fresh/empty buffer", () => {
      const engine = new CalcEngine();
      engine.inputDecimal();
      assert.equal(engine.getDisplay(), "0.");
      engine.inputDigit("5");
      assert.equal(engine.getDisplay(), "0.5");
    });

    it("should prefix decimal point with '0.' when pressed after an operator", () => {
      const engine = new CalcEngine();
      engine.inputDigit("2");
      engine.inputOperator("+");
      engine.inputDecimal();
      assert.equal(engine.getDisplay(), "0.");
      engine.inputDigit("5");
      assert.equal(engine.calculate(), "2.5");
    });

    it("should ignore redundant decimal points in active buffer", () => {
      const engine = new CalcEngine();
      engine.inputDigit("3");
      engine.inputDecimal();
      engine.inputDigit("1");
      engine.inputDecimal(); // Redundant, ignored
      engine.inputDigit("4");
      assert.equal(engine.getDisplay(), "3.14");
    });

    it("should ignore non-numeric digit inputs", () => {
      const engine = new CalcEngine();
      engine.inputDigit("a");
      engine.inputDigit("!");
      engine.inputDigit(" ");
      assert.equal(engine.getDisplay(), "0");
    });

    it("should cap buffer to 16 significant digits", () => {
      const engine = new CalcEngine();
      for (let i = 0; i < 20; i++) {
        engine.inputDigit("9");
      }
      assert.equal(engine.getDisplay().length, 16);
    });

    it("should allow repeating calculate without side-effects", () => {
      const engine = new CalcEngine();
      engine.inputDigit("4");
      engine.inputOperator("*");
      engine.inputDigit("5");
      assert.equal(engine.calculate(), "20");
      assert.equal(engine.calculate(), "20");
    });

    it("should handle calculate when no operator was entered", () => {
      const engine = new CalcEngine();
      engine.inputDigit("4");
      engine.inputDigit("2");
      assert.equal(engine.calculate(), "42");
    });
  });

  describe("8. Memory Registers & Persistence (M+, M-, MR, MC)", () => {
    it("should initialize with memory = 0 and hasMemory() = false", () => {
      const engine = new CalcEngine();
      assert.equal(engine.getMemoryValue(), 0);
      assert.equal(engine.hasMemory(), false);
    });

    it("should add to memory with M+ and set hasMemory to true", () => {
      const engine = new CalcEngine();
      engine.inputDigit("4");
      engine.inputDigit("2");
      engine.memoryAdd();
      assert.equal(engine.getMemoryValue(), 42);
      assert.equal(engine.hasMemory(), true);
      // Display value should be preserved
      assert.equal(engine.getDisplay(), "42");
    });

    it("should start fresh operand for next digit entry after M+", () => {
      const engine = new CalcEngine();
      engine.inputDigit("5");
      engine.memoryAdd();
      engine.inputDigit("3");
      assert.equal(engine.getDisplay(), "3");
    });

    it("should accumulate running totals across multiple M+ calls", () => {
      const engine = new CalcEngine();
      engine.inputDigit("1");
      engine.inputDigit("5");
      engine.memoryAdd(); // memory = 15
      engine.inputDigit("2");
      engine.inputDigit("5");
      engine.memoryAdd(); // memory = 40
      assert.equal(engine.getMemoryValue(), 40);
      assert.equal(engine.hasMemory(), true);
    });

    it("should subtract from memory with M- and transition hasMemory to false when reaching 0", () => {
      const engine = new CalcEngine();
      engine.inputDigit("5");
      engine.inputDigit("0");
      engine.memoryAdd(); // memory = 50
      assert.equal(engine.hasMemory(), true);

      engine.inputDigit("2");
      engine.inputDigit("0");
      engine.memorySubtract(); // memory = 30
      assert.equal(engine.getMemoryValue(), 30);
      assert.equal(engine.hasMemory(), true);

      engine.inputDigit("3");
      engine.inputDigit("0");
      engine.memorySubtract(); // memory = 0
      assert.equal(engine.getMemoryValue(), 0);
      assert.equal(engine.hasMemory(), false);
    });

    it("should handle negative memory values with M- and maintain hasMemory = true", () => {
      const engine = new CalcEngine();
      engine.inputDigit("1");
      engine.inputDigit("0");
      engine.memorySubtract(); // memory = -10
      assert.equal(engine.getMemoryValue(), -10);
      assert.equal(engine.hasMemory(), true);
    });

    it("should recall memory with MR into active display buffer and allow chained operations", () => {
      const engine = new CalcEngine();
      engine.inputDigit("2");
      engine.inputDigit("5");
      engine.memoryAdd(); // memory = 25

      engine.clear();
      assert.equal(engine.getDisplay(), "0");

      engine.inputDigit("5");
      engine.inputOperator("+");
      engine.memoryRecall(); // active buffer = 25
      assert.equal(engine.getDisplay(), "25");

      const result = engine.calculate();
      assert.equal(result, "30");
      assert.equal(engine.getDisplay(), "30");
    });

    it("should safely recall 0 when memory is empty", () => {
      const engine = new CalcEngine();
      engine.memoryRecall();
      assert.equal(engine.getDisplay(), "0");
      assert.equal(engine.hasMemory(), false);
    });

    it("should reset memory register to 0 with MC", () => {
      const engine = new CalcEngine();
      engine.inputDigit("9");
      engine.inputDigit("9");
      engine.memoryAdd();
      assert.equal(engine.hasMemory(), true);

      engine.memoryClear();
      assert.equal(engine.getMemoryValue(), 0);
      assert.equal(engine.hasMemory(), false);
    });

    it("should preserve memory register across Clear Entry (C) and All Clear (AC)", () => {
      const engine = new CalcEngine();
      engine.inputDigit("1");
      engine.inputDigit("2");
      engine.inputDigit("3");
      engine.memoryAdd(); // memory = 123
      assert.equal(engine.hasMemory(), true);

      engine.inputDigit("9");
      engine.clear(); // C
      assert.equal(engine.getDisplay(), "0");
      assert.equal(engine.getMemoryValue(), 123);
      assert.equal(engine.hasMemory(), true);

      engine.allClear(); // AC
      assert.equal(engine.getDisplay(), "0");
      assert.equal(engine.getMemoryValue(), 123);
      assert.equal(engine.hasMemory(), true);
    });

    it("should normalize floating-point precision in memory register without IEEE-754 noise", () => {
      const engine = new CalcEngine();
      engine.inputDigit("0");
      engine.inputDecimal();
      engine.inputDigit("1");
      engine.memoryAdd(); // memory = 0.1

      engine.inputDigit("0");
      engine.inputDecimal();
      engine.inputDigit("2");
      engine.memoryAdd(); // memory = 0.3 (not 0.30000000000000004)

      assert.equal(engine.getMemoryValue(), 0.3);
      assert.equal(engine.hasMemory(), true);
    });

    it("should reject memory mutations when locked in error state", () => {
      const engine = new CalcEngine();
      engine.inputDigit("8");
      engine.inputOperator("/");
      engine.inputDigit("0");
      engine.calculate(); // Locks in "Cannot divide by zero"
      assert.equal(engine.getDisplay(), "Cannot divide by zero");

      engine.memoryAdd();
      assert.equal(engine.getMemoryValue(), 0);
      assert.equal(engine.hasMemory(), false);

      engine.memorySubtract();
      assert.equal(engine.getMemoryValue(), 0);
      assert.equal(engine.hasMemory(), false);

      engine.memoryRecall();
      assert.equal(engine.getDisplay(), "Cannot divide by zero");
    });
  });
});
