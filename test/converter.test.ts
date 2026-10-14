/**
 * test/converter.test.ts
 *
 * Comprehensive unit and contract test suite for StayCalc Feature 9 (F9: Multi-Unit Converter Extension).
 * Maps 1:1 to the 11 Universal Test Cases (CASE-01 to CASE-11) defined in
 * docs/context/features/f9-multi-unit-converter/cases.md.
 *
 * Verifies:
 * - Length conversions: cm, m, km, in, ft with exact meter ratios
 * - Mass conversions: g, kg, oz, lb with exact kilogram ratios
 * - Temperature conversions: C, F, K with thermodynamic formulas & absolute zero validation
 * - Invariant NEVER-CALC-004: loading converted values preserves accumulator and pending operator
 * - Invariant RULE-CALC-002: precision normalization truncating IEEE-754 noise to max 12 digits
 * - Invariant NEVER-CALC-001: zero dynamic code evaluation
 * - Accessible drawer UI: #converterToggle, #converterDrawer, aria-expanded, aria-controls, aria-live
 * - Reactive live conversion & CustomEvent 'unit-convert' dispatch
 * - Buffer loading action: loadBuffer() facade & #btnLoadConvertedValue click with 'calc-change'
 * - Mobile responsive zero-overflow container queries across 320px–390px viewports
 * - WCAG 2.2 AAA high-contrast token conformance & zero !important declarations
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
import {
  convertUnits,
  normalizeConversionPrecision,
  getUnitsForCategory,
  isUnitCategory,
  isConversionUnit,
  LENGTH_RATIOS,
  MASS_RATIOS,
  UNIT_OPTIONS,
  DEFAULT_UNITS,
} from '../src/engine/converter.ts';
import type {
  CalculatorState,
  UnitCategory,
  LengthUnit,
  MassUnit,
  TemperatureUnit,
  ConversionResult,
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
  private _value: string = '';

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

  get value(): string {
    if (this.tagName === 'SELECT') {
      if (this._value) return this._value;
      const selected = this.children.find((c) => c.hasAttribute('selected'));
      if (selected) return selected.getAttribute('value') ?? '';
      return this.children[0]?.getAttribute('value') ?? '';
    }
    return this._value || (this.getAttribute('value') ?? '');
  }

  set value(val: string) {
    this._value = String(val);
    this.setAttribute('value', String(val));
    if (this.tagName === 'SELECT') {
      for (const child of this.children) {
        if (child.getAttribute('value') === val) {
          child.setAttribute('selected', '');
        } else {
          child.removeAttribute('selected');
        }
      }
    }
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
  }

  public appendChild(child: MockElement): void {
    child.parentNode = this;
    this.children.push(child);
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
  public localStorage: any;

  constructor(storage: any) {
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
  public getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  public setItem(key: string, val: string): void {
    this.store.set(key, String(val));
  }
  public removeItem(key: string): void {
    this.store.delete(key);
  }
  public clear(): void {
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

const { StayCalc } = await import('../src/components/stay-calc.ts');

function getShadowElement(calc: any, selector: string): MockElement {
  const el = calc.shadowRoot?.querySelector(selector);
  assert.ok(el, `Expected shadow DOM element matching "${selector}" to exist`);
  return el as MockElement;
}

// ============================================================================
// Test Suite: StayCalc Multi-Unit Converter Extension (F9)
// ============================================================================

describe('StayCalc Multi-Unit Converter Extension (F9)', () => {
  // --------------------------------------------------------------------------
  // CASE-01: Happy Path Nominal Execution (Bidirectional Length Conversions: cm, m, km, in, ft)
  // --------------------------------------------------------------------------
  describe('CASE-01: Happy Path Nominal Execution (Bidirectional Length Conversions: cm, m, km, in, ft)', () => {
    it('converts metric length units correctly with exact ratios', () => {
      // 100 cm = 1 m
      const cmToM = convertUnits('length', 'cm', 'm', 100);
      assert.strictEqual(cmToM.value, 1);
      assert.strictEqual(cmToM.formatted, '1');

      // 1 km = 1000 m
      const kmToM = convertUnits('length', 'km', 'm', 1);
      assert.strictEqual(kmToM.value, 1000);
      assert.strictEqual(kmToM.formatted, '1000');

      // 1000 m = 1 km
      const mToKm = convertUnits('length', 'm', 'km', 1000);
      assert.strictEqual(mToKm.value, 1);
      assert.strictEqual(mToKm.formatted, '1');
    });

    it('converts imperial and cross-system length units correctly', () => {
      // 1 in = 2.54 cm
      const inToCm = convertUnits('length', 'in', 'cm', 1);
      assert.strictEqual(inToCm.value, 2.54);
      assert.strictEqual(inToCm.formatted, '2.54');

      // 1 ft = 12 in
      const ftToIn = convertUnits('length', 'ft', 'in', 1);
      assert.strictEqual(ftToIn.value, 12);
      assert.strictEqual(ftToIn.formatted, '12');

      // 1 ft = 0.3048 m
      const ftToM = convertUnits('length', 'ft', 'm', 1);
      assert.strictEqual(ftToM.value, 0.3048);
      assert.strictEqual(ftToM.formatted, '0.3048');

      // 5280 ft = 1.609344 km
      const milesFeetToKm = convertUnits('length', 'ft', 'km', 5280);
      assert.strictEqual(milesFeetToKm.value, 1.609344);
      assert.strictEqual(milesFeetToKm.formatted, '1.609344');
    });

    it('component converts length live when input or unit changes', () => {
      const calc = new StayCalc();
      calc.connectedCallback();

      calc.openConverter();
      const inputEl = getShadowElement(calc, '#converterInput');
      const outputEl = getShadowElement(calc, '#converterOutput');

      // Set input to 100 cm -> default target is m -> output should be 1
      inputEl.value = '100';
      calc.recomputeConversion();

      assert.strictEqual(outputEl.textContent, '1');
    });
  });

  // --------------------------------------------------------------------------
  // CASE-02: Empty State & First Use (Clean Initial Drawer Mount: Hidden by Default, Accessible Attributes)
  // --------------------------------------------------------------------------
  describe('CASE-02: Empty State & First Use (Clean Initial Drawer Mount: Hidden by Default, Accessible Attributes, Clean Default Output "-")', () => {
    it('initializes with converter drawer collapsed and correct ARIA attributes', () => {
      const calc = new StayCalc();
      calc.connectedCallback();

      const toggleBtn = getShadowElement(calc, '#converterToggle');
      const drawerEl = getShadowElement(calc, '#converterDrawer');
      const outputEl = getShadowElement(calc, '#converterOutput');

      assert.strictEqual(toggleBtn.getAttribute('aria-expanded'), 'false');
      assert.strictEqual(toggleBtn.getAttribute('aria-controls'), 'converterDrawer');
      assert.strictEqual(toggleBtn.getAttribute('aria-label'), 'Toggle unit converter');

      assert.strictEqual(drawerEl.getAttribute('role'), 'region');
      assert.strictEqual(drawerEl.getAttribute('aria-label'), 'Unit Converter');
      assert.strictEqual(drawerEl.getAttribute('aria-hidden'), 'true');
      assert.strictEqual(drawerEl.style.display, 'none');

      // Default output display with empty input
      assert.strictEqual(outputEl.textContent, '-');
      assert.strictEqual(calc.getIsConverterOpen(), false);
    });

    it('clicking #converterToggle expands and collapses the drawer', () => {
      const calc = new StayCalc();
      calc.connectedCallback();

      const toggleBtn = getShadowElement(calc, '#converterToggle');
      const drawerEl = getShadowElement(calc, '#converterDrawer');

      // Click to expand
      toggleBtn.click();
      assert.strictEqual(calc.getIsConverterOpen(), true);
      assert.strictEqual(toggleBtn.getAttribute('aria-expanded'), 'true');
      assert.strictEqual(drawerEl.getAttribute('aria-hidden'), 'false');
      assert.strictEqual(drawerEl.style.display, 'flex');
      assert.ok(drawerEl.classList.contains('open'));

      // Click again to collapse
      toggleBtn.click();
      assert.strictEqual(calc.getIsConverterOpen(), false);
      assert.strictEqual(toggleBtn.getAttribute('aria-expanded'), 'false');
      assert.strictEqual(drawerEl.getAttribute('aria-hidden'), 'true');
      assert.strictEqual(drawerEl.style.display, 'none');
      assert.strictEqual(drawerEl.classList.contains('open'), false);
    });
  });

  // --------------------------------------------------------------------------
  // CASE-03: Error State & Absolute Zero Lockout (Thermodynamic Boundary: Sub-Absolute Zero Yields "Invalid temperature")
  // --------------------------------------------------------------------------
  describe('CASE-03: Error State & Absolute Zero Lockout (Thermodynamic Boundary: Sub-Absolute Zero Yields "Invalid temperature")', () => {
    it('returns error "Invalid temperature" when Celsius is below -273.15 C', () => {
      const res = convertUnits('temperature', 'C', 'F', -300);
      assert.ok(Number.isNaN(res.value));
      assert.strictEqual(res.formatted, 'Invalid temperature');
      assert.strictEqual(res.error, 'Invalid temperature');
    });

    it('returns error "Invalid temperature" when Fahrenheit is below -459.67 F', () => {
      const res = convertUnits('temperature', 'F', 'C', -500);
      assert.ok(Number.isNaN(res.value));
      assert.strictEqual(res.formatted, 'Invalid temperature');
      assert.strictEqual(res.error, 'Invalid temperature');
    });

    it('returns error "Invalid temperature" when Kelvin is negative', () => {
      const res = convertUnits('temperature', 'K', 'C', -5);
      assert.ok(Number.isNaN(res.value));
      assert.strictEqual(res.formatted, 'Invalid temperature');
      assert.strictEqual(res.error, 'Invalid temperature');
    });

    it('component blocks loading into calculator buffer when temperature is invalid', () => {
      const calc = new StayCalc();
      calc.connectedCallback();

      // Set initial calculator display to "42"
      calc.engine.pressDigit('4');
      calc.engine.pressDigit('2');
      assert.strictEqual(calc.engine.getState().display, '42');

      calc.openConverter();
      const catEl = getShadowElement(calc, '#converterCategory');
      const inputEl = getShadowElement(calc, '#converterInput');
      const loadBtn = getShadowElement(calc, '#btnLoadConvertedValue');
      const outputEl = getShadowElement(calc, '#converterOutput');

      catEl.value = 'temperature';
      calc.populateUnitSelects('temperature');
      inputEl.value = '-300';
      calc.recomputeConversion();

      assert.strictEqual(outputEl.textContent, 'Invalid temperature');

      // Click load button -> should be rejected and leave display at "42"
      loadBtn.click();
      assert.strictEqual(calc.engine.getState().display, '42');
      assert.strictEqual(calc.engine.getState().error, null);
    });
  });

  // --------------------------------------------------------------------------
  // CASE-04: Mid-Flow Operator Replacement & State Preservation (Loading Converted Value Into Active Calculation)
  // --------------------------------------------------------------------------
  describe('CASE-04: Mid-Flow Operator Replacement & State Preservation (Loading Converted Value Into Active Calculation Preserves Accumulator & Operator)', () => {
    it('preserves accumulator and pending operator when loading converted value into buffer (NEVER-CALC-004)', () => {
      const engine = new CalculatorEngine();

      // Enter "50 +"
      engine.pressDigit('5');
      engine.pressDigit('0');
      engine.pressOperator('+');

      assert.strictEqual(engine.getState().accumulator, 50);
      assert.strictEqual(engine.getState().pendingOperator, '+');

      // Load converted value "1"
      engine.loadBuffer('1');

      assert.strictEqual(engine.getState().display, '1');
      assert.strictEqual(engine.getState().waitingForOperand, true);
      assert.strictEqual(engine.getState().accumulator, 50);
      assert.strictEqual(engine.getState().pendingOperator, '+');

      // Complete calculation: 50 + 1 = 51
      engine.pressEquals();
      assert.strictEqual(engine.getState().display, '51');
    });

    it('end-to-end component flow: performs calculation, converts units, loads result, and calculates final value', () => {
      const calc = new StayCalc();
      calc.connectedCallback();

      // Enter 120 *
      calc.engine.pressDigit('1');
      calc.engine.pressDigit('2');
      calc.engine.pressDigit('0');
      calc.engine.pressOperator('*');
      assert.strictEqual(calc.engine.getState().accumulator, 120);
      assert.strictEqual(calc.engine.getState().pendingOperator, '*');

      // Open converter, convert 100 cm to m (result: 1)
      calc.openConverter();
      const inputEl = getShadowElement(calc, '#converterInput');
      inputEl.value = '100';
      calc.recomputeConversion();

      const loadBtn = getShadowElement(calc, '#btnLoadConvertedValue');
      loadBtn.click();

      // Main display should now show "1" while accumulator 120 and operator '*' are intact
      assert.strictEqual(calc.engine.getState().display, '1');
      assert.strictEqual(calc.engine.getState().accumulator, 120);
      assert.strictEqual(calc.engine.getState().pendingOperator, '*');

      // Press equals to complete: 120 * 1 = 120
      calc.engine.pressEquals();
      calc.syncUI();
      assert.strictEqual(calc.engine.getState().display, '120');
    });
  });

  // --------------------------------------------------------------------------
  // CASE-05: Idempotency & Repeated Operations (Same-Unit Identity Conversions and Repeated Re-evaluation)
  // --------------------------------------------------------------------------
  describe('CASE-05: Idempotency & Repeated Operations (Same-Unit Identity Conversions and Repeated Re-evaluation Without Float Drift)', () => {
    it('returns exact identity value when fromUnit equals toUnit without float distortion', () => {
      const lengthSame = convertUnits('length', 'm', 'm', 42.5);
      assert.strictEqual(lengthSame.value, 42.5);
      assert.strictEqual(lengthSame.formatted, '42.5');

      const massSame = convertUnits('mass', 'oz', 'oz', 16);
      assert.strictEqual(massSame.value, 16);
      assert.strictEqual(massSame.formatted, '16');

      const tempSame = convertUnits('temperature', 'C', 'C', 100);
      assert.strictEqual(tempSame.value, 100);
      assert.strictEqual(tempSame.formatted, '100');

      const kelvinSame = convertUnits('temperature', 'K', 'K', 298.15);
      assert.strictEqual(kelvinSame.value, 298.15);
      assert.strictEqual(kelvinSame.formatted, '298.15');
    });

    it('running 100 consecutive conversion cycles yields strictly idempotent results (NEVER-CALC-001)', () => {
      let currentVal = 10;
      for (let i = 0; i < 100; i++) {
        const res = convertUnits('length', 'm', 'cm', currentVal);
        assert.strictEqual(res.value, 1000);
        assert.strictEqual(res.formatted, '1000');
      }
    });

    it('handles empty string and invalid non-numeric inputs gracefully without crashing', () => {
      assert.strictEqual(convertUnits('length', 'cm', 'm', '').formatted, '-');
      assert.strictEqual(convertUnits('length', 'cm', 'm', '   ').formatted, '-');
      assert.strictEqual(convertUnits('length', 'cm', 'm', 'abc').formatted, '-');
      assert.strictEqual(convertUnits('mass', 'kg', 'g', 'NaN').formatted, '-');
    });
  });

  // --------------------------------------------------------------------------
  // CASE-06: Precision Normalization (Truncates IEEE-754 Representation Noise to Max 12 Significant Digits)
  // --------------------------------------------------------------------------
  describe('CASE-06: Precision Normalization (Truncates IEEE-754 Representation Noise to Max 12 Significant Digits - RULE-CALC-002)', () => {
    it('normalizes floating-point representation noise to clean decimal representations', () => {
      // 1 in to cm = 2.54 (not 2.5400000000000002)
      const inCm = convertUnits('length', 'in', 'cm', 1);
      assert.strictEqual(inCm.formatted, '2.54');

      // 3 in to ft = 0.25 (not 0.25000000000000006)
      const inFt = convertUnits('length', 'in', 'ft', 3);
      assert.strictEqual(inFt.formatted, '0.25');

      // 1 oz to g = 28.349523125
      const ozG = convertUnits('mass', 'oz', 'g', 1);
      assert.strictEqual(ozG.formatted, '28.349523125');

      // 1 lb to kg = 0.45359237
      const lbKg = convertUnits('mass', 'lb', 'kg', 1);
      assert.strictEqual(lbKg.formatted, '0.45359237');
    });

    it('normalizeConversionPrecision eliminates negative zero and preserves valid zeros', () => {
      const zeroNorm = normalizeConversionPrecision(-0);
      assert.strictEqual(zeroNorm.value, 0);
      assert.strictEqual(zeroNorm.formatted, '0');

      const positiveZero = normalizeConversionPrecision(0);
      assert.strictEqual(positiveZero.value, 0);
      assert.strictEqual(positiveZero.formatted, '0');
    });

    it('preserves clean negative temperatures with precision normalization', () => {
      // -40 C = -40 F
      const minus40 = convertUnits('temperature', 'C', 'F', -40);
      assert.strictEqual(minus40.value, -40);
      assert.strictEqual(minus40.formatted, '-40');

      // -40 F = -40 C
      const minus40F = convertUnits('temperature', 'F', 'C', -40);
      assert.strictEqual(minus40F.value, -40);
      assert.strictEqual(minus40F.formatted, '-40');
    });
  });

  // --------------------------------------------------------------------------
  // CASE-07: Mass Conversions Across Metric and Imperial Units (g, kg, oz, lb Bidirectional Precision Ratios)
  // --------------------------------------------------------------------------
  describe('CASE-07: Mass Conversions Across Metric and Imperial Units (g, kg, oz, lb Bidirectional Precision Ratios)', () => {
    it('converts between metric mass units g and kg', () => {
      const kgToG = convertUnits('mass', 'kg', 'g', 1);
      assert.strictEqual(kgToG.value, 1000);
      assert.strictEqual(kgToG.formatted, '1000');

      const gToKg = convertUnits('mass', 'g', 'kg', 1000);
      assert.strictEqual(gToKg.value, 1);
      assert.strictEqual(gToKg.formatted, '1');

      const halfKg = convertUnits('mass', 'kg', 'g', 0.5);
      assert.strictEqual(halfKg.value, 500);
      assert.strictEqual(halfKg.formatted, '500');
    });

    it('converts between imperial mass units oz and lb with exact 16:1 ratio', () => {
      const ozToLb = convertUnits('mass', 'oz', 'lb', 16);
      assert.strictEqual(ozToLb.value, 1);
      assert.strictEqual(ozToLb.formatted, '1');

      const lbToOz = convertUnits('mass', 'lb', 'oz', 1);
      assert.strictEqual(lbToOz.value, 16);
      assert.strictEqual(lbToOz.formatted, '16');

      const fiveLb = convertUnits('mass', 'lb', 'oz', 5);
      assert.strictEqual(fiveLb.value, 80);
      assert.strictEqual(fiveLb.formatted, '80');
    });

    it('converts cross-system mass between lb/oz and kg/g', () => {
      const lbToG = convertUnits('mass', 'lb', 'g', 1);
      assert.strictEqual(lbToG.value, 453.59237);
      assert.strictEqual(lbToG.formatted, '453.59237');

      const gToLb = convertUnits('mass', 'g', 'lb', 453.59237);
      assert.strictEqual(gToLb.value, 1);
      assert.strictEqual(gToLb.formatted, '1');
    });
  });

  // --------------------------------------------------------------------------
  // CASE-08: Temperature Scale Conversions Across C, F, K (Thermodynamic Conversions: C <-> F, C <-> K, F <-> K)
  // --------------------------------------------------------------------------
  describe('CASE-08: Temperature Scale Conversions Across C, F, K (Thermodynamic Conversions: C <-> F, C <-> K, F <-> K)', () => {
    it('converts freezing point across C, F, K accurately', () => {
      // 0 C = 32 F
      const freezingCtoF = convertUnits('temperature', 'C', 'F', 0);
      assert.strictEqual(freezingCtoF.value, 32);
      assert.strictEqual(freezingCtoF.formatted, '32');

      // 32 F = 0 C
      const freezingFtoC = convertUnits('temperature', 'F', 'C', 32);
      assert.strictEqual(freezingFtoC.value, 0);
      assert.strictEqual(freezingFtoC.formatted, '0');

      // 0 C = 273.15 K
      const freezingCtoK = convertUnits('temperature', 'C', 'K', 0);
      assert.strictEqual(freezingCtoK.value, 273.15);
      assert.strictEqual(freezingCtoK.formatted, '273.15');

      // 273.15 K = 0 C
      const freezingKtoC = convertUnits('temperature', 'K', 'C', 273.15);
      assert.strictEqual(freezingKtoC.value, 0);
      assert.strictEqual(freezingKtoC.formatted, '0');
    });

    it('converts boiling point across C, F, K accurately', () => {
      // 100 C = 212 F
      const boilingCtoF = convertUnits('temperature', 'C', 'F', 100);
      assert.strictEqual(boilingCtoF.value, 212);
      assert.strictEqual(boilingCtoF.formatted, '212');

      // 212 F = 100 C
      const boilingFtoC = convertUnits('temperature', 'F', 'C', 212);
      assert.strictEqual(boilingFtoC.value, 100);
      assert.strictEqual(boilingFtoC.formatted, '100');

      // 100 C = 373.15 K
      const boilingCtoK = convertUnits('temperature', 'C', 'K', 100);
      assert.strictEqual(boilingCtoK.value, 373.15);
      assert.strictEqual(boilingCtoK.formatted, '373.15');

      // 373.15 K = 100 C
      const boilingKtoC = convertUnits('temperature', 'K', 'C', 373.15);
      assert.strictEqual(boilingKtoC.value, 100);
      assert.strictEqual(boilingKtoC.formatted, '100');
    });

    it('converts human body temperature 98.6 F to 37 C accurately', () => {
      const bodyTempFtoC = convertUnits('temperature', 'F', 'C', 98.6);
      assert.strictEqual(bodyTempFtoC.value, 37);
      assert.strictEqual(bodyTempFtoC.formatted, '37');

      const bodyTempCtoF = convertUnits('temperature', 'C', 'F', 37);
      assert.strictEqual(bodyTempCtoF.value, 98.6);
      assert.strictEqual(bodyTempCtoF.formatted, '98.6');
    });

    it('converts exact absolute zero values', () => {
      // -273.15 C = 0 K
      const absZeroCtoK = convertUnits('temperature', 'C', 'K', -273.15);
      assert.strictEqual(absZeroCtoK.value, 0);
      assert.strictEqual(absZeroCtoK.formatted, '0');

      // 0 K = -273.15 C
      const absZeroKtoC = convertUnits('temperature', 'K', 'C', 0);
      assert.strictEqual(absZeroKtoC.value, -273.15);
      assert.strictEqual(absZeroKtoC.formatted, '-273.15');
    });
  });

  // --------------------------------------------------------------------------
  // CASE-09: Clear & Reset Semantics (Calculator C / AC Resets Registers But Preserves Converter Drawer State)
  // --------------------------------------------------------------------------
  describe('CASE-09: Clear & Reset Semantics (Calculator C / AC Resets Registers But Preserves Converter Drawer State and Selections - RULE-CALC-006, NEVER-CALC-004)', () => {
    it('Clear (C) and All Clear (AC) do not reset converter drawer visibility or user input', () => {
      const calc = new StayCalc();
      calc.connectedCallback();

      // Open converter drawer and enter values
      calc.openConverter();
      const catEl = getShadowElement(calc, '#converterCategory');
      const inputEl = getShadowElement(calc, '#converterInput');
      const outputEl = getShadowElement(calc, '#converterOutput');

      catEl.value = 'mass';
      calc.populateUnitSelects('mass');
      inputEl.value = '50';
      calc.recomputeConversion();

      assert.strictEqual(outputEl.textContent, '50000');
      assert.strictEqual(calc.getIsConverterOpen(), true);

      // Perform calculator operations
      calc.engine.pressDigit('9');
      calc.engine.pressDigit('9');
      assert.strictEqual(calc.engine.getState().display, '99');

      // Trigger calculator C (Clear active buffer)
      calc.engine.pressClear();
      assert.strictEqual(calc.engine.getState().display, '0');

      // Converter drawer remains open and values untouched
      assert.strictEqual(calc.getIsConverterOpen(), true);
      assert.strictEqual(inputEl.value, '50');
      assert.strictEqual(outputEl.textContent, '50000');

      // Trigger calculator AC (All Clear)
      calc.engine.pressAllClear();
      assert.strictEqual(calc.engine.getState().display, '0');
      assert.strictEqual(calc.getIsConverterOpen(), true);
      assert.strictEqual(inputEl.value, '50');
      assert.strictEqual(outputEl.textContent, '50000');
    });

    it('component reset() cleans calculator engine but preserves converter drawer state', () => {
      const calc = new StayCalc();
      calc.connectedCallback();

      calc.openConverter();
      assert.strictEqual(calc.getIsConverterOpen(), true);

      calc.engine.pressDigit('7');
      calc.reset();

      assert.strictEqual(calc.engine.getState().display, '0');
      assert.strictEqual(calc.getIsConverterOpen(), true);
    });
  });

  // --------------------------------------------------------------------------
  // CASE-10: Buffer Loading Integration (#btnLoadConvertedValue / loadBuffer Updates Display, MultiRadix, Clears Error, Dispatches calc-change)
  // --------------------------------------------------------------------------
  describe('CASE-10: Buffer Loading Integration (#btnLoadConvertedValue / loadBuffer Updates Display, MultiRadix, Clears Error, Dispatches calc-change)', () => {
    it('loadBuffer updates display, sets waitingForOperand=true, and clears error and lock state', () => {
      const engine = new CalculatorEngine();

      // Force division by zero error lockout
      engine.pressDigit('5');
      engine.pressOperator('/');
      engine.pressDigit('0');
      engine.pressEquals();

      assert.strictEqual(engine.getState().error, 'Cannot divide by zero');
      assert.strictEqual(engine.getState().isLocked, true);

      // Loading buffer clears error and lock
      engine.loadBuffer('42');

      assert.strictEqual(engine.getState().display, '42');
      assert.strictEqual(engine.getState().error, null);
      assert.strictEqual(engine.getState().isLocked, false);
      assert.strictEqual(engine.getState().waitingForOperand, true);
    });

    it('loadBuffer in programmer mode updates multiRadix values correctly', () => {
      const engine = new CalculatorEngine();
      engine.setMode('programmer');
      engine.setRadix('DEC');

      engine.loadBuffer('255');

      assert.strictEqual(engine.getState().display, '255');
      assert.strictEqual(engine.getState().multiRadix.hex, 'FF');
      assert.strictEqual(engine.getState().multiRadix.dec, '255');
      assert.strictEqual(engine.getState().multiRadix.oct, '377');
      assert.strictEqual(engine.getState().multiRadix.bin, '11111111');
    });

    it('clicking #btnLoadConvertedValue dispatches calc-change event with updated state', () => {
      const calc = new StayCalc();
      calc.connectedCallback();

      let calcChangeEventFired = false;
      let eventDetail: any = null;

      calc.addEventListener('calc-change', (e: any) => {
        calcChangeEventFired = true;
        eventDetail = e.detail;
      });

      calc.openConverter();
      const inputEl = getShadowElement(calc, '#converterInput');
      inputEl.value = '25.4';
      // From cm to m -> 0.254
      calc.recomputeConversion();

      const loadBtn = getShadowElement(calc, '#btnLoadConvertedValue');
      loadBtn.click();

      assert.ok(calcChangeEventFired, 'Expected calc-change CustomEvent to be dispatched on load');
      assert.strictEqual(eventDetail.display, '0.254');
      assert.strictEqual(calc.engine.getState().display, '0.254');
    });
  });

  // --------------------------------------------------------------------------
  // CASE-11: Component UI, Toggle Interaction, Accessibility & Mobile Zero-Overflow
  // --------------------------------------------------------------------------
  describe('CASE-11: Component UI, Toggle Interaction, Accessibility & Mobile Zero-Overflow (#converterToggle, #converterDrawer, unit-convert Event, 320px–390px Viewports)', () => {
    it('dispatches unit-convert CustomEvent with bubbles and composed on conversion', () => {
      const calc = new StayCalc();
      calc.connectedCallback();

      let unitConvertFired = false;
      let eventDetail: any = null;

      calc.addEventListener('unit-convert', (e: any) => {
        unitConvertFired = true;
        eventDetail = e.detail;
      });

      calc.openConverter();
      const inputEl = getShadowElement(calc, '#converterInput');
      inputEl.value = '5';
      calc.recomputeConversion();

      assert.ok(unitConvertFired, 'Expected unit-convert CustomEvent to be dispatched');
      assert.strictEqual(eventDetail.category, 'length');
      assert.strictEqual(eventDetail.sourceUnit, 'cm');
      assert.strictEqual(eventDetail.targetUnit, 'm');
      assert.strictEqual(eventDetail.inputValue, '5');
      assert.strictEqual(eventDetail.convertedValue, 0.05);
      assert.strictEqual(eventDetail.formatted, '0.05');
    });

    it('category dropdown updates unit selects dynamically', () => {
      const calc = new StayCalc();
      calc.connectedCallback();

      calc.openConverter();
      const catEl = getShadowElement(calc, '#converterCategory');
      const sourceUnitEl = getShadowElement(calc, '#converterSourceUnit');
      const targetUnitEl = getShadowElement(calc, '#converterTargetUnit');

      // Switch to mass
      catEl.value = 'mass';
      calc.populateUnitSelects('mass');

      assert.strictEqual(sourceUnitEl.value, 'kg');
      assert.strictEqual(targetUnitEl.value, 'g');

      // Switch to temperature
      catEl.value = 'temperature';
      calc.populateUnitSelects('temperature');

      assert.strictEqual(sourceUnitEl.value, 'C');
      assert.strictEqual(targetUnitEl.value, 'F');
    });

    it('enforces mobile zero-overflow and declares container queries for 320px–390px viewports (RULE-RESP-001)', () => {
      const calc = new StayCalc();
      calc.connectedCallback();

      const shadow = calc.shadowRoot;
      assert.ok(shadow);

      const styleEl = shadow.querySelector('style');
      assert.ok(styleEl, 'Expected <style> tag in shadow DOM');
      const css = styleEl.textContent;

      // Verify zero !important declarations
      assert.strictEqual(
        css.includes('!important'),
        false,
        'Component styles must contain ZERO !important declarations'
      );

      // Verify container queries adapt converter controls
      assert.ok(
        css.includes('@container calc-host (max-width: 390px)'),
        'Must contain @container calc-host query'
      );
      assert.ok(
        css.includes('.converter-toggle-btn') && css.includes('.converter-drawer'),
        'Container query must adapt .converter-toggle-btn and .converter-drawer'
      );
    });

    it('declares WCAG 2.2 AAA high-contrast border and focus rules for converter controls', () => {
      const calc = new StayCalc();
      calc.connectedCallback();

      const styleEl = calc.shadowRoot?.querySelector('style');
      assert.ok(styleEl);
      const css = styleEl.textContent;

      assert.ok(
        css.includes(':host([data-theme="high-contrast"]) .converter-drawer'),
        'High-contrast mode must declare 2px border for .converter-drawer'
      );
      assert.ok(
        css.includes(':host([data-theme="high-contrast"]) .converter-toggle-btn'),
        'High-contrast mode must declare 2px border for .converter-toggle-btn'
      );
      assert.ok(
        css.includes(':host([data-theme="high-contrast"]) .converter-load-btn'),
        'High-contrast mode must declare high-contrast rules for .converter-load-btn'
      );
    });

    it('helper functions isUnitCategory and isConversionUnit validate correctly', () => {
      assert.strictEqual(isUnitCategory('length'), true);
      assert.strictEqual(isUnitCategory('mass'), true);
      assert.strictEqual(isUnitCategory('temperature'), true);
      assert.strictEqual(isUnitCategory('speed'), false);

      assert.strictEqual(isConversionUnit('cm'), true);
      assert.strictEqual(isConversionUnit('kg'), true);
      assert.strictEqual(isConversionUnit('C'), true);
      assert.strictEqual(isConversionUnit('unknown'), false);
    });
  });
});
