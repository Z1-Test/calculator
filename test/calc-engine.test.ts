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
});
