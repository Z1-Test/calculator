/**
 * test/scientific.test.ts
 *
 * Comprehensive unit test suite for StayCalc Feature 5 (F5: Scientific Mode Toggle and Functions).
 * Maps 1:1 to the 11 Universal Test Cases (CASE-01 to CASE-11) defined in
 * docs/context/features/f5-scientific-mode/cases.md.
 * Verifies CalculatorEngine scientific unary and binary operations, trigonometric precision,
 * cardinal angle exactness (sin(90)=1, cos(90)=0, tan(90)->Invalid input), constant loading (pi, e),
 * angle unit toggling (DEG/RAD), state persistence across mode toggles (RULE-CALC-006),
 * error lockouts (RULE-CALC-001, NEVER-CALC-004), operator replacement with '^' (RULE-CALC-008),
 * accessible custom element UI, container queries, and SEAM-ENGINE-01 / SEAM-UI-01 event synchronization.
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
  evaluateTrig,
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

class MockElement {
  public tagName: string;
  public id: string = '';
  public attributes: Map<string, string> = new Map();
  public style: Record<string, string> = {};
  public classList: {
    add: (...tokens: string[]) => void;
    remove: (...tokens: string[]) => void;
    contains: (token: string) => boolean;
    toggle: (token: string, force?: boolean) => boolean;
  };
  private classes: Set<string> = new Set();
  public children: MockElement[] = [];
  public parentNode: MockElement | null = null;
  public shadowRoot: MockShadowRoot | null = null;
  private listeners: Map<string, Array<(e: any) => void>> = new Map();
  private _textContent: string = '';

  constructor(tagName: string = 'div') {
    this.tagName = tagName.toUpperCase();
    this.classList = {
      add: (...tokens: string[]) => tokens.forEach((t) => this.classes.add(t)),
      remove: (...tokens: string[]) => tokens.forEach((t) => this.classes.delete(t)),
      contains: (token: string) => this.classes.has(token),
      toggle: (token: string, force?: boolean) => {
        if (force === true) {
          this.classes.add(token);
          return true;
        }
        if (force === false) {
          this.classes.delete(token);
          return false;
        }
        if (this.classes.has(token)) {
          this.classes.delete(token);
          return false;
        }
        this.classes.add(token);
        return true;
      },
    };
  }

  get className(): string {
    return Array.from(this.classes).join(' ');
  }

  set className(val: string) {
    this.setAttribute('class', val);
  }

  get textContent(): string {
    if (this.children.length === 0) {
      return this._textContent;
    }
    return this.children.map((c) => c.textContent).join('');
  }

  set textContent(val: string) {
    this._textContent = val;
    this.children = [];
  }

  public getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }

  public setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
    if (name === 'id') this.id = value;
    if (name === 'class') {
      this.classes.clear();
      value.split(/\s+/).filter(Boolean).forEach((c) => this.classes.add(c));
    }
  }

  public hasAttribute(name: string): boolean {
    return this.attributes.has(name);
  }

  public removeAttribute(name: string): void {
    this.attributes.delete(name);
    if (name === 'id') this.id = '';
    if (name === 'class') this.classes.clear();
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
    const attrMatch = selector.match(/button\[([a-zA-Z0-9-_:]+)\]/);
    if (attrMatch) {
      return node.hasAttribute(attrMatch[1]);
    }
  }
  if (selector.startsWith('[') && selector.endsWith(']')) {
    const attrMatch = selector.match(/\[([a-zA-Z0-9-_:]+)(?:="([^"]*)")?\]/);
    if (attrMatch) {
      const name = attrMatch[1];
      const val = attrMatch[2];
      if (val === undefined) return node.hasAttribute(name);
      return node.getAttribute(name) === val;
    }
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
        const attrRegex = /([a-zA-Z0-9-_:]+)(?:="([^"]*)")?/g;
        let attrMatch: RegExpExecArray | null;
        while ((attrMatch = attrRegex.exec(attrsStr)) !== null) {
          const name = attrMatch[1];
          const val = attrMatch[2] !== undefined ? attrMatch[2] : '';
          el.setAttribute(name, val);
        }
      }

      stack[stack.length - 1].appendChild(el);
      if (!selfClose && !['input', 'img', 'br', 'hr', 'meta', 'link'].includes(openTag.toLowerCase())) {
        stack.push(el);
      }
    } else if (closeTag) {
      if (stack.length > 1 && stack[stack.length - 1].tagName.toLowerCase() === closeTag.toLowerCase()) {
        stack.pop();
      }
    } else if (textContent) {
      const trimmed = textContent.trim();
      if (trimmed.length > 0) {
        stack[stack.length - 1].textContent = trimmed;
      }
    }
  }
}

// Setup global mock DOM environment for StayCalc custom element tests
(globalThis as any).HTMLElement = MockElement;
(globalThis as any).CustomEvent = MockCustomEvent;
(globalThis as any).Event = MockEvent;
(globalThis as any).KeyboardEvent = MockKeyboardEvent;
(globalThis as any).window = {
  addEventListener: () => {},
  removeEventListener: () => {},
};
(globalThis as any).document = {
  createElement: (tagName: string) => new MockElement(tagName),
};
(globalThis as any).customElements = {
  define: () => {},
  get: () => undefined,
};

// Dynamically import StayCalc after mock DOM globals are populated
const { StayCalc } = await import('../src/components/stay-calc.ts');

describe('StayCalc Scientific Mode & Functions (F5)', () => {
  let engine: CalculatorEngine;
  let calc: InstanceType<typeof StayCalc>;

  beforeEach(() => {
    engine = new CalculatorEngine();
    calc = new StayCalc();
    calc.connectedCallback();
  });

  // CASE-01: Happy Path Nominal Execution
  describe('CASE-01: Happy Path Nominal Execution (Scientific Mode Toggle & Function Evaluation)', () => {
    it('toggles mode to scientific and evaluates square root, square, and power operations', () => {
      // Toggle mode
      engine.toggleMode();
      assert.strictEqual(engine.getMode(), 'scientific');

      // Square root: √25 = 5
      engine.pressDigit('2');
      engine.pressDigit('5');
      engine.squareRoot();
      assert.strictEqual(engine.getState().display, '5');
      assert.strictEqual(engine.getState().waitingForOperand, true);

      // Square: 6² = 36
      engine.pressDigit('6');
      engine.square();
      assert.strictEqual(engine.getState().display, '36');
      assert.strictEqual(engine.getState().waitingForOperand, true);

      // Power: 2 ^ 8 = 256
      engine.pressDigit('2');
      engine.pressOperator('^');
      engine.pressDigit('8');
      engine.pressEquals();
      assert.strictEqual(engine.getState().display, '256');
    });

    it('evaluates scientific functions via StayCalc custom element facade methods', () => {
      calc.toggleMode();
      assert.strictEqual(calc.getMode(), 'scientific');

      calc.pressButton('digit', '9');
      calc.squareRoot();
      assert.strictEqual(calc.getState().display, '3');

      calc.pressButton('digit', '4');
      calc.square();
      assert.strictEqual(calc.getState().display, '16');

      calc.pressButton('digit', '3');
      calc.pressButton('operator', '^');
      calc.pressButton('digit', '3');
      calc.pressButton('equals');
      assert.strictEqual(calc.getState().display, '27');
    });
  });

  // CASE-02: Empty State & First Use
  describe('CASE-02: Empty State & First Use (Clean Initial Bootstrap & Standard Mode Defaults)', () => {
    it('initializes engine with mode="standard" and angleUnit="DEG"', () => {
      const state = engine.getState();
      assert.strictEqual(state.mode, 'standard');
      assert.strictEqual(state.angleUnit, 'DEG');
      assert.strictEqual(state.display, '0');
      assert.strictEqual(state.accumulator, null);
      assert.strictEqual(state.pendingOperator, null);
      assert.strictEqual(state.error, null);
      assert.strictEqual(state.isLocked, false);
    });

    it('mounts <stay-calc> with modeToggle label "Switch to scientific mode" and hidden scientific keys', () => {
      const modeBtn = calc.shadowRoot?.querySelector('#modeToggle');
      assert.ok(modeBtn);
      assert.strictEqual(modeBtn.getAttribute('aria-label'), 'Switch to scientific mode');

      const sciKeys = calc.shadowRoot?.querySelector('#scientificKeys');
      assert.ok(sciKeys);
      assert.strictEqual(sciKeys.getAttribute('aria-hidden'), 'true');
      assert.strictEqual(sciKeys.style.display, 'none');
    });
  });

  // CASE-03: Error State & Input Lock
  describe('CASE-03: Error State & Input Lock (Negative Square Root & Invalid Tangent Lockout)', () => {
    it('triggers "Invalid input" and locks input on square root of negative number', () => {
      engine.pressDigit('9');
      engine.pressToggleSign();
      assert.strictEqual(engine.getState().display, '-9');

      engine.squareRoot();
      assert.strictEqual(engine.getState().display, 'Invalid input');
      assert.strictEqual(engine.getState().isLocked, true);
      assert.strictEqual(engine.getState().error, 'Invalid input');

      // Subsequent input ignored while locked
      engine.pressDigit('5');
      assert.strictEqual(engine.getState().display, 'Invalid input');

      // Unlocks on Clear (C)
      engine.pressClear();
      assert.strictEqual(engine.getState().display, '0');
      assert.strictEqual(engine.getState().isLocked, false);
      assert.strictEqual(engine.getState().error, null);
    });

    it('triggers "Invalid input" and locks on tan(90) in DEG mode', () => {
      assert.strictEqual(engine.getAngleUnit(), 'DEG');
      engine.pressDigit('9');
      engine.pressDigit('0');
      engine.tan();

      assert.strictEqual(engine.getState().display, 'Invalid input');
      assert.strictEqual(engine.getState().isLocked, true);

      // Unlocks on All Clear (AC)
      engine.pressAllClear();
      assert.strictEqual(engine.getState().display, '0');
      assert.strictEqual(engine.getState().isLocked, false);
    });

    it('handles negative base with non-integer exponent cleanly (2 ^ -1 on 0 -> division by zero or invalid input)', () => {
      const res = evaluateBinary(0, '^', -1);
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.error, 'Cannot divide by zero');
    });
  });

  // CASE-04: Mid-Flow Operator Replacement
  describe('CASE-04: Mid-Flow Operator Replacement with Power Operator (RULE-CALC-008)', () => {
    it('replaces pending addition with power operator mid-calculation', () => {
      engine.pressDigit('2');
      engine.pressOperator('+');
      assert.strictEqual(engine.getState().pendingOperator, '+');

      // Replace with power operator
      engine.pressOperator('^');
      assert.strictEqual(engine.getState().pendingOperator, '^');

      engine.pressDigit('3');
      engine.pressEquals();
      assert.strictEqual(engine.getState().display, '8');
    });

    it('replaces power operator with another operator', () => {
      engine.pressDigit('4');
      engine.pressOperator('^');
      engine.pressOperator('*');
      assert.strictEqual(engine.getState().pendingOperator, '*');

      engine.pressDigit('5');
      engine.pressEquals();
      assert.strictEqual(engine.getState().display, '20');
    });
  });

  // CASE-05: Idempotency & Repeated Operations
  describe('CASE-05: Idempotency & Repeated Operations (Repeated Mode Toggle, Angle Toggle & Squaring)', () => {
    it('repeatedly toggles mode without state loss or drift', () => {
      engine.pressDigit('7');
      engine.toggleMode(); // scientific
      assert.strictEqual(engine.getMode(), 'scientific');
      assert.strictEqual(engine.getState().display, '7');

      engine.toggleMode(); // standard
      assert.strictEqual(engine.getMode(), 'standard');
      assert.strictEqual(engine.getState().display, '7');

      engine.toggleMode(); // scientific
      assert.strictEqual(engine.getMode(), 'scientific');
      assert.strictEqual(engine.getState().display, '7');
    });

    it('repeatedly executes squaring operation sequentially', () => {
      engine.pressDigit('2');
      engine.square();
      assert.strictEqual(engine.getState().display, '4');

      engine.square();
      assert.strictEqual(engine.getState().display, '16');

      engine.square();
      assert.strictEqual(engine.getState().display, '256');
    });

    it('repeatedly toggles angle unit between DEG and RAD stably', () => {
      assert.strictEqual(engine.getAngleUnit(), 'DEG');
      engine.toggleAngleUnit();
      assert.strictEqual(engine.getAngleUnit(), 'RAD');
      engine.toggleAngleUnit();
      assert.strictEqual(engine.getAngleUnit(), 'DEG');
      engine.toggleAngleUnit();
      assert.strictEqual(engine.getAngleUnit(), 'RAD');
    });
  });

  // CASE-06: Precision Normalization
  describe('CASE-06: Precision Normalization (Trigonometric Boundaries & IEEE-754 Noise Suppression)', () => {
    it('computes exact cardinal angles in DEG mode (sin, cos, tan)', () => {
      assert.strictEqual(engine.getAngleUnit(), 'DEG');

      // sin(0) = 0, sin(90) = 1, sin(270) = -1
      engine.pressDigit('0');
      engine.sin();
      assert.strictEqual(engine.getState().display, '0');

      engine.pressDigit('9');
      engine.pressDigit('0');
      engine.sin();
      assert.strictEqual(engine.getState().display, '1');

      // cos(0) = 1, cos(90) = 0 (exact, zero float noise!)
      engine.pressDigit('0');
      engine.cos();
      assert.strictEqual(engine.getState().display, '1');

      engine.pressDigit('9');
      engine.pressDigit('0');
      engine.cos();
      assert.strictEqual(engine.getState().display, '0');

      // cos(270) = 0
      engine.pressDigit('2');
      engine.pressDigit('7');
      engine.pressDigit('0');
      engine.cos();
      assert.strictEqual(engine.getState().display, '0');

      // tan(45) = 1, tan(0) = 0
      engine.pressDigit('4');
      engine.pressDigit('5');
      engine.tan();
      assert.strictEqual(engine.getState().display, '1');

      engine.pressDigit('0');
      engine.tan();
      assert.strictEqual(engine.getState().display, '0');

      // sin(30) = 0.5, cos(60) = 0.5
      engine.pressDigit('3');
      engine.pressDigit('0');
      engine.sin();
      assert.strictEqual(engine.getState().display, '0.5');

      engine.pressDigit('6');
      engine.pressDigit('0');
      engine.cos();
      assert.strictEqual(engine.getState().display, '0.5');
    });

    it('computes trigonometric functions in RAD mode with precision noise elimination', () => {
      engine.toggleAngleUnit();
      assert.strictEqual(engine.getAngleUnit(), 'RAD');

      // cos(0) = 1
      engine.pressDigit('0');
      engine.cos();
      assert.strictEqual(engine.getState().display, '1');

      // evaluateTrig directly for pi in RAD
      const sinPi = evaluateTrig('sin', Math.PI, 'RAD');
      assert.strictEqual(sinPi.success, true);
      assert.strictEqual(sinPi.formatted, '0');

      const cosPi = evaluateTrig('cos', Math.PI, 'RAD');
      assert.strictEqual(cosPi.success, true);
      assert.strictEqual(cosPi.formatted, '-1');

      const cosHalfPi = evaluateTrig('cos', Math.PI / 2, 'RAD');
      assert.strictEqual(cosHalfPi.success, true);
      assert.strictEqual(cosHalfPi.formatted, '0');
    });
  });

  // CASE-07: Constants Loading
  describe('CASE-07: Constants Loading (Pi & Euler\'s Number Precision & Arithmetic Use)', () => {
    it('loads Pi with 10-digit normalized precision ("3.141592654")', () => {
      engine.loadConstant('pi');
      assert.strictEqual(engine.getState().display, '3.141592654');
      assert.strictEqual(engine.getState().waitingForOperand, true);

      // Chained arithmetic: pi * 2 = 6.283185308
      engine.pressOperator('*');
      engine.pressDigit('2');
      engine.pressEquals();
      assert.strictEqual(engine.getState().display, '6.283185308');
    });

    it('loads Euler\'s number with 10-digit normalized precision ("2.718281828")', () => {
      engine.loadConstant('e');
      assert.strictEqual(engine.getState().display, '2.718281828');
      assert.strictEqual(engine.getState().waitingForOperand, true);

      // Chained arithmetic: e + 1 = 3.718281828
      engine.pressOperator('+');
      engine.pressDigit('1');
      engine.pressEquals();
      assert.strictEqual(engine.getState().display, '3.718281828');
    });
  });

  // CASE-08: State Persistence Across Mode Toggles
  describe('CASE-08: State Persistence Across Mode Toggles (RULE-CALC-006)', () => {
    it('preserves accumulator, pending operator, memory register, and history across mode switches', () => {
      // 1. In-progress computation
      engine.pressDigit('1');
      engine.pressDigit('5');
      engine.pressOperator('+');
      assert.strictEqual(engine.getState().accumulator, 15);
      assert.strictEqual(engine.getState().pendingOperator, '+');

      // 2. Memory store
      engine.pressDigit('5');
      engine.pressMemoryAdd();
      assert.strictEqual(engine.getState().memory, 5);
      assert.strictEqual(engine.getState().hasActiveMemory, true);

      // 3. Switch to scientific mode
      engine.toggleMode();
      assert.strictEqual(engine.getMode(), 'scientific');
      assert.strictEqual(engine.getState().accumulator, 15);
      assert.strictEqual(engine.getState().pendingOperator, '+');
      assert.strictEqual(engine.getState().memory, 5);
      assert.strictEqual(engine.getState().hasActiveMemory, true);

      // 4. Switch back to standard mode
      engine.toggleMode();
      assert.strictEqual(engine.getMode(), 'standard');
      assert.strictEqual(engine.getState().accumulator, 15);
      assert.strictEqual(engine.getState().pendingOperator, '+');

      // 5. Complete calculation
      engine.pressDigit('1');
      engine.pressDigit('0');
      engine.pressEquals();
      assert.strictEqual(engine.getState().display, '25');

      // History was logged
      assert.strictEqual(engine.getHistory().length, 1);
      assert.strictEqual(engine.getHistory()[0].expression, '15 + 10');
      assert.strictEqual(engine.getHistory()[0].result, '25');

      // Toggle to scientific again, verify history preserved
      engine.toggleMode();
      assert.strictEqual(engine.getHistory().length, 1);
    });
  });

  // CASE-09: Clear & Reset Semantics
  describe('CASE-09: Clear & Reset Semantics in Scientific Mode (C vs AC)', () => {
    it('Clear (C) resets active buffer while preserving accumulator, pending operator, mode, and angle unit', () => {
      engine.toggleMode();
      engine.toggleAngleUnit();
      assert.strictEqual(engine.getMode(), 'scientific');
      assert.strictEqual(engine.getAngleUnit(), 'RAD');

      engine.pressDigit('2');
      engine.pressDigit('5');
      engine.pressOperator('^');
      engine.pressDigit('9');
      engine.pressDigit('9');
      assert.strictEqual(engine.getState().display, '99');

      // Press Clear
      engine.pressClear();
      assert.strictEqual(engine.getState().display, '0');
      assert.strictEqual(engine.getState().accumulator, 25);
      assert.strictEqual(engine.getState().pendingOperator, '^');
      assert.strictEqual(engine.getMode(), 'scientific');
      assert.strictEqual(engine.getAngleUnit(), 'RAD');

      // Enter correct exponent and evaluate
      engine.pressDigit('2');
      engine.pressEquals();
      assert.strictEqual(engine.getState().display, '625');
    });

    it('All Clear (AC) resets registers while preserving mode and angle unit', () => {
      engine.toggleMode();
      engine.toggleAngleUnit();
      assert.strictEqual(engine.getMode(), 'scientific');
      assert.strictEqual(engine.getAngleUnit(), 'RAD');

      engine.pressDigit('4');
      engine.pressDigit('2');
      engine.pressAllClear();

      assert.strictEqual(engine.getState().display, '0');
      assert.strictEqual(engine.getState().accumulator, null);
      assert.strictEqual(engine.getState().pendingOperator, null);
      assert.strictEqual(engine.getMode(), 'scientific');
      assert.strictEqual(engine.getAngleUnit(), 'RAD');
    });
  });

  // CASE-10: Angle Unit Mode Switching
  describe('CASE-10: Angle Unit Mode Switching (DEG vs RAD Calculation Differences)', () => {
    it('evaluates sin(90) differently in DEG vs RAD', () => {
      // In DEG: sin(90) = 1
      assert.strictEqual(engine.getAngleUnit(), 'DEG');
      engine.pressDigit('9');
      engine.pressDigit('0');
      engine.sin();
      assert.strictEqual(engine.getState().display, '1');

      // Switch to RAD
      engine.toggleAngleUnit();
      assert.strictEqual(engine.getAngleUnit(), 'RAD');

      // In RAD: sin(90) ≈ 0.893996664
      engine.pressDigit('9');
      engine.pressDigit('0');
      engine.sin();
      const radResult = engine.getState().display;
      assert.ok(radResult.startsWith('0.89399'));
    });
  });

  // CASE-11: Component UI, Container Queries, Accessibility & Event Synchronization
  describe('CASE-11: Component UI, Container Queries, Accessibility & Event Synchronization', () => {
    it('toggles scientific keys visibility and updates mode button aria-label', () => {
      const modeBtn = calc.shadowRoot?.querySelector('#modeToggle');
      const sciKeys = calc.shadowRoot?.querySelector('#scientificKeys');
      const angleToggle = calc.shadowRoot?.querySelector('#angleUnitToggle');
      const angleIndicator = calc.shadowRoot?.querySelector('#angleUnitIndicator');

      assert.ok(modeBtn);
      assert.ok(sciKeys);
      assert.ok(angleToggle);
      assert.ok(angleIndicator);

      // Initial state: standard
      assert.strictEqual(modeBtn.getAttribute('aria-label'), 'Switch to scientific mode');
      assert.strictEqual(sciKeys.style.display, 'none');
      assert.strictEqual(sciKeys.getAttribute('aria-hidden'), 'true');

      // Click mode toggle
      modeBtn.click();
      assert.strictEqual(calc.getMode(), 'scientific');
      assert.strictEqual(modeBtn.getAttribute('aria-label'), 'Switch to standard mode');
      assert.strictEqual(sciKeys.style.display, 'grid');
      assert.strictEqual(sciKeys.getAttribute('aria-hidden'), 'false');
      assert.strictEqual(angleToggle.style.display, 'inline-flex');
      assert.strictEqual(angleIndicator.textContent, 'DEG');

      // Click angle toggle
      angleToggle.click();
      assert.strictEqual(calc.getAngleUnit(), 'RAD');
      assert.strictEqual(angleIndicator.textContent, 'RAD');
      assert.strictEqual(angleToggle.getAttribute('aria-label'), 'Switch angle unit to degrees');
    });

    it('renders all 8 scientific function keys with accessible aria-label attributes', () => {
      calc.toggleMode();
      const sciKeys = calc.shadowRoot?.querySelector('#scientificKeys');
      assert.ok(sciKeys);

      const buttons = sciKeys.querySelectorAll('button');
      assert.strictEqual(buttons.length, 8);

      const expectedLabels = [
        'Square Root',
        'Square',
        'Power',
        'Pi',
        'Euler\'s number',
        'Sine',
        'Cosine',
        'Tangent',
      ];

      for (const expectedLabel of expectedLabels) {
        const found = buttons.some((b) => b.getAttribute('aria-label') === expectedLabel);
        assert.ok(found, `Expected scientific key with aria-label "${expectedLabel}"`);
      }
    });

    it('dispatches mode-change and calc-change CustomEvents upon mode and angle toggles (SEAM-UI-01)', () => {
      let modeChangeDispatched = false;
      let calcChangeDispatched = false;
      let lastModeDetail: any = null;
      let lastCalcDetail: any = null;

      calc.addEventListener('mode-change', (e: any) => {
        modeChangeDispatched = true;
        lastModeDetail = e.detail;
      });

      calc.addEventListener('calc-change', (e: any) => {
        calcChangeDispatched = true;
        lastCalcDetail = e.detail;
      });

      calc.toggleMode();

      assert.strictEqual(modeChangeDispatched, true);
      assert.strictEqual(calcChangeDispatched, true);
      assert.strictEqual(lastModeDetail.mode, 'scientific');
      assert.strictEqual(lastModeDetail.angleUnit, 'DEG');
      assert.strictEqual(lastCalcDetail.mode, 'scientific');

      // Test angle unit toggle event
      modeChangeDispatched = false;
      calc.toggleAngleUnit();
      assert.strictEqual(modeChangeDispatched, true);
      assert.strictEqual(lastModeDetail.angleUnit, 'RAD');
    });

    it('executes scientific operations via physical keyboard "^" hotkey', () => {
      calc.toggleMode();
      const typeKey = (key: string) => {
        const event = new MockKeyboardEvent('keydown', { key, cancelable: true });
        calc.handleKeyDown(event as any);
      };

      typeKey('2');
      typeKey('^');
      typeKey('4');
      typeKey('Enter');

      assert.strictEqual(calc.getState().display, '16');
    });
  });
});
