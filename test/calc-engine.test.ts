/**
 * test/calc-engine.test.ts
 *
 * Comprehensive unit test suite for StayCalc precision arithmetic engine.
 * Covers all 11 Universal Test Cases (CASE-01 to CASE-11) defined in
 * docs/context/features/f1-precision-arithmetic-engine/cases.md.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CalculatorEngine,
  calculatorReducer,
  createInitialState,
  evaluateBinary,
  normalizePrecision,
  DIVISION_BY_ZERO_ERROR,
} from '../src/engine/index.ts';

describe('StayCalc Precision Arithmetic Engine (F1)', () => {
  // CASE-01: Happy Path Nominal Execution
  describe('CASE-01: Happy Path Nominal Execution (RULE-CALC-007, NEVER-CALC-001)', () => {
    it('evaluates basic addition correctly (2 + 3 = 5)', () => {
      const calc = new CalculatorEngine();
      calc.pressDigit('2');
      calc.pressOperator('+');
      calc.pressDigit('3');
      calc.pressEquals();
      assert.strictEqual(calc.getState().display, '5');
    });

    it('evaluates basic subtraction correctly (10 - 4 = 6)', () => {
      const calc = new CalculatorEngine();
      calc.pressDigit('1');
      calc.pressDigit('0');
      calc.pressOperator('-');
      calc.pressDigit('4');
      calc.pressEquals();
      assert.strictEqual(calc.getState().display, '6');
    });

    it('evaluates basic multiplication correctly (6 * 7 = 42)', () => {
      const calc = new CalculatorEngine();
      calc.pressDigit('6');
      calc.pressOperator('*');
      calc.pressDigit('7');
      calc.pressEquals();
      assert.strictEqual(calc.getState().display, '42');
    });

    it('evaluates basic division correctly (20 / 4 = 5)', () => {
      const calc = new CalculatorEngine();
      calc.pressDigit('2');
      calc.pressDigit('0');
      calc.pressOperator('/');
      calc.pressDigit('4');
      calc.pressEquals();
      assert.strictEqual(calc.getState().display, '5');
    });

    it('evaluates sequential left-to-right pocket calculator order (2 + 3 * 4 = 20)', () => {
      const calc = new CalculatorEngine();
      calc.pressDigit('2');
      calc.pressOperator('+');
      calc.pressDigit('3');
      calc.pressOperator('*'); // Immediate evaluation: 2 + 3 = 5
      assert.strictEqual(calc.getState().display, '5');
      calc.pressDigit('4');
      calc.pressEquals();      // 5 * 4 = 20
      assert.strictEqual(calc.getState().display, '20');
    });
  });

  // CASE-02: Empty State & First Use
  describe('CASE-02: Empty State & First Use (RULE-CALC-009)', () => {
    it('initializes in clean ready state with display "0"', () => {
      const calc = new CalculatorEngine();
      const state = calc.getState();
      assert.strictEqual(state.display, '0');
      assert.strictEqual(state.accumulator, null);
      assert.strictEqual(state.pendingOperator, null);
      assert.strictEqual(state.waitingForOperand, false);
      assert.strictEqual(state.error, null);
      assert.strictEqual(state.isLocked, false);
    });

    it('createInitialState returns isolated clean state', () => {
      const state = createInitialState();
      assert.deepStrictEqual(state, {
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
      });
    });
  });

  // CASE-03: Error State & Input Lock (Division by Zero Safeguard)
  describe('CASE-03: Error State & Input Lock (RULE-CALC-001, NEVER-CALC-004)', () => {
    it('displays "Cannot divide by zero" and locks input on n / 0 =', () => {
      const calc = new CalculatorEngine();
      calc.pressDigit('5');
      calc.pressOperator('/');
      calc.pressDigit('0');
      calc.pressEquals();

      const state = calc.getState();
      assert.strictEqual(state.display, DIVISION_BY_ZERO_ERROR);
      assert.strictEqual(state.error, DIVISION_BY_ZERO_ERROR);
      assert.strictEqual(state.isLocked, true);
    });

    it('ignores digit, operator, and equals inputs when locked', () => {
      const calc = new CalculatorEngine();
      calc.pressDigit('5');
      calc.pressOperator('/');
      calc.pressDigit('0');
      calc.pressEquals();

      // Attempt to input while locked
      calc.pressDigit('7');
      calc.pressOperator('+');
      calc.pressDigit('3');
      calc.pressEquals();

      const state = calc.getState();
      assert.strictEqual(state.display, DIVISION_BY_ZERO_ERROR);
      assert.strictEqual(state.isLocked, true);
    });

    it('unlocks and returns to "0" when Clear (C) is pressed in error state', () => {
      const calc = new CalculatorEngine();
      calc.pressDigit('8');
      calc.pressOperator('/');
      calc.pressDigit('0');
      calc.pressEquals();

      assert.strictEqual(calc.getState().isLocked, true);
      calc.pressClear();

      const state = calc.getState();
      assert.strictEqual(state.display, '0');
      assert.strictEqual(state.isLocked, false);
      assert.strictEqual(state.error, null);
    });

    it('unlocks and resets fully when All Clear (AC) is pressed in error state', () => {
      const calc = new CalculatorEngine();
      calc.pressDigit('9');
      calc.pressOperator('/');
      calc.pressDigit('0');
      calc.pressEquals();

      assert.strictEqual(calc.getState().isLocked, true);
      calc.pressAllClear();

      const state = calc.getState();
      assert.strictEqual(state.display, '0');
      assert.strictEqual(state.isLocked, false);
      assert.strictEqual(state.accumulator, null);
      assert.strictEqual(state.pendingOperator, null);
    });
  });

  // CASE-04: Mid-Flow Operator Replacement
  describe('CASE-04: Mid-Flow Operator Replacement (RULE-CALC-008)', () => {
    it('replaces pending operator when multiple operators entered successively (5 + * 2 = 10)', () => {
      const calc = new CalculatorEngine();
      calc.pressDigit('5');
      calc.pressOperator('+');
      calc.pressOperator('*'); // Replaces '+' with '*'
      assert.strictEqual(calc.getState().pendingOperator, '*');
      calc.pressDigit('2');
      calc.pressEquals();
      assert.strictEqual(calc.getState().display, '10');
    });

    it('handles multiple operator switches (8 * + - 3 = 5)', () => {
      const calc = new CalculatorEngine();
      calc.pressDigit('8');
      calc.pressOperator('*');
      calc.pressOperator('+');
      calc.pressOperator('-'); // Replaces with '-'
      assert.strictEqual(calc.getState().pendingOperator, '-');
      calc.pressDigit('3');
      calc.pressEquals();
      assert.strictEqual(calc.getState().display, '5');
    });
  });

  // CASE-05: Idempotency & Repeated Equals
  describe('CASE-05: Idempotency & Repeated Equals (RULE-CALC-007)', () => {
    it('pressing equals repeatedly preserves evaluated result without corruption', () => {
      const calc = new CalculatorEngine();
      calc.pressDigit('5');
      calc.pressOperator('+');
      calc.pressDigit('3');
      calc.pressEquals();
      assert.strictEqual(calc.getState().display, '8');

      // Repeated equals
      calc.pressEquals();
      assert.strictEqual(calc.getState().display, '8');
      calc.pressEquals();
      assert.strictEqual(calc.getState().display, '8');
      calc.pressEquals();
      assert.strictEqual(calc.getState().display, '8');
    });
  });

  // CASE-06: Precision Normalization
  describe('CASE-06: Precision Normalization (RULE-CALC-002)', () => {
    it('eliminates IEEE 754 float representation noise for 0.1 + 0.2 = 0.3', () => {
      const calc = new CalculatorEngine();
      calc.pressDigit('0');
      calc.pressDecimal();
      calc.pressDigit('1');
      calc.pressOperator('+');
      calc.pressDigit('0');
      calc.pressDecimal();
      calc.pressDigit('2');
      calc.pressEquals();
      assert.strictEqual(calc.getState().display, '0.3');
    });

    it('eliminates float inaccuracy for 0.7 + 0.1 = 0.8', () => {
      const calc = new CalculatorEngine();
      calc.executeSequence('0.7+0.1=');
      assert.strictEqual(calc.getState().display, '0.8');
    });

    it('evaluates 0.3 - 0.2 = 0.1', () => {
      const calc = new CalculatorEngine();
      calc.executeSequence('0.3-0.2=');
      assert.strictEqual(calc.getState().display, '0.1');
    });

    it('evaluates 0.1 * 0.2 = 0.02', () => {
      const calc = new CalculatorEngine();
      calc.executeSequence('0.1*0.2=');
      assert.strictEqual(calc.getState().display, '0.02');
    });

    it('evaluates 0.3 / 0.1 = 3', () => {
      const calc = new CalculatorEngine();
      calc.executeSequence('0.3/0.1=');
      assert.strictEqual(calc.getState().display, '3');
    });
  });

  // CASE-07: Decimal Formatting & Input Handling
  describe('CASE-07: Decimal Formatting & Input Handling (RULE-CALC-002)', () => {
    it('suppresses duplicate decimal points (3.1.4 -> 3.14)', () => {
      const calc = new CalculatorEngine();
      calc.pressDigit('3');
      calc.pressDecimal();
      calc.pressDigit('1');
      calc.pressDecimal(); // Ignored
      calc.pressDigit('4');
      assert.strictEqual(calc.getState().display, '3.14');
    });

    it('prepends zero when decimal point pressed first (.5 -> 0.5)', () => {
      const calc = new CalculatorEngine();
      calc.pressDecimal();
      calc.pressDigit('5');
      assert.strictEqual(calc.getState().display, '0.5');
    });

    it('suppresses redundant leading zeros (007 -> 7)', () => {
      const calc = new CalculatorEngine();
      calc.pressDigit('0');
      calc.pressDigit('0');
      calc.pressDigit('7');
      assert.strictEqual(calc.getState().display, '7');
    });
  });

  // CASE-08: Clear Register C (Active Buffer Reset)
  describe('CASE-08: Clear Register C (RULE-CALC-009)', () => {
    it('clears active input buffer while preserving accumulator and pending operator (15 + 99 C 5 = 20)', () => {
      const calc = new CalculatorEngine();
      calc.pressDigit('1');
      calc.pressDigit('5');
      calc.pressOperator('+');
      calc.pressDigit('9');
      calc.pressDigit('9');
      assert.strictEqual(calc.getState().display, '99');

      calc.pressClear(); // Clears 99 to 0, preserves 15 +
      assert.strictEqual(calc.getState().display, '0');
      assert.strictEqual(calc.getState().accumulator, 15);
      assert.strictEqual(calc.getState().pendingOperator, '+');

      calc.pressDigit('5');
      calc.pressEquals();
      assert.strictEqual(calc.getState().display, '20');
    });
  });

  // CASE-09: All Clear Register AC (Complete Reset)
  describe('CASE-09: All Clear Register AC (RULE-CALC-009)', () => {
    it('flushes accumulator, pending operator, and buffer back to initial state', () => {
      const calc = new CalculatorEngine();
      calc.pressDigit('1');
      calc.pressDigit('5');
      calc.pressOperator('+');
      calc.pressDigit('9');
      calc.pressDigit('9');

      calc.pressAllClear();
      const state = calc.getState();
      assert.strictEqual(state.display, '0');
      assert.strictEqual(state.accumulator, null);
      assert.strictEqual(state.pendingOperator, null);
      assert.strictEqual(state.waitingForOperand, false);
      assert.strictEqual(state.error, null);
      assert.strictEqual(state.isLocked, false);
    });
  });

  // CASE-10: Negative Numbers & Sign Toggle
  describe('CASE-10: Negative Numbers & Sign Toggle (RULE-CALC-007)', () => {
    it('evaluates subtraction yielding negative result (3 - 8 = -5)', () => {
      const calc = new CalculatorEngine();
      calc.pressDigit('3');
      calc.pressOperator('-');
      calc.pressDigit('8');
      calc.pressEquals();
      assert.strictEqual(calc.getState().display, '-5');
    });

    it('toggles sign of positive number to negative and vice versa', () => {
      const calc = new CalculatorEngine();
      calc.pressDigit('5');
      calc.pressToggleSign();
      assert.strictEqual(calc.getState().display, '-5');
      calc.pressToggleSign();
      assert.strictEqual(calc.getState().display, '5');
    });

    it('handles negative operand in multiplication (-5 * 4 = -20)', () => {
      const calc = new CalculatorEngine();
      calc.pressDigit('5');
      calc.pressToggleSign();
      calc.pressOperator('*');
      calc.pressDigit('4');
      calc.pressEquals();
      assert.strictEqual(calc.getState().display, '-20');
    });

    it('does not toggle sign on zero (0 +/- remains 0)', () => {
      const calc = new CalculatorEngine();
      calc.pressToggleSign();
      assert.strictEqual(calc.getState().display, '0');
    });
  });

  // CASE-11: Display Boundary & Overflow
  describe('CASE-11: Display Boundary & Overflow (RULE-CALC-002)', () => {
    it('formats repeating fractions within max 10 display digits (1 / 3)', () => {
      const calc = new CalculatorEngine();
      calc.executeSequence('1/3=');
      const display = calc.getState().display;
      assert.strictEqual(display, '0.333333333');
      assert.ok(display.length <= 11); // 10 digits + decimal point
    });

    it('formats 355 / 113 to clean display precision', () => {
      const calc = new CalculatorEngine();
      calc.executeSequence('355/113=');
      assert.strictEqual(calc.getState().display, '3.14159292');
    });

    it('supports backspace erasing digits one by one', () => {
      const calc = new CalculatorEngine();
      calc.pressDigit('1');
      calc.pressDigit('2');
      calc.pressDigit('3');
      assert.strictEqual(calc.getState().display, '123');

      calc.pressBackspace();
      assert.strictEqual(calc.getState().display, '12');

      calc.pressBackspace();
      assert.strictEqual(calc.getState().display, '1');

      calc.pressBackspace();
      assert.strictEqual(calc.getState().display, '0');
    });
  });

  // Additional Helper & Standalone Function Tests
  describe('Pure Function Units', () => {
    it('evaluateBinary returns expected error on division by zero', () => {
      const res = evaluateBinary(10, '/', 0);
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.error, DIVISION_BY_ZERO_ERROR);
    });

    it('normalizePrecision formats negative zero as "0"', () => {
      assert.strictEqual(normalizePrecision(-0), '0');
    });
  });
});
