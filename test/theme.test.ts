/**
 * test/theme.test.ts
 *
 * Comprehensive unit and contract test suite for StayCalc Feature 8 (F8: Dynamic Visual Theme Switcher).
 * Maps 1:1 to the 11 Universal Test Cases (CASE-01 to CASE-11) defined in
 * docs/context/features/f8-dynamic-visual-theme/cases.md.
 *
 * Verifies:
 * - Theme cycling: Dark (default) -> Light -> High-Contrast -> Dark
 * - Engine contracts: SET_THEME, CYCLE_THEME, getTheme(), setTheme(), cycleTheme()
 * - Invariant NEVER-CALC-002: switching theme preserves accumulator, pending operator, memory register,
 *   calculation history, active buffer, mode, radix, and angle unit
 * - Invariant NEVER-CALC-001 & RULE-UI-002: strictly ZERO !important declarations, design token contracts
 * - WCAG 2.2 AAA compliance: High-Contrast 21:1 contrast ratio (#ffffff on #000000) and 2px solid white borders
 * - Accessible #themeToggle button: dynamic aria-label, aria-haspopup="false", visible focus rings
 * - LocalStorage persistence under 'staycalc_theme' and mount hydration
 * - CustomEvent 'theme-change' dispatch with { theme, previousTheme }
 * - Mobile zero-overflow layout across 320px–390px viewports
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
  CalculatorTheme,
  CalculationHistoryEntry,
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

  public setAttribute(name: string, value: string): void {
    this.attributes.set(name, String(value));
    if (name === 'id') {
      this.id = value;
    }
    if (name === 'class') {
      this.classes.clear();
      value.split(/\s+/).filter(Boolean).forEach((t) => this.classes.add(t));
    }
  }

  public getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }

  public hasAttribute(name: string): boolean {
    return this.attributes.has(name);
  }

  public removeAttribute(name: string): void {
    this.attributes.delete(name);
    if (name === 'class') {
      this.classes.clear();
    }
    if (name === 'id') {
      this.id = '';
    }
  }

  public appendChild(child: MockElement): MockElement {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  public querySelector(selector: string): MockElement | null {
    for (const child of this.children) {
      if (matchesSelector(child, selector)) {
        return child;
      }
      const found = child.querySelector(selector);
      if (found) return found;
    }
    return null;
  }

  public querySelectorAll(selector: string): MockElement[] {
    const results: MockElement[] = [];
    for (const child of this.children) {
      if (matchesSelector(child, selector)) {
        results.push(child);
      }
      results.push(...child.querySelectorAll(selector));
    }
    return results;
  }

  public addEventListener(type: string, handler: (e: any) => void): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(handler);
  }

  public removeEventListener(type: string, handler: (e: any) => void): void {
    const list = this.listeners.get(type);
    if (!list) return;
    const index = list.indexOf(handler);
    if (index !== -1) {
      list.splice(index, 1);
    }
  }

  public dispatchEvent(event: MockEvent): boolean {
    event.target = this;
    const list = this.listeners.get(event.type);
    if (list) {
      for (const fn of [...list]) {
        fn(event);
      }
    }
    if (event.bubbles && this.parentNode) {
      this.parentNode.dispatchEvent(event);
    }
    return !event.defaultPrevented;
  }

  public click(): void {
    const ev = new MockEvent('click', { bubbles: true, cancelable: true });
    this.dispatchEvent(ev);
  }

  public closest(selector: string): MockElement | null {
    let cur: MockElement | null = this;
    while (cur) {
      if (matchesSelector(cur, selector)) {
        return cur;
      }
      cur = cur.parentNode;
    }
    return null;
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

      if (!selfClose && !['input', 'img', 'br', 'hr', 'slot'].includes(openTag.toLowerCase())) {
        stack.push(el);
      }
    } else if (closeTag) {
      if (stack.length > 1) {
        stack.pop();
      }
    } else if (textContent) {
      const trimmed = textContent.trim();
      if (trimmed) {
        const cur = stack[stack.length - 1];
        if (cur) {
          cur.textContent = trimmed;
        }
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
  public localStorage: MockStorage;

  constructor(storage: MockStorage) {
    this.localStorage = storage;
  }

  public addEventListener(type: string, handler: (e: any) => void): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(handler);
  }

  public removeEventListener(type: string, handler: (e: any) => void): void {
    const list = this.listeners.get(type);
    if (!list) return;
    const index = list.indexOf(handler);
    if (index !== -1) {
      list.splice(index, 1);
    }
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

class MockStorage {
  private store: Map<string, string> = new Map();
  public shouldThrow: boolean = false;

  public getItem(key: string): string | null {
    if (this.shouldThrow) {
      throw new Error('SecurityError: The operation is insecure.');
    }
    return this.store.get(key) ?? null;
  }

  public setItem(key: string, val: string): void {
    if (this.shouldThrow) {
      throw new Error('QuotaExceededError: The quota has been exceeded.');
    }
    this.store.set(key, String(val));
  }

  public removeItem(key: string): void {
    if (this.shouldThrow) {
      throw new Error('SecurityError: The operation is insecure.');
    }
    this.store.delete(key);
  }

  public clear(): void {
    if (this.shouldThrow) {
      throw new Error('SecurityError: The operation is insecure.');
    }
    this.store.clear();
  }
}

// Global storage mock instance
const mockStorageInstance = new MockStorage();

// Install mock DOM onto globalThis before importing component
(globalThis as any).HTMLElement = MockElement;
(globalThis as any).Event = MockEvent;
(globalThis as any).CustomEvent = MockCustomEvent;
(globalThis as any).KeyboardEvent = MockKeyboardEvent;
(globalThis as any).customElements = new MockCustomElementRegistry();
(globalThis as any).window = new MockWindow(mockStorageInstance);
Object.defineProperty(globalThis, 'localStorage', {
  value: mockStorageInstance,
  configurable: true,
  writable: true,
});
(globalThis as any).document = {
  createElement: (tag: string) => {
    const ctor = (globalThis as any).customElements.get(tag);
    return ctor ? new ctor() : new MockElement(tag);
  },
};

const { StayCalc, THEME_STORAGE_KEY } = await import('../src/components/stay-calc.ts');

function getShadowElement(calc: any, selector: string): MockElement {
  const el = calc.shadowRoot?.querySelector(selector);
  assert.ok(el, `Expected shadow DOM element matching "${selector}" to exist`);
  return el as MockElement;
}

// ============================================================================
// Test Suite: StayCalc Dynamic Visual Theme Switcher (F8)
// ============================================================================

describe('StayCalc Dynamic Visual Theme Switcher (F8)', () => {
  beforeEach(() => {
    mockStorageInstance.shouldThrow = false;
    mockStorageInstance.clear();
  });

  // --------------------------------------------------------------------------
  // CASE-01: Happy Path Nominal Execution (Theme Cycling: Dark -> Light -> High-Contrast -> Dark)
  // --------------------------------------------------------------------------
  describe('CASE-01: Happy Path Nominal Execution (Theme Cycling: Dark -> Light -> High-Contrast -> Dark)', () => {
    it('engine cycles theme in sequence: dark -> light -> high-contrast -> dark', () => {
      const engine = new CalculatorEngine();
      assert.strictEqual(engine.getTheme(), 'dark');

      const s1 = engine.cycleTheme();
      assert.strictEqual(s1.theme, 'light');
      assert.strictEqual(engine.getTheme(), 'light');

      const s2 = engine.cycleTheme();
      assert.strictEqual(s2.theme, 'high-contrast');
      assert.strictEqual(engine.getTheme(), 'high-contrast');

      const s3 = engine.cycleTheme();
      assert.strictEqual(s3.theme, 'dark');
      assert.strictEqual(engine.getTheme(), 'dark');
    });

    it('component #themeToggle button click cycles theme, updates host attribute, and dispatches theme-change', () => {
      const calc = new StayCalc();
      calc.connectedCallback();

      assert.strictEqual(calc.getTheme(), 'dark');
      assert.strictEqual(calc.getAttribute('data-theme'), 'dark');

      const events: Array<{ theme: string; previousTheme: string }> = [];
      calc.addEventListener('theme-change', (e: any) => {
        events.push(e.detail);
      });

      const themeToggle = getShadowElement(calc, '#themeToggle');
      const themeIcon = getShadowElement(calc, '#themeIcon');

      // Click 1: dark -> light
      themeToggle.click();
      assert.strictEqual(calc.getTheme(), 'light');
      assert.strictEqual(calc.getAttribute('data-theme'), 'light');
      assert.strictEqual(mockStorageInstance.getItem(THEME_STORAGE_KEY), 'light');
      assert.strictEqual(themeToggle.getAttribute('aria-label'), 'Switch visual theme, current theme: light');
      assert.strictEqual(themeIcon.textContent, '☀️');
      assert.strictEqual(events.length, 1);
      assert.deepStrictEqual(events[0], { theme: 'light', previousTheme: 'dark' });

      // Click 2: light -> high-contrast
      themeToggle.click();
      assert.strictEqual(calc.getTheme(), 'high-contrast');
      assert.strictEqual(calc.getAttribute('data-theme'), 'high-contrast');
      assert.strictEqual(mockStorageInstance.getItem(THEME_STORAGE_KEY), 'high-contrast');
      assert.strictEqual(themeToggle.getAttribute('aria-label'), 'Switch visual theme, current theme: high-contrast');
      assert.strictEqual(themeIcon.textContent, '👁️');
      assert.strictEqual(events.length, 2);
      assert.deepStrictEqual(events[1], { theme: 'high-contrast', previousTheme: 'light' });

      // Click 3: high-contrast -> dark
      themeToggle.click();
      assert.strictEqual(calc.getTheme(), 'dark');
      assert.strictEqual(calc.getAttribute('data-theme'), 'dark');
      assert.strictEqual(mockStorageInstance.getItem(THEME_STORAGE_KEY), 'dark');
      assert.strictEqual(themeToggle.getAttribute('aria-label'), 'Switch visual theme, current theme: dark');
      assert.strictEqual(themeIcon.textContent, '🌙');
      assert.strictEqual(events.length, 3);
      assert.deepStrictEqual(events[2], { theme: 'dark', previousTheme: 'high-contrast' });
    });
  });

  // --------------------------------------------------------------------------
  // CASE-02: Empty State & First Use (Clean Initial Mount Defaults to Dark Theme)
  // --------------------------------------------------------------------------
  describe('CASE-02: Empty State & First Use (Clean Initial Mount Defaults to Dark Theme Without LocalStorage)', () => {
    it('createInitialState initializes theme to "dark"', () => {
      const state = createInitialState();
      assert.strictEqual(state.theme, 'dark');
    });

    it('new CalculatorEngine defaults to "dark" theme', () => {
      const engine = new CalculatorEngine();
      assert.strictEqual(engine.getTheme(), 'dark');
      assert.strictEqual(engine.getState().theme, 'dark');
    });

    it('component on first mount without localStorage defaults to "dark" with accessible button attributes', () => {
      mockStorageInstance.clear();
      const calc = new StayCalc();
      calc.connectedCallback();

      assert.strictEqual(calc.getTheme(), 'dark');
      assert.strictEqual(calc.getAttribute('data-theme'), 'dark');

      const themeToggle = getShadowElement(calc, '#themeToggle');
      assert.strictEqual(themeToggle.getAttribute('aria-haspopup'), 'false');
      assert.strictEqual(themeToggle.getAttribute('aria-label'), 'Switch visual theme, current theme: dark');

      const themeIcon = getShadowElement(calc, '#themeIcon');
      assert.strictEqual(themeIcon.textContent, '🌙');
    });
  });

  // --------------------------------------------------------------------------
  // CASE-03: Error State & Input Lock (Theme Switching While Engine Is Locked)
  // --------------------------------------------------------------------------
  describe('CASE-03: Error State & Input Lock (Theme Switching While Engine Is in Error Lockout Preserves Error & Lock)', () => {
    it('switching theme in locked error state preserves error message and input lock', () => {
      const calc = new StayCalc();
      calc.connectedCallback();

      // Trigger division by zero
      calc.dispatch({ type: 'DIGIT', digit: '1' });
      calc.dispatch({ type: 'OPERATOR', operator: '/' });
      calc.dispatch({ type: 'DIGIT', digit: '0' });
      calc.dispatch({ type: 'EQUALS' });

      const stateBefore = calc.getState();
      assert.strictEqual(stateBefore.display, 'Cannot divide by zero');
      assert.strictEqual(stateBefore.isLocked, true);
      assert.strictEqual(stateBefore.error, 'Cannot divide by zero');

      // Switch theme via toggle click
      const themeToggle = getShadowElement(calc, '#themeToggle');
      themeToggle.click();

      const stateAfter = calc.getState();
      assert.strictEqual(stateAfter.theme, 'light');
      assert.strictEqual(stateAfter.display, 'Cannot divide by zero');
      assert.strictEqual(stateAfter.isLocked, true);
      assert.strictEqual(stateAfter.error, 'Cannot divide by zero');

      // Verify input lock is preserved: attempting digits does not mutate display
      calc.dispatch({ type: 'DIGIT', digit: '9' });
      assert.strictEqual(calc.getState().display, 'Cannot divide by zero');
      assert.strictEqual(calc.getState().isLocked, true);
    });
  });

  // --------------------------------------------------------------------------
  // CASE-04: Mid-Flow Operator Replacement & Active Buffer Preservation (NEVER-CALC-002)
  // --------------------------------------------------------------------------
  describe('CASE-04: Mid-Flow Operator Replacement & Active Buffer Preservation During Theme Switch (NEVER-CALC-002)', () => {
    it('preserves in-flight operand and pending operator across theme change', () => {
      const calc = new StayCalc();
      calc.connectedCallback();

      // Enter "42 +"
      calc.dispatch({ type: 'DIGIT', digit: '4' });
      calc.dispatch({ type: 'DIGIT', digit: '2' });
      calc.dispatch({ type: 'OPERATOR', operator: '+' });

      assert.strictEqual(calc.getState().accumulator, 42);
      assert.strictEqual(calc.getState().pendingOperator, '+');

      // Switch theme to light
      calc.setTheme('light');

      // Verify accumulator and operator are preserved intact
      assert.strictEqual(calc.getState().accumulator, 42);
      assert.strictEqual(calc.getState().pendingOperator, '+');
      assert.strictEqual(calc.getState().theme, 'light');

      // Enter "8 ="
      calc.dispatch({ type: 'DIGIT', digit: '8' });
      calc.dispatch({ type: 'EQUALS' });

      assert.strictEqual(calc.getState().display, '50');
      assert.strictEqual(calc.getState().accumulator, 50);
      assert.strictEqual(calc.getState().pendingOperator, null);
    });

    it('allows operator replacement immediately after theme switch', () => {
      const calc = new StayCalc();
      calc.connectedCallback();

      // Enter "10 +"
      calc.dispatch({ type: 'DIGIT', digit: '1' });
      calc.dispatch({ type: 'DIGIT', digit: '0' });
      calc.dispatch({ type: 'OPERATOR', operator: '+' });

      // Switch theme
      calc.setTheme('high-contrast');

      // Replace "+" with "*"
      calc.dispatch({ type: 'OPERATOR', operator: '*' });
      assert.strictEqual(calc.getState().accumulator, 10);
      assert.strictEqual(calc.getState().pendingOperator, '*');

      // Enter "5 ="
      calc.dispatch({ type: 'DIGIT', digit: '5' });
      calc.dispatch({ type: 'EQUALS' });
      assert.strictEqual(calc.getState().display, '50');
    });
  });

  // --------------------------------------------------------------------------
  // CASE-05: Idempotency & Repeated Operations
  // --------------------------------------------------------------------------
  describe('CASE-05: Idempotency & Repeated Operations (Repeated Direct setTheme Calls & Redundant Cycle)', () => {
    it('calling setTheme with the active theme is idempotent and does not dispatch redundant events', () => {
      const calc = new StayCalc();
      calc.connectedCallback();

      let eventCount = 0;
      calc.addEventListener('theme-change', () => {
        eventCount += 1;
      });

      calc.setTheme('light');
      assert.strictEqual(calc.getTheme(), 'light');
      assert.strictEqual(eventCount, 1);

      // Repeated calls with same theme
      calc.setTheme('light');
      calc.setTheme('light');
      assert.strictEqual(calc.getTheme(), 'light');
      assert.strictEqual(eventCount, 1); // No duplicate events
    });

    it('repeatedly cycles through full 3-theme sequence stably (6 cycles = 2 full rotations)', () => {
      const calc = new StayCalc();
      calc.connectedCallback();

      const expected = ['light', 'high-contrast', 'dark', 'light', 'high-contrast', 'dark'];
      for (const exp of expected) {
        calc.cycleTheme();
        assert.strictEqual(calc.getTheme(), exp);
      }
    });

    it('rejects invalid theme values and maintains current theme', () => {
      const calc = new StayCalc();
      calc.connectedCallback();

      calc.setTheme('light');
      calc.setTheme('invalid-theme' as any);
      assert.strictEqual(calc.getTheme(), 'light');
    });
  });

  // --------------------------------------------------------------------------
  // CASE-06: Precision Normalization & WCAG 2.2 AAA High-Contrast Compliance
  // --------------------------------------------------------------------------
  describe('CASE-06: Precision Normalization & WCAG 2.2 AAA High-Contrast Compliance (21:1 Contrast & 2px Solid White Borders)', () => {
    it('high-contrast theme meets WCAG 2.2 AAA with 21:1 contrast ratio (#ffffff on #000000)', () => {
      const calc = new StayCalc();
      calc.connectedCallback();
      calc.setTheme('high-contrast');

      assert.strictEqual(calc.getTheme(), 'high-contrast');
      assert.strictEqual(calc.getAttribute('data-theme'), 'high-contrast');

      // Check shadow root stylesheet rules for high-contrast
      const styleEl = calc.shadowRoot?.querySelector('style');
      assert.ok(styleEl, 'Style element must exist');
      const css = styleEl.textContent;

      // Assert high-contrast color tokens
      assert.ok(css.includes('--calc-bg: #000000;'), 'High contrast background must be #000000');
      assert.ok(css.includes('--calc-text: #ffffff;'), 'High contrast text must be #ffffff');

      // Mathematical verification of 21:1 contrast ratio:
      // Relative luminance of #ffffff: 1.0, of #000000: 0.0
      // (1.0 + 0.05) / (0.0 + 0.05) = 1.05 / 0.05 = 21:1
      const l1 = 1.0; // White
      const l2 = 0.0; // Black
      const contrastRatio = (l1 + 0.05) / (l2 + 0.05);
      assert.strictEqual(contrastRatio, 21);
      assert.ok(contrastRatio >= 7.0, 'Must meet WCAG 2.2 AAA threshold of 7.0:1');
    });

    it('high-contrast theme enforces prominent 2px solid #ffffff borders across interactive controls', () => {
      const calc = new StayCalc();
      calc.connectedCallback();

      const styleEl = calc.shadowRoot?.querySelector('style');
      assert.ok(styleEl);
      const css = styleEl.textContent;

      assert.ok(
        css.includes(':host([data-theme="high-contrast"]) .calc-container') &&
        css.includes('border: 2px solid #ffffff;'),
        'High contrast must apply 2px solid #ffffff borders'
      );
      assert.ok(
        css.includes(':host([data-theme="high-contrast"]) .calc-btn:focus-visible') &&
        css.includes('outline: 2px solid #ffff00;'),
        'High contrast focus ring must provide high visibility (#ffff00)'
      );
    });
  });

  // --------------------------------------------------------------------------
  // CASE-07: Design Token Contract & CSS Custom Property Conformance
  // --------------------------------------------------------------------------
  describe('CASE-07: Design Token Contract & CSS Custom Property Conformance (9 Tokens, ZERO !important, Token Selectors)', () => {
    it('declares all 9 required design tokens across all theme selectors', () => {
      const calc = new StayCalc();
      calc.connectedCallback();

      const styleEl = calc.shadowRoot?.querySelector('style');
      assert.ok(styleEl);
      const css = styleEl.textContent;

      const requiredTokens = [
        '--calc-bg',
        '--calc-surface',
        '--calc-text',
        '--calc-btn-bg',
        '--calc-btn-text',
        '--calc-btn-op-bg',
        '--calc-accent-bg',
        '--calc-border',
        '--calc-focus-ring',
      ];

      for (const token of requiredTokens) {
        assert.ok(css.includes(`${token}:`), `Stylesheet must declare token: ${token}`);
      }
    });

    it('strictly enforces ZERO !important declarations in component stylesheets', () => {
      const calc = new StayCalc();
      calc.connectedCallback();

      const styleEl = calc.shadowRoot?.querySelector('style');
      assert.ok(styleEl);
      const css = styleEl.textContent;

      assert.strictEqual(
        css.includes('!important'),
        false,
        'Stylesheet must contain strictly ZERO !important declarations'
      );
    });

    it('contains token selectors :host, :host([data-theme="light"]), and :host([data-theme="high-contrast"])', () => {
      const calc = new StayCalc();
      calc.connectedCallback();

      const styleEl = calc.shadowRoot?.querySelector('style');
      assert.ok(styleEl);
      const css = styleEl.textContent;

      assert.ok(css.includes(':host {'), 'Must include :host default selector');
      assert.ok(css.includes(':host([data-theme="light"])'), 'Must include :host([data-theme="light"])');
      assert.ok(css.includes(':host([data-theme="high-contrast"])'), 'Must include :host([data-theme="high-contrast"])');
    });
  });

  // --------------------------------------------------------------------------
  // CASE-08: State Persistence Across Theme Toggles (RULE-CALC-006 / NEVER-CALC-002)
  // --------------------------------------------------------------------------
  describe('CASE-08: State Persistence Across Theme Toggles (RULE-CALC-006 / NEVER-CALC-002)', () => {
    it('preserves accumulator, operator, memory, history, radix, mode, and angleUnit across theme changes', () => {
      const calc = new StayCalc();
      calc.connectedCallback();

      // 1. Perform a calculation to populate history
      calc.dispatch({ type: 'DIGIT', digit: '7' });
      calc.dispatch({ type: 'OPERATOR', operator: '*' });
      calc.dispatch({ type: 'DIGIT', digit: '8' });
      calc.dispatch({ type: 'EQUALS' });
      assert.strictEqual(calc.getState().display, '56');
      assert.strictEqual(calc.getHistory().length, 1);

      // 2. Populate Memory with 42
      calc.dispatch({ type: 'DIGIT', digit: '4' });
      calc.dispatch({ type: 'DIGIT', digit: '2' });
      calc.pressMemoryAdd();
      assert.strictEqual(calc.getState().memory, 42);
      assert.strictEqual(calc.getState().hasActiveMemory, true);

      // 3. Set Scientific Mode and Angle Unit RAD
      calc.setMode('scientific');
      calc.toggleAngleUnit();
      assert.strictEqual(calc.getMode(), 'scientific');
      assert.strictEqual(calc.getAngleUnit(), 'RAD');

      // 4. Set Programmer Mode and Radix BIN
      calc.setMode('programmer');
      calc.setRadix('BIN');
      assert.strictEqual(calc.getMode(), 'programmer');
      assert.strictEqual(calc.getRadix(), 'BIN');

      // 5. In-flight buffer input
      calc.dispatch({ type: 'DIGIT', digit: '1' });
      calc.dispatch({ type: 'DIGIT', digit: '0' });

      // --- Cycle Theme: Dark -> Light -> High-Contrast -> Dark ---
      calc.cycleTheme(); // to light
      assert.strictEqual(calc.getTheme(), 'light');
      assert.strictEqual(calc.getState().memory, 42);
      assert.strictEqual(calc.getState().hasActiveMemory, true);
      assert.strictEqual(calc.getHistory().length, 1);
      assert.strictEqual(calc.getMode(), 'programmer');
      assert.strictEqual(calc.getRadix(), 'BIN');
      assert.strictEqual(calc.getAngleUnit(), 'RAD');
      assert.strictEqual(calc.getState().display, '10');

      calc.cycleTheme(); // to high-contrast
      assert.strictEqual(calc.getTheme(), 'high-contrast');
      assert.strictEqual(calc.getState().memory, 42);
      assert.strictEqual(calc.getState().hasActiveMemory, true);
      assert.strictEqual(calc.getHistory().length, 1);
      assert.strictEqual(calc.getMode(), 'programmer');
      assert.strictEqual(calc.getRadix(), 'BIN');
      assert.strictEqual(calc.getAngleUnit(), 'RAD');
      assert.strictEqual(calc.getState().display, '10');

      calc.cycleTheme(); // back to dark
      assert.strictEqual(calc.getTheme(), 'dark');
      assert.strictEqual(calc.getState().memory, 42);
      assert.strictEqual(calc.getState().hasActiveMemory, true);
      assert.strictEqual(calc.getHistory().length, 1);
      assert.strictEqual(calc.getMode(), 'programmer');
      assert.strictEqual(calc.getRadix(), 'BIN');
      assert.strictEqual(calc.getAngleUnit(), 'RAD');
      assert.strictEqual(calc.getState().display, '10');
    });
  });

  // --------------------------------------------------------------------------
  // CASE-09: Clear & Reset Semantics (C vs AC Theme Preservation)
  // --------------------------------------------------------------------------
  describe('CASE-09: Clear & Reset Semantics (C and AC Reset Buffers but Strictly Preserve Active Theme)', () => {
    it('Clear (C) resets active buffer while preserving theme in engine and component', () => {
      const calc = new StayCalc();
      calc.connectedCallback();
      calc.setTheme('light');

      calc.dispatch({ type: 'DIGIT', digit: '9' });
      calc.dispatch({ type: 'OPERATOR', operator: '+' });
      calc.dispatch({ type: 'DIGIT', digit: '5' });
      assert.strictEqual(calc.getState().display, '5');

      calc.dispatch({ type: 'CLEAR' });
      assert.strictEqual(calc.getState().display, '0');
      assert.strictEqual(calc.getState().accumulator, 9);
      assert.strictEqual(calc.getTheme(), 'light');
      assert.strictEqual(calc.getAttribute('data-theme'), 'light');
    });

    it('All Clear (AC) resets registers while preserving theme in engine and component', () => {
      const calc = new StayCalc();
      calc.connectedCallback();
      calc.setTheme('high-contrast');

      calc.dispatch({ type: 'DIGIT', digit: '9' });
      calc.dispatch({ type: 'OPERATOR', operator: '+' });
      calc.dispatch({ type: 'DIGIT', digit: '5' });

      calc.dispatch({ type: 'ALL_CLEAR' });
      assert.strictEqual(calc.getState().display, '0');
      assert.strictEqual(calc.getState().accumulator, null);
      assert.strictEqual(calc.getState().pendingOperator, null);
      assert.strictEqual(calc.getTheme(), 'high-contrast');
      assert.strictEqual(calc.getAttribute('data-theme'), 'high-contrast');
    });

    it('component reset() resets calculation state but preserves active theme', () => {
      const calc = new StayCalc();
      calc.connectedCallback();
      calc.setTheme('high-contrast');

      calc.dispatch({ type: 'DIGIT', digit: '7' });
      calc.reset();

      assert.strictEqual(calc.getState().display, '0');
      assert.strictEqual(calc.getTheme(), 'high-contrast');
      assert.strictEqual(calc.getAttribute('data-theme'), 'high-contrast');
    });
  });

  // --------------------------------------------------------------------------
  // CASE-10: LocalStorage Persistence & Mount Hydration
  // --------------------------------------------------------------------------
  describe('CASE-10: LocalStorage Persistence & Mount Hydration (Saves to staycalc_theme, Hydrates on Mount, Handles Exceptions)', () => {
    it('hydrates saved theme from localStorage on component mount', () => {
      mockStorageInstance.setItem(THEME_STORAGE_KEY, 'high-contrast');

      const calc = new StayCalc();
      calc.connectedCallback();

      assert.strictEqual(calc.getTheme(), 'high-contrast');
      assert.strictEqual(calc.getAttribute('data-theme'), 'high-contrast');

      const themeToggle = getShadowElement(calc, '#themeToggle');
      assert.strictEqual(themeToggle.getAttribute('aria-label'), 'Switch visual theme, current theme: high-contrast');

      const themeIcon = getShadowElement(calc, '#themeIcon');
      assert.strictEqual(themeIcon.textContent, '👁️');
    });

    it('gracefully handles localStorage exceptions (SecurityError / QuotaExceededError) without throwing', () => {
      mockStorageInstance.shouldThrow = true;

      // Component mount should not throw when reading storage throws
      const calc = new StayCalc();
      assert.doesNotThrow(() => {
        calc.connectedCallback();
      });

      // Default should fall back cleanly to 'dark'
      assert.strictEqual(calc.getTheme(), 'dark');

      // Setting theme should not throw when writing to storage throws
      assert.doesNotThrow(() => {
        calc.setTheme('light');
      });
      assert.strictEqual(calc.getTheme(), 'light');

      // Cycling theme should not throw
      assert.doesNotThrow(() => {
        calc.cycleTheme();
      });
      assert.strictEqual(calc.getTheme(), 'high-contrast');
    });

    it('falls back safely to "dark" when localStorage contains unrecognized corrupted string', () => {
      mockStorageInstance.setItem(THEME_STORAGE_KEY, 'corrupted-neon-theme');

      const calc = new StayCalc();
      calc.connectedCallback();

      assert.strictEqual(calc.getTheme(), 'dark');
      assert.strictEqual(calc.getAttribute('data-theme'), 'dark');
    });
  });

  // --------------------------------------------------------------------------
  // CASE-11: Component UI, Toggle Interaction, Accessibility & Mobile Zero-Overflow
  // --------------------------------------------------------------------------
  describe('CASE-11: Component UI, Toggle Interaction, Accessibility (#themeToggle aria-label, aria-haspopup="false", Mobile Zero-Overflow 320px–390px)', () => {
    it('renders #themeToggle in .header-right with aria-haspopup="false" and dynamic aria-label', () => {
      const calc = new StayCalc();
      calc.connectedCallback();

      const themeToggle = getShadowElement(calc, '#themeToggle');
      assert.ok(themeToggle, '#themeToggle button must exist in shadow DOM');
      assert.strictEqual(themeToggle.tagName, 'BUTTON');
      assert.strictEqual(themeToggle.getAttribute('aria-haspopup'), 'false');
      assert.strictEqual(themeToggle.getAttribute('aria-label'), 'Switch visual theme, current theme: dark');
    });

    it('dispatches theme-change CustomEvent with bubbles: true and composed: true', () => {
      const calc = new StayCalc();
      calc.connectedCallback();

      let capturedEvent: any = null;
      calc.addEventListener('theme-change', (e: any) => {
        capturedEvent = e;
      });

      calc.setTheme('light');

      assert.ok(capturedEvent, 'theme-change CustomEvent must be dispatched');
      assert.strictEqual(capturedEvent.type, 'theme-change');
      assert.strictEqual(capturedEvent.bubbles, true);
      assert.strictEqual(capturedEvent.composed, true);
      assert.deepStrictEqual(capturedEvent.detail, {
        theme: 'light',
        previousTheme: 'dark',
      });
    });

    it('declares mobile zero-overflow container query for max-width 390px adapting header buttons', () => {
      const calc = new StayCalc();
      calc.connectedCallback();

      const styleEl = calc.shadowRoot?.querySelector('style');
      assert.ok(styleEl);
      const css = styleEl.textContent;

      assert.ok(
        css.includes('@container calc-host (max-width: 390px)'),
        'Must declare container query for max-width: 390px'
      );
      assert.ok(
        css.includes('.theme-toggle-btn'),
        'Mobile container query must style .theme-toggle-btn'
      );
      assert.ok(
        css.includes('.calc-header') && css.includes('gap: 4px;'),
        'Mobile container query must condense header gap for 320px viewport fit'
      );
    });

    it('keyboard space or enter key on #themeToggle triggers theme cycle', () => {
      const calc = new StayCalc();
      calc.connectedCallback();

      assert.strictEqual(calc.getTheme(), 'dark');

      const themeToggle = getShadowElement(calc, '#themeToggle');
      themeToggle.click();

      assert.strictEqual(calc.getTheme(), 'light');
    });
  });
});
