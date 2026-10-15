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

  describe("9. Calculation History Tape & Recall (CASE-HIST-01 to CASE-HIST-08)", () => {
    it("should record completed calculations into history buffer upon calculate() (CASE-HIST-01)", () => {
      const engine = new CalcEngine();
      engine.inputDigit("2");
      engine.inputOperator("+");
      engine.inputDigit("3");
      const result = engine.calculate();
      assert.equal(result, "5");

      const history = engine.getHistory();
      assert.equal(history.length, 1);
      assert.equal(history[0].operand1, 2);
      assert.equal(history[0].operator, "+");
      assert.equal(history[0].operand2, 3);
      assert.equal(history[0].result, 5);
      assert.equal(history[0].expression, "2 + 3 = 5");
      assert.ok(history[0].timestamp > 0);
    });

    it("should record intermediate calculations into history on chained operator inputs (CASE-HIST-02)", () => {
      const engine = new CalcEngine();
      engine.inputDigit("1");
      engine.inputDigit("0");
      engine.inputOperator("+");
      engine.inputDigit("5");
      engine.inputOperator("*"); // records 10 + 5 = 15
      assert.equal(engine.getHistory().length, 1);
      assert.equal(engine.getHistory()[0].expression, "10 + 5 = 15");

      engine.inputDigit("2");
      engine.calculate(); // records 15 * 2 = 30
      const history = engine.getHistory();
      assert.equal(history.length, 2);
      assert.equal(history[1].expression, "15 * 2 = 30");
      assert.equal(history[1].result, 30);
    });

    it("should reject error calculations from history tape on division by zero (CASE-HIST-03, NEVER-CALC-007)", () => {
      const engine = new CalcEngine();
      engine.inputDigit("8");
      engine.inputOperator("/");
      engine.inputDigit("0");
      const result = engine.calculate();
      assert.equal(result, "Cannot divide by zero");
      assert.equal(engine.getHistory().length, 0);

      // Chained division by zero
      const chainedEngine = new CalcEngine();
      chainedEngine.inputDigit("4");
      chainedEngine.inputOperator("+");
      chainedEngine.inputDigit("6");
      chainedEngine.inputOperator("/"); // records 4 + 6 = 10
      assert.equal(chainedEngine.getHistory().length, 1);

      chainedEngine.inputDigit("0");
      chainedEngine.inputOperator("*"); // triggers division by zero
      assert.equal(chainedEngine.getDisplay(), "Cannot divide by zero");
      assert.equal(chainedEngine.getHistory().length, 1); // 10 / 0 was rejected
    });

    it("should enforce bounded capacity of 50 entries with FIFO eviction (CASE-HIST-04, RULE-CALC-005)", () => {
      const engine = new CalcEngine();
      for (let i = 1; i <= 55; i++) {
        engine.inputDigit(String(i % 10));
        engine.inputOperator("+");
        engine.inputDigit("1");
        engine.calculate();
      }

      const history = engine.getHistory();
      assert.equal(history.length, 50);
      // Entry 51 pushed; entries 1..5 shifted out; entry 6 is now first
      assert.ok(history[0].timestamp <= history[49].timestamp);
    });

    it("should recall calculation result into active buffer and allow chained operations (CASE-HIST-05)", () => {
      const engine = new CalcEngine();
      engine.inputDigit("1");
      engine.inputDigit("2");
      engine.inputOperator("+");
      engine.inputDigit("1");
      engine.inputDigit("3");
      engine.calculate(); // 12 + 13 = 25

      engine.clear();
      assert.equal(engine.getDisplay(), "0");

      const recalled = engine.recallHistory(0);
      assert.ok(recalled !== null);
      assert.equal(recalled.result, 25);
      assert.equal(engine.getDisplay(), "25");

      // Chained calculation with recalled result
      engine.inputOperator("+");
      engine.inputDigit("5");
      assert.equal(engine.calculate(), "30");
    });

    it("should start fresh operand when typing digit after recallHistory in idle state", () => {
      const engine = new CalcEngine();
      engine.inputDigit("1");
      engine.inputDigit("2");
      engine.inputOperator("+");
      engine.inputDigit("1");
      engine.inputDigit("3");
      engine.calculate(); // 12 + 13 = 25

      engine.clear();
      engine.recallHistory(0);
      assert.equal(engine.getDisplay(), "25");

      // Typing a digit in idle state starts a fresh operand rather than appending
      engine.inputDigit("3");
      assert.equal(engine.getDisplay(), "3");
    });

    it("should allow recallHistory as second operand during active pending operation", () => {
      const engine = new CalcEngine();
      engine.inputDigit("1");
      engine.inputDigit("2");
      engine.inputOperator("+");
      engine.inputDigit("1");
      engine.inputDigit("3");
      engine.calculate(); // 12 + 13 = 25

      engine.allClear();
      engine.inputDigit("1");
      engine.inputDigit("0");
      engine.inputOperator("+"); // pendingOperator is "+"
      engine.recallHistory(0);
      assert.equal(engine.getDisplay(), "25");
      assert.equal(engine.calculate(), "35");
    });

    it("should safely handle out-of-bounds or invalid history indices without modifying buffer (CASE-HIST-06, REC-HIST-01)", () => {
      const engine = new CalcEngine();
      engine.inputDigit("7");

      assert.equal(engine.recallHistory(-1), null);
      assert.equal(engine.recallHistory(99), null);
      assert.equal(engine.recallHistory(Number.NaN), null);
      assert.equal(engine.recallHistory(1.5), null);
      assert.equal(engine.getDisplay(), "7");
    });

    it("should preserve history tape across Clear Entry (C) and All Clear (AC) (CASE-HIST-07, NEVER-CALC-008)", () => {
      const engine = new CalcEngine();
      engine.inputDigit("5");
      engine.inputOperator("+");
      engine.inputDigit("5");
      engine.calculate(); // 10

      engine.inputDigit("4");
      engine.clear(); // C
      assert.equal(engine.getHistory().length, 1);
      assert.equal(engine.getDisplay(), "0");

      engine.allClear(); // AC
      assert.equal(engine.getHistory().length, 1);
      assert.equal(engine.getDisplay(), "0");
      assert.equal(engine.getHistory()[0].expression, "5 + 5 = 10");
    });

    it("should completely clear history tape with clearHistory() (CASE-HIST-08)", () => {
      const engine = new CalcEngine();
      engine.inputDigit("9");
      engine.inputOperator("*");
      engine.inputDigit("9");
      engine.calculate();
      assert.equal(engine.getHistory().length, 1);

      engine.clearHistory();
      assert.equal(engine.getHistory().length, 0);
      assert.equal(engine.getState().history.length, 0);
    });

    it("should reject recallHistory when engine is locked in error state (STL-HIST-09)", () => {
      const engine = new CalcEngine();
      engine.inputDigit("4");
      engine.inputOperator("+");
      engine.inputDigit("4");
      engine.calculate(); // 8

      engine.inputDigit("1");
      engine.inputOperator("/");
      engine.inputDigit("0");
      engine.calculate(); // locked
      assert.equal(engine.getDisplay(), "Cannot divide by zero");

      assert.equal(engine.recallHistory(0), null);
      assert.equal(engine.getDisplay(), "Cannot divide by zero");
    });

    it("should not record history when calculate is invoked without a pending operator (STL-HIST-06)", () => {
      const engine = new CalcEngine();
      engine.inputDigit("7");
      assert.equal(engine.calculate(), "7");
      assert.equal(engine.getHistory().length, 0);
    });
  });

  describe("10. Scientific Operations & Angle Modes (CASE-SCI-01 to CASE-SCI-08)", () => {
    it("should initialize in DEG mode and toggle between DEG and RAD (CASE-SCI-01)", () => {
      const engine = new CalcEngine();
      assert.equal(engine.getAngleMode(), "DEG");
      assert.equal(engine.getState().angleMode, "DEG");

      assert.equal(engine.toggleAngleMode(), "RAD");
      assert.equal(engine.getAngleMode(), "RAD");
      assert.equal(engine.getState().angleMode, "RAD");

      assert.equal(engine.toggleAngleMode(), "DEG");
      assert.equal(engine.getAngleMode(), "DEG");
    });

    it("should preserve active buffer, memory, and history across angle mode toggle (NEVER-CALC-002)", () => {
      const engine = new CalcEngine();
      engine.inputDigit("4");
      engine.inputDigit("2");
      engine.memoryAdd();
      assert.equal(engine.getDisplay(), "42");

      engine.toggleAngleMode();
      assert.equal(engine.getDisplay(), "42");
      assert.equal(engine.hasMemory(), true);
      assert.equal(engine.getMemoryValue(), 42);
    });

    it("should evaluate trigonometric functions in DEG mode (CASE-SCI-02)", () => {
      const engine = new CalcEngine();
      // sin(30) = 0.5
      engine.inputDigit("3");
      engine.inputDigit("0");
      engine.sin();
      assert.equal(engine.getDisplay(), "0.5");

      // sin(90) = 1
      engine.clear();
      engine.inputDigit("9");
      engine.inputDigit("0");
      engine.sin();
      assert.equal(engine.getDisplay(), "1");

      // sin(180) = 0
      engine.clear();
      engine.inputDigit("1");
      engine.inputDigit("8");
      engine.inputDigit("0");
      engine.sin();
      assert.equal(engine.getDisplay(), "0");

      // cos(60) = 0.5
      engine.clear();
      engine.inputDigit("6");
      engine.inputDigit("0");
      engine.cos();
      assert.equal(engine.getDisplay(), "0.5");

      // cos(90) = 0
      engine.clear();
      engine.inputDigit("9");
      engine.inputDigit("0");
      engine.cos();
      assert.equal(engine.getDisplay(), "0");

      // tan(45) = 1
      engine.clear();
      engine.inputDigit("4");
      engine.inputDigit("5");
      engine.tan();
      assert.equal(engine.getDisplay(), "1");

      // tan(0) = 0
      engine.clear();
      engine.inputDigit("0");
      engine.tan();
      assert.equal(engine.getDisplay(), "0");
    });

    it("should evaluate trigonometric functions in RAD mode (CASE-SCI-03)", () => {
      const engine = new CalcEngine();
      engine.toggleAngleMode(); // switch to RAD
      assert.equal(engine.getAngleMode(), "RAD");

      // sin(0) = 0
      engine.inputDigit("0");
      engine.sin();
      assert.equal(engine.getDisplay(), "0");

      // cos(0) = 1
      engine.clear();
      engine.inputDigit("0");
      engine.cos();
      assert.equal(engine.getDisplay(), "1");

      // cos(pi) = -1
      engine.clear();
      engine.inputConstant("pi");
      engine.cos();
      assert.equal(engine.getDisplay(), "-1");
    });

    it("should evaluate power operations x^y and x² (CASE-SCI-04)", () => {
      const engine = new CalcEngine();
      // 2 ^ 3 = 8
      engine.inputDigit("2");
      engine.inputOperator("^");
      engine.inputDigit("3");
      assert.equal(engine.calculate(), "8");

      // 5² = 25
      engine.clear();
      engine.inputDigit("5");
      engine.square();
      assert.equal(engine.getDisplay(), "25");

      // 10 ^ -1 = 0.1 via decimal
      engine.clear();
      engine.inputDigit("1");
      engine.inputDigit("0");
      engine.inputOperator("^");
      engine.inputDigit("2");
      assert.equal(engine.calculate(), "100");
    });

    it("should evaluate square root and reciprocal (CASE-SCI-05)", () => {
      const engine = new CalcEngine();
      // sqrt(16) = 4
      engine.inputDigit("1");
      engine.inputDigit("6");
      engine.sqrt();
      assert.equal(engine.getDisplay(), "4");

      // sqrt(0) = 0
      engine.clear();
      engine.inputDigit("0");
      engine.sqrt();
      assert.equal(engine.getDisplay(), "0");

      // 1/4 = 0.25
      engine.clear();
      engine.inputDigit("4");
      engine.reciprocal();
      assert.equal(engine.getDisplay(), "0.25");
    });

    it("should evaluate natural logarithm and common logarithm (CASE-SCI-06)", () => {
      const engine = new CalcEngine();
      // ln(1) = 0
      engine.inputDigit("1");
      engine.ln();
      assert.equal(engine.getDisplay(), "0");

      // ln(e) = 1
      engine.clear();
      engine.inputConstant("e");
      engine.ln();
      assert.equal(engine.getDisplay(), "1");

      // log(100) = 2
      engine.clear();
      engine.inputDigit("1");
      engine.inputDigit("0");
      engine.inputDigit("0");
      engine.log();
      assert.equal(engine.getDisplay(), "2");

      // log(1) = 0
      engine.clear();
      engine.inputDigit("1");
      engine.log();
      assert.equal(engine.getDisplay(), "0");
    });

    it("should insert mathematical constants pi and e into buffer (CASE-SCI-07)", () => {
      const engine = new CalcEngine();
      engine.inputConstant("pi");
      assert.equal(engine.getDisplay(), "3.1415926536");

      // Subsequent digit entry starts fresh operand
      engine.inputDigit("9");
      assert.equal(engine.getDisplay(), "9");

      engine.clear();
      engine.inputConstant("e");
      assert.equal(engine.getDisplay(), "2.7182818285");
    });

    it("should handle domain boundary errors and lock input (CASE-SCI-08)", () => {
      const engine = new CalcEngine();

      // sqrt(-4) -> Invalid input
      engine.inputDigit("0");
      engine.inputOperator("-");
      engine.inputDigit("4");
      assert.equal(engine.calculate(), "-4");
      engine.sqrt();
      assert.equal(engine.getDisplay(), "Invalid input");
      assert.equal(engine.getState().isLocked, true);

      // Input rejected while locked
      engine.inputDigit("5");
      assert.equal(engine.getDisplay(), "Invalid input");

      // Clear unlocks engine
      engine.clear();
      assert.equal(engine.getDisplay(), "0");
      assert.equal(engine.getState().isLocked, false);

      // ln(0) -> Invalid input
      engine.inputDigit("0");
      engine.ln();
      assert.equal(engine.getDisplay(), "Invalid input");
      assert.equal(engine.getState().isLocked, true);

      engine.allClear();
      assert.equal(engine.getDisplay(), "0");

      // log(0) -> Invalid input
      engine.inputDigit("0");
      engine.log();
      assert.equal(engine.getDisplay(), "Invalid input");
      assert.equal(engine.getState().isLocked, true);

      engine.clear();

      // reciprocal(0) -> Cannot divide by zero
      engine.inputDigit("0");
      engine.reciprocal();
      assert.equal(engine.getDisplay(), "Cannot divide by zero");
      assert.equal(engine.getState().isLocked, true);

      engine.clear();

      // tan(90) in DEG -> Invalid input
      engine.inputDigit("9");
      engine.inputDigit("0");
      engine.tan();
      assert.equal(engine.getDisplay(), "Invalid input");
      assert.equal(engine.getState().isLocked, true);

      engine.clear();

      // 0 ^ -2 -> Cannot divide by zero
      engine.allClear();
      engine.inputDigit("2");
      engine.memorySubtract(); // memory = -2
      engine.allClear();
      engine.inputDigit("0");
      engine.inputOperator("^");
      engine.memoryRecall(); // buffer is "-2"
      assert.equal(engine.calculate(), "Cannot divide by zero");

      engine.clear();

      // (-4) ^ 0.5 -> Invalid input
      engine.inputDigit("0");
      engine.inputOperator("-");
      engine.inputDigit("4");
      engine.inputOperator("^");
      engine.inputDigit("0");
      engine.inputDecimal();
      engine.inputDigit("5");
      assert.equal(engine.calculate(), "Invalid input");
    });

    it("should support chained operations with scientific functions", () => {
      const engine = new CalcEngine();
      // 10 + sin(30) = 10.5
      engine.inputDigit("1");
      engine.inputDigit("0");
      engine.inputOperator("+");
      engine.inputDigit("3");
      engine.inputDigit("0");
      engine.sin(); // 0.5
      assert.equal(engine.calculate(), "10.5");

      // 2 + 5² = 27
      engine.clear();
      engine.inputDigit("2");
      engine.inputOperator("+");
      engine.inputDigit("5");
      engine.square(); // 25
      assert.equal(engine.calculate(), "27");
    });
  });
});

