/**
 * test/export.test.ts
 *
 * Comprehensive unit test suite for StayCalc Feature 7 (F7: History Tape Export & Clipboard Copy).
 * Maps 1:1 to the 11 Universal Test Cases (CASE-01 to CASE-11) defined in
 * docs/context/features/f7-history-export-clipboard/cases.md.
 * Verifies Plain Text and CSV formatters, summary totals with precision normalization,
 * drawer action controls (#btnCopyResult, #btnCopyHistory, #btnExportTxt, #btnExportCsv),
 * accessible auto-dismissing toast notifications (#toastNotification), debounce timer reset,
 * safe clipboard copy with graceful rejection fallback, and CustomEvent dispatching (SEAM-UI-01).
 *
 * Runs natively in Node.js 24 (node:test) with zero external runtime dependencies.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  CalculatorEngine,
  exportHistoryToText,
  exportHistoryToCsv,
} from '../src/engine/calculator-engine.ts';
import type {
  CalculationHistoryEntry,
  HistoryExportResult,
} from '../src/engine/types.ts';

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
    this.attributes.set(name, value);
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

  public appendChild(child: MockElement): void {
    child.parentNode = this;
    this.children.push(child);
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

// Global Clipboard Mock state
let mockClipboardContent: string = '';
let mockClipboardShouldReject: boolean = false;

const mockNavigator = {
  clipboard: {
    writeText: async (text: string) => {
      if (mockClipboardShouldReject) {
        throw new Error('Clipboard write permission denied');
      }
      mockClipboardContent = text;
    },
    readText: async () => mockClipboardContent,
  },
};

// Install mock DOM and Navigator onto globalThis before importing component
(globalThis as any).HTMLElement = MockElement;
(globalThis as any).Event = MockEvent;
(globalThis as any).CustomEvent = MockCustomEvent;
(globalThis as any).KeyboardEvent = MockKeyboardEvent;
(globalThis as any).customElements = new MockCustomElementRegistry();
(globalThis as any).window = new MockWindow();
Object.defineProperty(globalThis, 'navigator', {
  value: mockNavigator,
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

describe('StayCalc History Tape Export & Clipboard Copy (F7)', () => {
  beforeEach(() => {
    mockClipboardContent = '';
    mockClipboardShouldReject = false;
  });

  // CASE-01: Happy Path Nominal Execution (Plain Text Format History Export)
  describe('CASE-01: Happy Path Nominal Execution (Plain Text Format History Export)', () => {
    it('formats history entries with header, 1-indexed rows, timestamp ISO, and summary footer', () => {
      const calc = new CalculatorEngine();
      calc.pressDigit('1');
      calc.pressDigit('2');
      calc.pressOperator('+');
      calc.pressDigit('8');
      calc.pressEquals();

      calc.pressDigit('5');
      calc.pressOperator('*');
      calc.pressDigit('4');
      calc.pressEquals();

      const text = calc.exportHistoryAsText();
      const lines = text.split('\n');

      assert.strictEqual(lines[0], '--- StayCalc Calculation History ---');
      assert.ok(lines[1].startsWith('[1] 5 * 4 = 20 ('));
      assert.ok(lines[1].endsWith('Z)'));
      assert.ok(lines[2].startsWith('[2] 12 + 8 = 20 ('));
      assert.ok(lines[2].endsWith('Z)'));
      assert.strictEqual(lines[3], 'Total calculations: 2 | Summary total: 40');
    });

    it('exports text via component #btnExportTxt, dispatches export-history event and shows toast', () => {
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

      let exportDetail: any = null;
      calc.addEventListener('export-history', (e: any) => {
        exportDetail = e.detail;
      });

      const exportTxtBtn = getShadowElement(calc, '#btnExportTxt');
      exportTxtBtn.click();

      assert.ok(exportDetail, 'Expected export-history CustomEvent to be dispatched');
      assert.strictEqual(exportDetail.format, 'text');
      assert.strictEqual(exportDetail.count, 2);
      assert.strictEqual(exportDetail.total, 40);
      assert.ok(exportDetail.content.includes('--- StayCalc Calculation History ---'));

      const toast = getShadowElement(calc, '#toastNotification');
      assert.strictEqual(toast.textContent, 'History exported as TXT');
      assert.strictEqual(toast.classList.contains('show'), true);
    });
  });

  // CASE-02: Happy Path Nominal Execution (CSV Format History Export)
  describe('CASE-02: Happy Path Nominal Execution (CSV Format History Export)', () => {
    it('formats history entries into RFC-compliant CSV with header and quoted fields', () => {
      const calc = new CalculatorEngine();
      calc.pressDigit('1');
      calc.pressDigit('0');
      calc.pressOperator('+');
      calc.pressDigit('5');
      calc.pressEquals();

      calc.pressDigit('6');
      calc.pressOperator('*');
      calc.pressDigit('7');
      calc.pressEquals();

      const csv = calc.exportHistoryAsCsv();
      const lines = csv.split('\n');

      assert.strictEqual(lines[0], '"Index","Expression","Result","Timestamp","ISO"');
      assert.ok(lines[1].startsWith('1,"6 * 7","42",'));
      assert.ok(lines[2].startsWith('2,"10 + 5","15",'));
    });

    it('exports CSV via component #btnExportCsv, dispatches export-history event and shows toast', () => {
      const calc = new StayCalc();
      calc.connectedCallback();

      typeKey('1');
      typeKey('0');
      typeKey('+');
      typeKey('5');
      typeKey('Enter');

      typeKey('6');
      typeKey('*');
      typeKey('7');
      typeKey('Enter');

      let exportDetail: any = null;
      calc.addEventListener('export-history', (e: any) => {
        exportDetail = e.detail;
      });

      const exportCsvBtn = getShadowElement(calc, '#btnExportCsv');
      exportCsvBtn.click();

      assert.ok(exportDetail, 'Expected export-history CustomEvent to be dispatched');
      assert.strictEqual(exportDetail.format, 'csv');
      assert.strictEqual(exportDetail.count, 2);
      assert.strictEqual(exportDetail.total, 57);
      assert.ok(exportDetail.content.includes('"Index","Expression","Result"'));

      const toast = getShadowElement(calc, '#toastNotification');
      assert.strictEqual(toast.textContent, 'History exported as CSV');
      assert.strictEqual(toast.classList.contains('show'), true);
    });
  });

  // CASE-03: Empty State & First Use (Copy & Export on Empty History Tape)
  describe('CASE-03: Empty State & First Use (Copy & Export on Empty History Tape)', () => {
    it('produces clean headers and zero totals on empty history tape', () => {
      const text = exportHistoryToText([]);
      assert.strictEqual(
        text,
        '--- StayCalc Calculation History ---\nTotal calculations: 0 | Summary total: 0'
      );

      const csv = exportHistoryToCsv([]);
      assert.strictEqual(csv, '"Index","Expression","Result","Timestamp","ISO"');
    });

    it('shows polite feedback toasts without writing clipboard or dispatching export events when empty', async () => {
      const calc = new StayCalc();
      calc.connectedCallback();

      let exportFired = false;
      calc.addEventListener('export-history', () => {
        exportFired = true;
      });

      const toast = getShadowElement(calc, '#toastNotification');

      // Click Copy History on empty tape
      const copyHistBtn = getShadowElement(calc, '#btnCopyHistory');
      copyHistBtn.click();
      assert.strictEqual(toast.textContent, 'No history to copy');
      assert.strictEqual(mockClipboardContent, '');

      // Click Export TXT on empty tape
      const exportTxtBtn = getShadowElement(calc, '#btnExportTxt');
      exportTxtBtn.click();
      assert.strictEqual(toast.textContent, 'No history to export');
      assert.strictEqual(exportFired, false);

      // Click Export CSV on empty tape
      const exportCsvBtn = getShadowElement(calc, '#btnExportCsv');
      exportCsvBtn.click();
      assert.strictEqual(toast.textContent, 'No history to export');
      assert.strictEqual(exportFired, false);
    });
  });

  // CASE-04: Active Result Clipboard Copy (#btnCopyResult)
  describe('CASE-04: Active Result Clipboard Copy (#btnCopyResult)', () => {
    it('copies current display value to clipboard and dispatches copy-clipboard event', async () => {
      const calc = new StayCalc();
      calc.connectedCallback();

      // Evaluate 15 * 6 = 90
      typeKey('1');
      typeKey('5');
      typeKey('*');
      typeKey('6');
      typeKey('Enter');

      assert.strictEqual(calc.getState().display, '90');

      let copyDetail: any = null;
      calc.addEventListener('copy-clipboard', (e: any) => {
        copyDetail = e.detail;
      });

      const copyResultBtn = getShadowElement(calc, '#btnCopyResult');
      copyResultBtn.click();

      // Wait for async clipboard resolution
      await new Promise((r) => setTimeout(r, 10));

      assert.strictEqual(mockClipboardContent, '90');
      assert.ok(copyDetail);
      assert.strictEqual(copyDetail.text, '90');
      assert.strictEqual(copyDetail.type, 'result');
      assert.strictEqual(copyDetail.success, true);

      const toast = getShadowElement(calc, '#toastNotification');
      assert.strictEqual(toast.textContent, 'Result copied to clipboard');
    });
  });

  // CASE-05: Full History Tape Clipboard Copy (#btnCopyHistory)
  describe('CASE-05: Full History Tape Clipboard Copy (#btnCopyHistory)', () => {
    it('copies full formatted text history to clipboard and dispatches copy-clipboard event', async () => {
      const calc = new StayCalc();
      calc.connectedCallback();

      typeKey('3');
      typeKey('+');
      typeKey('2');
      typeKey('Enter');

      typeKey('8');
      typeKey('*');
      typeKey('2');
      typeKey('Enter');

      let copyDetail: any = null;
      calc.addEventListener('copy-clipboard', (e: any) => {
        copyDetail = e.detail;
      });

      const copyHistBtn = getShadowElement(calc, '#btnCopyHistory');
      copyHistBtn.click();

      await new Promise((r) => setTimeout(r, 10));

      assert.ok(mockClipboardContent.includes('--- StayCalc Calculation History ---'));
      assert.ok(mockClipboardContent.includes('[1] 8 * 2 = 16'));
      assert.ok(mockClipboardContent.includes('[2] 3 + 2 = 5'));
      assert.ok(mockClipboardContent.includes('Total calculations: 2 | Summary total: 21'));

      assert.ok(copyDetail);
      assert.strictEqual(copyDetail.type, 'history');
      assert.strictEqual(copyDetail.success, true);

      const toast = getShadowElement(calc, '#toastNotification');
      assert.strictEqual(toast.textContent, 'History copied to clipboard');
    });
  });

  // CASE-06: Precision Normalization & Summary Total in Exports (IEEE-754 Artifact Elimination)
  describe('CASE-06: Precision Normalization & Summary Total in Exports (IEEE-754 Artifact Elimination)', () => {
    it('eliminates IEEE 754 float representation noise in export rows and summary total', () => {
      const calc = new CalculatorEngine();

      calc.pressDigit('0');
      calc.pressDecimal();
      calc.pressDigit('1');
      calc.pressOperator('+');
      calc.pressDigit('0');
      calc.pressDecimal();
      calc.pressDigit('2');
      calc.pressEquals();

      calc.pressDigit('0');
      calc.pressDecimal();
      calc.pressDigit('7');
      calc.pressOperator('+');
      calc.pressDigit('0');
      calc.pressDecimal();
      calc.pressDigit('1');
      calc.pressEquals();

      const textRes = calc.exportHistory('text');
      assert.strictEqual(textRes.count, 2);
      assert.strictEqual(textRes.total, 1.1);
      assert.ok(textRes.content.includes('0.7 + 0.1 = 0.8'));
      assert.ok(textRes.content.includes('0.1 + 0.2 = 0.3'));
      assert.ok(textRes.content.includes('Summary total: 1.1'));

      const csvRes = calc.exportHistory('csv');
      assert.strictEqual(csvRes.count, 2);
      assert.strictEqual(csvRes.total, 1.1);
      assert.ok(csvRes.content.includes('"0.7 + 0.1","0.8"'));
      assert.ok(csvRes.content.includes('"0.1 + 0.2","0.3"'));
    });
  });

  // CASE-07: Error State Exclusion from History Exports (RULE-CALC-007)
  describe('CASE-07: Error State Exclusion from History Exports (RULE-CALC-007)', () => {
    it('excludes division by zero from history tape and export summary totals', () => {
      const calc = new CalculatorEngine();

      // Valid calculation
      calc.pressDigit('1');
      calc.pressDigit('0');
      calc.pressOperator('+');
      calc.pressDigit('2');
      calc.pressEquals();

      // Division by zero error
      calc.pressDigit('1');
      calc.pressDigit('0');
      calc.pressOperator('/');
      calc.pressDigit('0');
      calc.pressEquals();

      assert.strictEqual(calc.getState().isLocked, true);
      assert.strictEqual(calc.getState().display, 'Cannot divide by zero');

      const res = calc.exportHistory('text');
      assert.strictEqual(res.count, 1);
      assert.strictEqual(res.total, 12);
      assert.ok(!res.content.includes('Cannot divide by zero'));
      assert.ok(res.content.includes('[1] 10 + 2 = 12'));
    });
  });

  // CASE-08: Export Persistence Across C and AC Clears (RULE-CALC-008)
  describe('CASE-08: Export Persistence Across C and AC Clears (RULE-CALC-008)', () => {
    it('preserves history export content across buffer clear C and all-clear AC', () => {
      const calc = new CalculatorEngine();

      calc.pressDigit('4');
      calc.pressOperator('+');
      calc.pressDigit('4');
      calc.pressEquals();

      calc.pressDigit('5');
      calc.pressOperator('+');
      calc.pressDigit('5');
      calc.pressEquals();

      // Perform Clear (C)
      calc.pressClear();
      assert.strictEqual(calc.getState().display, '0');

      // Perform All Clear (AC)
      calc.pressAllClear();
      assert.strictEqual(calc.getState().display, '0');

      const res = calc.exportHistory('text');
      assert.strictEqual(res.count, 2);
      assert.strictEqual(res.total, 18);
      assert.ok(res.content.includes('5 + 5 = 10'));
      assert.ok(res.content.includes('4 + 4 = 8'));
    });
  });

  // CASE-09: History Export After Explicit Clear (#clearHistory & CLEAR_HISTORY)
  describe('CASE-09: History Export After Explicit Clear (#clearHistory & CLEAR_HISTORY)', () => {
    it('flushes export data when history is explicitly cleared via #clearHistory', () => {
      const calc = new StayCalc();
      calc.connectedCallback();

      typeKey('7');
      typeKey('+');
      typeKey('3');
      typeKey('Enter');

      const clearBtn = getShadowElement(calc, '#clearHistory');
      clearBtn.click();

      assert.strictEqual(calc.getState().history.length, 0);

      const exportRes = calc.exportHistoryAsText();
      assert.strictEqual(exportRes, null);

      const toast = getShadowElement(calc, '#toastNotification');
      assert.strictEqual(toast.textContent, 'No history to export');
    });
  });

  // CASE-10: 100-Entry FIFO Cap Export Integrity (RULE-CALC-005)
  describe('CASE-10: 100-Entry FIFO Cap Export Integrity (RULE-CALC-005)', () => {
    it('exports exactly 100 entries and accurate summary total under continuous calculation load', () => {
      const calc = new CalculatorEngine();

      // Perform 105 calculations: 1 + 1 = 2, 1 + 2 = 3, ..., 1 + 105 = 106
      for (let i = 1; i <= 105; i++) {
        calc.pressDigit('1');
        calc.pressOperator('+');
        for (const digit of i.toString()) {
          calc.pressDigit(digit);
        }
        calc.pressEquals();
      }

      const res = calc.exportHistory('text');
      assert.strictEqual(res.count, 100);

      const lines = res.content.split('\n');
      // Header (1) + 100 rows + Footer (1) = 102 lines
      assert.strictEqual(lines.length, 102);

      // Newest entry is at index 1: 1 + 105 = 106
      assert.ok(lines[1].startsWith('[1] 1 + 105 = 106'));
      // Oldest retained entry is at index 100: 1 + 6 = 7 (first 5 pruned)
      assert.ok(lines[100].startsWith('[100] 1 + 6 = 7'));

      // Total of 100 retained results: sum of (1 + i) for i=6 to 105 = sum of 7 to 106
      // (100 * (7 + 106)) / 2 = 5650
      assert.strictEqual(res.total, 5650);
      assert.ok(lines[101].includes('Summary total: 5650'));
    });
  });

  // CASE-11: Toast Notification Lifecycle, Debounce Timer Reset & A11y ARIA Live Region
  describe('CASE-11: Toast Notification Lifecycle, Debounce Timer Reset & A11y ARIA Live Region', () => {
    it('configures #toastNotification with accessible ARIA live status attributes', () => {
      const calc = new StayCalc();
      calc.connectedCallback();

      const toast = getShadowElement(calc, '#toastNotification');
      assert.strictEqual(toast.getAttribute('role'), 'status');
      assert.strictEqual(toast.getAttribute('aria-live'), 'polite');
      assert.strictEqual(toast.getAttribute('aria-atomic'), 'true');
    });

    it('resets debounce timer on rapid successive toast notifications without premature clearance', async () => {
      const calc = new StayCalc();
      calc.connectedCallback();

      const toast = getShadowElement(calc, '#toastNotification');

      calc.showToast('First Message', 50);
      assert.strictEqual(toast.textContent, 'First Message');
      assert.strictEqual(toast.classList.contains('show'), true);

      // Debounce trigger before 50ms expires
      calc.showToast('Second Message', 80);
      assert.strictEqual(toast.textContent, 'Second Message');
      assert.strictEqual(toast.classList.contains('show'), true);

      // Wait 100ms for final auto-dismissal
      await new Promise((resolve) => setTimeout(resolve, 100));

      assert.strictEqual(toast.textContent, '');
      assert.strictEqual(toast.classList.contains('show'), false);
    });

    it('handles clipboard write rejection gracefully without throwing unhandled exceptions', async () => {
      mockClipboardShouldReject = true;

      const calc = new StayCalc();
      calc.connectedCallback();

      typeKey('4');
      typeKey('2');
      typeKey('Enter');

      let copyDetail: any = null;
      calc.addEventListener('copy-clipboard', (e: any) => {
        copyDetail = e.detail;
      });

      // Calling copyResult() must resolve cleanly without throwing
      const resultSuccess = await calc.copyResult();
      assert.strictEqual(resultSuccess, false);
      assert.ok(copyDetail);
      assert.strictEqual(copyDetail.success, false);

      // UI remains active and responsive
      assert.strictEqual(calc.getState().display, '42');
    });

    it('handles environment with missing navigator.clipboard gracefully', async () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: {},
        configurable: true,
        writable: true,
      });

      const calc = new StayCalc();
      calc.connectedCallback();

      typeKey('5');
      typeKey('Enter');

      const success = await calc.copyResult();
      assert.strictEqual(success, false);

      Object.defineProperty(globalThis, 'navigator', {
        value: mockNavigator,
        configurable: true,
        writable: true,
      });
    });
  });
});
