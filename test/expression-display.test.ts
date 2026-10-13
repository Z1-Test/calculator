import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { CalcEngine } from '../src/engine/calc-engine.ts';
import { ExpressionDisplayController } from '../src/components/expression-display.ts';
import { setupMockDom } from './test-dom-helper.ts';

setupMockDom();
const { StayCalcElement } = await import('../src/components/stay-calc.ts');

describe('Formula Expression Preview Display Tests (F10)', () => {
  test('CASE-F10-001: Initial empty state is empty string', () => {
    const engine = new CalcEngine();
    assert.equal(engine.getFormulaPreview(), '');
    assert.equal(ExpressionDisplayController.getPreview(engine), '');
  });

  test('CASE-F10-002: Operator selection preview displays accumulator and pending operator ("5 +")', () => {
    const engine = new CalcEngine();
    engine.inputDigit('5');
    engine.inputOperator('+');
    assert.equal(engine.getFormulaPreview(), '5 +');
  });

  test('CASE-F10-003: Calculation equals termination ("5 + 3 =")', () => {
    const engine = new CalcEngine();
    engine.inputDigit('5');
    engine.inputOperator('+');
    engine.inputDigit('3');
    const state = engine.calculate();

    assert.equal(state.display, '8');
    assert.equal(engine.getFormulaPreview(), '5 + 3 =');
  });

  test('CASE-F10-004: Operator replacement reflection ("5 +" -> "5 *")', () => {
    const engine = new CalcEngine();
    engine.inputDigit('5');
    engine.inputOperator('+');
    assert.equal(engine.getFormulaPreview(), '5 +');

    engine.inputOperator('*');
    assert.equal(engine.getFormulaPreview(), '5 *');
  });

  test('CASE-F10-005: Chained arithmetic preview execution', () => {
    const engine = new CalcEngine();
    engine.inputDigit('2');
    engine.inputOperator('+');
    engine.inputDigit('3');
    engine.inputOperator('*');

    // In sequential execution, 2 + 3 evaluates to 5 before *
    assert.equal(engine.getFormulaPreview(), '5 *');

    engine.inputDigit('4');
    engine.calculate();
    assert.equal(engine.getFormulaPreview(), '5 * 4 =');
    assert.equal(engine.getState().display, '20');
  });

  test('CASE-F10-006: All Clear full reset resets preview to empty string', () => {
    const engine = new CalcEngine();
    engine.inputDigit('9');
    engine.inputOperator('*');
    engine.inputDigit('9');
    engine.calculate();

    assert.equal(engine.getFormulaPreview(), '9 * 9 =');

    engine.allClear();
    assert.equal(engine.getFormulaPreview(), '');
    assert.equal(engine.getState().display, '0');
  });

  test('CASE-F10-007: Clear Entry preserves pending operator preview', () => {
    const engine = new CalcEngine();
    engine.inputDigit('5');
    engine.inputOperator('+');
    engine.inputDigit('9');

    assert.equal(engine.getFormulaPreview(), '5 +');

    engine.clearEntry();
    assert.equal(engine.getState().display, '0');
    assert.equal(engine.getFormulaPreview(), '5 +');
  });

  test('CASE-F10-008: Decimal operand expression preview ("0.1 + 0.2 =")', () => {
    const engine = new CalcEngine();
    engine.inputDigit('0');
    engine.inputDecimal();
    engine.inputDigit('1');
    engine.inputOperator('+');
    engine.inputDigit('0');
    engine.inputDecimal();
    engine.inputDigit('2');
    engine.calculate();

    assert.equal(engine.getFormulaPreview(), '0.1 + 0.2 =');
    assert.equal(engine.getState().display, '0.3');
  });

  test('CASE-F10-009: Division by zero preview retention ("10 / 0 =")', () => {
    const engine = new CalcEngine();
    engine.inputDigit('1');
    engine.inputDigit('0');
    engine.inputOperator('/');
    engine.inputDigit('0');
    engine.calculate();

    assert.equal(engine.getState().display, 'Cannot divide by zero');
    assert.equal(engine.getFormulaPreview(), '10 / 0 =');
  });

  test('CASE-F10-010: Accessibility role and attributes on #expression-preview in shadow DOM', () => {
    const calc = new StayCalcElement();
    calc.connectedCallback();

    const previewEl = (calc as any).shadowRoot.getElementById('expression-preview');
    assert.ok(previewEl, 'Expression preview element must exist in shadow root');
    assert.equal(previewEl.getAttribute('role'), 'status');
    assert.equal(previewEl.getAttribute('aria-label'), 'Formula expression');
    assert.equal(previewEl.getAttribute('aria-live'), 'polite');
  });

  test('CASE-F10-011: Live component typing and equals synchronization', () => {
    const calc = new StayCalcElement();
    calc.connectedCallback();

    calc.engine.inputDigit('7');
    calc.engine.inputOperator('*');
    calc.updateDisplay();

    const previewEl = (calc as any).shadowRoot.getElementById('expression-preview');
    assert.equal(previewEl.textContent, '7 *');

    calc.engine.inputDigit('6');
    calc.triggerCalculate();

    assert.equal(previewEl.textContent, '7 * 6 =');
    assert.equal(calc.displayValue, '42');
  });
});
