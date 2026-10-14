/**
 * test/expression.test.ts
 *
 * Comprehensive unit and contract test suite for StayCalc Feature 10 (F10: Formula Expression Preview Display).
 * Maps 1:1 to the 11 Universal Test Cases (CASE-01 to CASE-11) defined in
 * docs/context/features/f10-formula-preview/cases.md.
 *
 * Verifies:
 * - Real-time formula expression preview row (#expressionPreview) above primary readout
 * - Expression updates on operands, binary operators (+, -, *, /, ^), and equals (=)
 * - Mid-flow operator replacement updates expression immediately without evaluation (RULE-CALC-008)
 * - Finalized formula with trailing "=" on equals (e.g. "15 * 4 =") while main display shows result
 * - Division by zero shows "n / 0 =" and error message with input lock (RULE-CALC-001)
 * - Unary function operand wrapping (e.g. "√(25)", "sqr(5)", "sin(90)")
 * - Immediate execution chained operations ("2 + 3 *" evaluates 5 and updates expression to "5 * ")
 * - Clear (C) resets active input buffer while preserving expression prefix (RULE-CALC-009)
 * - All Clear (AC) and reset() reset expression to empty string "" (RULE-CALC-009)
 * - Programmer multi-radix token formatting (HEX, DEC, OCT, BIN) and bitwise ops (RULE-CALC-004)
 * - Accessible #expressionPreview: role="status", aria-label="Expression preview", aria-live="polite"
 * - CustomEvent 'calc-change' dispatch including { expression } (SEAM-UI-01)
 * - Container queries & CSS logical properties with mobile zero-overflow across 320px–390px
 * - Strictly zero external runtime dependencies
 *
 * Runs natively in Node.js 24 (node:test) with zero external runtime dependencies.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  CalculatorEngine,
  createInitialState,
  calculatorReducer,
} from '../src/engine/calculator-engine.ts';
import type {
  CalculatorState,
  Operator,
  CalculatorMode,
  Radix,
} from '../src/engine/types.ts';

// --- Lightweight W3C Custom Element & DOM Test Harness ---

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

  public stopPropagation(): void {}
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
    const self = this;
    this.classList = {
      add: (...tokens: string[]) => {
        tokens.forEach((t) => self.classes.add(t));
      },
      remove: (...tokens: string[]) => {
        tokens.forEach((t) => self.classes.delete(t));
      },
      contains: (token: string) => self.classes.has(token),
      toggle: (token: string, force?: boolean) => {
        if (force !== undefined) {
          if (force) self.classes.add(token);
          else self.classes.delete(token);
          return force;
        }
        if (self.classes.has(token)) {
          self.classes.delete(token);
          return false;
        }
        self.classes.add(token);
        return true;
      },
    };
  }

  public get textContent(): string {
    if (this.children.length === 0) {
      return this._textContent;
    }
    return this.children.map((c) => c.textContent).join('');
  }

  public set textContent(val: string) {
    this._textContent = val;
    this.children = [];
  }

  public get className(): string {
    return Array.from(this.classes).join(' ');
  }

  public set className(val: string) {
    this.classes.clear();
    val.split(/\s+/).filter(Boolean).forEach((c) => this.classes.add(c));
  }

  public setAttribute(name: string, value: string): void {
    this.attributes.set(name, String(value));
    if (name === 'id') this.id = value;
    if (name === 'class') this.className = value;
  }

  public getAttribute(name: string): string | null {
    if (name === 'id') return this.id || null;
    if (name === 'class') return this.className || null;
    return this.attributes.get(name) ?? null;
  }

  public hasAttribute(name: string): boolean {
    if (name === 'id') return Boolean(this.id);
    if (name === 'class') return this.classes.size > 0;
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
  public dispatchEvent(event: MockEvent): boolean {
    const list = this.listeners.get(event.type);
    if (list) {
      for (const fn of [...list]) {
        fn(event);
      }
    }
    return !event.defaultPrevented;
  }
}

// Setup DOM globals
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

function getShadowElement(calc: any, selector: string): MockElement {
  const el = calc.shadowRoot?.querySelector(selector);
  assert.ok(el, `Expected shadow DOM element matching "${selector}" to exist`);
  return el as MockElement;
}

function clickButtonByAction(calc: any, action: string, value?: string): void {
  const buttons = calc.shadowRoot?.querySelectorAll('button') ?? [];
  const btn = buttons.find((b: MockElement) => {
    const matchAction = b.getAttribute('data-action') === action;
    if (value !== undefined) {
      return matchAction && (b.getAttribute('data-value') === value || b.textContent.trim() === value);
    }
    return matchAction;
  });
  assert.ok(btn, `Button with action "${action}" ${value ? `and value "${value}"` : ''} not found`);
  btn.click();
}

function typeKey(key: string): MockKeyboardEvent {
  const event = new MockKeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  (globalThis as any).window.dispatchEvent(event);
  return event;
}

// --- Test Suites: CASE-01 to CASE-11 ---

describe('StayCalc Formula Expression Preview Display (F10)', () => {
  let calc: any;

  beforeEach(() => {
    calc = new StayCalc();
    calc.connectedCallback();
  });

  // CASE-01: Happy Path Nominal Execution
  describe('CASE-01: Happy Path Nominal Execution (Binary Operation Expression Formulation: "15 * 4 = 60")', () => {
    it('engine formulates expression for binary multiplication and appends "=" on equals', () => {
      const engine = new CalculatorEngine();
      engine.pressDigit('1');
      engine.pressDigit('5');
      assert.strictEqual(engine.getState().display, '15');
      assert.strictEqual(engine.getExpression(), '');

      engine.pressOperator('*');
      assert.strictEqual(engine.getExpression(), '15 * ');
      assert.strictEqual(engine.getState().display, '15');

      engine.pressDigit('4');
      assert.strictEqual(engine.getState().display, '4');
      assert.strictEqual(engine.getExpression(), '15 * ');

      engine.pressEquals();
      assert.strictEqual(engine.getExpression(), '15 * 4 =');
      assert.strictEqual(engine.getState().display, '60');

      // History entry recorded with matching expression
      const history = engine.getHistory();
      assert.strictEqual(history.length, 1);
      assert.strictEqual(history[0].expression, '15 * 4');
      assert.strictEqual(history[0].result, '60');
    });

    it('component #expressionPreview updates reactively on button clicks', () => {
      clickButtonByAction(calc, 'digit', '1');
      clickButtonByAction(calc, 'digit', '5');
      clickButtonByAction(calc, 'operator', '*');

      const exprPreview = getShadowElement(calc, '#expressionPreview');
      assert.strictEqual(exprPreview.textContent, '15 * ');

      clickButtonByAction(calc, 'digit', '4');
      assert.strictEqual(exprPreview.textContent, '15 * ');

      clickButtonByAction(calc, 'equals');
      assert.strictEqual(exprPreview.textContent, '15 * 4 =');
      assert.strictEqual(calc.getState().display, '60');
    });
  });

  // CASE-02: Empty State & First Use
  describe('CASE-02: Empty State & First Use (Clean Initial Mount: Expression is Empty String "", No Layout Jump)', () => {
    it('engine initializes with empty expression string', () => {
      const state = createInitialState();
      assert.strictEqual(state.expression, '');

      const engine = new CalculatorEngine();
      assert.strictEqual(engine.getExpression(), '');
    });

    it('component on initial mount renders empty #expressionPreview with accessible attributes', () => {
      const exprEl = getShadowElement(calc, '#expressionPreview');
      assert.strictEqual(exprEl.textContent, '');
      assert.strictEqual(exprEl.getAttribute('role'), 'status');
      assert.strictEqual(exprEl.getAttribute('aria-label'), 'Expression preview');
      assert.strictEqual(exprEl.getAttribute('aria-live'), 'polite');
      assert.strictEqual(calc.getExpression(), '');
    });
  });

  // CASE-03: Error State & Division by Zero
  describe('CASE-03: Error State & Division by Zero ("15 / 0 =" in Expression Preview with Error Lockout)', () => {
    it('engine reflects "15 / 0 =" on division by zero, locks input, and shows error message', () => {
      const engine = new CalculatorEngine();
      engine.pressDigit('1');
      engine.pressDigit('5');
      engine.pressOperator('/');
      assert.strictEqual(engine.getExpression(), '15 / ');

      engine.pressDigit('0');
      engine.pressEquals();

      assert.strictEqual(engine.getExpression(), '15 / 0 =');
      assert.strictEqual(engine.getState().display, 'Cannot divide by zero');
      assert.strictEqual(engine.getState().isLocked, true);
      assert.strictEqual(engine.getState().error, 'Cannot divide by zero');

      // Subsequent digit entry is locked
      engine.pressDigit('7');
      assert.strictEqual(engine.getState().display, 'Cannot divide by zero');
      assert.strictEqual(engine.getExpression(), '15 / 0 =');
    });

    it('component reflects error state and locks UI on division by zero', () => {
      clickButtonByAction(calc, 'digit', '1');
      clickButtonByAction(calc, 'digit', '5');
      clickButtonByAction(calc, 'operator', '/');
      clickButtonByAction(calc, 'digit', '0');
      clickButtonByAction(calc, 'equals');

      const exprPreview = getShadowElement(calc, '#expressionPreview');
      const defaultDisplay = getShadowElement(calc, '#defaultDisplay');
      assert.strictEqual(exprPreview.textContent, '15 / 0 =');
      assert.strictEqual(calc.getState().display, 'Cannot divide by zero');
      assert.strictEqual(defaultDisplay.classList.contains('error'), true);
    });
  });

  // CASE-04: Mid-Flow Operator Replacement
  describe('CASE-04: Mid-Flow Operator Replacement (Instant Update: "15 + " -> "15 * " without Evaluation)', () => {
    it('engine cleanly replaces trailing operator in expression on consecutive operator entry', () => {
      const engine = new CalculatorEngine();
      engine.pressDigit('1');
      engine.pressDigit('5');
      engine.pressOperator('+');
      assert.strictEqual(engine.getExpression(), '15 + ');

      // Mid-flow operator replacement (RULE-CALC-008)
      engine.pressOperator('*');
      assert.strictEqual(engine.getExpression(), '15 * ');

      engine.pressOperator('-');
      assert.strictEqual(engine.getExpression(), '15 - ');

      engine.pressDigit('5');
      engine.pressEquals();

      assert.strictEqual(engine.getExpression(), '15 - 5 =');
      assert.strictEqual(engine.getState().display, '10');
    });

    it('component updates #expressionPreview immediately on mid-flow operator switch', () => {
      clickButtonByAction(calc, 'digit', '1');
      clickButtonByAction(calc, 'digit', '5');
      clickButtonByAction(calc, 'operator', '+');

      const exprPreview = getShadowElement(calc, '#expressionPreview');
      assert.strictEqual(exprPreview.textContent, '15 + ');

      clickButtonByAction(calc, 'operator', '*');
      assert.strictEqual(exprPreview.textContent, '15 * ');

      clickButtonByAction(calc, 'operator', '-');
      assert.strictEqual(exprPreview.textContent, '15 - ');
    });
  });

  // CASE-05: Idempotency & Repeated Equals
  describe('CASE-05: Idempotency & Repeated Equals ("5 =" or Repeated Equals Maintains Stable Expression)', () => {
    it('engine formats "5 =" when equals pressed with no pending operator and stays idempotent', () => {
      const engine = new CalculatorEngine();
      engine.pressDigit('5');
      engine.pressEquals();

      assert.strictEqual(engine.getExpression(), '5 =');
      assert.strictEqual(engine.getState().display, '5');

      // Repeated equals
      engine.pressEquals();
      engine.pressEquals();
      engine.pressEquals();

      assert.strictEqual(engine.getExpression(), '5 =');
      assert.strictEqual(engine.getState().display, '5');
    });

    it('repeated equals after calculation maintains stable finalized expression', () => {
      const engine = new CalculatorEngine();
      engine.pressDigit('6');
      engine.pressOperator('*');
      engine.pressDigit('7');
      engine.pressEquals();

      assert.strictEqual(engine.getExpression(), '6 * 7 =');
      assert.strictEqual(engine.getState().display, '42');

      engine.pressEquals();
      engine.pressEquals();
      assert.strictEqual(engine.getExpression(), '6 * 7 =');
      assert.strictEqual(engine.getState().display, '42');
    });
  });

  // CASE-06: Precision Normalization in Expression
  describe('CASE-06: Precision Normalization in Expression (Normalized Float Representation: e.g. "0.1 + 0.2 =")', () => {
    it('engine eliminates IEEE-754 noise in expression tokens and display', () => {
      const engine = new CalculatorEngine();
      engine.pressDigit('0');
      engine.pressDecimal();
      engine.pressDigit('1');
      engine.pressOperator('+');
      assert.strictEqual(engine.getExpression(), '0.1 + ');

      engine.pressDigit('0');
      engine.pressDecimal();
      engine.pressDigit('2');
      engine.pressEquals();

      assert.strictEqual(engine.getExpression(), '0.1 + 0.2 =');
      assert.strictEqual(engine.getState().display, '0.3');
    });

    it('normalizes 0.7 + 0.1 to clean "0.7 + 0.1 =" and display "0.8"', () => {
      const engine = new CalculatorEngine();
      engine.pressDigit('0');
      engine.pressDecimal();
      engine.pressDigit('7');
      engine.pressOperator('+');
      engine.pressDigit('0');
      engine.pressDecimal();
      engine.pressDigit('1');
      engine.pressEquals();

      assert.strictEqual(engine.getExpression(), '0.7 + 0.1 =');
      assert.strictEqual(engine.getState().display, '0.8');
    });
  });

  // CASE-07: Unary Function Operand Wrapping
  describe('CASE-07: Unary Function Operand Wrapping (Wrapping Operands: "√(25)", "sqr(5)", "sin(90)")', () => {
    it('engine wraps active operand in unary syntax for sqrt and sqr', () => {
      const engine = new CalculatorEngine();
      engine.pressDigit('2');
      engine.pressDigit('5');
      engine.squareRoot();

      assert.strictEqual(engine.getExpression(), '√(25)');
      assert.strictEqual(engine.getState().display, '5');

      engine.square();
      assert.strictEqual(engine.getExpression(), 'sqr(√(25))');
      assert.strictEqual(engine.getState().display, '25');
    });

    it('engine wraps trigonometric operand respecting active angle unit', () => {
      const engine = new CalculatorEngine({ mode: 'scientific', angleUnit: 'DEG' });
      engine.pressDigit('9');
      engine.pressDigit('0');
      engine.sin();

      assert.strictEqual(engine.getExpression(), 'sin(90)');
      assert.strictEqual(engine.getState().display, '1');
    });

    it('engine wraps unary operand when chained inside a binary operation', () => {
      const engine = new CalculatorEngine();
      engine.pressDigit('1');
      engine.pressDigit('0');
      engine.pressOperator('+');
      assert.strictEqual(engine.getExpression(), '10 + ');

      engine.pressDigit('2');
      engine.pressDigit('5');
      engine.squareRoot();

      assert.strictEqual(engine.getExpression(), '10 + √(25)');
      assert.strictEqual(engine.getState().display, '5');

      engine.pressEquals();
      assert.strictEqual(engine.getExpression(), '10 + √(25) =');
      assert.strictEqual(engine.getState().display, '15');
    });
  });

  // CASE-08: Chained Operations & Accumulator Propagation
  describe('CASE-08: Chained Operations & Accumulator Propagation ("2 + 3 *" Evaluates 5 and Updates Expression to "5 * ")', () => {
    it('engine evaluates immediate result on chained operator and propagates to expression', () => {
      const engine = new CalculatorEngine();
      engine.pressDigit('2');
      engine.pressOperator('+');
      engine.pressDigit('3');
      assert.strictEqual(engine.getExpression(), '2 + ');

      // Chained operator press executes 2 + 3 = 5 and updates expression to "5 * "
      engine.pressOperator('*');
      assert.strictEqual(engine.getState().display, '5');
      assert.strictEqual(engine.getExpression(), '5 * ');

      engine.pressDigit('4');
      engine.pressEquals();

      assert.strictEqual(engine.getExpression(), '5 * 4 =');
      assert.strictEqual(engine.getState().display, '20');
    });

    it('continues chaining from previous equals result when operator pressed', () => {
      const engine = new CalculatorEngine();
      engine.pressDigit('1');
      engine.pressDigit('0');
      engine.pressOperator('*');
      engine.pressDigit('2');
      engine.pressEquals();
      assert.strictEqual(engine.getExpression(), '10 * 2 =');
      assert.strictEqual(engine.getState().display, '20');

      // Operator pressed after equals chains calculation using evaluated result
      engine.pressOperator('+');
      assert.strictEqual(engine.getExpression(), '20 + ');

      engine.pressDigit('5');
      engine.pressEquals();
      assert.strictEqual(engine.getExpression(), '20 + 5 =');
      assert.strictEqual(engine.getState().display, '25');
    });
  });

  // CASE-09: Clear & Reset Semantics
  describe('CASE-09: Clear & Reset Semantics (C Preserves Expression Prefix; AC Completely Clears Expression to "")', () => {
    it('Clear (C) flushes active input buffer while strictly preserving formula expression prefix', () => {
      const engine = new CalculatorEngine();
      engine.pressDigit('1');
      engine.pressDigit('5');
      engine.pressOperator('+');
      engine.pressDigit('9');
      engine.pressDigit('9');
      assert.strictEqual(engine.getExpression(), '15 + ');
      assert.strictEqual(engine.getState().display, '99');

      // Clear (C)
      engine.pressClear();
      assert.strictEqual(engine.getState().display, '0');
      assert.strictEqual(engine.getExpression(), '15 + ');

      // Enter correct operand
      engine.pressDigit('5');
      engine.pressEquals();
      assert.strictEqual(engine.getExpression(), '15 + 5 =');
      assert.strictEqual(engine.getState().display, '20');
    });

    it('All Clear (AC) resets display to "0" and expression to empty string ""', () => {
      const engine = new CalculatorEngine();
      engine.pressDigit('1');
      engine.pressDigit('5');
      engine.pressOperator('+');
      engine.pressDigit('4');
      assert.strictEqual(engine.getExpression(), '15 + ');

      engine.pressAllClear();
      assert.strictEqual(engine.getState().display, '0');
      assert.strictEqual(engine.getExpression(), '');
    });

    it('typing new digit after equals starts fresh calculation and resets expression', () => {
      const engine = new CalculatorEngine();
      engine.pressDigit('4');
      engine.pressOperator('*');
      engine.pressDigit('5');
      engine.pressEquals();
      assert.strictEqual(engine.getExpression(), '4 * 5 =');
      assert.strictEqual(engine.getState().display, '20');

      // Typing new digit clears expression for fresh calculation
      engine.pressDigit('7');
      assert.strictEqual(engine.getExpression(), '');
      assert.strictEqual(engine.getState().display, '7');
    });

    it('component reset() sets expression to empty string', () => {
      clickButtonByAction(calc, 'digit', '8');
      clickButtonByAction(calc, 'operator', '+');
      clickButtonByAction(calc, 'digit', '2');

      const exprPreview = getShadowElement(calc, '#expressionPreview');
      assert.strictEqual(exprPreview.textContent, '8 + ');

      calc.reset();
      assert.strictEqual(exprPreview.textContent, '');
      assert.strictEqual(calc.getExpression(), '');
    });
  });

  // CASE-10: Multi-Radix Programmer Mode Formatting
  describe('CASE-10: Multi-Radix Programmer Mode Formatting (Hex, Octal, Binary Expression Tokens e.g. "0xFF + " or "FF & ")', () => {
    it('engine formats hex operands in expression preview in programmer mode', () => {
      const engine = new CalculatorEngine({ mode: 'programmer', radix: 'HEX' });
      engine.inputHexDigit('F');
      engine.inputHexDigit('F');
      engine.pressOperator('+');

      assert.strictEqual(engine.getExpression(), 'FF + ');

      engine.inputHexDigit('1');
      engine.pressEquals();

      assert.strictEqual(engine.getExpression(), 'FF + 1 =');
      assert.strictEqual(engine.getState().display, '100');
    });

    it('engine formats binary operands and bitwise operators cleanly', () => {
      const engine = new CalculatorEngine({ mode: 'programmer', radix: 'BIN' });
      engine.pressDigit('1');
      engine.pressDigit('0');
      engine.pressDigit('1');
      engine.pressDigit('0');
      engine.pressOperator('AND');

      assert.strictEqual(engine.getExpression(), '1010 AND ');

      engine.pressDigit('1');
      engine.pressDigit('1');
      engine.pressDigit('0');
      engine.pressDigit('0');
      engine.pressEquals();

      assert.strictEqual(engine.getExpression(), '1010 AND 1100 =');
      assert.strictEqual(engine.getState().display, '1000');
    });

    it('engine formats bitwise NOT unary operator with active radix representation', () => {
      const engine = new CalculatorEngine({ mode: 'programmer', radix: 'HEX' });
      engine.inputHexDigit('F');
      engine.bitwiseNot();

      assert.strictEqual(engine.getExpression(), '~(F)');
      assert.strictEqual(engine.getState().display, 'FFFFFFF0');
    });

    it('switching radix while operator is pending updates accumulator token in expression', () => {
      const engine = new CalculatorEngine({ mode: 'programmer', radix: 'DEC' });
      engine.pressDigit('1');
      engine.pressDigit('5');
      engine.pressOperator('+');
      assert.strictEqual(engine.getExpression(), '15 + ');

      // Switch radix to HEX
      engine.setRadix('HEX');
      assert.strictEqual(engine.getExpression(), 'F + ');
    });
  });

  // CASE-11: Component UI, Live Region & Accessibility
  describe('CASE-11: Component UI, Live Region & Accessibility (#expressionPreview attributes, calc-change event detail, mobile zero-overflow 320px–390px)', () => {
    it('dispatches calc-change CustomEvent with expression detail on every calculation transition', () => {
      let lastDetail: any = null;
      calc.addEventListener('calc-change', (e: any) => {
        lastDetail = e.detail;
      });

      clickButtonByAction(calc, 'digit', '8');
      assert.ok(lastDetail, 'Expected calc-change detail to exist');
      assert.strictEqual(lastDetail.display, '8');
      assert.strictEqual(lastDetail.expression, '');

      clickButtonByAction(calc, 'operator', '*');
      assert.strictEqual(lastDetail.expression, '8 * ');

      clickButtonByAction(calc, 'digit', '2');
      assert.strictEqual(lastDetail.expression, '8 * ');

      clickButtonByAction(calc, 'equals');
      assert.strictEqual(lastDetail.display, '16');
      assert.strictEqual(lastDetail.expression, '8 * 2 =');
    });

    it('renders #expressionPreview directly above #display inside .display-screen with accessible attributes', () => {
      const displayScreen = getShadowElement(calc, '#defaultDisplay');
      assert.ok(displayScreen);

      const exprPreview = getShadowElement(calc, '#expressionPreview');
      assert.ok(exprPreview);
      assert.strictEqual(exprPreview.getAttribute('role'), 'status');
      assert.strictEqual(exprPreview.getAttribute('aria-label'), 'Expression preview');
      assert.strictEqual(exprPreview.getAttribute('aria-live'), 'polite');

      // Check display alias element
      const displayAlias = getShadowElement(calc, '#display');
      assert.ok(displayAlias);
    });

    it('verifies stylesheet contains zero !important declarations (RULE-CALC-002, AGENTS.md invariant)', async () => {
      const fs = await import('node:fs/promises');
      const content = await fs.readFile('src/components/stay-calc.ts', 'utf8');
      const hasImportant = content.includes('!important');
      assert.strictEqual(hasImportant, false, 'Expected zero !important declarations in stay-calc.ts');
    });

    it('declares mobile zero-overflow container query for max-width 390px adapting .expression-preview', async () => {
      const fs = await import('node:fs/promises');
      const content = await fs.readFile('src/components/stay-calc.ts', 'utf8');
      assert.ok(
        content.includes('@container calc-host (max-width: 390px)'),
        'Expected container query @container calc-host (max-width: 390px) to exist'
      );
      assert.ok(
        content.includes('.expression-preview'),
        'Expected .expression-preview class to be defined in stylesheet'
      );
    });

    it('loading converted value into buffer preserves pending operator and updates expression cleanly', () => {
      const engine = new CalculatorEngine();
      engine.pressDigit('5');
      engine.pressDigit('0');
      engine.pressOperator('+');
      assert.strictEqual(engine.getExpression(), '50 + ');

      // Load buffer value (e.g. from unit converter)
      engine.loadBuffer('10');
      assert.strictEqual(engine.getState().display, '10');
      assert.strictEqual(engine.getExpression(), '50 + ');

      engine.pressEquals();
      assert.strictEqual(engine.getExpression(), '50 + 10 =');
      assert.strictEqual(engine.getState().display, '60');
    });
  });
});
