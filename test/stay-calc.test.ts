/**
 * test/stay-calc.test.ts
 *
 * Comprehensive unit test suite for the <stay-calc> autonomous custom element.
 * Covers all 11 Universal Test Cases (CASE-01 to CASE-11) defined in
 * docs/context/features/f2-accessible-ui-keyboard-nav/cases.md, custom element lifecycle,
 * keyboard navigation, WCAG 2.2 AA accessibility attributes, and SEAM-ENGINE-01 / SEAM-UI-01.
 *
 * Runs natively in Node.js 24 (node:test) with zero external runtime dependencies.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

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
  public classList: {
    add: (...tokens: string[]) => void;
    remove: (...tokens: string[]) => void;
    contains: (token: string) => boolean;
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

// Install mock DOM onto globalThis before loading component
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

// Import component module dynamically after environment setup
const { StayCalc } = await import('../src/components/stay-calc.ts');

// --- Helper Functions ---

function getShadowElement(calc: any, selector: string): MockElement {
  const el = calc.shadowRoot?.querySelector(selector);
  assert.ok(el, `Expected shadow DOM element matching "${selector}" to exist`);
  return el as MockElement;
}

function clickButtonByText(calc: any, text: string): void {
  const buttons = calc.shadowRoot?.querySelectorAll('button') ?? [];
  const btn = buttons.find(
    (b: MockElement) =>
      b.textContent.trim() === text || b.getAttribute('data-value') === text
  );
  assert.ok(btn, `Button with label/value "${text}" not found`);
  btn.click();
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

function typeKey(key: string, modifiers: { metaKey?: boolean; ctrlKey?: boolean; altKey?: boolean } = {}): MockKeyboardEvent {
  const event = new MockKeyboardEvent('keydown', {
    key,
    cancelable: true,
    ...modifiers,
  });
  (globalThis as any).window.dispatchEvent(event);
  return event;
}

// --- Test Suites ---

describe('StayCalc Autonomous Custom Element (F2)', () => {
  let calc: any;

  beforeEach(() => {
    calc = new StayCalc();
    calc.connectedCallback();
  });

  // CASE-01: Happy Path Nominal Execution
  describe('CASE-01: Happy Path Nominal Execution (Keypad Click & Keyboard Arithmetic)', () => {
    it('evaluates basic addition via button clicks (2 + 3 = 5)', () => {
      clickButtonByAction(calc, 'digit', '2');
      clickButtonByAction(calc, 'operator', '+');
      clickButtonByAction(calc, 'digit', '3');
      clickButtonByAction(calc, 'equals');

      const display = getShadowElement(calc, '#displayValue');
      assert.strictEqual(display.textContent, '5');
      assert.strictEqual(calc.getState().display, '5');
    });

    it('evaluates basic subtraction via physical keyboard typing (10 - 4 = 6)', () => {
      typeKey('1');
      typeKey('0');
      typeKey('-');
      typeKey('4');
      typeKey('Enter');

      const display = getShadowElement(calc, '#displayValue');
      assert.strictEqual(display.textContent, '6');
      assert.strictEqual(calc.getState().display, '6');
    });

    it('evaluates basic multiplication via keyboard (6 * 7 = 42)', () => {
      typeKey('6');
      typeKey('*');
      typeKey('7');
      typeKey('=');

      const display = getShadowElement(calc, '#displayValue');
      assert.strictEqual(display.textContent, '42');
      assert.strictEqual(calc.getState().display, '42');
    });

    it('evaluates basic division via keyboard (20 / 4 = 5)', () => {
      typeKey('2');
      typeKey('0');
      typeKey('/');
      typeKey('4');
      typeKey('Enter');

      const display = getShadowElement(calc, '#displayValue');
      assert.strictEqual(display.textContent, '5');
      assert.strictEqual(calc.getState().display, '5');
    });

    it('evaluates sequential immediate pocket calculator order via keyboard (2 + 3 * 4 = 20)', () => {
      typeKey('2');
      typeKey('+');
      typeKey('3');
      typeKey('*'); // 2 + 3 = 5
      assert.strictEqual(calc.getState().display, '5');
      typeKey('4');
      typeKey('Enter'); // 5 * 4 = 20

      const display = getShadowElement(calc, '#displayValue');
      assert.strictEqual(display.textContent, '20');
      assert.strictEqual(calc.getState().display, '20');
    });
  });

  // CASE-02: Empty State & First Use
  describe('CASE-02: Empty State & First Use (Mount & DSD Slots)', () => {
    it('is registered in customElements registry as "stay-calc"', () => {
      const registered = (globalThis as any).customElements.get('stay-calc');
      assert.strictEqual(registered, StayCalc);
    });

    it('mounts with display initialized to "0"', () => {
      const display = getShadowElement(calc, '#displayValue');
      assert.strictEqual(display.textContent, '0');
      assert.strictEqual(calc.getState().display, '0');
    });

    it('provides polite ARIA live region attributes on display element', () => {
      const displayScreen = getShadowElement(calc, '#defaultDisplay');
      assert.strictEqual(displayScreen.getAttribute('role'), 'status');
      assert.strictEqual(displayScreen.getAttribute('aria-live'), 'polite');
      assert.strictEqual(displayScreen.getAttribute('aria-atomic'), 'true');
    });

    it('renders 20 keypad buttons with accessible aria-label attributes', () => {
      const buttons = calc.shadowRoot?.querySelectorAll('button') ?? [];
      assert.strictEqual(buttons.length, 20);

      for (const btn of buttons) {
        assert.ok(btn.getAttribute('aria-label'), `Button ${btn.textContent} missing aria-label`);
        assert.ok(btn.classList.contains('calc-btn'), 'Button must have calc-btn class');
      }
    });
  });

  // CASE-03: Error State & Input Lock
  describe('CASE-03: Error State & Input Lock (Division by Zero UI Lockout & Escape Unlock)', () => {
    it('displays "Cannot divide by zero" and applies error visual styling on division by zero', () => {
      typeKey('5');
      typeKey('/');
      typeKey('0');
      typeKey('Enter');

      const display = getShadowElement(calc, '#displayValue');
      const screen = getShadowElement(calc, '#defaultDisplay');

      assert.strictEqual(display.textContent, 'Cannot divide by zero');
      assert.strictEqual(calc.getState().isLocked, true);
      assert.strictEqual(screen.classList.contains('error'), true);
    });

    it('locks input so subsequent digits and operators are ignored', () => {
      typeKey('8');
      typeKey('/');
      typeKey('0');
      typeKey('=');

      // Attempt invalid operations while locked
      typeKey('9');
      clickButtonByAction(calc, 'digit', '7');
      clickButtonByAction(calc, 'operator', '+');

      const display = getShadowElement(calc, '#displayValue');
      assert.strictEqual(display.textContent, 'Cannot divide by zero');
      assert.strictEqual(calc.getState().isLocked, true);
    });

    it('unlocks and returns to "0" when Escape key is pressed', () => {
      typeKey('5');
      typeKey('/');
      typeKey('0');
      typeKey('Enter');

      assert.strictEqual(calc.getState().isLocked, true);

      typeKey('Escape');

      const display = getShadowElement(calc, '#displayValue');
      const screen = getShadowElement(calc, '#defaultDisplay');

      assert.strictEqual(display.textContent, '0');
      assert.strictEqual(calc.getState().isLocked, false);
      assert.strictEqual(screen.classList.contains('error'), false);
    });

    it('unlocks and resets when AC button is clicked', () => {
      typeKey('5');
      typeKey('/');
      typeKey('0');
      typeKey('Enter');

      clickButtonByAction(calc, 'all-clear');

      const display = getShadowElement(calc, '#displayValue');
      assert.strictEqual(display.textContent, '0');
      assert.strictEqual(calc.getState().isLocked, false);
    });
  });

  // CASE-04: Mid-Flow Operator Replacement
  describe('CASE-04: Mid-Flow Operator Replacement (Visual Feedback)', () => {
    it('replaces pending operator when subsequent operator entered (5 + * 2 = 10)', () => {
      typeKey('5');
      typeKey('+');
      typeKey('*'); // Replaces + with *
      typeKey('2');
      typeKey('Enter');

      const display = getShadowElement(calc, '#displayValue');
      assert.strictEqual(display.textContent, '10');
      assert.strictEqual(calc.getState().display, '10');
    });
  });

  // CASE-05: Idempotency & Repeated Equals
  describe('CASE-05: Idempotency & Repeated Equals (Enter Key Repeating Result)', () => {
    it('pressing Enter repeatedly maintains stable calculation result', () => {
      typeKey('4');
      typeKey('+');
      typeKey('5');
      typeKey('Enter'); // 9

      assert.strictEqual(calc.getState().display, '9');

      typeKey('Enter');
      typeKey('Enter');
      typeKey('Enter');

      const display = getShadowElement(calc, '#displayValue');
      assert.strictEqual(display.textContent, '9');
      assert.strictEqual(calc.getState().display, '9');
    });
  });

  // CASE-06: Precision Normalization
  describe('CASE-06: Precision Normalization (Visual Display of Normalized Decimals)', () => {
    it('eliminates IEEE 754 float representation noise (0.1 + 0.2 = 0.3)', () => {
      typeKey('0');
      typeKey('.');
      typeKey('1');
      typeKey('+');
      typeKey('0');
      typeKey('.');
      typeKey('2');
      typeKey('Enter');

      const display = getShadowElement(calc, '#displayValue');
      assert.strictEqual(display.textContent, '0.3');
    });

    it('normalizes 0.7 + 0.1 to clean "0.8"', () => {
      typeKey('0');
      typeKey('.');
      typeKey('7');
      typeKey('+');
      typeKey('0');
      typeKey('.');
      typeKey('1');
      typeKey('Enter');

      const display = getShadowElement(calc, '#displayValue');
      assert.strictEqual(display.textContent, '0.8');
    });
  });

  // CASE-07: Decimal Formatting & Input Handling
  describe('CASE-07: Decimal Formatting & Input Handling (Decimal Button and Keypress)', () => {
    it('suppresses redundant decimal points (3.1.4 -> 3.14)', () => {
      clickButtonByAction(calc, 'digit', '3');
      clickButtonByAction(calc, 'decimal');
      clickButtonByAction(calc, 'digit', '1');
      clickButtonByAction(calc, 'decimal'); // Ignored
      clickButtonByAction(calc, 'digit', '4');

      const display = getShadowElement(calc, '#displayValue');
      assert.strictEqual(display.textContent, '3.14');
    });

    it('prepends zero when decimal point clicked first (.5 -> 0.5)', () => {
      typeKey('.');
      typeKey('5');

      const display = getShadowElement(calc, '#displayValue');
      assert.strictEqual(display.textContent, '0.5');
    });
  });

  // CASE-08: Clear Register C
  describe('CASE-08: Clear Register C (Active Buffer Reset)', () => {
    it('clears active input buffer while preserving accumulator (15 + 99 C 5 = 20)', () => {
      typeKey('1');
      typeKey('5');
      typeKey('+');
      typeKey('9');
      typeKey('9');

      clickButtonByAction(calc, 'clear'); // Resets active buffer to 0

      typeKey('5');
      typeKey('Enter');

      const display = getShadowElement(calc, '#displayValue');
      assert.strictEqual(display.textContent, '20');
    });
  });

  // CASE-09: All Clear Register AC & Escape Key
  describe('CASE-09: All Clear Register AC & Escape Key (Complete Reset)', () => {
    it('resets accumulator, operator, and buffer on Escape key', () => {
      typeKey('7');
      typeKey('*');
      typeKey('8');

      typeKey('Escape');

      const display = getShadowElement(calc, '#displayValue');
      assert.strictEqual(display.textContent, '0');
      assert.strictEqual(calc.getState().accumulator, null);
      assert.strictEqual(calc.getState().pendingOperator, null);
    });
  });

  // CASE-10: Negative Numbers & Sign Toggle
  describe('CASE-10: Negative Numbers & Sign Toggle (+/- Key)', () => {
    it('toggles positive number to negative and back via +/- button', () => {
      clickButtonByAction(calc, 'digit', '5');
      clickButtonByAction(calc, 'negate');

      assert.strictEqual(calc.getState().display, '-5');

      clickButtonByAction(calc, 'negate');
      assert.strictEqual(calc.getState().display, '5');
    });

    it('evaluates subtraction yielding negative result (3 - 8 = -5)', () => {
      typeKey('3');
      typeKey('-');
      typeKey('8');
      typeKey('Enter');

      const display = getShadowElement(calc, '#displayValue');
      assert.strictEqual(display.textContent, '-5');
    });
  });

  // CASE-11: Display Boundary & Backspace Key Handling
  describe('CASE-11: Display Boundary & Backspace Key Handling', () => {
    it('erases digits sequentially on Backspace key', () => {
      typeKey('1');
      typeKey('2');
      typeKey('3');
      typeKey('4');

      assert.strictEqual(calc.getState().display, '1234');

      typeKey('Backspace');
      assert.strictEqual(calc.getState().display, '123');

      typeKey('Backspace');
      assert.strictEqual(calc.getState().display, '12');
    });

    it('resets display to "0" when all digits are erased with Backspace', () => {
      typeKey('9');
      typeKey('Backspace');

      const display = getShadowElement(calc, '#displayValue');
      assert.strictEqual(display.textContent, '0');
    });
  });

  // SEAM Contracts & A11y Events
  describe('SEAM Contracts, Event Interception & Lifecycle', () => {
    it('dispatches calc-change CustomEvent on calculation transition (SEAM-UI-01)', () => {
      let eventPayload: any = null;
      calc.addEventListener('calc-change', (e: any) => {
        eventPayload = e.detail;
      });

      clickButtonByAction(calc, 'digit', '8');

      assert.ok(eventPayload);
      assert.strictEqual(eventPayload.display, '8');
    });

    it('intercepts calculator keys and calls preventDefault()', () => {
      const event = typeKey('7');
      assert.strictEqual(event.defaultPrevented, true);
    });

    it('does not intercept or preventDefault when modifier keys are pressed (Cmd+R, Ctrl+C)', () => {
      const cmdEvent = typeKey('r', { metaKey: true });
      assert.strictEqual(cmdEvent.defaultPrevented, false);

      const ctrlEvent = typeKey('c', { ctrlKey: true });
      assert.strictEqual(ctrlEvent.defaultPrevented, false);
    });

    it('cleans up keyboard listeners on disconnectedCallback()', () => {
      calc.disconnectedCallback();

      // Typing keys should now have zero effect on component
      typeKey('9');
      assert.strictEqual(calc.getState().display, '0');
    });

    it('provides public reset() method returning to clean state', () => {
      typeKey('9');
      typeKey('+');
      typeKey('9');
      calc.reset();

      assert.strictEqual(calc.getState().display, '0');
      assert.strictEqual(calc.getState().accumulator, null);
    });
  });
});
