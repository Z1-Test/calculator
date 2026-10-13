import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { CalcEngine, normalizePrecision, formatDisplay } from '../src/engine/calc-engine.ts';

describe('CalcEngine Precision Arithmetic Tests', () => {
  test('CASE-F1-001: Basic Addition (2 + 3 = 5)', () => {
    const engine = new CalcEngine();
    engine.inputDigit('2');
    engine.inputOperator('+');
    engine.inputDigit('3');
    const state = engine.calculate();
    assert.equal(state.display, '5');
    assert.equal(state.hasError, false);
  });

  test('CASE-F1-002: Basic Subtraction (10 - 4 = 6)', () => {
    const engine = new CalcEngine();
    engine.inputDigit('1');
    engine.inputDigit('0');
    engine.inputOperator('-');
    engine.inputDigit('4');
    const state = engine.calculate();
    assert.equal(state.display, '6');
    assert.equal(state.hasError, false);
  });

  test('CASE-F1-003: Basic Multiplication (7 * 6 = 42)', () => {
    const engine = new CalcEngine();
    engine.inputDigit('7');
    engine.inputOperator('*');
    engine.inputDigit('6');
    const state = engine.calculate();
    assert.equal(state.display, '42');
    assert.equal(state.hasError, false);
  });

  test('CASE-F1-004: Basic Division (84 / 2 = 42)', () => {
    const engine = new CalcEngine();
    engine.inputDigit('8');
    engine.inputDigit('4');
    engine.inputOperator('/');
    engine.inputDigit('2');
    const state = engine.calculate();
    assert.equal(state.display, '42');
    assert.equal(state.hasError, false);
  });

  test('CASE-F1-005: Decimal Precision Normalization (0.1 + 0.2 = 0.3, 0.7 + 0.1 = 0.8)', () => {
    const engine1 = new CalcEngine();
    engine1.inputDigit('0');
    engine1.inputDecimal();
    engine1.inputDigit('1');
    engine1.inputOperator('+');
    engine1.inputDigit('0');
    engine1.inputDecimal();
    engine1.inputDigit('2');
    const s1 = engine1.calculate();
    assert.equal(s1.display, '0.3', '0.1 + 0.2 must display 0.3 without IEEE float noise');

    const engine2 = new CalcEngine();
    engine2.inputDigit('0');
    engine2.inputDecimal();
    engine2.inputDigit('7');
    engine2.inputOperator('+');
    engine2.inputDigit('0');
    engine2.inputDecimal();
    engine2.inputDigit('1');
    const s2 = engine2.calculate();
    assert.equal(s2.display, '0.8', '0.7 + 0.1 must display 0.8 without IEEE float noise');
  });

  test('CASE-F1-006: Immediate Execution Sequential Model (2 + 3 * 4 = 20)', () => {
    const engine = new CalcEngine();
    engine.inputDigit('2');
    engine.inputOperator('+');
    engine.inputDigit('3');
    engine.inputOperator('*'); // intermediate calculation: 2 + 3 = 5
    assert.equal(engine.getState().display, '5');
    engine.inputDigit('4');
    const state = engine.calculate(); // 5 * 4 = 20
    assert.equal(state.display, '20', 'Pocket calculator immediate execution must evaluate 2 + 3 * 4 = 20');
  });

  test('CASE-F1-007: Division by Zero Safeguard (10 / 0 = Cannot divide by zero)', () => {
    const engine = new CalcEngine();
    engine.inputDigit('1');
    engine.inputDigit('0');
    engine.inputOperator('/');
    engine.inputDigit('0');
    const state = engine.calculate();
    assert.equal(state.display, 'Cannot divide by zero');
    assert.equal(state.hasError, true);
    assert.equal(state.errorMessage, 'Cannot divide by zero');

    // Further inputs must be blocked
    engine.inputDigit('5');
    assert.equal(engine.getState().display, 'Cannot divide by zero', 'Input must be locked during error');

    // Clear restores state
    engine.clearEntry();
    assert.equal(engine.getState().display, '0');
    assert.equal(engine.getState().hasError, false);
  });

  test('CASE-F1-008: Operator Replacement (5 + * 2 = 10)', () => {
    const engine = new CalcEngine();
    engine.inputDigit('5');
    engine.inputOperator('+');
    engine.inputOperator('*'); // replaced '+' with '*'
    engine.inputDigit('2');
    const state = engine.calculate();
    assert.equal(state.display, '10');
  });

  test('CASE-F1-009: Clear Entry vs All Clear (5 + 9 [C] 4 = 9, AC full reset)', () => {
    // C preserves accumulator and pendingOperator
    const engine = new CalcEngine();
    engine.inputDigit('5');
    engine.inputOperator('+');
    engine.inputDigit('9');
    engine.clearEntry(); // Clears '9' to '0', keeps 5 and '+'
    assert.equal(engine.getState().display, '0');
    engine.inputDigit('4');
    const state = engine.calculate();
    assert.equal(state.display, '9');

    // AC resets everything
    const engine2 = new CalcEngine();
    engine2.inputDigit('5');
    engine2.inputOperator('+');
    engine2.allClear();
    assert.equal(engine2.getState().display, '0');
    assert.equal(engine2.getState().accumulator, null);
    assert.equal(engine2.getState().pendingOperator, null);
  });

  test('CASE-F1-010: Percentage calculation', () => {
    const engine = new CalcEngine();
    engine.inputDigit('5');
    engine.inputDigit('0');
    engine.percentage();
    assert.equal(engine.getState().display, '0.5');

    const engine2 = new CalcEngine();
    engine2.inputDigit('2');
    engine2.inputDigit('0');
    engine2.inputDigit('0');
    engine2.inputOperator('+');
    engine2.inputDigit('1');
    engine2.inputDigit('0');
    engine2.percentage(); // 10% of 200 = 20
    const state = engine2.calculate(); // 200 + 20 = 220
    assert.equal(state.display, '220');
  });

  test('CASE-F1-011: Toggle Sign (+/-)', () => {
    const engine = new CalcEngine();
    engine.inputDigit('4');
    engine.inputDigit('2');
    engine.toggleSign();
    assert.equal(engine.getState().display, '-42');
    engine.toggleSign();
    assert.equal(engine.getState().display, '42');
  });

  test('STALL Cases: Multiple decimals and leading zeroes', () => {
    const engine = new CalcEngine();
    engine.inputDigit('1');
    engine.inputDecimal();
    engine.inputDigit('2');
    engine.inputDecimal(); // ignored
    engine.inputDigit('3');
    assert.equal(engine.getState().display, '1.23');

    const engine2 = new CalcEngine();
    engine2.inputDigit('0');
    engine2.inputDigit('0');
    engine2.inputDigit('7');
    assert.equal(engine2.getState().display, '7');
  });
});
