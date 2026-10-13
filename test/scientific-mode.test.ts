import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ScientificEngine } from '../src/engine/scientific-engine.ts';
import { CalcEngine } from '../src/engine/calc-engine.ts';
import { setupMockDom } from './test-dom-helper.ts';

setupMockDom();
const { StayCalcElement } = await import('../src/components/stay-calc.ts');

describe('Scientific Mode & Trigonometry Tests (F5)', () => {
  test('CASE-F5-001: Square root nominal', () => {
    const sci = new ScientificEngine();
    assert.equal(sci.sqrt(25), 5);
    assert.equal(sci.sqrt(0), 0);
  });

  test('CASE-F5-002: Negative square root domain error (sqrt(-1) -> Invalid input)', () => {
    const sci = new ScientificEngine();
    assert.equal(sci.sqrt(-1), 'Invalid input');
    assert.equal(sci.sqrt(-42), 'Invalid input');
  });

  test('CASE-F5-003: Square operation', () => {
    const sci = new ScientificEngine();
    assert.equal(sci.square(7), 49);
    assert.equal(sci.square(-4), 16);
  });

  test('CASE-F5-004: Binary power exponentiation (2 ^ 8 = 256)', () => {
    const engine = new CalcEngine();
    engine.inputDigit('2');
    engine.inputOperator('^');
    engine.inputDigit('8');
    const state = engine.calculate();
    assert.equal(state.display, '256');
  });

  test('CASE-F5-005: Trigonometry in DEG mode (sin 30, cos 60, tan 45, sin 180, cos 90)', () => {
    const sci = new ScientificEngine();
    sci.setAngleMode('DEG');

    assert.equal(sci.sin(30), 0.5, 'sin(30 deg) must equal 0.5');
    assert.equal(sci.cos(60), 0.5, 'cos(60 deg) must equal 0.5');
    assert.equal(sci.tan(45), 1, 'tan(45 deg) must equal 1');
    assert.equal(sci.sin(180), 0, 'sin(180 deg) must normalize to 0');
    assert.equal(sci.cos(90), 0, 'cos(90 deg) must normalize to 0');
  });

  test('CASE-F5-006: Tangent asymptote domain error (tan(90 deg))', () => {
    const sci = new ScientificEngine();
    sci.setAngleMode('DEG');
    assert.equal(sci.tan(90), 'Invalid input');
    assert.equal(sci.tan(270), 'Invalid input');
  });

  test('CASE-F5-007: Angle unit toggle to RAD (sin(PI / 2) = 1)', () => {
    const sci = new ScientificEngine();
    assert.equal(sci.getAngleMode(), 'DEG');
    sci.toggleAngleMode();
    assert.equal(sci.getAngleMode(), 'RAD');

    const halfPi = Math.PI / 2;
    assert.equal(sci.sin(halfPi), 1, 'sin(PI/2 rad) must equal 1 in RAD mode');
  });

  test('CASE-F5-008 & 009: Mathematical constants (pi, e)', () => {
    const sci = new ScientificEngine();
    assert.equal(sci.pi(), 3.1415926536);
    assert.equal(sci.e(), 2.7182818285);
  });

  test('CASE-F5-010: Scientific panel toggle in component', () => {
    const calc = new StayCalcElement();
    calc.connectedCallback();

    const panel = (calc as any).shadowRoot.getElementById('scientific-panel');
    assert.ok(panel, 'Scientific panel must exist');
    assert.equal(panel.style.display, 'none');

    calc.toggleScientific();
    assert.equal(panel.style.display, 'grid', 'Toggled scientific panel must show grid');

    calc.toggleScientific();
    assert.equal(panel.style.display, 'none', 'Second toggle must hide panel');
  });

  test('CASE-F5-011: Chained calculation with scientific result (sqrt(16) + 10 = 14)', () => {
    const calc = new StayCalcElement();
    calc.connectedCallback();

    const sqrt16 = calc.scientific.sqrt(16);
    calc.engine.setDisplayValue(String(sqrt16));
    calc.engine.inputOperator('+');
    calc.engine.inputDigit('1');
    calc.engine.inputDigit('0');
    calc.triggerCalculate();

    assert.equal(calc.displayValue, '14');
  });
});
