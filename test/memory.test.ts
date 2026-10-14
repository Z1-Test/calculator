/**
 * test/memory.test.ts
 *
 * Comprehensive unit test suite for StayCalc Feature 3 (F3: Memory Registers & Active Indicator).
 * Maps 1:1 to the 11 Universal Test Cases (CASE-01 to CASE-11) defined in
 * docs/context/features/f3-memory-registers/cases.md.
 * Verifies CalculatorEngine reducer transitions, precision normalization (RULE-CALC-002),
 * memory persistence (RULE-CALC-006, RULE-CALC-009), division by zero lockouts (RULE-CALC-001),
 * <stay-calc> custom element UI synchronization, and SEAM-ENGINE-01 / SEAM-UI-01 contracts.
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
        if (force !== undefined) {
          if (force) this.classes.add(token);
          else this.classes.delete(token);
          return force;
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

// Install mock DOM onto globalThis before importing component
(globalThis as any).HTMLElement = MockElement;
(globalThis as any).Event = MockEvent;
(globalThis as any).CustomEvent = MockCustomEvent;
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

function clickButtonByAction(calc: any, action: string, value?: string): void {
  const buttons = calc.shadowRoot?.querySelectorAll('button') ?? [];
  const btn = buttons.find((b: MockElement) => {
    const matchAction = b.getAttribute('data-action') === action;
    if (value !== undefined) {
      return matchAction && b.getAttribute('data-value') === value;
    }
    return matchAction;
  });
  assert.ok(btn, `Button with action "${action}" and value "${value}" not found`);
  btn.click();
}

// --- Test Suite ---

describe('StayCalc Memory Registers & Active Indicator (F3)', () => {

  // CASE-01: Happy Path Nominal Execution
  describe('CASE-01: Happy Path Nominal Execution (Memory Store & Recall across Operations)', () => {
    it('accurately accumulates and subtracts values in memory and recalls with MR', () => {
      const calc = new CalculatorEngine();
      
      // Enter 5, M+ -> memory = 5
      calc.pressDigit('5');
      calc.pressMemoryAdd();
      assert.strictEqual(calc.getState().memory, 5);
      assert.strictEqual(calc.getState().hasActiveMemory, true);
      assert.strictEqual(calc.getState().display, '5');

      // Enter 10, M+ -> memory = 15
      calc.pressDigit('1');
      calc.pressDigit('0');
      calc.pressMemoryAdd();
      assert.strictEqual(calc.getState().memory, 15);
      assert.strictEqual(calc.getState().hasActiveMemory, true);

      // Enter 3, M- -> memory = 12
      calc.pressDigit('3');
      calc.pressMemorySubtract();
      assert.strictEqual(calc.getState().memory, 12);
      assert.strictEqual(calc.getState().hasActiveMemory, true);

      // MR recalls 12 into display
      calc.pressMemoryRecall();
      assert.strictEqual(calc.getState().display, '12');
      assert.strictEqual(calc.getState().memory, 12);
    });

    it('stores intermediate arithmetic evaluation results into memory', () => {
      const calc = new CalculatorEngine();
      // 4 * 5 = 20 -> M+
      calc.pressDigit('4');
      calc.pressOperator('*');
      calc.pressDigit('5');
      calc.pressEquals();
      assert.strictEqual(calc.getState().display, '20');

      calc.pressMemoryAdd();
      assert.strictEqual(calc.getState().memory, 20);
      assert.strictEqual(calc.getState().hasActiveMemory, true);

      // 6 / 2 = 3 -> M+
      calc.pressDigit('6');
      calc.pressOperator('/');
      calc.pressDigit('2');
      calc.pressEquals();
      assert.strictEqual(calc.getState().display, '3');

      calc.pressMemoryAdd();
      assert.strictEqual(calc.getState().memory, 23);

      // Recall memory
      calc.pressClear();
      assert.strictEqual(calc.getState().display, '0');
      calc.pressMemoryRecall();
      assert.strictEqual(calc.getState().display, '23');
    });
  });

  // CASE-02: Empty State & First Use
  describe('CASE-02: Empty State & First Use (Clean Initial Bootstrap)', () => {
    it('initializes engine with memory: 0 and hasActiveMemory: false', () => {
      const calc = new CalculatorEngine();
      const state = calc.getState();
      assert.strictEqual(state.memory, 0);
      assert.strictEqual(state.hasActiveMemory, false);
    });

    it('mounts <stay-calc> component with inactive memory indicator', () => {
      const calc = new StayCalc();
      calc.connectedCallback();

      const indicator = getShadowElement(calc, '#memoryIndicator');
      assert.strictEqual(indicator.classList.contains('active'), false);
      assert.strictEqual(indicator.style.visibility, 'hidden');
      assert.strictEqual(calc.getState().hasActiveMemory, false);
    });
  });

  // CASE-03: Error State & Input Lock
  describe('CASE-03: Error State & Input Lock (Division by Zero Safeguard & Memory Preservation)', () => {
    it('preserves memory value when division by zero error lock occurs', () => {
      const calc = new CalculatorEngine();
      // Store 42 in memory
      calc.pressDigit('4');
      calc.pressDigit('2');
      calc.pressMemoryAdd();
      assert.strictEqual(calc.getState().memory, 42);
      assert.strictEqual(calc.getState().hasActiveMemory, true);

      // Trigger division by zero
      calc.pressDigit('1');
      calc.pressDigit('0');
      calc.pressOperator('/');
      calc.pressDigit('0');
      calc.pressEquals();

      assert.strictEqual(calc.getState().display, 'Cannot divide by zero');
      assert.strictEqual(calc.getState().isLocked, true);
      assert.strictEqual(calc.getState().memory, 42);
      assert.strictEqual(calc.getState().hasActiveMemory, true);

      // Memory actions are locked out/ignored during error state
      calc.pressMemoryAdd();
      assert.strictEqual(calc.getState().memory, 42);
      calc.pressMemorySubtract();
      assert.strictEqual(calc.getState().memory, 42);
      calc.pressMemoryRecall();
      assert.strictEqual(calc.getState().display, 'Cannot divide by zero');

      // Clear (C) unlocks display while strictly preserving memory 42 (RULE-CALC-006)
      calc.pressClear();
      assert.strictEqual(calc.getState().isLocked, false);
      assert.strictEqual(calc.getState().display, '0');
      assert.strictEqual(calc.getState().memory, 42);
      assert.strictEqual(calc.getState().hasActiveMemory, true);

      // Recalling memory works cleanly after unlocking
      calc.pressMemoryRecall();
      assert.strictEqual(calc.getState().display, '42');
    });
  });

  // CASE-04: Mid-Flow Operator Replacement & Memory Interaction
  describe('CASE-04: Mid-Flow Operator Replacement & Memory Interaction', () => {
    it('adds operand to memory mid-flow and correctly replaces pending operator', () => {
      const calc = new CalculatorEngine();
      // User enters 8 +
      calc.pressDigit('8');
      calc.pressOperator('+');

      // Mid-flow M+ stores 8 in memory
      calc.pressMemoryAdd();
      assert.strictEqual(calc.getState().memory, 8);
      assert.strictEqual(calc.getState().hasActiveMemory, true);

      // User immediately presses * (replaces + with *)
      calc.pressOperator('*');
      assert.strictEqual(calc.getState().pendingOperator, '*');

      // User enters 3 = -> evaluates 8 * 3 = 24
      calc.pressDigit('3');
      calc.pressEquals();
      assert.strictEqual(calc.getState().display, '24');
      assert.strictEqual(calc.getState().memory, 8);
    });
  });

  // CASE-05: Idempotency & Repeated Operations
  describe('CASE-05: Idempotency & Repeated Operations (Repeated MR and MC)', () => {
    it('repeated MR presses repeatedly display memory value without state mutation', () => {
      const calc = new CalculatorEngine();
      calc.pressDigit('2');
      calc.pressDigit('5');
      calc.pressMemoryAdd();

      calc.pressClear();
      assert.strictEqual(calc.getState().display, '0');

      calc.pressMemoryRecall();
      assert.strictEqual(calc.getState().display, '25');

      calc.pressMemoryRecall();
      assert.strictEqual(calc.getState().display, '25');

      calc.pressMemoryRecall();
      assert.strictEqual(calc.getState().display, '25');
      assert.strictEqual(calc.getState().memory, 25);
    });

    it('repeated MC presses maintain clean zero state idempotently', () => {
      const calc = new CalculatorEngine();
      calc.pressDigit('5');
      calc.pressMemoryAdd();
      assert.strictEqual(calc.getState().hasActiveMemory, true);

      calc.pressMemoryClear();
      assert.strictEqual(calc.getState().memory, 0);
      assert.strictEqual(calc.getState().hasActiveMemory, false);

      calc.pressMemoryClear();
      assert.strictEqual(calc.getState().memory, 0);
      assert.strictEqual(calc.getState().hasActiveMemory, false);
    });
  });

  // CASE-06: Precision Normalization
  describe('CASE-06: Precision Normalization (IEEE 754 Float Artifact Elimination)', () => {
    it('eliminates IEEE 754 representation noise on memory addition (0.1 M+ and 0.2 M+ = 0.3)', () => {
      const calc = new CalculatorEngine();
      
      calc.pressDigit('0');
      calc.pressDecimal();
      calc.pressDigit('1');
      calc.pressMemoryAdd();

      calc.pressDigit('0');
      calc.pressDecimal();
      calc.pressDigit('2');
      calc.pressMemoryAdd();

      assert.strictEqual(calc.getState().memory, 0.3);
      assert.strictEqual(calc.getState().hasActiveMemory, true);

      calc.pressClear();
      calc.pressMemoryRecall();
      assert.strictEqual(calc.getState().display, '0.3');
    });

    it('eliminates float inaccuracy for 0.7 M+ and 0.1 M+ = 0.8', () => {
      const calc = new CalculatorEngine();
      calc.pressDigit('0');
      calc.pressDecimal();
      calc.pressDigit('7');
      calc.pressMemoryAdd();

      calc.pressDigit('0');
      calc.pressDecimal();
      calc.pressDigit('1');
      calc.pressMemoryAdd();

      assert.strictEqual(calc.getState().memory, 0.8);
      calc.pressMemoryRecall();
      assert.strictEqual(calc.getState().display, '0.8');
    });

    it('eliminates float inaccuracy on memory subtraction (0.3 M+ and 0.2 M- = 0.1)', () => {
      const calc = new CalculatorEngine();
      calc.pressDigit('0');
      calc.pressDecimal();
      calc.pressDigit('3');
      calc.pressMemoryAdd();

      calc.pressDigit('0');
      calc.pressDecimal();
      calc.pressDigit('2');
      calc.pressMemorySubtract();

      assert.strictEqual(calc.getState().memory, 0.1);
      calc.pressMemoryRecall();
      assert.strictEqual(calc.getState().display, '0.1');
    });
  });

  // CASE-07: Decimal Formatting & Input Handling
  describe('CASE-07: Decimal Formatting & Input Handling (Negative Memory & Exact Zero Clearance)', () => {
    it('supports negative numbers in memory and displays leading minus on MR', () => {
      const calc = new CalculatorEngine();
      calc.pressDigit('5');
      calc.pressMemorySubtract(); // 0 - 5 = -5

      assert.strictEqual(calc.getState().memory, -5);
      assert.strictEqual(calc.getState().hasActiveMemory, true);

      calc.pressClear();
      calc.pressMemoryRecall();
      assert.strictEqual(calc.getState().display, '-5');
    });

    it('clears active memory flag when M- brings memory value to exact zero', () => {
      const calc = new CalculatorEngine();
      calc.pressDigit('5');
      calc.pressMemoryAdd();
      assert.strictEqual(calc.getState().memory, 5);
      assert.strictEqual(calc.getState().hasActiveMemory, true);

      calc.pressDigit('5');
      calc.pressMemorySubtract();
      assert.strictEqual(calc.getState().memory, 0);
      assert.strictEqual(calc.getState().hasActiveMemory, false);

      calc.pressMemoryRecall();
      assert.strictEqual(calc.getState().display, '0');
    });
  });

  // CASE-08: Clear Register C
  describe('CASE-08: Clear Register C (Input Buffer Reset with Memory Persistence)', () => {
    it('clears active input buffer while preserving memory register and active flag', () => {
      const calc = new CalculatorEngine();
      calc.pressDigit('1');
      calc.pressDigit('0');
      calc.pressDigit('0');
      calc.pressMemoryAdd();
      assert.strictEqual(calc.getState().memory, 100);

      // User types 999
      calc.pressDigit('9');
      calc.pressDigit('9');
      calc.pressDigit('9');
      assert.strictEqual(calc.getState().display, '999');

      // Press C
      calc.pressClear();
      assert.strictEqual(calc.getState().display, '0');
      assert.strictEqual(calc.getState().memory, 100);
      assert.strictEqual(calc.getState().hasActiveMemory, true);

      // Recall memory
      calc.pressMemoryRecall();
      assert.strictEqual(calc.getState().display, '100');
    });
  });

  // CASE-09: All Clear Register AC
  describe('CASE-09: All Clear Register AC (Complete Reset of All Registers)', () => {
    it('flushes memory register, active flag, accumulator, and display on AC', () => {
      const calc = new CalculatorEngine();
      calc.pressDigit('7');
      calc.pressDigit('5');
      calc.pressMemoryAdd();
      assert.strictEqual(calc.getState().memory, 75);
      assert.strictEqual(calc.getState().hasActiveMemory, true);

      // Press AC
      calc.pressAllClear();
      assert.strictEqual(calc.getState().display, '0');
      assert.strictEqual(calc.getState().memory, 0);
      assert.strictEqual(calc.getState().hasActiveMemory, false);

      // Subsequent MR outputs 0
      calc.pressMemoryRecall();
      assert.strictEqual(calc.getState().display, '0');
    });
  });

  // CASE-10: Memory Recall with Chained Arithmetic
  describe('CASE-10: Memory Recall with Chained Arithmetic', () => {
    it('uses recalled memory value as right operand in chained calculation (10 + MR = 15)', () => {
      const calc = new CalculatorEngine();
      // Store 5 in memory
      calc.pressDigit('5');
      calc.pressMemoryAdd();

      // Clear buffer and calculate 10 + MR =
      calc.pressClear();
      calc.pressDigit('1');
      calc.pressDigit('0');
      calc.pressOperator('+');

      calc.pressMemoryRecall();
      assert.strictEqual(calc.getState().display, '5');

      calc.pressEquals();
      assert.strictEqual(calc.getState().display, '15');
      assert.strictEqual(calc.getState().memory, 5);
    });

    it('uses recalled memory value as left operand in chained calculation (MR * 4 = 20)', () => {
      const calc = new CalculatorEngine();
      calc.pressDigit('5');
      calc.pressMemoryAdd();

      calc.pressClear();
      calc.pressMemoryRecall();
      assert.strictEqual(calc.getState().display, '5');

      calc.pressOperator('*');
      calc.pressDigit('4');
      calc.pressEquals();
      assert.strictEqual(calc.getState().display, '20');
    });

    it('replaces recalled value when user begins typing new digits', () => {
      const calc = new CalculatorEngine();
      calc.pressDigit('4');
      calc.pressDigit('2');
      calc.pressMemoryAdd();

      calc.pressClear();
      calc.pressMemoryRecall();
      assert.strictEqual(calc.getState().display, '42');

      // Typing digit 9 should replace 42 instead of appending to 429
      calc.pressDigit('9');
      assert.strictEqual(calc.getState().display, '9');
    });
  });

  // CASE-11: Component UI & Event Synchronization
  describe('CASE-11: Component UI & Event Synchronization (Keypad Grid, "M" Badge & CustomEvent)', () => {
    let calc: any;

    beforeEach(() => {
      calc = new StayCalc();
      calc.connectedCallback();
    });

    it('renders 4 memory keys with accessible labels in the keypad grid', () => {
      const buttons = calc.shadowRoot?.querySelectorAll('button') ?? [];
      const memoryButtons = buttons.filter((b: MockElement) => b.classList.contains('btn-memory'));
      assert.strictEqual(memoryButtons.length, 4);

      const actions = memoryButtons.map((b: MockElement) => b.getAttribute('data-action'));
      assert.ok(actions.includes('memory-clear'));
      assert.ok(actions.includes('memory-recall'));
      assert.ok(actions.includes('memory-subtract'));
      assert.ok(actions.includes('memory-add'));

      for (const btn of memoryButtons) {
        assert.ok(btn.getAttribute('aria-label'), `Memory button ${btn.textContent} missing aria-label`);
      }
    });

    it('synchronizes visual "M" indicator on keypad button clicks', () => {
      const indicator = getShadowElement(calc, '#memoryIndicator');
      assert.strictEqual(indicator.classList.contains('active'), false);
      assert.strictEqual(indicator.style.visibility, 'hidden');

      // Click button 9, then M+
      clickButtonByAction(calc, 'digit', '9');
      clickButtonByAction(calc, 'memory-add');

      assert.strictEqual(indicator.classList.contains('active'), true);
      assert.strictEqual(indicator.style.visibility, 'visible');
      assert.strictEqual(calc.getState().memory, 9);

      // Click MC -> indicator becomes inactive and hidden
      clickButtonByAction(calc, 'memory-clear');
      assert.strictEqual(indicator.classList.contains('active'), false);
      assert.strictEqual(indicator.style.visibility, 'hidden');
      assert.strictEqual(calc.getState().memory, 0);
    });

    it('dispatches calc-change CustomEvent with memory and hasActiveMemory (SEAM-UI-01)', () => {
      const events: any[] = [];
      calc.addEventListener('calc-change', (e: any) => {
        events.push(e.detail);
      });

      clickButtonByAction(calc, 'digit', '7');
      clickButtonByAction(calc, 'memory-add');

      assert.ok(events.length > 0);
      const lastEvent = events[events.length - 1];
      assert.strictEqual(lastEvent.memory, 7);
      assert.strictEqual(lastEvent.hasActiveMemory, true);
    });

    it('supports StayCalc facade methods pressMemoryAdd, pressMemorySubtract, pressMemoryRecall, pressMemoryClear', () => {
      calc.pressButton('digit', '8');
      calc.pressMemoryAdd();
      assert.strictEqual(calc.getState().memory, 8);

      calc.pressButton('digit', '2');
      calc.pressMemorySubtract();
      assert.strictEqual(calc.getState().memory, 6);

      calc.pressButton('clear');
      calc.pressMemoryRecall();
      assert.strictEqual(calc.getState().display, '6');

      calc.pressMemoryClear();
      assert.strictEqual(calc.getState().memory, 0);
      assert.strictEqual(calc.getState().hasActiveMemory, false);
    });
  });
});
