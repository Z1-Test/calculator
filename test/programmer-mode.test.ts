import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ProgrammerEngine } from '../src/engine/programmer-engine.ts';
import { setupMockDom } from './test-dom-helper.ts';

setupMockDom();
const { StayCalcElement } = await import('../src/components/stay-calc.ts');

describe('Programmer Radix Mode Tests (F6)', () => {
  test('CASE-F6-001: Base conversions for 255 (HEX, DEC, OCT, BIN)', () => {
    const prog = new ProgrammerEngine();
    prog.setValue(255);
    const reps = prog.getRepresentations();
    assert.equal(reps.DEC, '255');
    assert.equal(reps.HEX, 'FF');
    assert.equal(reps.OCT, '377');
    assert.equal(reps.BIN, '11111111');
  });

  test('CASE-F6-002: Bitwise AND Operation (12 & 10 = 8)', () => {
    const prog = new ProgrammerEngine();
    prog.setValue(12);
    const res = prog.bitwiseAnd(10);
    assert.equal(res, 8n);
    assert.equal(prog.getRepresentations().DEC, '8');
  });

  test('CASE-F6-003: Bitwise OR Operation (12 | 10 = 14)', () => {
    const prog = new ProgrammerEngine();
    prog.setValue(12);
    const res = prog.bitwiseOr(10);
    assert.equal(res, 14n);
    assert.equal(prog.getRepresentations().DEC, '14');
  });

  test('CASE-F6-004: Bitwise XOR Operation (12 ^ 10 = 6)', () => {
    const prog = new ProgrammerEngine();
    prog.setValue(12);
    const res = prog.bitwiseXor(10);
    assert.equal(res, 6n);
    assert.equal(prog.getRepresentations().DEC, '6');
  });

  test('CASE-F6-005: Bitwise NOT in BYTE Mode (~0 clamped to 255)', () => {
    const prog = new ProgrammerEngine();
    prog.setWordSize('BYTE');
    prog.setValue(0);
    const res = prog.bitwiseNot();
    assert.equal(res, 255n);
    assert.equal(prog.getRepresentations().HEX, 'FF');
  });

  test('CASE-F6-006: Left Shift LSH (5 << 2 = 20)', () => {
    const prog = new ProgrammerEngine();
    prog.setValue(5);
    const res = prog.shiftLeft(2);
    assert.equal(res, 20n);
    assert.equal(prog.getRepresentations().DEC, '20');
  });

  test('CASE-F6-007: Right Shift RSH (20 >> 2 = 5)', () => {
    const prog = new ProgrammerEngine();
    prog.setValue(20);
    const res = prog.shiftRight(2);
    assert.equal(res, 5n);
    assert.equal(prog.getRepresentations().DEC, '5');
  });

  test('CASE-F6-008: Word Clamping BYTE 8-bit (300 -> 44)', () => {
    const prog = new ProgrammerEngine();
    prog.setWordSize('BYTE');
    prog.setValue(300);
    assert.equal(prog.getValue(), 44n);
  });

  test('CASE-F6-009: Word Clamping WORD 16-bit (70000 -> 4464)', () => {
    const prog = new ProgrammerEngine();
    prog.setWordSize('WORD');
    prog.setValue(70000);
    assert.equal(prog.getValue(), 4464n);
  });

  test('CASE-F6-010: BigInt 64-bit QWORD Support', () => {
    const prog = new ProgrammerEngine();
    prog.setWordSize('QWORD');
    prog.setValue('18446744073709551615');
    assert.equal(prog.getRepresentations().HEX, 'FFFFFFFFFFFFFFFF');
  });

  test('CASE-F6-011: Component Mode Integration (Panel toggle and radix strips)', () => {
    const calc = new StayCalcElement();
    calc.connectedCallback();

    const panel = (calc as any).shadowRoot.getElementById('programmer-panel');
    assert.ok(panel, 'Programmer panel must exist in shadow root');
    assert.equal(panel.style.display, 'none');

    calc.toggleProgrammer();
    assert.equal(panel.style.display, 'flex');

    // Input 42 into calculator
    calc.engine.inputDigit('4');
    calc.engine.inputDigit('2');
    calc.updateDisplay();

    const hexEl = (calc as any).shadowRoot.getElementById('prog-hex');
    const binEl = (calc as any).shadowRoot.getElementById('prog-bin');
    assert.equal(hexEl.textContent, '2A');
    assert.equal(binEl.textContent, '101010');

    calc.toggleProgrammer();
    assert.equal(panel.style.display, 'none');
  });
});
