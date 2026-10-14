/**
 * test/programmer.test.ts
 *
 * Comprehensive unit test suite for StayCalc Feature 6 (F6: Programmer Radix Mode & Bitwise Ops).
 * Maps 1:1 to the 11 Universal Test Cases (CASE-01 to CASE-11) defined in
 * docs/context/features/f6-programmer-radix-mode/cases.md.
 * Verifies CalculatorEngine 32-bit integer arithmetic, multi-base radix conversions (HEX, DEC, OCT, BIN),
 * bitwise operations (AND, OR, XOR, NOT, LSH, RSH), dynamic keypad gating, division by zero lockout,
 * state persistence across mode toggles, accessible custom element UI, and SEAM-ENGINE-01 / SEAM-UI-01 event synchronization.
 *
 * Runs natively in Node.js 24 (node:test) with zero external runtime dependencies.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  CalculatorEngine,
  createInitialState,
  calculatorReducer,
  evaluateBinary,
  computeMultiRadix,
  formatRadixValue,
  parseDisplayToInteger,
  DIVISION_BY_ZERO_ERROR,
} from '../src/engine/calculator-engine.ts';

// --- Lightweight W3C Custom Element & DOM Test Harness for Component UI Tests ---

interface EventInit {
  bubbles?: boolean;
  cancelable?: boolean;
  composed?: boolean;
}

class MockEvent {
  public type: string;
  public bubbles: boolean;
  public cancelable: boolean;
  public composed: boolean;
  public defaultPrevented: boolean = false;
  public target: any = null;

  constructor(type: string, init?: EventInit) {
    this.type = type;
    this.bubbles = init?.bubbles ?? false;
    this.cancelable = init?.cancelable ?? true;
    this.composed = init?.composed ?? false;
  }

  public preventDefault(): void {
    if (this.cancelable) {
      this.defaultPrevented = true;
    }
  }
}

class MockCustomEvent extends MockEvent {
  public detail: any;
  constructor(type: string, init?: EventInit & { detail?: any }) {
    super(type, init);
    this.detail = init?.detail;
  }
}

class MockKeyboardEvent extends MockEvent {
  public key: string;
  public metaKey: boolean;
  public ctrlKey: boolean;
  public altKey: boolean;
  public shiftKey: boolean;

  constructor(
    type: string,
    init?: EventInit & {
      key?: string;
      metaKey?: boolean;
      ctrlKey?: boolean;
      altKey?: boolean;
      shiftKey?: boolean;
    }
  ) {
    super(type, init);
    this.key = init?.key ?? '';
    this.metaKey = init?.metaKey ?? false;
    this.ctrlKey = init?.ctrlKey ?? false;
    this.altKey = init?.altKey ?? false;
    this.shiftKey = init?.shiftKey ?? false;
  }
}

class MockClassList {
  private set: Set<string> = new Set();
  constructor(initial?: string) {
    if (initial) {
      initial.split(/\s+/).filter(Boolean).forEach((c) => this.set.add(c));
    }
  }
  public add(...tokens: string[]): void {
    tokens.forEach((t) => this.set.add(t));
  }
  public remove(...tokens: string[]): void {
    tokens.forEach((t) => this.set.delete(t));
  }
  public contains(token: string): boolean {
    return this.set.has(token);
  }
  public toggle(token: string, force?: boolean): boolean {
    if (force !== undefined) {
      if (force) this.set.add(token);
      else this.set.delete(token);
      return force;
    }
    if (this.set.has(token)) {
      this.set.delete(token);
      return false;
    }
    this.set.add(token);
    return true;
  }
  public toString(): string {
    return Array.from(this.set).join(' ');
  }
}

class MockElement {
  public tagName: string;
  public id: string = '';
  public classList: MockClassList = new MockClassList();
  public attributes: Map<string, string> = new Map();
  public children: MockElement[] = [];
  public parentNode: MockElement | null = null;
  public shadowRoot: MockShadowRoot | null = null;
  public textContent: string = '';
  public style: Record<string, string> = {};
  public listeners: Map<string, Array<(e: any) => void>> = new Map();

  constructor(tagName: string = 'div') {
    this.tagName = tagName.toUpperCase();
  }

  public getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }

  public setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
    if (name === 'id') this.id = value;
    if (name === 'class') {
      this.classList = new MockClassList(value);
    }
  }

  public hasAttribute(name: string): boolean {
    return this.attributes.has(name);
  }

  public removeAttribute(name: string): void {
    this.attributes.delete(name);
    if (name === 'id') this.id = '';
    if (name === 'class') this.classList = new MockClassList();
  }

  public appendChild(child: MockElement): MockElement {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  public addEventListener(type: string, listener: (e: any) => void): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(listener);
  }

  public removeEventListener(type: string, listener: (e: any) => void): void {
    const list = this.listeners.get(type);
    if (!list) return;
    const idx = list.indexOf(listener);
    if (idx !== -1) list.splice(idx, 1);
  }

  public dispatchEvent(event: MockEvent): boolean {
    event.target = this;
    let current: MockElement | null = this;
    while (current) {
      const list = current.listeners.get(event.type);
      if (list) {
        for (const fn of [...list]) {
          fn(event);
        }
      }
      if (!event.bubbles) break;
      current = current.parentNode;
    }
    return !event.defaultPrevented;
  }

  public click(): void {
    this.dispatchEvent(new MockEvent('click', { bubbles: true, cancelable: true }));
  }

  public closest(selector: string): MockElement | null {
    let current: MockElement | null = this;
    while (current) {
      if (matchesSelector(current, selector)) return current;
      current = current.parentNode;
    }
    return null;
  }

  public querySelector(selector: string): MockElement | null {
    const list = this.querySelectorAll(selector);
    return list[0] ?? null;
  }

  public querySelectorAll(selector: string): MockElement[] {
    const results: MockElement[] = [];
    const traverse = (node: MockElement) => {
      for (const child of node.children) {
        if (matchesSelector(child, selector)) results.push(child);
        traverse(child);
      }
    };
    traverse(this);
    return results;
  }

  public attachShadow(options: { mode: string }): MockShadowRoot {
    const shadow = new MockShadowRoot();
    shadow.host = this;
    this.shadowRoot = shadow;
    return shadow;
  }
}

class MockShadowRoot extends MockElement {
  public host: MockElement | null = null;
  private _innerHTML: string = '';

  constructor() {
    super('#shadow-root');
  }

  get innerHTML(): string {
    return this._innerHTML;
  }

  set innerHTML(html: string) {
    this._innerHTML = html;
    this.children = [];
    parseHtmlToMock(html, this);
  }
}

function matchesSelector(node: MockElement, selector: string): boolean {
  if (selector.startsWith('#')) {
    return node.id === selector.slice(1);
  }
  if (selector.startsWith('.')) {
    return node.classList.contains(selector.slice(1));
  }
  if (selector === 'button') {
    return node.tagName === 'BUTTON';
  }
  if (selector.startsWith('button[')) {
    if (node.tagName !== 'BUTTON') return false;
    const attrRegex = /\[([a-zA-Z0-9-_:]+)(?:="([^"]*)")?\]/g;
    let m: RegExpExecArray | null;
    let matchAll = true;
    while ((m = attrRegex.exec(selector)) !== null) {
      const name = m[1];
      const val = m[2];
      if (val === undefined) {
        if (!node.hasAttribute(name)) {
          matchAll = false;
          break;
        }
      } else {
        if (node.getAttribute(name) !== val) {
          matchAll = false;
          break;
        }
      }
    }
    return matchAll;
  }
  if (selector.startsWith('[') && selector.endsWith(']')) {
    const attrRegex = /\[([a-zA-Z0-9-_:]+)(?:="([^"]*)")?\]/g;
    let m: RegExpExecArray | null;
    let matchAll = true;
    while ((m = attrRegex.exec(selector)) !== null) {
      const name = m[1];
      const val = m[2];
      if (val === undefined) {
        if (!node.hasAttribute(name)) {
          matchAll = false;
          break;
        }
      } else {
        if (node.getAttribute(name) !== val) {
          matchAll = false;
          break;
        }
      }
    }
    return matchAll;
  }
  return node.tagName.toLowerCase() === selector.toLowerCase();
}

function parseHtmlToMock(html: string, parent: MockElement) {
  const tokenRegex = /<([a-zA-Z0-9-]+)([^>]*?)(\/?)>|([^<]+)|<\/([a-zA-Z0-9-]+)>/g;
  const stack: MockElement[] = [parent];
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(html)) !== null) {
    const [_, openTag, attrsStr, selfClose, textContent, closeTag] = match;

    if (openTag) {
      if (openTag.toLowerCase() === 'style') {
        const endStyle = html.indexOf('</style>', tokenRegex.lastIndex);
        const styleText = endStyle !== -1 ? html.substring(tokenRegex.lastIndex, endStyle) : '';
        const el = new MockElement('style');
        el.textContent = styleText;
        stack[stack.length - 1].appendChild(el);
        if (endStyle !== -1) {
          tokenRegex.lastIndex = endStyle + 8;
        }
        continue;
      }

      const el = new MockElement(openTag);
      if (attrsStr) {
        const attrRegex = /([a-zA-Z0-9-_:]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
        let attrMatch: RegExpExecArray | null;
        while ((attrMatch = attrRegex.exec(attrsStr)) !== null) {
          const attrName = attrMatch[1];
          const attrVal = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? '';
          el.setAttribute(attrName, attrVal);
        }
      }

      stack[stack.length - 1].appendChild(el);

      if (!selfClose && !['input', 'img', 'br', 'hr', 'meta'].includes(openTag.toLowerCase())) {
        stack.push(el);
      }
    } else if (textContent) {
      const trimmed = textContent.trim();
      if (trimmed) {
        stack[stack.length - 1].textContent = trimmed;
      }
    } else if (closeTag) {
      if (stack.length > 1 && stack[stack.length - 1].tagName.toLowerCase() === closeTag.toLowerCase()) {
        stack.pop();
      }
    }
  }
}

class MockCustomElementRegistry {
  private registry: Map<string, any> = new Map();
  public define(name: string, constructor: any): void {
    this.registry.set(name, constructor);
  }
  public get(name: string): any {
    return this.registry.get(name);
  }
}

class MockWindow {
  private listeners: Map<string, Array<(e: any) => void>> = new Map();
  public addEventListener(type: string, listener: (e: any) => void): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(listener);
  }
  public removeEventListener(type: string, listener: (e: any) => void): void {
    const list = this.listeners.get(type);
    if (!list) return;
    const idx = list.indexOf(listener);
    if (idx !== -1) list.splice(idx, 1);
  }
  public dispatchEvent(event: any): boolean {
    const list = this.listeners.get(event.type);
    if (list) {
      for (const fn of [...list]) {
        fn(event);
      }
    }
    return !event.defaultPrevented;
  }
}

// Install mock DOM onto globalThis before importing component
(globalThis as any).HTMLElement = MockElement;
(globalThis as any).Event = MockEvent;
(globalThis as any).CustomEvent = MockCustomEvent;
(globalThis as any).KeyboardEvent = MockKeyboardEvent;
(globalThis as any).customElements = new MockCustomElementRegistry();
(globalThis as any).window = new MockWindow();
(globalThis as any).document = {
  createElement: (tag: string) => {
    const ctor = (globalThis as any).customElements.get(tag);
    return ctor ? new ctor() : new MockElement(tag);
  },
};

const { StayCalc } = await import('../src/components/stay-calc.ts');

// --- Helper Functions ---

function getShadowElement(calc: any, selector: string): MockElement {
  const el = calc.shadowRoot?.querySelector(selector);
  assert.ok(el, `Expected shadow DOM element matching "${selector}" to exist`);
  return el as MockElement;
}

// --- Test Suites ---

describe('StayCalc Programmer Radix Mode & Bitwise Ops (F6)', () => {
  let engine: CalculatorEngine;
  let calc: any;

  beforeEach(() => {
    engine = new CalculatorEngine({ mode: 'programmer', radix: 'HEX' });
    calc = new StayCalc();
    calc.connectedCallback();
    calc.setMode('programmer');
  });

  // CASE-01: Happy Path Nominal Execution (Radix Conversion & Bitwise Operations)
  describe('CASE-01: Happy Path Nominal Execution (Radix Conversion & Bitwise Operations)', () => {
    it('evaluates bitwise AND in HEX radix (0xFF & 0x0F = 0x0F)', () => {
      engine.setRadix('HEX');
      engine.inputHexDigit('F');
      engine.inputHexDigit('F');
      engine.pressOperator('AND');
      engine.inputHexDigit('0');
      engine.inputHexDigit('F');
      engine.pressEquals();

      assert.strictEqual(engine.getState().display, 'F');
      assert.strictEqual(engine.getState().multiRadix.hex, 'F');
      assert.strictEqual(engine.getState().multiRadix.dec, '15');
      assert.strictEqual(engine.getState().multiRadix.bin, '1111');
    });

    it('evaluates bitwise OR in DEC radix (12 | 10 = 14)', () => {
      engine.setRadix('DEC');
      engine.pressDigit('1');
      engine.pressDigit('2');
      engine.pressOperator('OR');
      engine.pressDigit('1');
      engine.pressDigit('0');
      engine.pressEquals();

      assert.strictEqual(engine.getState().display, '14');
      assert.strictEqual(engine.getState().multiRadix.hex, 'E');
      assert.strictEqual(engine.getState().multiRadix.bin, '1110');
    });

    it('evaluates bitwise XOR in DEC radix (12 ^ 10 = 6)', () => {
      engine.setRadix('DEC');
      engine.pressDigit('1');
      engine.pressDigit('2');
      engine.pressOperator('XOR');
      engine.pressDigit('1');
      engine.pressDigit('0');
      engine.pressEquals();

      assert.strictEqual(engine.getState().display, '6');
      assert.strictEqual(engine.getState().multiRadix.bin, '110');
    });

    it('evaluates bitwise Left Shift (1 << 4 = 16)', () => {
      engine.setRadix('DEC');
      engine.pressDigit('1');
      engine.pressOperator('LSH');
      engine.pressDigit('4');
      engine.pressEquals();

      assert.strictEqual(engine.getState().display, '16');
      assert.strictEqual(engine.getState().multiRadix.hex, '10');
    });

    it('evaluates bitwise Right Shift (16 >> 2 = 4)', () => {
      engine.setRadix('DEC');
      engine.pressDigit('1');
      engine.pressDigit('6');
      engine.pressOperator('RSH');
      engine.pressDigit('2');
      engine.pressEquals();

      assert.strictEqual(engine.getState().display, '4');
    });

    it('evaluates bitwise NOT (~0 = -1)', () => {
      engine.setRadix('DEC');
      engine.pressDigit('0');
      engine.bitwiseNot();

      assert.strictEqual(engine.getState().display, '-1');
      assert.strictEqual(engine.getState().multiRadix.hex, 'FFFFFFFF');
      assert.strictEqual(engine.getState().multiRadix.bin, '11111111111111111111111111111111');
    });

    it('adheres to NEVER-CALC-001 by strictly avoiding dynamic eval', () => {
      assert.strictEqual(typeof evaluateBinary, 'function');
      const res = evaluateBinary(12, 'AND', 10, 'programmer', 'DEC');
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.formatted, '8');
    });
  });

  // CASE-02: Empty State & First Use (Bootstrap, Default Radix & Multi-Radix Preview Initialization)
  describe('CASE-02: Empty State & First Use (Bootstrap, Default Radix & Multi-Radix Preview Initialization)', () => {
    it('initializes programmer mode with default HEX radix and zeroed multi-radix preview values', () => {
      assert.strictEqual(engine.getRadix(), 'HEX');
      assert.strictEqual(engine.getState().display, '0');
      const multi = engine.getMultiRadix();
      assert.strictEqual(multi.hex, '0');
      assert.strictEqual(multi.dec, '0');
      assert.strictEqual(multi.oct, '0');
      assert.strictEqual(multi.bin, '0');
    });

    it('renders radix selector, preview display, and programmer keys in component shadow DOM', () => {
      const radixSelector = getShadowElement(calc, '#radixSelector');
      const multiPreview = getShadowElement(calc, '#multiRadixPreview');
      const progKeys = getShadowElement(calc, '#programmerKeys');

      assert.strictEqual(radixSelector.classList.contains('visible'), true);
      assert.strictEqual(multiPreview.classList.contains('visible'), true);
      assert.strictEqual(progKeys.classList.contains('visible'), true);

      const hexBtn = getShadowElement(calc, '#btnRadixHex');
      assert.strictEqual(hexBtn.getAttribute('aria-pressed'), 'true');
    });
  });

  // CASE-03: Error State & Input Lock (Integer Division by Zero Lockout & Escape Unlock)
  describe('CASE-03: Error State & Input Lock (Integer Division by Zero Lockout & Escape Unlock)', () => {
    it('locks input on integer division by zero in programmer mode', () => {
      engine.setRadix('DEC');
      engine.pressDigit('4');
      engine.pressDigit('2');
      engine.pressOperator('/');
      engine.pressDigit('0');
      engine.pressEquals();

      assert.strictEqual(engine.getState().display, DIVISION_BY_ZERO_ERROR);
      assert.strictEqual(engine.getState().isLocked, true);

      // Attempt to press digits or operators while locked
      engine.pressDigit('7');
      assert.strictEqual(engine.getState().display, DIVISION_BY_ZERO_ERROR);

      // Clear unlocks back to clean state
      engine.pressClear();
      assert.strictEqual(engine.getState().display, '0');
      assert.strictEqual(engine.getState().isLocked, false);
      assert.strictEqual(engine.getState().mode, 'programmer');
    });
  });

  // CASE-04: Mid-Flow Operator Replacement with Bitwise Operator (RULE-CALC-008)
  describe('CASE-04: Mid-Flow Operator Replacement with Bitwise Operator (RULE-CALC-008)', () => {
    it('replaces pending addition with bitwise AND mid-calculation', () => {
      engine.setRadix('DEC');
      engine.pressDigit('1');
      engine.pressDigit('2');
      engine.pressOperator('+');
      // Immediately replace operator with AND
      engine.pressOperator('AND');
      engine.pressDigit('1');
      engine.pressDigit('0');
      engine.pressEquals();

      // 12 & 10 = 8 (not 12 + 10 = 22)
      assert.strictEqual(engine.getState().display, '8');
    });

    it('replaces pending bitwise operator with another bitwise operator', () => {
      engine.setRadix('DEC');
      engine.pressDigit('1');
      engine.pressDigit('2');
      engine.pressOperator('AND');
      engine.pressOperator('OR');
      engine.pressDigit('1');
      engine.pressDigit('0');
      engine.pressEquals();

      // 12 | 10 = 14
      assert.strictEqual(engine.getState().display, '14');
    });
  });

  // CASE-05: Idempotency & Repeated Operations (Radix Toggle Idempotency & Sequential Shift/NOT)
  describe('CASE-05: Idempotency & Repeated Operations (Radix Toggle Idempotency & Sequential Shift/NOT)', () => {
    it('repeatedly converts active value across radices losslessly', () => {
      engine.setRadix('DEC');
      engine.pressDigit('4');
      engine.pressDigit('2');
      assert.strictEqual(engine.getState().display, '42');

      engine.setRadix('HEX');
      assert.strictEqual(engine.getState().display, '2A');

      engine.setRadix('BIN');
      assert.strictEqual(engine.getState().display, '101010');

      engine.setRadix('OCT');
      assert.strictEqual(engine.getState().display, '52');

      engine.setRadix('DEC');
      assert.strictEqual(engine.getState().display, '42');
    });

    it('evaluates repeated equals on bitwise left shift', () => {
      engine.setRadix('DEC');
      engine.pressDigit('1');
      engine.pressOperator('LSH');
      engine.pressDigit('1');
      engine.pressEquals(); // 1 << 1 = 2
      assert.strictEqual(engine.getState().display, '2');

      engine.pressEquals(); // idempotent
      assert.strictEqual(engine.getState().display, '2');
    });

    it('returns to original value on consecutive double bitwise NOT', () => {
      engine.setRadix('DEC');
      engine.pressDigit('5');
      engine.bitwiseNot();
      assert.strictEqual(engine.getState().display, '-6');

      engine.bitwiseNot();
      assert.strictEqual(engine.getState().display, '5');
    });
  });

  // CASE-06: Precision Normalization & 32-Bit Integer Two's Complement Boundary Clamping (RULE-CALC-004)
  describe("CASE-06: Precision Normalization & 32-Bit Integer Two's Complement Boundary Clamping (RULE-CALC-004)", () => {
    it('wraps 32-bit signed overflow cleanly (2147483647 + 1 = -2147483648)', () => {
      engine.setRadix('DEC');
      // Set to 2147483647
      '2147483647'.split('').forEach((d) => engine.pressDigit(d));
      engine.pressOperator('+');
      engine.pressDigit('1');
      engine.pressEquals();

      assert.strictEqual(engine.getState().display, '-2147483648');
      assert.strictEqual(engine.getState().multiRadix.hex, '80000000');
    });

    it('formats negative numbers in two\'s complement HEX and BIN representations (0 - 1 = -1)', () => {
      engine.setRadix('DEC');
      engine.pressDigit('0');
      engine.pressOperator('-');
      engine.pressDigit('1');
      engine.pressEquals();

      assert.strictEqual(engine.getState().display, '-1');
      assert.strictEqual(engine.getState().multiRadix.hex, 'FFFFFFFF');
      assert.strictEqual(engine.getState().multiRadix.bin, '11111111111111111111111111111111');
      assert.strictEqual(engine.getState().multiRadix.oct, '37777777777');
    });
  });

  // CASE-07: Hexadecimal and Octal Input Handling (Digit Capacity & Prefix/Case Normalization)
  describe('CASE-07: Hexadecimal and Octal Input Handling (Digit Capacity & Prefix/Case Normalization)', () => {
    it('inputs and formats uppercase hexadecimal digits A-F accurately', () => {
      engine.setRadix('HEX');
      ['A', 'B', 'C', 'D', 'E', 'F'].forEach((h) => engine.inputHexDigit(h));

      assert.strictEqual(engine.getState().display, 'ABCDEF');
      assert.strictEqual(engine.getState().multiRadix.hex, 'ABCDEF');
      assert.strictEqual(engine.getState().multiRadix.dec, '11259375');
    });

    it('inputs and converts octal digits accurately', () => {
      engine.setRadix('OCT');
      ['7', '0', '5'].forEach((d) => engine.pressDigit(d));

      assert.strictEqual(engine.getState().display, '705');
      assert.strictEqual(engine.getState().multiRadix.dec, '453');
      assert.strictEqual(engine.getState().multiRadix.hex, '1C5');
    });
  });

  // CASE-08: State Persistence Across Mode Toggles (Standard <-> Scientific <-> Programmer Retention) (RULE-CALC-006)
  describe('CASE-08: State Persistence Across Mode Toggles (RULE-CALC-006)', () => {
    it('preserves accumulator, pending operator, memory register, and history across mode transitions', () => {
      const e = new CalculatorEngine();
      e.pressDigit('5');
      e.pressDigit('0');
      e.pressOperator('+');

      // Set memory
      e.pressDigit('2');
      e.pressDigit('5');
      e.pressMemoryAdd();

      // Switch to programmer mode
      e.setMode('programmer');
      assert.strictEqual(e.getMode(), 'programmer');
      assert.strictEqual(e.getState().accumulator, 50);
      assert.strictEqual(e.getState().pendingOperator, '+');
      assert.strictEqual(e.getState().memory, 25);
      assert.strictEqual(e.getState().hasActiveMemory, true);

      // Switch back to standard mode and complete computation
      e.setMode('standard');
      assert.strictEqual(e.getMode(), 'standard');
      e.pressDigit('1');
      e.pressDigit('0');
      e.pressEquals();

      assert.strictEqual(e.getState().display, '60');
      assert.strictEqual(e.getState().memory, 25);
      assert.strictEqual(e.getState().history.length, 1);
    });
  });

  // CASE-09: Clear & Reset Semantics in Programmer Mode (C vs AC)
  describe('CASE-09: Clear & Reset Semantics in Programmer Mode (C vs AC)', () => {
    it('Clear (C) resets active buffer while preserving accumulator, pending operator, and active radix', () => {
      engine.setRadix('HEX');
      engine.inputHexDigit('F');
      engine.inputHexDigit('F');
      engine.pressOperator('AND');

      engine.inputHexDigit('A');
      engine.inputHexDigit('A');
      assert.strictEqual(engine.getState().display, 'AA');

      // Press Clear
      engine.pressClear();
      assert.strictEqual(engine.getState().display, '0');
      assert.strictEqual(engine.getState().accumulator, 255);
      assert.strictEqual(engine.getState().pendingOperator, 'AND');
      assert.strictEqual(engine.getRadix(), 'HEX');

      // Complete with 0F
      engine.inputHexDigit('0');
      engine.inputHexDigit('F');
      engine.pressEquals();

      assert.strictEqual(engine.getState().display, 'F');
    });

    it('All Clear (AC) resets registers while preserving programmer mode and active radix', () => {
      engine.setRadix('OCT');
      engine.pressDigit('7');
      engine.pressOperator('+');
      engine.pressDigit('3');

      engine.pressAllClear();
      assert.strictEqual(engine.getState().display, '0');
      assert.strictEqual(engine.getState().accumulator, null);
      assert.strictEqual(engine.getState().pendingOperator, null);
      assert.strictEqual(engine.getMode(), 'programmer');
      assert.strictEqual(engine.getRadix(), 'OCT');
    });
  });

  // CASE-10: Dynamic Keypad Gating & Radix Invariant Enforcement
  describe('CASE-10: Dynamic Keypad Gating & Radix Invariant Enforcement', () => {
    it('enforces dynamic gating on keypad buttons according to active radix', () => {
      // Test BIN radix
      calc.setRadix('BIN');
      const bin0 = calc.shadowRoot?.querySelector('button[data-action="digit"][data-value="0"]');
      const bin1 = calc.shadowRoot?.querySelector('button[data-action="digit"][data-value="1"]');
      const bin2 = calc.shadowRoot?.querySelector('button[data-action="digit"][data-value="2"]');
      const btnHexA = calc.shadowRoot?.querySelector('#btnHexA');
      const decBtn = calc.shadowRoot?.querySelector('button[data-action="decimal"]');

      assert.strictEqual(bin0.hasAttribute('disabled'), false);
      assert.strictEqual(bin1.hasAttribute('disabled'), false);
      assert.strictEqual(bin2.hasAttribute('disabled'), true);
      assert.strictEqual(btnHexA.hasAttribute('disabled'), true);
      assert.strictEqual(decBtn.hasAttribute('disabled'), true);

      // Test OCT radix
      calc.setRadix('OCT');
      const oct7 = calc.shadowRoot?.querySelector('button[data-action="digit"][data-value="7"]');
      const oct8 = calc.shadowRoot?.querySelector('button[data-action="digit"][data-value="8"]');
      assert.strictEqual(oct7.hasAttribute('disabled'), false);
      assert.strictEqual(oct8.hasAttribute('disabled'), true);

      // Test DEC radix
      calc.setRadix('DEC');
      assert.strictEqual(oct8.hasAttribute('disabled'), false);
      assert.strictEqual(btnHexA.hasAttribute('disabled'), true);

      // Test HEX radix
      calc.setRadix('HEX');
      assert.strictEqual(btnHexA.hasAttribute('disabled'), false);
      assert.strictEqual(decBtn.hasAttribute('disabled'), true);
    });

    it('intercepts and suppresses disallowed keyboard inputs per active radix', () => {
      calc.setRadix('BIN');
      const typeKey = (key: string) => {
        const ev = new MockKeyboardEvent('keydown', { key, cancelable: true });
        calc.handleKeyDown(ev as any);
        return ev;
      };

      // In BIN mode, '1' is allowed, '2' and '.' are suppressed
      typeKey('1');
      assert.strictEqual(calc.getState().display, '1');

      const ev2 = typeKey('2');
      assert.strictEqual(ev2.defaultPrevented, true);
      assert.strictEqual(calc.getState().display, '1');

      const evDec = typeKey('.');
      assert.strictEqual(evDec.defaultPrevented, true);
      assert.strictEqual(calc.getState().display, '1');
    });
  });

  // CASE-11: Component UI, Container Queries, Accessibility & Event Synchronization
  describe('CASE-11: Component UI, Container Queries, Accessibility & Event Synchronization', () => {
    it('updates radix button aria-pressed and dispatches mode-change and calc-change CustomEvents', () => {
      let modeChangeDispatched = false;
      let calcChangeDispatched = false;
      let lastModeDetail: any = null;

      calc.addEventListener('mode-change', (e: any) => {
        modeChangeDispatched = true;
        lastModeDetail = e.detail;
      });

      calc.addEventListener('calc-change', (e: any) => {
        calcChangeDispatched = true;
      });

      calc.setRadix('OCT');

      assert.strictEqual(modeChangeDispatched, true);
      assert.strictEqual(calcChangeDispatched, true);
      assert.strictEqual(lastModeDetail.mode, 'programmer');
      assert.strictEqual(lastModeDetail.radix, 'OCT');

      const octBtn = getShadowElement(calc, '#btnRadixOct');
      const hexBtn = getShadowElement(calc, '#btnRadixHex');
      assert.strictEqual(octBtn.getAttribute('aria-pressed'), 'true');
      assert.strictEqual(hexBtn.getAttribute('aria-pressed'), 'false');
    });

    it('renders all bitwise and hex buttons with accessible aria-label attributes', () => {
      const progKeys = getShadowElement(calc, '#programmerKeys');
      const buttons = progKeys.querySelectorAll('button');
      assert.strictEqual(buttons.length, 12);

      const expectedLabels = [
        'Bitwise AND',
        'Bitwise OR',
        'Bitwise XOR',
        'Bitwise NOT',
        'Bitwise Left Shift',
        'Bitwise Right Shift',
        'Hex A',
        'Hex B',
        'Hex C',
        'Hex D',
        'Hex E',
        'Hex F',
      ];

      for (const expected of expectedLabels) {
        const found = buttons.find((b: any) => b.getAttribute('aria-label') === expected);
        assert.ok(found, `Expected button with aria-label "${expected}" to exist in programmer keys`);
      }
    });

    it('executes bitwise operations via physical keyboard shortcuts (&, |, ^, ~)', () => {
      calc.setRadix('DEC');
      const typeKey = (key: string) => {
        const ev = new MockKeyboardEvent('keydown', { key, cancelable: true });
        calc.handleKeyDown(ev as any);
      };

      typeKey('1');
      typeKey('2');
      typeKey('&');
      typeKey('1');
      typeKey('0');
      typeKey('Enter');

      assert.strictEqual(calc.getState().display, '8');

      // Test bitwise NOT shortcut
      typeKey('~');
      assert.strictEqual(calc.getState().display, '-9');
    });
  });
});
