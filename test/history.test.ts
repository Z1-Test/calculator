/**
 * test/history.test.ts
 *
 * Comprehensive unit test suite for StayCalc Feature 4 (F4: Calculation History Tape & Drawer).
 * Maps 1:1 to the 11 Universal Test Cases (CASE-01 to CASE-11) defined in
 * docs/context/features/f4-calculation-history-tape/cases.md.
 * Verifies CalculatorEngine audit tape recording, 100-entry FIFO ceiling (RULE-CALC-005),
 * error state isolation (RULE-CALC-007), persistence across C and AC (RULE-CALC-008),
 * precision normalization in history (RULE-CALC-002), history reload into active buffer,
 * explicit history clear (CLEAR_HISTORY), accessible slide-out drawer UI, Escape key dismissal,
 * and SEAM-ENGINE-02 / SEAM-UI-01 event synchronization.
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
        const attrRegex = /([a-zA-Z0-9-_:]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
        let attrMatch: RegExpExecArray | null;
        while ((attrMatch = attrRegex.exec(attrsStr)) !== null) {
          const name = attrMatch[1];
          const val = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? '';
          el.setAttribute(name, val);
        }
      }

      stack[stack.length - 1].appendChild(el);

      if (!selfClose && !['input', 'meta', 'link', 'br', 'hr', 'img'].includes(openTag.toLowerCase())) {
        stack.push(el);
      }
    } else if (closeTag) {
      if (stack.length > 1 && stack[stack.length - 1].tagName.toLowerCase() === closeTag.toLowerCase()) {
        stack.pop();
      }
    } else if (textContent) {
      const trimmed = textContent.trim();
      if (trimmed) {
        const textNode = new MockElement('#text');
        textNode.textContent = trimmed;
        stack[stack.length - 1].appendChild(textNode);
      }
    }
  }
}

class MockCustomElementRegistry {
  private registry: Map<string, any> = new Map();

  public define(name: string, constructor: any): void {
    if (this.registry.has(name)) {
      throw new Error(`Custom element ${name} has already been defined`);
    }
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

function getShadowElement(calc: any, selector: string): MockElement {
  const el = calc.shadowRoot?.querySelector(selector);
  assert.ok(el, `Expected shadow DOM element matching "${selector}" to exist`);
  return el as MockElement;
}

function typeKey(key: string, modifiers: { metaKey?: boolean; ctrlKey?: boolean; altKey?: boolean } = {}): MockKeyboardEvent {
  const event = new MockKeyboardEvent('keydown', {
    key,
    ...modifiers,
    bubbles: true,
    cancelable: true,
  });
  if (typeof (globalThis as any).window !== 'undefined') {
    (globalThis as any).window.dispatchEvent(event);
  }
  return event;
}

describe('StayCalc Calculation History Tape & Drawer (F4)', () => {

  // CASE-01: Happy Path Nominal Execution
  describe('CASE-01: Happy Path Nominal Execution (Calculation Logging & Drawer Visibility)', () => {
    it('records completed calculations in reverse chronological order on Equals', () => {
      const calc = new CalculatorEngine();
      calc.pressDigit('1');
      calc.pressDigit('2');
      calc.pressOperator('+');
      calc.pressDigit('8');
      calc.pressEquals();

      assert.strictEqual(calc.getState().display, '20');
      assert.strictEqual(calc.getState().history.length, 1);
      assert.strictEqual(calc.getState().history[0].expression, '12 + 8');
      assert.strictEqual(calc.getState().history[0].result, '20');

      calc.pressDigit('5');
      calc.pressOperator('*');
      calc.pressDigit('4');
      calc.pressEquals();

      assert.strictEqual(calc.getState().display, '20');
      const history = calc.getState().history;
      assert.strictEqual(history.length, 2);
      assert.strictEqual(history[0].expression, '5 * 4');
      assert.strictEqual(history[0].result, '20');
      assert.strictEqual(history[1].expression, '12 + 8');
      assert.strictEqual(history[1].result, '20');
    });

    it('toggles drawer panel and renders interactive history entry buttons in component UI', () => {
      const calc = new StayCalc();
      calc.connectedCallback();

      typeKey('1');
      typeKey('2');
      typeKey('+');
      typeKey('8');
      typeKey('Enter');

      typeKey('5');
      typeKey('*');
      typeKey('4');
      typeKey('Enter');

      const toggleBtn = getShadowElement(calc, '#historyToggle');
      const drawer = getShadowElement(calc, '#historyDrawer');

      assert.strictEqual(toggleBtn.getAttribute('aria-expanded'), 'false');
      assert.strictEqual(drawer.getAttribute('aria-hidden'), 'true');
      assert.strictEqual(drawer.classList.contains('open'), false);

      toggleBtn.click();

      assert.strictEqual(toggleBtn.getAttribute('aria-expanded'), 'true');
      assert.strictEqual(drawer.getAttribute('aria-hidden'), 'false');
      assert.strictEqual(drawer.classList.contains('open'), true);

      const entryButtons = drawer.querySelectorAll('.history-entry');
      assert.strictEqual(entryButtons.length, 2);
      assert.strictEqual(entryButtons[0].getAttribute('data-result'), '20');
      assert.ok(entryButtons[0].getAttribute('aria-label')?.includes('5 * 4'));
    });
  });

  // CASE-02: Empty State & First Use
  describe('CASE-02: Empty State & First Use (Clean Initial Bootstrap & "No calculations yet")', () => {
    it('initializes engine with empty history tape array', () => {
      const state = createInitialState();
      assert.deepStrictEqual(state.history, []);
      const engine = new CalculatorEngine();
      assert.deepStrictEqual(engine.getHistory(), []);
    });

    it('renders #historyEmpty message when drawer opens with zero calculations', () => {
      const calc = new StayCalc();
      calc.connectedCallback();

      const toggleBtn = getShadowElement(calc, '#historyToggle');
      toggleBtn.click();

      const emptyMsg = getShadowElement(calc, '#historyEmpty');
      assert.strictEqual(emptyMsg.textContent, 'No calculations yet');

      const drawer = getShadowElement(calc, '#historyDrawer');
      const entries = drawer.querySelectorAll('.history-entry');
      assert.strictEqual(entries.length, 0);
    });
  });

  // CASE-03: Error State & Input Lock
  describe('CASE-03: Error State & Input Lock (Division by Zero Safeguard & Error Isolation)', () => {
    it('does not record mathematical error states to the calculation history tape (RULE-CALC-007)', () => {
      const calc = new CalculatorEngine();
      calc.pressDigit('7');
      calc.pressOperator('+');
      calc.pressDigit('3');
      calc.pressEquals();

      assert.strictEqual(calc.getHistory().length, 1);
      assert.strictEqual(calc.getHistory()[0].expression, '7 + 3');

      // Attempt division by zero
      calc.pressDigit('5');
      calc.pressDigit('0');
      calc.pressOperator('/');
      calc.pressDigit('0');
      calc.pressEquals();

      assert.strictEqual(calc.getState().display, 'Cannot divide by zero');
      assert.strictEqual(calc.getState().isLocked, true);
      // History tape must NOT contain error state
      assert.strictEqual(calc.getHistory().length, 1);
      assert.strictEqual(calc.getHistory()[0].expression, '7 + 3');
    });
  });

  // CASE-04: Mid-Flow Operator Replacement & History Integrity
  describe('CASE-04: Mid-Flow Operator Replacement & History Integrity', () => {
    it('records final replaced operator in history expression (6 + * - 2 = 4)', () => {
      const calc = new CalculatorEngine();
      calc.pressDigit('6');
      calc.pressOperator('+');
      calc.pressOperator('*');
      calc.pressOperator('-');
      calc.pressDigit('2');
      calc.pressEquals();

      assert.strictEqual(calc.getState().display, '4');
      assert.strictEqual(calc.getHistory().length, 1);
      assert.strictEqual(calc.getHistory()[0].expression, '6 - 2');
      assert.strictEqual(calc.getHistory()[0].result, '4');
    });
  });

  // CASE-05: Idempotency & Repeated Operations
  describe('CASE-05: Idempotency & Repeated Operations (Repeated Equals & History Integrity)', () => {
    it('does not create duplicate history entries on repeated Equals keypresses', () => {
      const calc = new CalculatorEngine();
      calc.pressDigit('9');
      calc.pressOperator('*');
      calc.pressDigit('9');
      calc.pressEquals();

      assert.strictEqual(calc.getState().display, '81');
      assert.strictEqual(calc.getHistory().length, 1);

      // Repeat equals
      calc.pressEquals();
      calc.pressEquals();
      calc.pressEquals();

      assert.strictEqual(calc.getHistory().length, 1);
      assert.strictEqual(calc.getHistory()[0].expression, '9 * 9');
      assert.strictEqual(calc.getHistory()[0].result, '81');
    });
  });

  // CASE-06: Precision Normalization in History Tape
  describe('CASE-06: Precision Normalization in History Tape (IEEE 754 Float Artifact Elimination)', () => {
    it('normalizes 0.1 + 0.2 to clean "0.3" in both expression and result in history', () => {
      const calc = new CalculatorEngine();
      calc.pressDigit('0');
      calc.pressDecimal();
      calc.pressDigit('1');
      calc.pressOperator('+');
      calc.pressDigit('0');
      calc.pressDecimal();
      calc.pressDigit('2');
      calc.pressEquals();

      assert.strictEqual(calc.getState().display, '0.3');
      const entry = calc.getHistory()[0];
      assert.strictEqual(entry.expression, '0.1 + 0.2');
      assert.strictEqual(entry.result, '0.3');
    });

    it('normalizes 0.7 + 0.1 to clean "0.8" in history tape', () => {
      const calc = new CalculatorEngine();
      calc.pressDigit('0');
      calc.pressDecimal();
      calc.pressDigit('7');
      calc.pressOperator('+');
      calc.pressDigit('0');
      calc.pressDecimal();
      calc.pressDigit('1');
      calc.pressEquals();

      assert.strictEqual(calc.getState().display, '0.8');
      const entry = calc.getHistory()[0];
      assert.strictEqual(entry.expression, '0.7 + 0.1');
      assert.strictEqual(entry.result, '0.8');
    });
  });

  // CASE-07: History Reload into Active Buffer
  describe('CASE-07: History Reload into Active Buffer (Clickable Past Result Recall)', () => {
    it('reloads past calculation result into display buffer for immediate subsequent calculation', () => {
      const calc = new StayCalc();
      calc.connectedCallback();

      // Execute 25 * 4 = 100
      typeKey('2');
      typeKey('5');
      typeKey('*');
      typeKey('4');
      typeKey('Enter');

      assert.strictEqual(calc.getState().display, '100');

      // Clear active buffer
      typeKey('c');
      assert.strictEqual(calc.getState().display, '0');

      // Open drawer and click past result entry
      calc.openHistoryDrawer();
      const drawer = getShadowElement(calc, '#historyDrawer');
      const entryBtn = drawer.querySelector('.history-entry');
      assert.ok(entryBtn);
      entryBtn.click();

      // Past result loaded into display with waitingForOperand = true
      assert.strictEqual(calc.getState().display, '100');
      assert.strictEqual(calc.getState().waitingForOperand, true);

      // Perform subsequent addition: + 5 = 105
      typeKey('+');
      typeKey('5');
      typeKey('Enter');

      assert.strictEqual(calc.getState().display, '105');
      assert.strictEqual(calc.getHistory().length, 2);
      assert.strictEqual(calc.getHistory()[0].expression, '100 + 5');
      assert.strictEqual(calc.getHistory()[0].result, '105');
    });

    it('supports loading entry via facade method loadHistoryEntry by id or object', () => {
      const engine = new CalculatorEngine();
      engine.pressDigit('5');
      engine.pressOperator('*');
      engine.pressDigit('5');
      engine.pressEquals();

      const entry = engine.getHistory()[0];
      engine.pressClear();
      assert.strictEqual(engine.getState().display, '0');

      engine.loadHistoryEntry(entry.id);
      assert.strictEqual(engine.getState().display, '25');
      assert.strictEqual(engine.getState().waitingForOperand, true);
    });
  });

  // CASE-08: Clear Registers C and AC
  describe('CASE-08: Clear Registers C and AC (History Tape Persistence Across Clears)', () => {
    it('persists history tape when user presses Clear (C) and All Clear (AC) (RULE-CALC-008)', () => {
      const calc = new CalculatorEngine();
      // Add 3 calculations
      calc.pressDigit('2');
      calc.pressOperator('+');
      calc.pressDigit('2');
      calc.pressEquals();

      calc.pressDigit('3');
      calc.pressOperator('*');
      calc.pressDigit('3');
      calc.pressEquals();

      calc.pressDigit('4');
      calc.pressOperator('/');
      calc.pressDigit('2');
      calc.pressEquals();

      assert.strictEqual(calc.getHistory().length, 3);

      // Clear (C)
      calc.pressClear();
      assert.strictEqual(calc.getState().display, '0');
      assert.strictEqual(calc.getHistory().length, 3);

      // All Clear (AC)
      calc.pressAllClear();
      assert.strictEqual(calc.getState().display, '0');
      assert.strictEqual(calc.getState().accumulator, null);
      assert.strictEqual(calc.getHistory().length, 3);
    });
  });

  // CASE-09: Explicit History Tape Clear
  describe('CASE-09: Explicit History Tape Clear (#clearHistory & CLEAR_HISTORY Action)', () => {
    it('clears all history entries via clearHistory facade and resets drawer to empty state', () => {
      const calc = new StayCalc();
      calc.connectedCallback();

      typeKey('3');
      typeKey('+');
      typeKey('3');
      typeKey('Enter');

      assert.strictEqual(calc.getHistory().length, 1);

      calc.openHistoryDrawer();
      const clearBtn = getShadowElement(calc, '#clearHistory');
      clearBtn.click();

      assert.strictEqual(calc.getHistory().length, 0);
      const emptyMsg = getShadowElement(calc, '#historyEmpty');
      assert.strictEqual(emptyMsg.textContent, 'No calculations yet');
      // Calculator active display remains intact
      assert.strictEqual(calc.getState().display, '6');
    });

    it('dispatches history-change event upon clearing history', () => {
      const calc = new StayCalc();
      calc.connectedCallback();

      let eventReceived: any = null;
      calc.addEventListener('history-change', (e: any) => {
        eventReceived = e.detail;
      });

      calc.pressButton('digit', '4');
      calc.pressButton('operator', '+');
      calc.pressButton('digit', '4');
      calc.pressButton('equals');

      assert.ok(eventReceived);
      assert.strictEqual(eventReceived.history.length, 1);

      calc.clearHistory();
      assert.strictEqual(eventReceived.history.length, 0);
    });
  });

  // CASE-10: 100-Entry FIFO Cap Enforcement
  describe('CASE-10: 100-Entry FIFO Cap Enforcement (Oldest Entry Pruning Under Continuous Load)', () => {
    it('enforces maximum 100 entries and prunes oldest entries in FIFO order (RULE-CALC-005)', () => {
      const calc = new CalculatorEngine();

      // Perform 105 calculations sequentially
      for (let i = 1; i <= 105; i++) {
        calc.pressDigit('1');
        calc.pressOperator('+');
        for (const ch of String(i)) {
          calc.pressDigit(ch);
        }
        calc.pressEquals();
      }

      const history = calc.getHistory();
      assert.strictEqual(history.length, 100);

      // Newest calculation is 1 + 105 = 106 at index 0
      assert.strictEqual(history[0].expression, '1 + 105');
      assert.strictEqual(history[0].result, '106');

      // Oldest retained calculation is 1 + 6 = 7 at index 99 (1+1 through 1+5 pruned)
      assert.strictEqual(history[99].expression, '1 + 6');
      assert.strictEqual(history[99].result, '7');
    });
  });

  // CASE-11: Component UI, Escape Key Dismissal & Event Synchronization
  describe('CASE-11: Component UI, Escape Key Dismissal & Event Synchronization', () => {
    it('dismisses open history drawer on Escape key without clearing active calculation formula (RULE-UI-002)', () => {
      const calc = new StayCalc();
      calc.connectedCallback();

      // Enter formula in progress: 15 +
      typeKey('1');
      typeKey('5');
      typeKey('+');

      assert.strictEqual(calc.getState().accumulator, 15);
      assert.strictEqual(calc.getState().pendingOperator, '+');

      // Open history drawer
      calc.openHistoryDrawer();
      assert.strictEqual(calc.isHistoryDrawerOpen(), true);

      // Press Escape key while drawer is open
      typeKey('Escape');

      // Drawer must be closed
      assert.strictEqual(calc.isHistoryDrawerOpen(), false);
      const drawer = getShadowElement(calc, '#historyDrawer');
      assert.strictEqual(drawer.getAttribute('aria-hidden'), 'true');

      // In-flight calculation must be PRESERVED
      assert.strictEqual(calc.getState().accumulator, 15);
      assert.strictEqual(calc.getState().pendingOperator, '+');

      // Complete the calculation: 5 = 20
      typeKey('5');
      typeKey('Enter');
      assert.strictEqual(calc.getState().display, '20');
    });

    it('resets calculation completely when Escape key is pressed while drawer is closed', () => {
      const calc = new StayCalc();
      calc.connectedCallback();

      typeKey('5');
      typeKey('+');
      typeKey('9');

      assert.strictEqual(calc.isHistoryDrawerOpen(), false);

      typeKey('Escape');

      assert.strictEqual(calc.getState().display, '0');
      assert.strictEqual(calc.getState().accumulator, null);
      assert.strictEqual(calc.getState().pendingOperator, null);
    });

    it('dispatches calc-change with history state on every arithmetic evaluation (SEAM-UI-01)', () => {
      const calc = new StayCalc();
      calc.connectedCallback();

      let calcDetail: any = null;
      calc.addEventListener('calc-change', (e: any) => {
        calcDetail = e.detail;
      });

      typeKey('8');
      typeKey('*');
      typeKey('2');
      typeKey('Enter');

      assert.ok(calcDetail);
      assert.strictEqual(calcDetail.display, '16');
      assert.strictEqual(calcDetail.history.length, 1);
      assert.strictEqual(calcDetail.history[0].expression, '8 * 2');
      assert.strictEqual(calcDetail.history[0].result, '16');
    });
  });
});
