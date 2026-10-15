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

  describe("9b. Audit Tape Export Serialization (CASE-EXP-01 to CASE-EXP-05, RULE-EXP-001)", () => {
    it("should export empty history tape to CSV with header row only (CASE-EXP-05)", () => {
      const engine = new CalcEngine();
      const csv = engine.exportHistoryToCSV();
      assert.equal(csv, "timestamp,expression,result\n");

      // With includeHeader: false
      const noHeaderCsv = engine.exportHistoryToCSV({ includeHeader: false });
      assert.equal(noHeaderCsv, "");
    });

    it("should export empty history tape to formatted text with friendly notice (CASE-EXP-05)", () => {
      const engine = new CalcEngine();
      const text = engine.exportHistoryToText();
      assert.equal(text, "(No calculation entries recorded)\n");
    });

    it("should export calculation records to standard RFC 4180 CSV (CASE-EXP-01, CASE-EXP-03)", () => {
      const engine = new CalcEngine();
      engine.inputDigit("2");
      engine.inputOperator("+");
      engine.inputDigit("3");
      engine.calculate(); // 2 + 3 = 5

      engine.inputDigit("1");
      engine.inputDigit("0");
      engine.inputOperator("*");
      engine.inputDigit("4");
      engine.calculate(); // 10 * 4 = 40

      const csv = engine.exportHistoryToCSV();
      const lines = csv.trim().split("\n");
      assert.equal(lines.length, 3);
      assert.equal(lines[0], "timestamp,expression,result");

      const [ts1, expr1, res1] = lines[1].split(",");
      assert.ok(!Number.isNaN(Date.parse(ts1)));
      assert.equal(expr1, "2 + 3 = 5");
      assert.equal(res1, "5");

      const [ts2, expr2, res2] = lines[2].split(",");
      assert.ok(!Number.isNaN(Date.parse(ts2)));
      assert.equal(expr2, "10 * 4 = 40");
      assert.equal(res2, "40");
    });

    it("should escape commas, quotes, and newlines in CSV per RFC 4180 (CASE-EXP-02, NEVER-EXP-001)", () => {
      const engine = new CalcEngine();
      // Inject record with special chars into history to test edge-case escaping
      (engine as any).history.push({
        operand1: 2000,
        operator: "+",
        operand2: 500,
        result: 2500,
        timestamp: 1700000000000,
        expression: 'format("2,000 + 500") = 2500',
      });

      const csv = engine.exportHistoryToCSV();
      const lines = csv.trim().split("\n");
      assert.equal(lines.length, 2);
      assert.equal(lines[1], '2023-11-14T22:13:20.000Z,"format(""2,000 + 500"") = 2500",2500');
    });

    it("should support custom delimiter in exportHistoryToCSV", () => {
      const engine = new CalcEngine();
      engine.inputDigit("7");
      engine.inputOperator("*");
      engine.inputDigit("6");
      engine.calculate(); // 7 * 6 = 42

      const tsv = engine.exportHistoryToCSV({ delimiter: "\t" });
      const lines = tsv.trim().split("\n");
      assert.equal(lines[0], "timestamp\texpression\tresult");
      const parts = lines[1].split("\t");
      assert.equal(parts.length, 3);
      assert.equal(parts[1], "7 * 6 = 42");
      assert.equal(parts[2], "42");
    });

    it("should export calculation records to human-readable plain text (CASE-EXP-04)", () => {
      const engine = new CalcEngine();
      engine.inputDigit("5");
      engine.inputOperator("+");
      engine.inputDigit("5");
      engine.calculate(); // 5 + 5 = 10

      engine.inputDigit("2");
      engine.inputDigit("0");
      engine.inputOperator("/");
      engine.inputDigit("4");
      engine.calculate(); // 20 / 4 = 5

      const text = engine.exportHistoryToText();
      const lines = text.trim().split("\n");
      assert.equal(lines.length, 2);

      const regex = /^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} UTC\] (.+)$/;
      assert.match(lines[0], regex);
      assert.ok(lines[0].endsWith("5 + 5 = 10"));
      assert.match(lines[1], regex);
      assert.ok(lines[1].endsWith("20 / 4 = 5"));
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

  describe("11. Programmer Radix Mode & Bitwise Operations (CASE-PROG-01 to CASE-PROG-07, CASE-PROG-09, CASE-PROG-10)", () => {
    it("should initialize in DEC mode, 64-bit word size, and return initial multiRadixState (CASE-PROG-02)", () => {
      const engine = new CalcEngine();
      engine.setProgrammerMode(true);
      assert.equal(engine.isProgrammerModeActive(), true);
      assert.equal(engine.getRadix(), "DEC");
      assert.equal(engine.getWordSize(), 64);

      const state = engine.getMultiRadixState();
      assert.deepEqual(state, {
        hex: "0",
        dec: "0",
        oct: "0",
        bin: "0",
      });
    });

    it("should format multiRadix representations for positive values (CASE-PROG-01)", () => {
      const engine = new CalcEngine();
      engine.setProgrammerMode(true);
      // Input 255 in DEC
      engine.inputDigit("2");
      engine.inputDigit("5");
      engine.inputDigit("5");
      assert.equal(engine.getDisplay(), "255");

      const state = engine.getMultiRadixState();
      assert.equal(state.hex, "FF");
      assert.equal(state.dec, "255");
      assert.equal(state.oct, "377");
      assert.equal(state.bin, "11111111");
    });

    it("should format signed vs unsigned representations for negative values across word sizes (CASE-PROG-07)", () => {
      const engine = new CalcEngine();
      engine.setProgrammerMode(true);
      engine.setWordSize(8);

      // 0 - 1 = -1 in 8-bit
      engine.inputDigit("0");
      engine.inputOperator("-");
      engine.inputDigit("1");
      const res = engine.calculate();
      assert.equal(res, "-1");

      const state8 = engine.getMultiRadixState();
      assert.equal(state8.hex, "FF");
      assert.equal(state8.dec, "-1");
      assert.equal(state8.oct, "377");
      assert.equal(state8.bin, "11111111");

      // Switch to 16-bit
      engine.setWordSize(16);
      engine.clear();
      engine.inputDigit("0");
      engine.inputOperator("-");
      engine.inputDigit("1");
      engine.calculate();

      const state16 = engine.getMultiRadixState();
      assert.equal(state16.hex, "FFFF");
      assert.equal(state16.dec, "-1");
      assert.equal(state16.oct, "177777");
      assert.equal(state16.bin, "1111111111111111");
    });

    it("should evaluate bitwise AND (&) operations (CASE-PROG-03)", () => {
      const engine = new CalcEngine();
      engine.setProgrammerMode(true);
      // 12 & 10 = 8 (1100 & 1010 = 1000)
      engine.inputDigit("1");
      engine.inputDigit("2");
      engine.inputOperator("&");
      engine.inputDigit("1");
      engine.inputDigit("0");
      const result = engine.calculate();
      assert.equal(result, "8");
      assert.equal(engine.getDisplay(), "8");

      const state = engine.getMultiRadixState();
      assert.equal(state.bin, "1000");
      assert.equal(state.hex, "8");
    });

    it("should evaluate bitwise OR (|) operations (CASE-PROG-03)", () => {
      const engine = new CalcEngine();
      engine.setProgrammerMode(true);
      // 12 | 10 = 14 (1100 | 1010 = 1110)
      engine.inputDigit("1");
      engine.inputDigit("2");
      engine.inputOperator("|");
      engine.inputDigit("1");
      engine.inputDigit("0");
      const result = engine.calculate();
      assert.equal(result, "14");

      const state = engine.getMultiRadixState();
      assert.equal(state.bin, "1110");
      assert.equal(state.hex, "E");
    });

    it("should evaluate bitwise XOR (^) operations (CASE-PROG-04)", () => {
      const engine = new CalcEngine();
      engine.setProgrammerMode(true);
      // 12 ^ 10 = 6 (1100 ^ 1010 = 0110)
      engine.inputDigit("1");
      engine.inputDigit("2");
      engine.inputOperator("^");
      engine.inputDigit("1");
      engine.inputDigit("0");
      const result = engine.calculate();
      assert.equal(result, "6");

      const state = engine.getMultiRadixState();
      assert.equal(state.bin, "110");
      assert.equal(state.hex, "6");
    });

    it("should evaluate bitwise unary NOT (~) within word size (CASE-PROG-04)", () => {
      const engine = new CalcEngine();
      engine.setProgrammerMode(true);
      engine.setWordSize(8);

      // ~0 in 8-bit mode is 0xFF (-1 signed)
      engine.inputDigit("0");
      engine.bitwiseNot();
      assert.equal(engine.getDisplay(), "-1");

      const state = engine.getMultiRadixState();
      assert.equal(state.hex, "FF");
      assert.equal(state.bin, "11111111");
      assert.equal(state.oct, "377");
      assert.equal(state.dec, "-1");
    });

    it("should evaluate bitwise left shift (<< / LSH) and right shift (>> / RSH) (CASE-PROG-05)", () => {
      const engine = new CalcEngine();
      engine.setProgrammerMode(true);

      // 5 << 2 = 20
      engine.inputDigit("5");
      engine.inputOperator("<<");
      engine.inputDigit("2");
      assert.equal(engine.calculate(), "20");

      // 20 >> 2 = 5
      engine.clear();
      engine.inputDigit("2");
      engine.inputDigit("0");
      engine.inputOperator(">>");
      engine.inputDigit("2");
      assert.equal(engine.calculate(), "5");
    });

    it("should clamp shift operand to valid range [0, wordSize - 1] (STL-PROG-02)", () => {
      const engine = new CalcEngine();
      engine.setProgrammerMode(true);
      engine.setWordSize(8);

      // 1 << 10 should clamp to 1 << 7 in 8-bit = 128 (0x80)
      engine.inputDigit("1");
      engine.inputOperator("LSH");
      engine.inputDigit("1");
      engine.inputDigit("0");
      engine.calculate();

      const state = engine.getMultiRadixState();
      assert.equal(state.hex, "80");
      assert.equal(state.bin, "10000000");
    });

    it("should enforce word size clamping and overflow truncation across 8, 16, 32, and 64-bit modes (CASE-PROG-06)", () => {
      const engine = new CalcEngine();
      engine.setProgrammerMode(true);
      engine.setWordSize(8);

      // 200 + 100 = 300; in 8-bit unsigned: 300 % 256 = 44
      engine.inputDigit("2");
      engine.inputDigit("0");
      engine.inputDigit("0");
      engine.inputOperator("+");
      engine.inputDigit("1");
      engine.inputDigit("0");
      engine.inputDigit("0");
      const result = engine.calculate();
      assert.equal(result, "44");

      const state = engine.getMultiRadixState();
      assert.equal(state.dec, "44");
      assert.equal(state.hex, "2C");
      assert.equal(state.bin, "101100");
    });

    it("should preserve active buffer value across radix base switches mid-entry (CASE-PROG-09, NEVER-CALC-002)", () => {
      const engine = new CalcEngine();
      engine.setProgrammerMode(true);
      engine.inputDigit("2");
      engine.inputDigit("5");
      engine.inputDigit("5");
      assert.equal(engine.getDisplay(), "255");

      // Switch to HEX -> display "FF"
      engine.setRadix("HEX");
      assert.equal(engine.getDisplay(), "FF");
      assert.equal(engine.getRadix(), "HEX");

      // Switch to BIN -> display "11111111"
      engine.setRadix("BIN");
      assert.equal(engine.getDisplay(), "11111111");

      // Switch to OCT -> display "377"
      engine.setRadix("OCT");
      assert.equal(engine.getDisplay(), "377");

      // Switch back to DEC -> display "255"
      engine.setRadix("DEC");
      assert.equal(engine.getDisplay(), "255");
    });

    it("should enforce active radix keypad gating and ignore invalid characters (CASE-PROG-10, RULE-PROG-003)", () => {
      const engine = new CalcEngine();
      engine.setProgrammerMode(true);

      // 1. In BIN mode, only 0 and 1 are accepted
      engine.setRadix("BIN");
      engine.inputDigit("1");
      engine.inputDigit("0");
      engine.inputDigit("2"); // Ignored
      engine.inputDigit("9"); // Ignored
      engine.inputDigit("A"); // Ignored
      engine.inputDecimal(); // Ignored per RULE-PROG-003
      assert.equal(engine.getDisplay(), "10");

      // 2. In OCT mode, only 0-7 are accepted
      engine.clear();
      engine.setRadix("OCT");
      engine.inputDigit("7");
      engine.inputDigit("5");
      engine.inputDigit("8"); // Ignored
      engine.inputDigit("9"); // Ignored
      engine.inputDigit("F"); // Ignored
      assert.equal(engine.getDisplay(), "75");

      // 3. In HEX mode, 0-9 and A-F are accepted
      engine.clear();
      engine.setRadix("HEX");
      engine.inputDigit("A");
      engine.inputDigit("b"); // Converted to 'B'
      engine.inputDigit("F");
      engine.inputDigit("3");
      engine.inputDigit("G"); // Ignored
      assert.equal(engine.getDisplay(), "ABF3");

      // 4. In DEC mode, 0-9 accepted, A-F ignored
      engine.clear();
      engine.setRadix("DEC");
      engine.inputDigit("9");
      engine.inputDigit("8");
      engine.inputDigit("C"); // Ignored
      assert.equal(engine.getDisplay(), "98");
    });

    it("should handle integer division by zero and lock engine (STL-PROG-01, NEVER-CALC-003)", () => {
      const engine = new CalcEngine();
      engine.setProgrammerMode(true);
      engine.inputDigit("1");
      engine.inputDigit("5");
      engine.inputOperator("/");
      engine.inputDigit("0");
      assert.equal(engine.calculate(), "Cannot divide by zero");
      assert.equal(engine.getState().isLocked, true);

      // Locked engine ignores further input until unlocked
      engine.inputDigit("5");
      assert.equal(engine.getDisplay(), "Cannot divide by zero");

      engine.clear();
      assert.equal(engine.getState().isLocked, false);
      assert.equal(engine.getDisplay(), "0");
    });

    it("should support chained bitwise operations with intermediate evaluation", () => {
      const engine = new CalcEngine();
      engine.setProgrammerMode(true);
      // 12 & 10 = 8; 8 | 1 = 9
      engine.inputDigit("1");
      engine.inputDigit("2");
      engine.inputOperator("&");
      engine.inputDigit("1");
      engine.inputDigit("0");
      engine.inputOperator("|"); // Immediate evaluation: 12 & 10 = 8
      assert.equal(engine.getDisplay(), "8");

      engine.inputDigit("1");
      assert.equal(engine.calculate(), "9");
    });

    it("should replace consecutive bitwise operators (e.g. 10 & | 2 = 10 | 2 = 10)", () => {
      const engine = new CalcEngine();
      engine.setProgrammerMode(true);
      // 10 & | 2 = 10 | 2 = 10
      engine.inputDigit("1");
      engine.inputDigit("0");
      engine.inputOperator("&");
      engine.inputOperator("|"); // Replaces & with |
      engine.inputDigit("2");
      assert.equal(engine.calculate(), "10");
    });
  });

  describe("12. Formula Expression & Parentheses Precedence (CASE-EXPR-01 to CASE-EXPR-10)", () => {
    it("should maintain live formula expression string and parentheses depth (CASE-EXPR-01)", () => {
      const engine = new CalcEngine();
      engine.inputDigit("2");
      engine.inputOperator("*");
      engine.inputParenthesis("(");
      engine.inputDigit("3");
      engine.inputOperator("+");
      engine.inputDigit("4");

      const state = engine.getState();
      assert.equal(state.parenDepth, 1);
      assert.equal(engine.getExpression(), "2 * (3 + 4");
    });

    it("should evaluate parentheses expressions with auto-closing on calculate() (CASE-EXPR-04)", () => {
      const engine = new CalcEngine();
      engine.inputDigit("2");
      engine.inputOperator("*");
      engine.inputParenthesis("(");
      engine.inputDigit("3");
      engine.inputOperator("+");
      engine.inputDigit("4");

      assert.equal(engine.calculate(), "14");
      assert.equal(engine.getState().parenDepth, 0);
      assert.ok(engine.getExpression().includes("14"));
    });

    it("should evaluate multi-level nested parentheses expressions (CASE-EXPR-02)", () => {
      const engine = new CalcEngine();
      engine.inputParenthesis("(");
      engine.inputParenthesis("(");
      engine.inputDigit("2");
      engine.inputOperator("+");
      engine.inputDigit("3");
      engine.inputParenthesis(")");
      engine.inputOperator("*");
      engine.inputDigit("2");
      engine.inputParenthesis(")");

      assert.equal(engine.calculate(), "10");
      assert.equal(engine.getState().parenDepth, 0);
    });

    it("should enforce BODMAS precedence in evaluateExpression() (CASE-EXPR-03)", () => {
      const engine = new CalcEngine();
      assert.equal(engine.evaluateExpression("2 + 3 * 4"), 14);
      assert.equal(engine.evaluateExpression("(2 + 3) * 4"), 20);
      assert.equal(engine.evaluateExpression("2 * 3 ^ 2"), 18);
    });

    it("should prevent division by zero in sub-expressions and lock engine (CASE-EXPR-07)", () => {
      const engine = new CalcEngine();
      engine.inputDigit("1");
      engine.inputDigit("0");
      engine.inputOperator("/");
      engine.inputParenthesis("(");
      engine.inputDigit("5");
      engine.inputOperator("-");
      engine.inputDigit("5");
      engine.inputParenthesis(")");

      assert.equal(engine.calculate(), "Cannot divide by zero");
      assert.equal(engine.getState().isLocked, true);
    });

    it("should ignore mismatched closing parenthesis when parenDepth is 0 (CASE-EXPR-08)", () => {
      const engine = new CalcEngine();
      engine.inputDigit("7");
      engine.inputParenthesis(")");
      assert.equal(engine.getState().parenDepth, 0);
      assert.equal(engine.getExpression(), "7");
    });

    it("should synchronize Clear Entry (C) and All Clear (AC) with expression preview (CASE-EXPR-10)", () => {
      const engine = new CalcEngine();
      engine.inputDigit("5");
      engine.inputOperator("+");
      engine.inputDigit("8");
      engine.clear();
      assert.equal(engine.getDisplay(), "0");

      engine.inputDigit("9");
      assert.equal(engine.calculate(), "14");

      engine.allClear();
      assert.equal(engine.getDisplay(), "0");
      assert.equal(engine.getExpression(), "");
      assert.equal(engine.getState().parenDepth, 0);
    });
  });
});


