import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { HistoryStore } from '../src/engine/history-store.ts';
import { setupMockDom } from './test-dom-helper.ts';

setupMockDom();
const { StayCalcElement } = await import('../src/components/stay-calc.ts');

describe('Calculation History Tape Tests (F4)', () => {
  test('CASE-F4-001: Initial empty state', () => {
    const store = new HistoryStore();
    assert.equal(store.count(), 0);
    assert.deepEqual(store.getEntries(), []);
  });

  test('CASE-F4-002: Add record on calculation (12 * 4 = 48)', () => {
    const store = new HistoryStore();
    const entry = store.addEntry('12 * 4', '48');
    assert.equal(entry.expression, '12 * 4');
    assert.equal(entry.result, '48');
    assert.equal(store.count(), 1);
  });

  test('CASE-F4-003: Chronological ordering (newest first)', () => {
    const store = new HistoryStore();
    store.addEntry('1 + 1', '2');
    store.addEntry('2 + 2', '4');
    const entries = store.getEntries();
    assert.equal(entries[0].result, '4', 'Newest calculation must be at index 0');
    assert.equal(entries[1].result, '2');
  });

  test('CASE-F4-004: FIFO 100-cap limit (RULE-CALC-005)', () => {
    const store = new HistoryStore();
    for (let i = 1; i <= 105; i++) {
      store.addEntry(`op ${i}`, `${i}`);
    }
    assert.equal(store.count(), 100, 'History tape must cap at 100 records');
    const entries = store.getEntries();
    assert.equal(entries[0].result, '105', 'Newest calculation must be first');
    assert.equal(entries[99].result, '6', 'Oldest preserved entry must be 6 (1 to 5 pruned)');
  });

  test('CASE-F4-005: Click-to-load into display', () => {
    const calc = new StayCalcElement();
    calc.connectedCallback();

    calc.history.addEntry('10 * 5', '50');
    calc.loadHistoryRecord('50');

    assert.equal(calc.displayValue, '50', 'Loaded history record must populate display');
  });

  test('CASE-F4-006: Chained math on loaded result (50 + 10 = 60)', () => {
    const calc = new StayCalcElement();
    calc.connectedCallback();

    calc.loadHistoryRecord('50');
    calc.engine.inputOperator('+');
    calc.engine.inputDigit('1');
    calc.engine.inputDigit('0');
    calc.triggerCalculate();

    assert.equal(calc.displayValue, '60');
    assert.equal(calc.history.count(), 1);
  });

  test('CASE-F4-007: Clear history action', () => {
    const store = new HistoryStore();
    store.addEntry('2 + 2', '4');
    store.clear();
    assert.equal(store.count(), 0);
  });

  test('CASE-F4-008: No record on error state (10 / 0)', () => {
    const calc = new StayCalcElement();
    calc.connectedCallback();

    calc.engine.inputDigit('1');
    calc.engine.inputDigit('0');
    calc.engine.inputOperator('/');
    calc.engine.inputDigit('0');
    calc.triggerCalculate(); // Error

    assert.equal(calc.displayValue, 'Cannot divide by zero');
    assert.equal(calc.history.count(), 0, 'Divide by zero error must NOT append to history tape');
  });

  test('CASE-F4-009: Drawer toggle action', () => {
    const calc = new StayCalcElement();
    calc.connectedCallback();

    const drawer = (calc as any).shadowRoot.getElementById('history-drawer');
    assert.ok(drawer, 'History drawer element must exist');
    assert.equal(drawer.style.display, 'none', 'Initial drawer is hidden');

    calc.toggleHistory();
    assert.equal(drawer.style.display, 'block', 'Toggled drawer must be displayed');

    calc.toggleHistory();
    assert.equal(drawer.style.display, 'none', 'Second toggle must hide drawer');
  });

  test('CASE-F4-010: Decimal precision in tape (0.1 + 0.2 = 0.3)', () => {
    const calc = new StayCalcElement();
    calc.connectedCallback();

    calc.engine.inputDigit('0');
    calc.engine.inputDecimal();
    calc.engine.inputDigit('1');
    calc.engine.inputOperator('+');
    calc.engine.inputDigit('0');
    calc.engine.inputDecimal();
    calc.engine.inputDigit('2');
    calc.triggerCalculate();

    const entries = calc.history.getEntries();
    assert.equal(entries.length, 1);
    assert.equal(entries[0].result, '0.3', 'Tape must store normalized 0.3');
  });

  test('CASE-F4-011: Memory independence', () => {
    const calc = new StayCalcElement();
    calc.connectedCallback();

    calc.memory.add(77);
    calc.history.addEntry('1 + 2', '3');
    calc.history.clear();

    assert.equal(calc.history.count(), 0);
    assert.equal(calc.memory.getValue(), 77, 'Clearing history must not alter memory register');
  });
});
