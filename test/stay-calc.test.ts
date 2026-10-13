import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { setupMockDom, MockKeyboardEvent } from './test-dom-helper.ts';

// Initialize mock DOM before loading custom element
setupMockDom();

// Dynamic import after globals are set
const { StayCalcElement } = await import('../src/components/stay-calc.ts');

describe('StayCalcElement Component & Keyboard Accessibility Tests', () => {
  test('CASE-F2-001: Custom element definition', () => {
    assert.ok(customElements.get('stay-calc'), 'stay-calc must be registered in customElements');
  });

  test('CASE-F2-002 & 003: Shadow DOM attachment and initial display state', () => {
    const calc = new StayCalcElement();
    calc.connectedCallback();
    assert.equal(calc.displayValue, '0', 'Initial displayValue must be 0');
    assert.ok((calc as any).shadowRoot, 'Element must have shadowRoot');
  });

  test('CASE-F2-005: Keyboard digit input', () => {
    const calc = new StayCalcElement();
    calc.connectedCallback();

    const event = new MockKeyboardEvent('keydown', { key: '7' });
    calc.handleKeydown(event as any);

    assert.equal(calc.displayValue, '7');
    assert.equal(event.defaultPrevented, true);
  });

  test('CASE-F2-006: Keyboard operator and Enter calculation (7 + 3 Enter = 10)', () => {
    const calc = new StayCalcElement();
    calc.connectedCallback();

    calc.handleKeydown(new MockKeyboardEvent('keydown', { key: '7' }) as any);
    calc.handleKeydown(new MockKeyboardEvent('keydown', { key: '+' }) as any);
    calc.handleKeydown(new MockKeyboardEvent('keydown', { key: '3' }) as any);
    calc.handleKeydown(new MockKeyboardEvent('keydown', { key: 'Enter' }) as any);

    assert.equal(calc.displayValue, '10', '7 + 3 Enter must evaluate to 10');
  });

  test('CASE-F2-007: Keyboard Escape resets to 0 (All Clear)', () => {
    const calc = new StayCalcElement();
    calc.connectedCallback();

    calc.handleKeydown(new MockKeyboardEvent('keydown', { key: '9' }) as any);
    calc.handleKeydown(new MockKeyboardEvent('keydown', { key: 'Escape' }) as any);

    assert.equal(calc.displayValue, '0', 'Escape key must reset display to 0');
  });

  test('CASE-F2-008: Keyboard Backspace truncates digit', () => {
    const calc = new StayCalcElement();
    calc.connectedCallback();

    calc.handleKeydown(new MockKeyboardEvent('keydown', { key: '4' }) as any);
    calc.handleKeydown(new MockKeyboardEvent('keydown', { key: '2' }) as any);
    assert.equal(calc.displayValue, '42');

    calc.handleKeydown(new MockKeyboardEvent('keydown', { key: 'Backspace' }) as any);
    assert.equal(calc.displayValue, '4', 'Backspace must remove last digit');
  });

  test('CASE-F2-009 & 010: Accessibility attributes and container styling', () => {
    const calc = new StayCalcElement();
    calc.connectedCallback();

    const shadow = (calc as any).shadowRoot;
    assert.ok(shadow.innerHTML.includes('role="status"'), 'Display must have role="status"');
    assert.ok(shadow.innerHTML.includes('aria-live="polite"'), 'Display must have aria-live="polite"');
    assert.ok(shadow.innerHTML.includes(':focus-visible'), 'Component CSS must include :focus-visible styling');
    assert.ok(shadow.innerHTML.includes('max-width: 390px'), 'Component CSS must enforce max-width for 390px mobile viewport');
  });

  test('CASE-F2-011: Lifecycle event listener cleanup', () => {
    const calc = new StayCalcElement();
    calc.connectedCallback();
    const listenersBefore = ((window as any)._listeners.get('keydown') || []).length;
    assert.ok(listenersBefore > 0, 'Window keydown listener should be attached');

    calc.disconnectedCallback();
    const listenersAfter = ((window as any)._listeners.get('keydown') || []).length;
    assert.equal(listenersAfter, listenersBefore - 1, 'Window keydown listener should be detached on disconnectedCallback');
  });
});
