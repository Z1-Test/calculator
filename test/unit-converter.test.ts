import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { UnitConverterEngine } from '../src/engine/unit-converter.ts';
import { setupMockDom } from './test-dom-helper.ts';

setupMockDom();
const { StayCalcElement } = await import('../src/components/stay-calc.ts');

describe('Multi-Unit Converter Extension Tests (F9)', () => {
  test('CASE-F9-001: Length conversion 1000 m = 1 km', () => {
    const engine = new UnitConverterEngine();
    assert.equal(engine.convertLength(1000, 'm', 'km'), 1);
    assert.equal(engine.convertLength(1, 'km', 'm'), 1000);
  });

  test('CASE-F9-002: Length conversion 1 ft = 12 in', () => {
    const engine = new UnitConverterEngine();
    assert.equal(engine.convertLength(1, 'ft', 'in'), 12);
  });

  test('CASE-F9-003: Length conversion 1 mi = 1.609344 km', () => {
    const engine = new UnitConverterEngine();
    assert.equal(engine.convertLength(1, 'mi', 'km'), 1.609344);
  });

  test('CASE-F9-004: Mass conversion 2.5 kg = 2500 g', () => {
    const engine = new UnitConverterEngine();
    assert.equal(engine.convertMass(2.5, 'kg', 'g'), 2500);
  });

  test('CASE-F9-005: Mass conversion 1 lb = 16 oz', () => {
    const engine = new UnitConverterEngine();
    assert.equal(engine.convertMass(1, 'lb', 'oz'), 16);
  });

  test('CASE-F9-006: Mass conversion 1 kg ≈ 2.20462262 lb', () => {
    const engine = new UnitConverterEngine();
    assert.equal(engine.convertMass(1, 'kg', 'lb'), 2.20462262);
  });

  test('CASE-F9-007: Temperature conversion 100 C = 212 F and 0 C = 32 F', () => {
    const engine = new UnitConverterEngine();
    assert.equal(engine.convertTemperature(100, 'C', 'F'), 212);
    assert.equal(engine.convertTemperature(0, 'C', 'F'), 32);
  });

  test('CASE-F9-008: Temperature conversion 0 C = 273.15 K and 100 C = 373.15 K', () => {
    const engine = new UnitConverterEngine();
    assert.equal(engine.convertTemperature(0, 'C', 'K'), 273.15);
    assert.equal(engine.convertTemperature(100, 'C', 'K'), 373.15);
  });

  test('CASE-F9-009: Temperature conversion 98.6 F = 37 C', () => {
    const engine = new UnitConverterEngine();
    assert.equal(engine.convertTemperature(98.6, 'F', 'C'), 37);
  });

  test('CASE-F9-010: Absolute zero domain error guard (< -273.15 C)', () => {
    const engine = new UnitConverterEngine();
    assert.equal(engine.convertTemperature(-300, 'C', 'F'), 'Invalid input');
    assert.equal(engine.convertTemperature(-500, 'F', 'C'), 'Invalid input');
  });

  test('CASE-F9-011: Component converter panel toggle and conversion integration', () => {
    const calc = new StayCalcElement();
    calc.connectedCallback();

    const panel = (calc as any).shadowRoot.getElementById('converter-panel');
    assert.ok(panel, 'Converter panel must exist in shadow DOM');
    assert.equal(panel.style.display, 'none');

    calc.toggleConverter();
    assert.equal(panel.style.display, 'flex');

    // Display 5 km and convert km-to-m
    calc.engine.setDisplayValue('5');
    const kmToM = calc.converter.convertLength(5, 'km', 'm');
    calc.engine.setDisplayValue(String(kmToM));
    calc.updateDisplay();

    assert.equal(calc.displayValue, '5000');

    calc.toggleConverter();
    assert.equal(panel.style.display, 'none');
  });
});
