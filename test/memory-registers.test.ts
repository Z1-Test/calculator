import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryStore } from '../src/engine/memory-store.ts';
import { CalcEngine } from '../src/engine/calc-engine.ts';
import { setupMockDom } from './test-dom-helper.ts';

setupMockDom();
const { StayCalcElement } = await import('../src/components/stay-calc.ts');

describe('Memory Registers & Badge Synchronization Tests (F3)', () => {
  test('CASE-F3-001: Initial zero state', () => {
    const memory = new MemoryStore();
    assert.equal(memory.getValue(), 0);
    assert.equal(memory.hasMemory(), false);
  });

  test('CASE-F3-002: M+ addition', () => {
    const memory = new MemoryStore();
    memory.add(42);
    assert.equal(memory.getValue(), 42);
    assert.equal(memory.hasMemory(), true);
  });

  test('CASE-F3-003: M- subtraction', () => {
    const memory = new MemoryStore();
    memory.add(42);
    memory.subtract(12);
    assert.equal(memory.getValue(), 30);
    assert.equal(memory.hasMemory(), true);
  });

  test('CASE-F3-004: MR recall', () => {
    const memory = new MemoryStore();
    memory.add(30);
    assert.equal(memory.recall(), 30);
  });

  test('CASE-F3-005: MC clear', () => {
    const memory = new MemoryStore();
    memory.add(30);
    memory.clear();
    assert.equal(memory.getValue(), 0);
    assert.equal(memory.hasMemory(), false);
  });

  test('CASE-F3-006: Memory persistence across engine allClear()', () => {
    const engine = new CalcEngine();
    const memory = new MemoryStore();

    engine.inputDigit('5');
    engine.inputOperator('+');
    engine.inputDigit('5');
    engine.calculate(); // 10
    memory.add(10);

    engine.allClear(); // Clears calculation registers
    assert.equal(engine.getState().display, '0');
    assert.equal(memory.getValue(), 10, 'Memory register must persist across engine allClear');
  });

  test('CASE-F3-007: Decimal precision in memory (0.1 + 0.2 = 0.3)', () => {
    const memory = new MemoryStore();
    memory.add(0.1);
    memory.add(0.2);
    assert.equal(memory.getValue(), 0.3, 'Memory addition must normalize IEEE float noise');
  });

  test('CASE-F3-008 & 009: Visual "M" badge synchronization and return to zero', () => {
    const calc = new StayCalcElement();
    calc.connectedCallback();

    const badge = (calc as any).shadowRoot.getElementById('memory-badge');
    assert.ok(badge, 'memory-badge element must exist in shadow root');
    assert.equal(badge.style.display, 'none', 'Initial badge must be hidden');

    calc.memory.add(15);
    calc.updateDisplay();
    assert.equal(badge.style.display, 'inline-block', 'Badge must appear when memory !== 0');

    calc.memory.subtract(15); // Return to 0
    calc.updateDisplay();
    assert.equal(badge.style.display, 'none', 'Badge must be hidden when memory returns to 0');
  });

  test('CASE-F3-010: Chained memory operations (5 M+ 10 M+ 3 M- MR = 12)', () => {
    const memory = new MemoryStore();
    memory.add(5);
    memory.add(10);
    memory.subtract(3);
    assert.equal(memory.recall(), 12);
  });

  test('CASE-F3-011: Memory recall in arithmetic flow (MR + 5 = 17)', () => {
    const calc = new StayCalcElement();
    calc.connectedCallback();

    calc.memory.add(12);
    const recalled = calc.memory.recall();
    calc.engine.setDisplayValue(String(recalled));
    calc.engine.inputOperator('+');
    calc.engine.inputDigit('5');
    const state = calc.engine.calculate();

    assert.equal(state.display, '17');
  });
});
