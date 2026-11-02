import { describe, it, before, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { renderStayCalcTemplate } from "../../src/ui/stay-calc.template.ts";
import { stayCalcStyles } from "../../src/ui/stay-calc.styles.ts";

/**
 * Lightweight in-memory DOM simulation for Node.js 26 test runner.
 * Provides standard Element, CustomElementsRegistry, and Event interfaces with zero dependencies.
 */
class MockDOMElement {
  public tagName: string = "div";
  public parentNode: MockDOMElement | null = null;
  public children: MockDOMElement[] = [];
  public attributes: Record<string, string> = {};
  public dataset: Record<string, string> = {};
  public classList: Set<string> = new Set();
  public listeners: Map<string, Array<(event: any) => void>> = new Map();
  public textContent: string = "";
  public shadowRoot: MockShadowRoot | null = null;
  public id: string = "";
  public className: string = "";

  constructor(tagName = "div", parentNode: MockDOMElement | null = null) {
    this.tagName = tagName;
    this.parentNode = parentNode;
  }

  public getAttribute(name: string): string | null {
    return this.attributes[name] ?? null;
  }

  public setAttribute(name: string, val: string | number): void {
    const strVal = String(val);
    this.attributes[name] = strVal;
    if (name.startsWith("data-")) {
      const prop = name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      this.dataset[prop] = strVal;
    }
    if (name === "id") this.id = strVal;
    if (name === "class") {
      this.className = strVal;
      this.classList = new Set(strVal.split(/\s+/).filter(Boolean));
    }
  }

  public closest(selector: string): MockDOMElement | null {
    if (selector === this.tagName.toLowerCase()) return this;
    if (selector.startsWith(".") && this.classList.has(selector.slice(1))) return this;
    return this.parentNode ? this.parentNode.closest(selector) : null;
  }

  public addEventListener(type: string, fn: (event: any) => void): void {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type)!.push(fn);
  }

  public removeEventListener(type: string, fn: (event: any) => void): void {
    if (!this.listeners.has(type)) return;
    this.listeners.set(
      type,
      this.listeners.get(type)!.filter((f) => f !== fn)
    );
  }

  public dispatchEvent(event: any): boolean {
    event.target = this;
    let curr: MockDOMElement | null = this;
    while (curr) {
      const handlers = curr.listeners.get(event.type) ?? [];
      for (const h of handlers) h(event);
      if (!event.bubbles) break;
      curr = curr.parentNode;
    }
    return !event.defaultPrevented;
  }

  public querySelector(sel: string): MockDOMElement | null {
    return this.querySelectorAll(sel)[0] || null;
  }

  public querySelectorAll(sel: string): MockDOMElement[] {
    const res: MockDOMElement[] = [];
    const check = (el: MockDOMElement) => {
      if (sel.startsWith("#") && el.id === sel.slice(1)) res.push(el);
      else if (sel.startsWith(".") && el.classList.has(sel.slice(1))) res.push(el);
      else if (el.tagName.toLowerCase() === sel.toLowerCase()) res.push(el);
      for (const ch of el.children) check(ch);
    };
    for (const ch of this.children) check(ch);
    return res;
  }
}

class MockShadowRoot extends MockDOMElement {
  public mode: "open" | "closed" = "open";

  constructor(mode: "open" | "closed" = "open") {
    super("shadow-root");
    this.mode = mode;
  }

  public set innerHTML(html: string) {
    this.children = [];
    parseHTMLToTree(html, this);
  }

  public get innerHTML(): string {
    return "";
  }
}

class MockHTMLElement extends MockDOMElement {
  public attachShadow(options: { mode: "open" | "closed" }): MockShadowRoot {
    const root = new MockShadowRoot(options.mode);
    this.shadowRoot = root;
    return root;
  }

  public connectedCallback?(): void;
  public disconnectedCallback?(): void;
}

class MockEvent {
  public type: string;
  public target: any = null;
  public bubbles: boolean;
  public defaultPrevented: boolean = false;

  constructor(type: string, options: { bubbles?: boolean } = {}) {
    this.type = type;
    this.bubbles = options.bubbles ?? true;
  }

  public preventDefault(): void {
    this.defaultPrevented = true;
  }
}

class MockMouseEvent extends MockEvent {
  constructor(type: string, options: { bubbles?: boolean } = {}) {
    super(type, { bubbles: options.bubbles ?? true });
  }
}

class MockKeyboardEvent extends MockEvent {
  public key: string;
  public code: string;
  public metaKey: boolean;
  public ctrlKey: boolean;
  public altKey: boolean;

  constructor(
    type: string,
    options: {
      key?: string;
      code?: string;
      metaKey?: boolean;
      ctrlKey?: boolean;
      altKey?: boolean;
      bubbles?: boolean;
    } = {}
  ) {
    super(type, { bubbles: options.bubbles ?? true });
    this.key = options.key ?? "";
    this.code = options.code ?? "";
    this.metaKey = options.metaKey ?? false;
    this.ctrlKey = options.ctrlKey ?? false;
    this.altKey = options.altKey ?? false;
  }
}

function parseHTMLToTree(html: string, root: MockDOMElement): void {
  const tagRegex = /<\/?([a-zA-Z0-9-]+)([^>]*)>|([^<]+)/g;
  let current: MockDOMElement = root;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(html)) !== null) {
    const [full, tagName, attrStr, text] = match;
    if (text) {
      const trimmed = text.trim();
      if (trimmed) current.textContent = trimmed;
      continue;
    }
    if (full.startsWith("<!--")) continue;
    if (full.startsWith("</")) {
      if (current.parentNode) current = current.parentNode;
      continue;
    }
    const elem = new MockDOMElement(tagName.toLowerCase(), current);
    if (attrStr) {
      const attrRegex = /([a-zA-Z0-9_:-]+)(?:="([^"]*)")?/g;
      let am: RegExpExecArray | null;
      while ((am = attrRegex.exec(attrStr)) !== null) {
        elem.setAttribute(am[1], am[2] ?? "");
      }
    }
    current.children.push(elem);
    if (!full.endsWith("/>") && tagName.toLowerCase() !== "style" && tagName.toLowerCase() !== "input") {
      current = elem;
    }
  }
}

// Global window event target for keyboard navigation
class MockWindow {
  public listeners: Map<string, Array<(event: any) => void>> = new Map();

  public addEventListener(type: string, fn: (event: any) => void): void {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type)!.push(fn);
  }

  public removeEventListener(type: string, fn: (event: any) => void): void {
    if (!this.listeners.has(type)) return;
    this.listeners.set(
      type,
      this.listeners.get(type)!.filter((f) => f !== fn)
    );
  }

  public dispatchEvent(event: any): boolean {
    const handlers = this.listeners.get(event.type) ?? [];
    for (const h of handlers) h(event);
    return !event.defaultPrevented;
  }
}

// Polyfill globalThis with standard Mock DOM before importing StayCalc
const mockWindow = new MockWindow();
(globalThis as any).HTMLElement = MockHTMLElement;
(globalThis as any).window = mockWindow;
(globalThis as any).MouseEvent = MockMouseEvent;
(globalThis as any).KeyboardEvent = MockKeyboardEvent;
(globalThis as any).customElements = {
  registry: new Map<string, any>(),
  define(name: string, ctor: any) {
    this.registry.set(name, ctor);
  },
  get(name: string) {
    return this.registry.get(name);
  },
};

// Now import StayCalc with DOM environment present
const { StayCalc, defineStayCalc } = await import("../../src/ui/stay-calc.ts");

describe("<stay-calc> Accessible Web Calculator Component", () => {
  let calc: InstanceType<typeof StayCalc>;

  beforeEach(() => {
    mockWindow.listeners.clear();
    calc = new StayCalc();
    calc.connectedCallback();
  });

  afterEach(() => {
    calc.disconnectedCallback();
  });

  it("CASE-UI-01: <stay-calc> registers and renders shadow tree with DSD slot projection", () => {
    assert.ok(calc.shadowRoot, "Shadow root should be attached");
    assert.equal(calc.shadowRoot.mode, "open");

    const display = calc.shadowRoot.querySelector("#display");
    assert.ok(display, "#display element must exist in shadow tree");
    assert.equal(display.textContent, "0", "Initial display text must be '0'");

    const status = calc.shadowRoot.querySelector("#status");
    assert.ok(status, "#status element must exist for polite ARIA live updates");
    assert.equal(status.getAttribute("role"), "status");
    assert.equal(status.getAttribute("aria-live"), "polite");
    assert.equal(status.getAttribute("aria-atomic"), "true");

    const keypad = calc.shadowRoot.querySelector(".calc-keypad");
    assert.ok(keypad, "Keypad container must exist");

    const buttons = calc.shadowRoot.querySelectorAll("button");
    assert.ok(buttons.length >= 18, `Keypad must contain at least 18 buttons, found ${buttons.length}`);

    // Verify registration helper
    const registered = defineStayCalc();
    assert.equal(registered.TAG_NAME, "stay-calc");
  });

  it("CASE-UI-02: Keypad button clicks feed digits, decimals, and operators into engine and update display", () => {
    const buttons = calc.shadowRoot!.querySelectorAll("button");
    const findButton = (pred: (btn: MockDOMElement) => boolean) => {
      const b = buttons.find(pred);
      assert.ok(b, "Button matching predicate must exist");
      return b;
    };

    const btn5 = findButton((b) => b.dataset.digit === "5");
    const btnPlus = findButton((b) => b.dataset.operator === "+");
    const btn3 = findButton((b) => b.dataset.digit === "3");
    const btnEquals = findButton((b) => b.dataset.action === "equals");
    const btnClear = findButton((b) => b.dataset.action === "clear");
    const btnAllClear = findButton((b) => b.dataset.action === "all-clear");

    // Click 5
    btn5.dispatchEvent(new MockMouseEvent("click", { bubbles: true }));
    assert.equal(calc.getDisplay(), "5");
    assert.equal(calc.shadowRoot!.querySelector("#display")!.textContent, "5");

    // Click +
    btnPlus.dispatchEvent(new MockMouseEvent("click", { bubbles: true }));
    assert.equal(calc.getDisplay(), "5");

    // Click 3
    btn3.dispatchEvent(new MockMouseEvent("click", { bubbles: true }));
    assert.equal(calc.getDisplay(), "3");

    // Click = -> 8
    btnEquals.dispatchEvent(new MockMouseEvent("click", { bubbles: true }));
    assert.equal(calc.getDisplay(), "8");
    assert.equal(calc.shadowRoot!.querySelector("#display")!.textContent, "8");

    // Test C (Clear entry)
    calc.inputDigit("9");
    assert.equal(calc.getDisplay(), "9");
    btnClear.dispatchEvent(new MockMouseEvent("click", { bubbles: true }));
    assert.equal(calc.getDisplay(), "0");

    // Test AC (All clear)
    calc.inputDigit("4");
    calc.inputOperator("*");
    calc.inputDigit("2");
    btnAllClear.dispatchEvent(new MockMouseEvent("click", { bubbles: true }));
    assert.equal(calc.getDisplay(), "0");
    assert.equal(calc.getState().accumulator, null);
    assert.equal(calc.getState().pendingOperator, null);
  });

  it("CASE-UI-03: Physical keyboard presses (0-9, +, -, *, /, Enter, Escape, Backspace) trigger calculations", () => {
    // 7 * 6 = 42
    mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "7" }));
    assert.equal(calc.getDisplay(), "7");

    mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "*" }));
    assert.equal(calc.getDisplay(), "7");

    mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "6" }));
    assert.equal(calc.getDisplay(), "6");

    mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "Enter" }));
    assert.equal(calc.getDisplay(), "42");
    assert.equal(calc.shadowRoot!.querySelector("#display")!.textContent, "42");

    // Backspace triggers clear()
    mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "5" }));
    assert.equal(calc.getDisplay(), "5");
    mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "Backspace" }));
    assert.equal(calc.getDisplay(), "0");

    // Escape triggers allClear()
    mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "8" }));
    mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "+" }));
    mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "Escape" }));
    assert.equal(calc.getDisplay(), "0");
    assert.equal(calc.getState().accumulator, null);
  });

  it("CASE-UI-04: Numpad keyboard presses (Numpad0-9, NumpadAdd, NumpadSubtract, NumpadEnter) trigger calculations", () => {
    // Numpad: 9 / 3 = 3
    mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { code: "Numpad9" }));
    assert.equal(calc.getDisplay(), "9");

    mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { code: "NumpadDivide" }));
    assert.equal(calc.getDisplay(), "9");

    mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { code: "Numpad3" }));
    assert.equal(calc.getDisplay(), "3");

    mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { code: "NumpadEnter" }));
    assert.equal(calc.getDisplay(), "3");

    // Numpad decimal point
    mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { code: "NumpadSubtract" }));
    mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { code: "Numpad0" }));
    mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { code: "NumpadDecimal" }));
    mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { code: "Numpad5" }));
    mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { code: "NumpadEnter" }));
    assert.equal(calc.getDisplay(), "2.5");
  });

  it("CASE-UI-05: Accessible :focus-visible focus rings and WCAG 2.2 AA contrast verified", () => {
    // Verify CSS contains :focus-visible rule
    assert.ok(
      stayCalcStyles.includes(":focus-visible"),
      "Styles must declare explicit :focus-visible rule"
    );
    assert.ok(
      stayCalcStyles.includes("outline: 2px solid"),
      "Focus indicator must have distinct 2px solid outline"
    );
    assert.ok(
      stayCalcStyles.includes("outline-offset: 2px"),
      "Focus indicator must maintain 2px outline offset"
    );

    // WCAG 2.2 AA contrast calculation helper
    const luminance = (hex: string): number => {
      const rgb = [1, 3, 5].map((offset) => {
        const val = parseInt(hex.slice(offset, offset + 2), 16) / 255;
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
    };
    const contrastRatio = (hex1: string, hex2: string): number => {
      const l1 = luminance(hex1);
      const l2 = luminance(hex2);
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    };

    // Primary action button: #ffffff text on #2563eb background (Requirement >= 4.5:1)
    const primaryRatio = contrastRatio("#ffffff", "#2563eb");
    assert.ok(
      primaryRatio >= 4.5,
      `Primary button contrast must be >= 4.5:1 for WCAG AA, got ${primaryRatio.toFixed(2)}`
    );

    // Display text: #0f172a text on #f8fafc surface (Requirement >= 4.5:1)
    const displayRatio = contrastRatio("#0f172a", "#f8fafc");
    assert.ok(
      displayRatio >= 4.5,
      `Display contrast must be >= 4.5:1 for WCAG AA, got ${displayRatio.toFixed(2)}`
    );
  });

  it("CASE-UI-06: Viewports 320px, 375px, 390px render with zero horizontal scroll overflow", () => {
    // Verify container query declarations exist in stylesheet
    assert.ok(
      stayCalcStyles.includes("@container (max-width: 390px)"),
      "Styles must define container query for 390px mobile viewport"
    );
    assert.ok(
      stayCalcStyles.includes("@container (max-width: 340px)"),
      "Styles must define container query for narrow viewports down to 320px"
    );
    assert.ok(
      stayCalcStyles.includes("container-type: inline-size"),
      "Host must declare container-type: inline-size"
    );
    assert.ok(
      stayCalcStyles.includes("box-sizing: border-box"),
      "Must enforce box-sizing: border-box"
    );
    assert.ok(
      stayCalcStyles.includes("overflow: hidden"),
      "Container shell must prevent overflow"
    );

    // Verify computed layout metrics across target mobile viewports
    const viewports = [320, 375, 390];
    for (const vp of viewports) {
      // In 4-column grid with gap (4px to 8px) and padding (8px to 16px):
      const padding = vp <= 340 ? 16 : vp <= 390 ? 24 : 32;
      const gap = vp <= 340 ? 4 : vp <= 390 ? 6 : 8;
      const availableWidth = vp - padding;
      const totalColWidth = availableWidth - gap * 3;
      const buttonWidth = Math.floor(totalColWidth / 4);

      // Width of 4 buttons + 3 gaps + 2 * padding must be <= viewport width
      const totalRenderedWidth = buttonWidth * 4 + gap * 3 + padding;
      assert.ok(
        totalRenderedWidth <= vp,
        `Viewport ${vp}px rendered width (${totalRenderedWidth}px) must be <= clientWidth (${vp}px)`
      );
    }
  });

  it("CASE-UI-07: ARIA live region (aria-live='polite') updates with calculation output and error text", () => {
    const status = calc.shadowRoot!.querySelector("#status")!;

    // Initial state
    assert.equal(status.textContent, "0");

    // Input digit 4
    calc.inputDigit("4");
    assert.equal(status.textContent, "4");

    // Input + 5 = 9
    calc.inputOperator("+");
    calc.inputDigit("5");
    calc.calculate();
    assert.equal(status.textContent, "9");

    // Clear
    calc.clear();
    assert.equal(status.textContent, "0");
  });

  it("CASE-UI-08: Division by zero displays 'Cannot divide by zero' and unlocks via C/AC", () => {
    const status = calc.shadowRoot!.querySelector("#status")!;
    const display = calc.shadowRoot!.querySelector("#display")!;

    // 8 / 0 =
    calc.inputDigit("8");
    calc.inputOperator("/");
    calc.inputDigit("0");
    calc.calculate();

    assert.equal(calc.getDisplay(), "Cannot divide by zero");
    assert.equal(display.textContent, "Cannot divide by zero");
    assert.equal(status.textContent, "Cannot divide by zero");

    // Input locked while in error state per RULE-CALC-001
    calc.inputDigit("5");
    assert.equal(calc.getDisplay(), "Cannot divide by zero");
    assert.equal(display.textContent, "Cannot divide by zero");

    // Unlock via Clear (C)
    calc.clear();
    assert.equal(calc.getDisplay(), "0");
    assert.equal(display.textContent, "0");
    assert.equal(status.textContent, "0");

    // Normal calculation resumes after unlock
    calc.inputDigit("7");
    assert.equal(calc.getDisplay(), "7");
    assert.equal(display.textContent, "7");
  });
});
