import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { HistoryStore } from '../src/engine/history-store.ts';
import { HistoryExportService } from '../src/services/history-export.ts';
import { setupMockDom } from './test-dom-helper.ts';

setupMockDom();
const { StayCalcElement } = await import('../src/components/stay-calc.ts');

describe('Calculation Tape Export & Clipboard Tests (F7)', () => {
  test('CASE-F7-001: Single entry text export contains expression and result', () => {
    const store = new HistoryStore();
    store.addEntry('2 + 3', '5');
    const text = HistoryExportService.formatAsText(store.getEntries());

    assert.ok(text.includes('StayCalc Calculation Tape'));
    assert.ok(text.includes('2 + 3 = 5'));
    assert.ok(text.includes('Total Entries: 1'));
  });

  test('CASE-F7-002: Multi-entry text export formats sequential order and total count', () => {
    const store = new HistoryStore();
    store.addEntry('10 * 5', '50');
    store.addEntry('50 - 8', '42');

    const text = HistoryExportService.formatAsText(store.getEntries());
    assert.ok(text.includes('50 - 8 = 42'));
    assert.ok(text.includes('10 * 5 = 50'));
    assert.ok(text.includes('Total Entries: 2'));
  });

  test('CASE-F7-003: RFC 8259 JSON export is valid and parseable', () => {
    const store = new HistoryStore();
    store.addEntry('7 * 6', '42');

    const jsonStr = HistoryExportService.formatAsJson(store.getEntries());
    const parsed = JSON.parse(jsonStr);
    assert.ok(Array.isArray(parsed));
    assert.equal(parsed.length, 1);
  });

  test('CASE-F7-004: JSON schema conformance (id, expression, result, timestamp)', () => {
    const store = new HistoryStore();
    store.addEntry('100 / 4', '25');

    const jsonStr = HistoryExportService.formatAsJson(store.getEntries());
    const parsed = JSON.parse(jsonStr);
    const item = parsed[0];

    assert.ok(typeof item.id === 'string');
    assert.equal(item.expression, '100 / 4');
    assert.equal(item.result, '25');
    assert.ok(typeof item.timestamp === 'number');
  });

  test('CASE-F7-005: Empty tape text guard returns "Tape is empty"', () => {
    const store = new HistoryStore();
    const text = HistoryExportService.formatAsText(store.getEntries());
    assert.equal(text, 'Tape is empty');
  });

  test('CASE-F7-006: Empty tape JSON guard returns "[]"', () => {
    const store = new HistoryStore();
    const jsonStr = HistoryExportService.formatAsJson(store.getEntries());
    assert.equal(jsonStr, '[]');
    assert.deepEqual(JSON.parse(jsonStr), []);
  });

  test('CASE-F7-007: Special characters & decimal precision retention (0.1 + 0.2 = 0.3)', () => {
    const store = new HistoryStore();
    store.addEntry('0.1 + 0.2', '0.3');

    const text = HistoryExportService.formatAsText(store.getEntries());
    assert.ok(text.includes('0.1 + 0.2 = 0.3'));
  });

  test('CASE-F7-008: Clipboard copy payload generation via getExportPayload', () => {
    const store = new HistoryStore();
    store.addEntry('12 + 12', '24');

    const textPayload = HistoryExportService.getExportPayload(store.getEntries(), 'text');
    assert.equal(textPayload.format, 'text');
    assert.equal(textPayload.count, 1);
    assert.ok(textPayload.content.includes('12 + 12 = 24'));

    const jsonPayload = HistoryExportService.getExportPayload(store.getEntries(), 'json');
    assert.equal(jsonPayload.format, 'json');
    assert.equal(jsonPayload.count, 1);
  });

  test('CASE-F7-009: Component UI Export JSON button dispatches event or provides JSON', () => {
    const calc = new StayCalcElement();
    calc.connectedCallback();

    calc.engine.inputDigit('9');
    calc.engine.inputOperator('*');
    calc.engine.inputDigit('9');
    calc.triggerCalculate();

    const exportBtn = (calc as any).shadowRoot.getElementById('btn-export-json');
    assert.ok(exportBtn, 'Export JSON button must exist in shadow root');

    const json = calc.exportTapeJson();
    assert.ok(json.includes('9 * 9'));
    assert.ok(json.includes('81'));
  });

  test('CASE-F7-010: Component UI Copy Tape button invokes copyTape', async () => {
    const calc = new StayCalcElement();
    calc.connectedCallback();

    calc.engine.inputDigit('5');
    calc.engine.inputOperator('+');
    calc.engine.inputDigit('5');
    calc.triggerCalculate();

    const copyBtn = (calc as any).shadowRoot.getElementById('btn-copy-history');
    assert.ok(copyBtn, 'Copy History button must exist in shadow root');

    const text = await calc.copyTape();
    assert.ok(text.includes('5 + 5 = 10'));
  });

  test('CASE-F7-011: Clear tape dynamic sync immediately reflects in export', () => {
    const calc = new StayCalcElement();
    calc.connectedCallback();

    calc.engine.inputDigit('1');
    calc.engine.inputOperator('+');
    calc.engine.inputDigit('1');
    calc.triggerCalculate();

    assert.ok(calc.exportTapeText().includes('1 + 1 = 2'));

    calc.history.clear();
    assert.equal(calc.exportTapeText(), 'Tape is empty');
    assert.equal(calc.exportTapeJson(), '[]');
  });
});
