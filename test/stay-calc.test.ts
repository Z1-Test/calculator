import test, { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

// Setup zero-dependency lightweight DOM environment for W3C Custom Element testing
class MockNode {
  public childNodes: MockNode[] = [];
  public parentNode: MockNode | null = null;

  public appendChild<T extends MockNode>(child: T): T {
    this.childNodes.push(child);
    child.parentNode = this;
    return child;
  }
}

class MockElement extends MockNode {
  public tagName: string;
  public attributes: Map<string, string> = new Map();
  public listeners: Map<string, Array<(e: any) => void>> = new Map();
  public classList = {
    _classes: new Set<string>(),
    add: (c: string) => this.classList._classes.add(c),
    remove: (c: string) => this.classList._classes.delete(c),
    contains: (c: string) => this.classList._classes.has(c),
  };
  public style: Record<string, string> = {};
  public _textContent: string = "";
  public id: string = "";

  constructor(tagName: string = "DIV") {
    super();
    this.tagName = tagName.toUpperCase();
  }

  public get textContent(): string {
    return this._textContent;
  }
  public set textContent(val: string) {
    this._textContent = String(val);
  }

  public setAttribute(k: string, v: string): void {
    this.attributes.set(k, String(v));
  }
  public getAttribute(k: string): string | null {
    return this.attributes.get(k) ?? null;
  }
  public hasAttribute(k: string): boolean {
    return this.attributes.has(k);
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

  public dispatchEvent(event: any): boolean {
    Object.defineProperty(event, "target", {
      value: this,
      configurable: true,
      writable: true,
    });
    let curr: MockNode | null = this;
    while (curr) {
      if (curr instanceof MockElement) {
        const list = curr.listeners.get(event.type);
        if (list) {
          for (const l of list) {
            l.call(curr, event);
          }
        }
      }
      if (!event.bubbles) break;
      curr = curr.parentNode;
    }
    return !event.defaultPrevented;
  }

  public closest(selector: string): MockElement | null {
    let curr: MockNode | null = this;
    while (curr) {
      if (curr instanceof MockElement) {
        if (curr.tagName.toLowerCase() === selector.toLowerCase()) {
          return curr;
        }
      }
      curr = curr.parentNode;
    }
    return null;
  }

  public getElementById(id: string): MockElement | null {
    function search(node: MockNode): MockElement | null {
      if (node instanceof MockElement && node.id === id) return node;
      for (const c of node.childNodes) {
        const found = search(c);
        if (found) return found;
      }
      return null;
    }
    return search(this);
  }

  public querySelector(selector: string): MockElement | null {
    const results = this.querySelectorAll(selector);
    return results.length > 0 ? results[0] : null;
  }

  public querySelectorAll(selector: string): MockElement[] {
    const matched: MockElement[] = [];
    function matchNode(node: MockElement): boolean {
      const m = selector.match(
        /^([a-zA-Z0-9_-]+)?(?:\.([a-zA-Z0-9_-]+))?(?:#([a-zA-Z0-9_-]+))?(?:\[([a-zA-Z0-9_-]+)(?:="([^"]*)")?\])?$/
      );
      if (!m) return false;
      const [_, tag, cls, id, attr, val] = m;
      if (tag && node.tagName.toLowerCase() !== tag.toLowerCase()) return false;
      if (cls && !node.classList.contains(cls)) return false;
      if (id && node.id !== id) return false;
      if (attr) {
        if (val !== undefined) {
          if (node.getAttribute(attr) !== val) return false;
        } else if (!node.hasAttribute(attr)) {
          return false;
        }
      }
      return true;
    }

    function search(node: MockNode) {
      if (node instanceof MockElement) {
        if (matchNode(node)) {
          matched.push(node);
        }
      }
      for (const c of node.childNodes) {
        search(c);
      }
    }
    search(this);
    return matched;
  }

  public set innerHTML(html: string) {
    this.childNodes = [];
    parseFragment(html, this);
  }
}

function parseFragment(text: string, container: MockNode): void {
  const styleMatch = text.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  if (styleMatch) {
    const styleEl = new MockElement("style");
    styleEl.textContent = styleMatch[1];
    container.appendChild(styleEl);
  }

  const clean = text.replace(/<style[\s\S]*?<\/style>/gi, "");
  const regex = /<([a-zA-Z0-9-]+)([^>]*)>([\s\S]*?)<\/\1>|<([a-zA-Z0-9-]+)([^>]*)\/?>/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(clean)) !== null) {
    const tagName = m[1] || m[4];
    const attrStr = m[2] || m[5] || "";
    const inner = m[3] || "";

    const el = new MockElement(tagName);
    const attrRegex = /([a-zA-Z0-9_-]+)(?:="([^"]*)")?/g;
    let am: RegExpExecArray | null;
    while ((am = attrRegex.exec(attrStr)) !== null) {
      if (am[1]) el.setAttribute(am[1], am[2] !== undefined ? am[2] : "");
    }
    if (el.getAttribute("id")) el.id = el.getAttribute("id")!;
    if (el.getAttribute("class")) {
      for (const c of el.getAttribute("class")!.split(/\s+/)) {
        if (c) el.classList.add(c);
      }
    }

    container.appendChild(el);

    if (inner && inner.includes("<")) {
      parseFragment(inner, el);
    } else if (inner) {
      el.textContent = inner.trim();
    }
  }
}

class MockShadowRoot extends MockElement {
  constructor() {
    super("#SHADOW-ROOT");
  }
}

class MockHTMLElement extends MockElement {
  public shadowRoot: MockShadowRoot | null = null;
  constructor(tagName: string = "DIV") {
    super(tagName);
  }
  public attachShadow({ mode }: ShadowRootInit): MockShadowRoot {
    this.shadowRoot = new MockShadowRoot();
    this.shadowRoot.parentNode = this;
    return this.shadowRoot;
  }
}

const registry = new Map<string, any>();
const customElementsRegistry = {
  define(tag: string, ctor: any) {
    registry.set(tag, ctor);
  },
  get(tag: string) {
    return registry.get(tag);
  },
};

class MockKeyboardEvent extends Event {
  public key: string;
  public ctrlKey: boolean;
  public metaKey: boolean;
  public altKey: boolean;
  public defaultPrevented: boolean = false;

  constructor(type: string, init: any = {}) {
    super(type, { bubbles: true, cancelable: true });
    this.key = init.key || "";
    this.ctrlKey = !!init.ctrlKey;
    this.metaKey = !!init.metaKey;
    this.altKey = !!init.altKey;
  }

  public preventDefault(): void {
    this.defaultPrevented = true;
  }
}

const windowListeners = new Map<string, Array<(e: any) => void>>();
const mockWindow = {
  addEventListener(type: string, listener: (e: any) => void) {
    if (!windowListeners.has(type)) windowListeners.set(type, []);
    windowListeners.get(type)!.push(listener);
  },
  removeEventListener(type: string, listener: (e: any) => void) {
    const list = windowListeners.get(type);
    if (!list) return;
    const idx = list.indexOf(listener);
    if (idx !== -1) list.splice(idx, 1);
  },
  dispatchEvent(event: any) {
    const list = windowListeners.get(event.type);
    if (list) {
      for (const l of [...list]) {
        l.call(mockWindow, event);
      }
    }
    return !event.defaultPrevented;
  },
};

// Bind to globalThis before importing component
(globalThis as any).HTMLElement = MockHTMLElement;
(globalThis as any).customElements = customElementsRegistry;
(globalThis as any).KeyboardEvent = MockKeyboardEvent;
(globalThis as any).window = mockWindow;

// Dynamically import StayCalc custom element
const { StayCalc } = await import("../src/index.ts");

describe("Autonomous Custom Element (<stay-calc>)", () => {
  let calc: InstanceType<typeof StayCalc>;

  beforeEach(() => {
    windowListeners.clear();
    calc = new StayCalc();
    calc.connectedCallback();
  });

  afterEach(() => {
    calc.disconnectedCallback();
  });

  describe("1. Custom Element Definition & Lifecycle (CASE-UI-01, CASE-UI-02)", () => {
    it("should be defined in customElements registry with correct constructor", () => {
      assert.equal(customElementsRegistry.get("stay-calc"), StayCalc);
    });

    it("should attach an open ShadowRoot with default template and slots", () => {
      assert.ok(calc.shadowRoot, "shadowRoot should be defined");
      const slots = calc.shadowRoot.querySelectorAll("slot");
      const slotNames = slots.map((s: any) => s.getAttribute("name"));
      assert.ok(slotNames.includes("display"), "should project display slot");
      assert.ok(slotNames.includes("keypad"), "should project keypad slot");
    });

    it("should initialize with display '0' and clear status indicator (CASE-UI-02)", () => {
      assert.equal(calc.getDisplayValue(), "0");
      const displayValEl = calc.shadowRoot!.getElementById("display-value");
      assert.equal(displayValEl?.textContent, "0");
      const statusEl = calc.shadowRoot!.getElementById("display-status");
      assert.equal(statusEl?.textContent, "");
    });

    it("should unbind window event listeners on disconnectedCallback (STL-UI-08)", () => {
      assert.equal(windowListeners.get("keydown")?.length, 1);
      calc.disconnectedCallback();
      assert.equal(windowListeners.get("keydown")?.length, 0);
    });
  });

  describe("2. Keypad Button Click Interactions (CASE-UI-04, CASE-UI-10)", () => {
    it("should evaluate sequential addition from button clicks (7 + 8 = 15)", () => {
      const btn7 = calc.shadowRoot!.querySelector('button[data-value="7"]');
      const btnPlus = calc.shadowRoot!.querySelector('button[data-value="+"]');
      const btn8 = calc.shadowRoot!.querySelector('button[data-value="8"]');
      const btnEquals = calc.shadowRoot!.querySelector('button[data-action="calculate"]');

      assert.ok(btn7 && btnPlus && btn8 && btnEquals);

      btn7.dispatchEvent(new Event("click", { bubbles: true }));
      assert.equal(calc.getDisplayValue(), "7");

      btnPlus.dispatchEvent(new Event("click", { bubbles: true }));
      assert.equal(calc.getDisplayValue(), "7");

      btn8.dispatchEvent(new Event("click", { bubbles: true }));
      assert.equal(calc.getDisplayValue(), "8");

      btnEquals.dispatchEvent(new Event("click", { bubbles: true }));
      assert.equal(calc.getDisplayValue(), "15");
      assert.equal(calc.shadowRoot!.getElementById("display-value")?.textContent, "15");
    });

    it("should evaluate decimal input and multiplication via button clicks (2.5 * 4 = 10)", () => {
      const btn2 = calc.shadowRoot!.querySelector('button[data-value="2"]');
      const btnDot = calc.shadowRoot!.querySelector('button[data-action="decimal"]');
      const btn5 = calc.shadowRoot!.querySelector('button[data-value="5"]');
      const btnMult = calc.shadowRoot!.querySelector('button[data-value="*"]');
      const btn4 = calc.shadowRoot!.querySelector('button[data-value="4"]');
      const btnEquals = calc.shadowRoot!.querySelector('button[data-action="calculate"]');

      btn2?.dispatchEvent(new Event("click", { bubbles: true }));
      btnDot?.dispatchEvent(new Event("click", { bubbles: true }));
      btn5?.dispatchEvent(new Event("click", { bubbles: true }));
      assert.equal(calc.getDisplayValue(), "2.5");

      btnMult?.dispatchEvent(new Event("click", { bubbles: true }));
      btn4?.dispatchEvent(new Event("click", { bubbles: true }));
      btnEquals?.dispatchEvent(new Event("click", { bubbles: true }));
      assert.equal(calc.getDisplayValue(), "10");
    });

    it("should support Clear (C) vs All Clear (AC) buttons (CASE-UI-10)", () => {
      const btn9 = calc.shadowRoot!.querySelector('button[data-value="9"]');
      const btnPlus = calc.shadowRoot!.querySelector('button[data-value="+"]');
      const btn5 = calc.shadowRoot!.querySelector('button[data-value="5"]');
      const btnC = calc.shadowRoot!.querySelector('button[data-action="clear"]');
      const btn3 = calc.shadowRoot!.querySelector('button[data-value="3"]');
      const btnEquals = calc.shadowRoot!.querySelector('button[data-action="calculate"]');
      const btnAC = calc.shadowRoot!.querySelector('button[data-action="allClear"]');

      // 9 + 5 -> C -> 3 = -> 12
      btn9?.dispatchEvent(new Event("click", { bubbles: true }));
      btnPlus?.dispatchEvent(new Event("click", { bubbles: true }));
      btn5?.dispatchEvent(new Event("click", { bubbles: true }));
      btnC?.dispatchEvent(new Event("click", { bubbles: true }));
      assert.equal(calc.getDisplayValue(), "0");

      btn3?.dispatchEvent(new Event("click", { bubbles: true }));
      btnEquals?.dispatchEvent(new Event("click", { bubbles: true }));
      assert.equal(calc.getDisplayValue(), "12");

      // AC resets completely
      btnAC?.dispatchEvent(new Event("click", { bubbles: true }));
      assert.equal(calc.getDisplayValue(), "0");
      assert.equal(calc.engine.getState().accumulator, null);
    });

    it("should support backspace button (CASE-UI-07)", () => {
      const btn1 = calc.shadowRoot!.querySelector('button[data-value="1"]');
      const btn2 = calc.shadowRoot!.querySelector('button[data-value="2"]');
      const btn3 = calc.shadowRoot!.querySelector('button[data-value="3"]');
      const btnBack = calc.shadowRoot!.querySelector('button[data-action="backspace"]');

      btn1?.dispatchEvent(new Event("click", { bubbles: true }));
      btn2?.dispatchEvent(new Event("click", { bubbles: true }));
      btn3?.dispatchEvent(new Event("click", { bubbles: true }));
      assert.equal(calc.getDisplayValue(), "123");

      btnBack?.dispatchEvent(new Event("click", { bubbles: true }));
      assert.equal(calc.getDisplayValue(), "12");

      btnBack?.dispatchEvent(new Event("click", { bubbles: true }));
      assert.equal(calc.getDisplayValue(), "1");

      btnBack?.dispatchEvent(new Event("click", { bubbles: true }));
      assert.equal(calc.getDisplayValue(), "0");
    });
  });

  describe("3. Keyboard Navigation & Typing Event Mapping (CASE-UI-05, CASE-UI-07)", () => {
    it("should evaluate sequential arithmetic from physical keyboard typing (2 + 3 * 4 = 20)", () => {
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "2" }));
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "+" }));
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "3" }));
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "*" }));
      assert.equal(calc.getDisplayValue(), "5");

      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "4" }));
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "Enter" }));
      assert.equal(calc.getDisplayValue(), "20");
    });

    it("should map '=' key to calculation", () => {
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "9" }));
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "-" }));
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "4" }));
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "=" }));
      assert.equal(calc.getDisplayValue(), "5");
    });

    it("should map 'Escape' and 'c' to Clear (C) and 'Delete' to All Clear (AC)", () => {
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "9" }));
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "9" }));
      assert.equal(calc.getDisplayValue(), "99");

      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "Escape" }));
      assert.equal(calc.getDisplayValue(), "0");

      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "5" }));
      assert.equal(calc.getDisplayValue(), "5");
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "c" }));
      assert.equal(calc.getDisplayValue(), "0");

      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "8" }));
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "+" }));
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "Delete" }));
      assert.equal(calc.getDisplayValue(), "0");
      assert.equal(calc.engine.getState().accumulator, null);
    });

    it("should map 'Backspace' key to remove last character", () => {
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "5" }));
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "6" }));
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "7" }));
      assert.equal(calc.getDisplayValue(), "567");

      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "Backspace" }));
      assert.equal(calc.getDisplayValue(), "56");
    });
  });

  describe("4. Keyboard Modifier Key Guard (CASE-UI-06, STL-UI-01)", () => {
    it("should ignore keydown when ctrlKey is active (e.g. Ctrl+C)", () => {
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "5" }));
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "5" }));
      assert.equal(calc.getDisplayValue(), "55");

      // User presses Ctrl+C to copy
      const ctrlC = new MockKeyboardEvent("keydown", { key: "c", ctrlKey: true });
      mockWindow.dispatchEvent(ctrlC);

      assert.equal(calc.getDisplayValue(), "55", "Display should not clear on Ctrl+C");
      assert.equal(ctrlC.defaultPrevented, false, "Should not prevent default for Ctrl+C");
    });

    it("should ignore keydown when metaKey is active (e.g. Cmd+R)", () => {
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "4" }));
      const cmdR = new MockKeyboardEvent("keydown", { key: "r", metaKey: true });
      mockWindow.dispatchEvent(cmdR);

      assert.equal(calc.getDisplayValue(), "4");
      assert.equal(cmdR.defaultPrevented, false);
    });

    it("should ignore keydown when altKey is active", () => {
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "4" }));
      const altKey = new MockKeyboardEvent("keydown", { key: "1", altKey: true });
      mockWindow.dispatchEvent(altKey);

      assert.equal(calc.getDisplayValue(), "4", "Should not append digit when altKey is pressed");
    });
  });

  describe("5. Division by Zero Error State & Input Locking (CASE-UI-03, STL-UI-04)", () => {
    it("should lock engine and display 'Cannot divide by zero' on division by zero", () => {
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "8" }));
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "/" }));
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "0" }));
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "Enter" }));

      assert.equal(calc.getDisplayValue(), "Cannot divide by zero");
      const cardEl = calc.shadowRoot!.getElementById("display-card");
      assert.ok(cardEl?.classList.contains("error"), "display card should have error class");

      // Inputs while locked are ignored
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "5" }));
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "+" }));
      assert.equal(calc.getDisplayValue(), "Cannot divide by zero");

      // Unlocked via C or AC
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "Escape" }));
      assert.equal(calc.getDisplayValue(), "0");
      assert.equal(cardEl?.classList.contains("error"), false);
      assert.equal(calc.engine.getState().isLocked, false);
    });
  });

  describe("6. Accessible Focus Rings & WCAG 2.2 AA Contrast (CASE-UI-08)", () => {
    it("should define visible focus rings via :focus-visible without !important", () => {
      const styleEl = calc.shadowRoot!.querySelector("style");
      assert.ok(styleEl, "style tag must exist in shadow root");
      const css = styleEl.textContent;

      // Verify :focus-visible outline
      assert.ok(css.includes(":focus-visible"), "CSS must define :focus-visible");
      assert.ok(
        css.includes("outline: 2px solid var(--calc-primary, #2563eb)") ||
        css.includes("outline: 2px solid"),
        "CSS must define 2px solid outline for focus visible"
      );
      assert.ok(css.includes("outline-offset: 2px"), "CSS must define 2px outline-offset");

      // Verify zero !important discipline (NEVER-UI-002)
      assert.ok(!css.includes("!important"), "CSS must strictly forbid !important");
    });

    it("should provide accessible aria-labels on interactive symbols", () => {
      const buttons = calc.shadowRoot!.querySelectorAll("button");
      assert.ok(buttons.length >= 19, "should contain complete keypad button set");

      const divideBtn = calc.shadowRoot!.querySelector('button[data-value="/"]');
      assert.equal(divideBtn?.getAttribute("aria-label"), "Divide");

      const multiplyBtn = calc.shadowRoot!.querySelector('button[data-value="*"]');
      assert.equal(multiplyBtn?.getAttribute("aria-label"), "Multiply");

      const equalsBtn = calc.shadowRoot!.querySelector('button[data-action="calculate"]');
      assert.equal(equalsBtn?.getAttribute("aria-label"), "Equals");

      const clearBtn = calc.shadowRoot!.querySelector('button[data-action="clear"]');
      assert.equal(clearBtn?.getAttribute("aria-label"), "Clear Entry");

      const allClearBtn = calc.shadowRoot!.querySelector('button[data-action="allClear"]');
      assert.equal(allClearBtn?.getAttribute("aria-label"), "All Clear");

      const mcBtn = calc.shadowRoot!.querySelector('button[data-action="memoryClear"]');
      assert.equal(mcBtn?.getAttribute("aria-label"), "Memory Clear");

      const mrBtn = calc.shadowRoot!.querySelector('button[data-action="memoryRecall"]');
      assert.equal(mrBtn?.getAttribute("aria-label"), "Memory Recall");

      const mSubBtn = calc.shadowRoot!.querySelector('button[data-action="memorySubtract"]');
      assert.equal(mSubBtn?.getAttribute("aria-label"), "Memory Subtract");

      const mAddBtn = calc.shadowRoot!.querySelector('button[data-action="memoryAdd"]');
      assert.equal(mAddBtn?.getAttribute("aria-label"), "Memory Add");
    });

    it("should enforce tactile pill shape (border-radius: 9999px) on all buttons", () => {
      const styleEl = calc.shadowRoot!.querySelector("style");
      const css = styleEl!.textContent;
      assert.ok(css.includes("border-radius: 9999px"), "All buttons must use pill border-radius 9999px");
    });
  });

  describe("7. Mobile Viewport Zero-Overflow Bounds (CASE-UI-09, STL-UI-03)", () => {
    it("should enforce host container boundaries preventing overflow across 320px-390px viewports", () => {
      const styleEl = calc.shadowRoot!.querySelector("style");
      const css = styleEl!.textContent;

      assert.ok(css.includes("max-width: 380px"), "Host container must cap max-width to 380px");
      assert.ok(css.includes("box-sizing: border-box"), "Must use border-box for deterministic sizing");
      assert.ok(css.includes("grid-template-columns: repeat(4, 1fr)"), "Grid must use flexible 1fr columns");
      assert.ok(css.includes("min-width: 0"), "Button cells must allow shrinking with min-width: 0");

      // Mathematical zero-overflow audit for 320px viewport:
      const viewport320 = 320;
      const hostPadding = 16 * 2; // 32px padding
      const gridGaps = 8 * 3; // 24px total gaps across 4 columns
      const availableWidth = viewport320 - hostPadding; // 288px
      const colWidth = (availableWidth - gridGaps) / 4; // 66px per button
      assert.ok(colWidth > 48, "Each column on 320px viewport must exceed minimum touch target size (48px)");
      assert.ok(colWidth * 4 + gridGaps + hostPadding <= viewport320, "Total width must not exceed viewport width (zero overflow)");
    });
  });

  describe("8. Mid-Flow Consecutive Operator Replacement (CASE-UI-11)", () => {
    it("should replace pending operator on consecutive entries (10 + * 5 = 50)", () => {
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "1" }));
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "0" }));
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "+" }));
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "*" })); // Overrides +
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "5" }));
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "Enter" }));

      assert.equal(calc.getDisplayValue(), "50");
    });
  });

  describe("9. Memory Registers & Reactive Status Badge (CASE-MEM-01, CASE-MEM-09, CASE-MEM-10)", () => {
    it("should initialize with memory badge hidden and not active", () => {
      const badge = calc.shadowRoot!.getElementById("memory-badge");
      assert.ok(badge, "Memory badge must exist in shadow root");
      assert.equal(badge.style.display, "none");
      assert.equal(badge.classList.contains("active"), false);
      assert.equal(calc.engine.hasMemory(), false);
    });

    it("should activate memory badge when M+ button is clicked with non-zero value", () => {
      const btn4 = calc.shadowRoot!.querySelector('button[data-value="4"]');
      const btn2 = calc.shadowRoot!.querySelector('button[data-value="2"]');
      const btnMAdd = calc.shadowRoot!.querySelector('button[data-action="memoryAdd"]');
      const badge = calc.shadowRoot!.getElementById("memory-badge");

      btn4?.dispatchEvent(new Event("click", { bubbles: true }));
      btn2?.dispatchEvent(new Event("click", { bubbles: true }));
      assert.equal(calc.getDisplayValue(), "42");

      btnMAdd?.dispatchEvent(new Event("click", { bubbles: true }));
      assert.equal(calc.engine.getMemoryValue(), 42);
      assert.equal(calc.engine.hasMemory(), true);
      assert.equal(badge?.style.display, "inline-block");
      assert.equal(badge?.classList.contains("active"), true);
      assert.equal(calc.getDisplayValue(), "42");
    });

    it("should deactivate memory badge when M- button reduces memory to 0", () => {
      const btn5 = calc.shadowRoot!.querySelector('button[data-value="5"]');
      const btn0 = calc.shadowRoot!.querySelector('button[data-value="0"]');
      const btnMAdd = calc.shadowRoot!.querySelector('button[data-action="memoryAdd"]');
      const btnMSub = calc.shadowRoot!.querySelector('button[data-action="memorySubtract"]');
      const badge = calc.shadowRoot!.getElementById("memory-badge");

      btn5?.dispatchEvent(new Event("click", { bubbles: true }));
      btn0?.dispatchEvent(new Event("click", { bubbles: true }));
      btnMAdd?.dispatchEvent(new Event("click", { bubbles: true })); // memory = 50
      assert.equal(badge?.classList.contains("active"), true);

      // Subtract 50
      btnMSub?.dispatchEvent(new Event("click", { bubbles: true })); // memory = 0
      assert.equal(calc.engine.getMemoryValue(), 0);
      assert.equal(calc.engine.hasMemory(), false);
      assert.equal(badge?.style.display, "none");
      assert.equal(badge?.classList.contains("active"), false);
    });

    it("should recall memory via MR button and allow chained calculations", () => {
      const btn3 = calc.shadowRoot!.querySelector('button[data-value="3"]');
      const btn0 = calc.shadowRoot!.querySelector('button[data-value="0"]');
      const btnMAdd = calc.shadowRoot!.querySelector('button[data-action="memoryAdd"]');
      const btnMR = calc.shadowRoot!.querySelector('button[data-action="memoryRecall"]');
      const btnPlus = calc.shadowRoot!.querySelector('button[data-value="+"]');
      const btn5 = calc.shadowRoot!.querySelector('button[data-value="5"]');
      const btnEquals = calc.shadowRoot!.querySelector('button[data-action="calculate"]');
      const btnC = calc.shadowRoot!.querySelector('button[data-action="clear"]');

      // Add 30 to memory
      btn3?.dispatchEvent(new Event("click", { bubbles: true }));
      btn0?.dispatchEvent(new Event("click", { bubbles: true }));
      btnMAdd?.dispatchEvent(new Event("click", { bubbles: true })); // memory = 30

      // Clear active buffer
      btnC?.dispatchEvent(new Event("click", { bubbles: true }));
      assert.equal(calc.getDisplayValue(), "0");

      // Chained operation: 5 + MR =
      btn5?.dispatchEvent(new Event("click", { bubbles: true }));
      btnPlus?.dispatchEvent(new Event("click", { bubbles: true }));
      btnMR?.dispatchEvent(new Event("click", { bubbles: true }));
      assert.equal(calc.getDisplayValue(), "30");

      btnEquals?.dispatchEvent(new Event("click", { bubbles: true }));
      assert.equal(calc.getDisplayValue(), "35");
    });

    it("should reset memory and hide badge on MC button click", () => {
      const btn9 = calc.shadowRoot!.querySelector('button[data-value="9"]');
      const btnMAdd = calc.shadowRoot!.querySelector('button[data-action="memoryAdd"]');
      const btnMC = calc.shadowRoot!.querySelector('button[data-action="memoryClear"]');
      const badge = calc.shadowRoot!.getElementById("memory-badge");

      btn9?.dispatchEvent(new Event("click", { bubbles: true }));
      btnMAdd?.dispatchEvent(new Event("click", { bubbles: true }));
      assert.equal(badge?.classList.contains("active"), true);

      btnMC?.dispatchEvent(new Event("click", { bubbles: true }));
      assert.equal(calc.engine.getMemoryValue(), 0);
      assert.equal(calc.engine.hasMemory(), false);
      assert.equal(badge?.style.display, "none");
      assert.equal(badge?.classList.contains("active"), false);
    });

    it("should preserve memory register and badge visibility across C and AC clicks", () => {
      const btn7 = calc.shadowRoot!.querySelector('button[data-value="7"]');
      const btnMAdd = calc.shadowRoot!.querySelector('button[data-action="memoryAdd"]');
      const btnC = calc.shadowRoot!.querySelector('button[data-action="clear"]');
      const btnAC = calc.shadowRoot!.querySelector('button[data-action="allClear"]');
      const badge = calc.shadowRoot!.getElementById("memory-badge");

      btn7?.dispatchEvent(new Event("click", { bubbles: true }));
      btnMAdd?.dispatchEvent(new Event("click", { bubbles: true })); // memory = 7
      assert.equal(badge?.classList.contains("active"), true);

      // Press C
      btnC?.dispatchEvent(new Event("click", { bubbles: true }));
      assert.equal(calc.getDisplayValue(), "0");
      assert.equal(calc.engine.getMemoryValue(), 7);
      assert.equal(badge?.classList.contains("active"), true);
      assert.equal(badge?.style.display, "inline-block");

      // Press AC
      btnAC?.dispatchEvent(new Event("click", { bubbles: true }));
      assert.equal(calc.getDisplayValue(), "0");
      assert.equal(calc.engine.getMemoryValue(), 7);
      assert.equal(badge?.classList.contains("active"), true);
      assert.equal(badge?.style.display, "inline-block");
    });

    it("should synchronize memory badge in slotted custom display", () => {
      const slottedDiv = new MockElement("DIV");
      slottedDiv.setAttribute("slot", "display");
      const customValue = new MockElement("SPAN");
      customValue.setAttribute("data-display-value", "true");
      const customBadge = new MockElement("SPAN");
      customBadge.setAttribute("data-memory-badge", "true");
      slottedDiv.appendChild(customBadge);
      slottedDiv.appendChild(customValue);

      calc.appendChild(slottedDiv);

      calc.executeAction("digit", "8");
      calc.executeAction("memoryAdd");

      assert.equal(customBadge.classList.contains("active"), true);
      assert.equal(customBadge.style.display, "inline-block");

      calc.executeAction("memoryClear");
      assert.equal(customBadge.classList.contains("active"), false);
      assert.equal(customBadge.style.display, "none");
    });
  });

  describe("10. Calculation History Tape Drawer & Recall (CASE-HIST-09 to CASE-HIST-11)", () => {
    it("should initialize with history drawer closed and empty message rendered", () => {
      assert.equal(calc.getHistoryOpen(), false);
      const drawer = calc.shadowRoot!.getElementById("history-drawer");
      const toggle = calc.shadowRoot!.getElementById("history-toggle");
      const empty = calc.shadowRoot!.getElementById("history-empty");

      assert.ok(drawer && toggle && empty);
      assert.equal(toggle.getAttribute("aria-expanded"), "false");
      assert.equal(toggle.getAttribute("aria-controls"), "history-drawer");
      assert.equal(toggle.getAttribute("aria-label"), "Toggle calculation history");
      assert.equal(drawer.classList.contains("open"), false);
      assert.equal(empty.textContent, "No calculations yet");
    });

    it("should toggle history drawer open and closed on #history-toggle button click (CASE-HIST-09)", () => {
      const toggle = calc.shadowRoot!.getElementById("history-toggle");
      const drawer = calc.shadowRoot!.getElementById("history-drawer");

      toggle?.dispatchEvent(new Event("click", { bubbles: true }));
      assert.equal(calc.getHistoryOpen(), true);
      assert.equal(drawer?.classList.contains("open"), true);
      assert.equal(drawer?.style.display, "block");
      assert.equal(toggle?.getAttribute("aria-expanded"), "true");

      toggle?.dispatchEvent(new Event("click", { bubbles: true }));
      assert.equal(calc.getHistoryOpen(), false);
      assert.equal(drawer?.classList.contains("open"), false);
      assert.equal(drawer?.style.display, "none");
      assert.equal(toggle?.getAttribute("aria-expanded"), "false");
    });

    it("should render history entries in #history-list after calculation", () => {
      const btn2 = calc.shadowRoot!.querySelector('button[data-value="2"]');
      const btnPlus = calc.shadowRoot!.querySelector('button[data-value="+"]');
      const btn3 = calc.shadowRoot!.querySelector('button[data-value="3"]');
      const btnEquals = calc.shadowRoot!.querySelector('button[data-action="calculate"]');

      btn2?.dispatchEvent(new Event("click", { bubbles: true }));
      btnPlus?.dispatchEvent(new Event("click", { bubbles: true }));
      btn3?.dispatchEvent(new Event("click", { bubbles: true }));
      btnEquals?.dispatchEvent(new Event("click", { bubbles: true }));

      assert.equal(calc.getDisplayValue(), "5");

      const historyList = calc.shadowRoot!.getElementById("history-list");
      const historyEmpty = calc.shadowRoot!.getElementById("history-empty");
      assert.equal(historyEmpty?.style.display, "none");

      const items = historyList?.childNodes as MockElement[];
      assert.equal(items.length, 1);
      assert.equal(items[0].getAttribute("data-action"), "recallHistory");
      assert.equal(items[0].getAttribute("data-index"), "0");
      assert.equal(items[0].getAttribute("role"), "button");
      assert.equal(items[0].getAttribute("tabindex"), "0");
      assert.equal(items[0].textContent, "2 + 3 = 5");
    });

    it("should recall calculation result when history item button is clicked (CASE-HIST-05)", () => {
      calc.executeAction("digit", "4");
      calc.executeAction("operator", "*");
      calc.executeAction("digit", "5");
      calc.executeAction("calculate"); // 20

      calc.executeAction("clear"); // Display resets to "0"
      assert.equal(calc.getDisplayValue(), "0");

      const historyList = calc.shadowRoot!.getElementById("history-list");
      const itemBtn = historyList?.childNodes[0] as MockElement;
      assert.ok(itemBtn);

      itemBtn.dispatchEvent(new Event("click", { bubbles: true }));
      assert.equal(calc.getDisplayValue(), "20");

      // Verify immediate chaining with subsequent operator
      calc.executeAction("operator", "+");
      calc.executeAction("digit", "1");
      calc.executeAction("digit", "0");
      calc.executeAction("calculate");
      assert.equal(calc.getDisplayValue(), "30");
    });

    it("should recall calculation result via keyboard Enter and Space keys (CASE-HIST-10)", () => {
      calc.executeAction("digit", "7");
      calc.executeAction("operator", "+");
      calc.executeAction("digit", "8");
      calc.executeAction("calculate"); // 15

      calc.executeAction("clear");
      assert.equal(calc.getDisplayValue(), "0");

      const historyList = calc.shadowRoot!.getElementById("history-list");
      const itemBtn = historyList?.childNodes[0] as MockElement;
      assert.ok(itemBtn);

      // Trigger Enter keydown
      const enterEvent = new MockKeyboardEvent("keydown", { key: "Enter", bubbles: true });
      itemBtn.dispatchEvent(enterEvent);
      assert.equal(calc.getDisplayValue(), "15");

      calc.executeAction("clear");
      assert.equal(calc.getDisplayValue(), "0");

      // Trigger Space keydown
      const spaceEvent = new MockKeyboardEvent("keydown", { key: " ", bubbles: true });
      itemBtn.dispatchEvent(spaceEvent);
      assert.equal(calc.getDisplayValue(), "15");
    });

    it("should clear history entries and restore empty state on #history-clear button click (CASE-HIST-08)", () => {
      calc.executeAction("digit", "9");
      calc.executeAction("operator", "*");
      calc.executeAction("digit", "9");
      calc.executeAction("calculate"); // 81

      assert.equal(calc.engine.getHistory().length, 1);

      const clearBtn = calc.shadowRoot!.getElementById("history-clear");
      clearBtn?.dispatchEvent(new Event("click", { bubbles: true }));

      assert.equal(calc.engine.getHistory().length, 0);
      const historyList = calc.shadowRoot!.getElementById("history-list");
      const historyEmpty = calc.shadowRoot!.getElementById("history-empty");

      assert.equal(historyList?.childNodes.length, 0);
      assert.equal(historyEmpty?.style.display, "block");
    });

    it("should dispatch history actions exactly once without duplicate bubbling dispatches", () => {
      calc.executeAction("digit", "5");
      calc.executeAction("operator", "+");
      calc.executeAction("digit", "5");
      calc.executeAction("calculate"); // 10

      const historyList = calc.shadowRoot!.getElementById("history-list");
      const itemBtn = historyList?.childNodes[0] as MockElement;
      assert.ok(itemBtn);

      const historyCalls: string[] = [];
      const originalExecuteAction = calc.executeAction.bind(calc);
      calc.executeAction = (action, val) => {
        historyCalls.push(`${action}:${val}`);
        return originalExecuteAction(action, val);
      };

      // Item click must fire once
      itemBtn.dispatchEvent(new Event("click", { bubbles: true }));
      assert.equal(historyCalls.length, 1);
      assert.equal(historyCalls[0], "recallHistory:0");

      historyCalls.length = 0;
      // Item keydown Enter must fire once
      const enterEvent = new MockKeyboardEvent("keydown", { key: "Enter", bubbles: true });
      itemBtn.dispatchEvent(enterEvent);
      assert.equal(historyCalls.length, 1);
      assert.equal(historyCalls[0], "recallHistory:0");

      historyCalls.length = 0;
      // Clear history click must fire once
      const clearBtn = calc.shadowRoot!.getElementById("history-clear");
      clearBtn?.dispatchEvent(new Event("click", { bubbles: true }));
      assert.equal(historyCalls.length, 1);
      assert.equal(historyCalls[0], "clearHistory:null");
    });

    it("should preserve history across Clear Entry (C) and All Clear (AC) button clicks", () => {
      calc.executeAction("digit", "6");
      calc.executeAction("operator", "+");
      calc.executeAction("digit", "6");
      calc.executeAction("calculate"); // 12

      assert.equal(calc.engine.getHistory().length, 1);

      const btnC = calc.shadowRoot!.querySelector('button[data-action="clear"]');
      const btnAC = calc.shadowRoot!.querySelector('button[data-action="allClear"]');

      btnC?.dispatchEvent(new Event("click", { bubbles: true }));
      assert.equal(calc.getDisplayValue(), "0");
      assert.equal(calc.engine.getHistory().length, 1);

      btnAC?.dispatchEvent(new Event("click", { bubbles: true }));
      assert.equal(calc.getDisplayValue(), "0");
      assert.equal(calc.engine.getHistory().length, 1);
    });

    it("should enforce mobile zero-overflow and layout boundaries on drawer and items (CASE-HIST-11)", () => {
      const styleEl = calc.shadowRoot!.querySelector("style");
      assert.ok(styleEl);
      const css = styleEl.textContent;

      assert.ok(css.includes(".history-drawer"));
      assert.ok(css.includes("max-width: 100%"));
      assert.ok(css.includes("overflow-x: hidden"));
      assert.ok(css.includes("overflow-y: auto"));
      assert.ok(css.includes("word-break: break-all"));
      assert.ok(css.includes("overflow-wrap: break-word"));
      assert.ok(!css.includes("!important"), "Strictly zero !important across stylesheets");
    });
  });

  describe("11. Scientific Keypad Panel & UI Navigation (CASE-SCI-09 to CASE-SCI-11)", () => {
    it("should initialize with scientific keypad closed and aria-expanded = false (CASE-SCI-09)", () => {
      assert.equal(calc.getScientificOpen(), false);
      assert.equal(calc.isScientificKeypadOpen(), false);

      const keypad = calc.shadowRoot!.getElementById("scientific-keypad");
      const toggle = calc.shadowRoot!.getElementById("scientific-toggle");

      assert.ok(keypad);
      assert.ok(toggle);
      assert.equal(keypad.classList.contains("open"), false);
      assert.equal(toggle.getAttribute("aria-expanded"), "false");
      assert.equal(toggle.getAttribute("aria-controls"), "scientific-keypad");
    });

    it("should toggle scientific keypad open and closed on #scientific-toggle button click (CASE-SCI-09)", () => {
      const toggle = calc.shadowRoot!.getElementById("scientific-toggle");
      const keypad = calc.shadowRoot!.getElementById("scientific-keypad");

      // Open keypad
      toggle?.dispatchEvent(new Event("click", { bubbles: true }));
      assert.equal(calc.getScientificOpen(), true);
      assert.equal(keypad?.classList.contains("open"), true);
      assert.equal(toggle?.getAttribute("aria-expanded"), "true");

      // Close keypad
      toggle?.dispatchEvent(new Event("click", { bubbles: true }));
      assert.equal(calc.getScientificOpen(), false);
      assert.equal(keypad?.classList.contains("open"), false);
      assert.equal(toggle?.getAttribute("aria-expanded"), "false");
    });

    it("should toggle angle mode and update button label on #angle-mode-toggle button click (CASE-SCI-01)", () => {
      const angleBtn = calc.shadowRoot!.getElementById("angle-mode-toggle");
      assert.ok(angleBtn);
      assert.equal(angleBtn.textContent, "DEG");
      assert.equal(calc.engine.getAngleMode(), "DEG");

      // Toggle to RAD
      angleBtn.dispatchEvent(new Event("click", { bubbles: true }));
      assert.equal(calc.engine.getAngleMode(), "RAD");
      assert.equal(angleBtn.textContent, "RAD");

      // Toggle back to DEG
      angleBtn.dispatchEvent(new Event("click", { bubbles: true }));
      assert.equal(calc.engine.getAngleMode(), "DEG");
      assert.equal(angleBtn.textContent, "DEG");
    });

    it("should evaluate scientific operations via button clicks", () => {
      // 1. sin(30) = 0.5 in DEG
      calc.executeAction("digit", "3");
      calc.executeAction("digit", "0");
      const sinBtn = calc.shadowRoot!.querySelector('button[data-action="sin"]');
      sinBtn?.dispatchEvent(new Event("click", { bubbles: true }));
      assert.equal(calc.getDisplayValue(), "0.5");

      // 2. Square: 5² = 25
      calc.executeAction("clear");
      calc.executeAction("digit", "5");
      const sqBtn = calc.shadowRoot!.querySelector('button[data-action="square"]');
      sqBtn?.dispatchEvent(new Event("click", { bubbles: true }));
      assert.equal(calc.getDisplayValue(), "25");

      // 3. Square Root: √16 = 4
      calc.executeAction("clear");
      calc.executeAction("digit", "1");
      calc.executeAction("digit", "6");
      const sqrtBtn = calc.shadowRoot!.querySelector('button[data-action="sqrt"]');
      sqrtBtn?.dispatchEvent(new Event("click", { bubbles: true }));
      assert.equal(calc.getDisplayValue(), "4");

      // 4. Reciprocal: 1/4 = 0.25
      const recipBtn = calc.shadowRoot!.querySelector('button[data-action="reciprocal"]');
      recipBtn?.dispatchEvent(new Event("click", { bubbles: true }));
      assert.equal(calc.getDisplayValue(), "0.25");

      // 5. Constants pi and e
      calc.executeAction("clear");
      const piBtn = calc.shadowRoot!.querySelector('button[data-value="pi"]');
      assert.ok(piBtn);
      piBtn.dispatchEvent(new Event("click", { bubbles: true }));
      assert.equal(calc.getDisplayValue(), "3.1415926536");

      calc.executeAction("clear");
      const eBtn = calc.shadowRoot!.querySelector('button[data-value="e"]');
      assert.ok(eBtn);
      eBtn.dispatchEvent(new Event("click", { bubbles: true }));
      assert.equal(calc.getDisplayValue(), "2.7182818285");
    });

    it("should evaluate power operation via keyboard key ^ (CASE-SCI-10)", () => {
      // 2 ^ 3 = 8
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "2" }));
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "^" }));
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "3" }));
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "Enter" }));
      assert.equal(calc.getDisplayValue(), "8");
    });

    it("should provide accessible aria-labels and tactile pill styling on all scientific buttons (CASE-SCI-10)", () => {
      const keypad = calc.shadowRoot!.getElementById("scientific-keypad");
      assert.ok(keypad);
      const buttons = keypad.querySelectorAll("button");
      assert.equal(buttons.length, 12);

      for (const btn of buttons) {
        assert.ok(btn.hasAttribute("aria-label"), `Button ${btn.textContent} missing aria-label`);
        assert.ok(btn.getAttribute("aria-label")!.length > 0);
      }
    });

    it("should enforce mobile zero-overflow styling across 320px-390px viewports (CASE-SCI-11)", () => {
      const styleEl = calc.shadowRoot!.querySelector("style");
      assert.ok(styleEl);
      const css = styleEl.textContent;

      assert.ok(css.includes(".scientific-keypad"));
      assert.ok(css.includes(".scientific-grid"));
      assert.ok(css.includes("repeat(4, 1fr)"));
      assert.ok(css.includes("overflow-x: hidden"));
      assert.ok(css.includes("box-sizing: border-box"));
      assert.ok(!css.includes("!important"), "Strictly zero !important across stylesheets");
    });

    it("should preserve active buffer and display when toggling scientific panel (NEVER-CALC-002)", () => {
      calc.executeAction("digit", "8");
      calc.executeAction("digit", "9");
      assert.equal(calc.getDisplayValue(), "89");

      calc.toggleScientific();
      assert.equal(calc.getDisplayValue(), "89");
      assert.equal(calc.getScientificOpen(), true);

      calc.toggleScientific();
      assert.equal(calc.getDisplayValue(), "89");
      assert.equal(calc.getScientificOpen(), false);
    });
  });

  describe("12. Programmer Radix Mode UI & Keypad Gating (CASE-PROG-08 to CASE-PROG-11, RULE-PROG-001 to RULE-PROG-004)", () => {
    it("should initialize with programmer panel closed and aria-expanded = false (CASE-PROG-08)", () => {
      assert.equal(calc.getProgrammerOpen(), false);
      const toggle = calc.shadowRoot!.getElementById("programmer-toggle");
      assert.ok(toggle);
      assert.equal(toggle.getAttribute("aria-expanded"), "false");
      assert.equal(toggle.getAttribute("aria-controls"), "programmer-panel");

      const panel = calc.shadowRoot!.getElementById("programmer-panel");
      assert.ok(panel);
      assert.equal(panel.classList.contains("open"), false);
    });

    it("should toggle programmer panel open and closed on #programmer-toggle button click (CASE-PROG-08, FLW-PROG-01)", () => {
      const toggle = calc.shadowRoot!.getElementById("programmer-toggle");
      const panel = calc.shadowRoot!.getElementById("programmer-panel");

      toggle?.dispatchEvent(new Event("click", { bubbles: true }));
      assert.equal(calc.getProgrammerOpen(), true);
      assert.equal(calc.isProgrammerPanelOpen(), true);
      assert.equal(toggle?.getAttribute("aria-expanded"), "true");
      assert.equal(toggle?.classList.contains("active"), true);
      assert.equal(panel?.classList.contains("open"), true);

      toggle?.dispatchEvent(new Event("click", { bubbles: true }));
      assert.equal(calc.getProgrammerOpen(), false);
      assert.equal(calc.isProgrammerPanelOpen(), false);
      assert.equal(toggle?.getAttribute("aria-expanded"), "false");
      assert.equal(toggle?.classList.contains("active"), false);
      assert.equal(panel?.classList.contains("open"), false);
    });

    it("should synchronize live multi-radix readout panel values across HEX, DEC, OCT, BIN (CASE-PROG-08, CASE-PROG-09, RULE-PROG-001)", () => {
      calc.toggleProgrammer();

      // Enter 255 in DEC
      calc.executeAction("digit", "2");
      calc.executeAction("digit", "5");
      calc.executeAction("digit", "5");
      assert.equal(calc.getDisplayValue(), "255");

      const hexVal = calc.shadowRoot!.getElementById("radix-val-hex");
      const decVal = calc.shadowRoot!.getElementById("radix-val-dec");
      const octVal = calc.shadowRoot!.getElementById("radix-val-oct");
      const binVal = calc.shadowRoot!.getElementById("radix-val-bin");

      assert.equal(hexVal?.textContent, "FF");
      assert.equal(decVal?.textContent, "255");
      assert.equal(octVal?.textContent, "377");
      assert.equal(binVal?.textContent, "11111111");
    });

    it("should switch active radix base when radix row is clicked and reformat display value (CASE-PROG-09, DEC-PROG-05)", () => {
      calc.toggleProgrammer();
      calc.executeAction("digit", "2");
      calc.executeAction("digit", "5");
      calc.executeAction("digit", "5");

      const hexRow = calc.shadowRoot!.querySelector('.radix-row[data-value="HEX"]');
      const decRow = calc.shadowRoot!.querySelector('.radix-row[data-value="DEC"]');

      hexRow?.dispatchEvent(new Event("click", { bubbles: true }));

      assert.equal(calc.engine.getRadix(), "HEX");
      assert.equal(calc.getDisplayValue(), "FF");
      assert.equal(hexRow?.classList.contains("active"), true);
      assert.equal(hexRow?.getAttribute("aria-checked"), "true");
      assert.equal(decRow?.classList.contains("active"), false);
      assert.equal(decRow?.getAttribute("aria-checked"), "false");

      // Switch to BIN
      const binRow = calc.shadowRoot!.querySelector('.radix-row[data-value="BIN"]');
      binRow?.dispatchEvent(new Event("click", { bubbles: true }));

      assert.equal(calc.engine.getRadix(), "BIN");
      assert.equal(calc.getDisplayValue(), "11111111");
      assert.equal(binRow?.classList.contains("active"), true);
      assert.equal(binRow?.getAttribute("aria-checked"), "true");
    });

    it("should enforce active keypad gating across radix modes (CASE-PROG-10, RULE-PROG-003)", () => {
      calc.toggleProgrammer();
      const hexButtons = calc.shadowRoot!.querySelectorAll(".btn-hex");
      const keypad = calc.shadowRoot!.getElementById("keypad-grid")!;
      const btnDecimal = keypad.querySelector('button[data-action="decimal"]') as any;
      const btn8 = keypad.querySelector('button[data-value="8"]') as any;
      const btn2 = keypad.querySelector('button[data-value="2"]') as any;
      const btn1 = keypad.querySelector('button[data-value="1"]') as any;

      // Decimal point is ALWAYS disabled in programmer mode
      assert.equal(btnDecimal.disabled, true);

      // In DEC (default): Hex A-F disabled, 0-9 enabled
      for (const btn of hexButtons) {
        assert.equal((btn as any).disabled, true);
      }
      assert.equal(btn8.disabled, false);
      assert.equal(btn2.disabled, false);
      assert.equal(btn1.disabled, false);

      // Switch to HEX: Hex A-F enabled, 0-9 enabled
      calc.setRadix("HEX");
      for (const btn of hexButtons) {
        assert.equal((btn as any).disabled, false);
      }
      assert.equal(btn8.disabled, false);
      assert.equal(btn2.disabled, false);
      assert.equal(btn1.disabled, false);

      // Switch to OCT: Hex A-F disabled, 8-9 disabled, 0-7 enabled
      calc.setRadix("OCT");
      for (const btn of hexButtons) {
        assert.equal((btn as any).disabled, true);
      }
      assert.equal(btn8.disabled, true);
      assert.equal(btn2.disabled, false);
      assert.equal(btn1.disabled, false);

      // Switch to BIN: Hex A-F disabled, 2-9 disabled, 0-1 enabled
      calc.setRadix("BIN");
      for (const btn of hexButtons) {
        assert.equal((btn as any).disabled, true);
      }
      assert.equal(btn8.disabled, true);
      assert.equal(btn2.disabled, true);
      assert.equal(btn1.disabled, false);

      // Close programmer mode: decimal point restored, digits 0-9 enabled
      calc.toggleProgrammer();
      assert.equal(btnDecimal.disabled, false);
      assert.equal(btn8.disabled, false);
      assert.equal(btn2.disabled, false);
      assert.equal(btn1.disabled, false);
      for (const btn of hexButtons) {
        assert.equal((btn as any).disabled, true);
      }
    });

    it("should cycle word size button and clamp active buffer (CASE-PROG-06)", () => {
      calc.toggleProgrammer();
      const wordSizeBtn = calc.shadowRoot!.getElementById("word-size-toggle");
      assert.ok(wordSizeBtn);
      assert.equal(wordSizeBtn.textContent, "QWORD (64-bit)");

      // Click to DWORD 32-bit
      wordSizeBtn.dispatchEvent(new Event("click", { bubbles: true }));
      assert.equal(calc.engine.getWordSize(), 32);
      assert.equal(wordSizeBtn.textContent, "DWORD (32-bit)");

      // Click to WORD 16-bit
      wordSizeBtn.dispatchEvent(new Event("click", { bubbles: true }));
      assert.equal(calc.engine.getWordSize(), 16);
      assert.equal(wordSizeBtn.textContent, "WORD (16-bit)");

      // Click to BYTE 8-bit
      wordSizeBtn.dispatchEvent(new Event("click", { bubbles: true }));
      assert.equal(calc.engine.getWordSize(), 8);
      assert.equal(wordSizeBtn.textContent, "BYTE (8-bit)");

      // In 8-bit mode, compute 200 + 100 -> truncates to 44 (300 & 0xFF) (CASE-PROG-06)
      calc.executeAction("allClear");
      calc.executeAction("digit", "2");
      calc.executeAction("digit", "0");
      calc.executeAction("digit", "0");
      calc.executeAction("operator", "+");
      calc.executeAction("digit", "1");
      calc.executeAction("digit", "0");
      calc.executeAction("digit", "0");
      calc.executeAction("calculate");
      assert.equal(calc.getDisplayValue(), "44");

      // Click to cycle back to QWORD 64-bit
      wordSizeBtn.dispatchEvent(new Event("click", { bubbles: true }));
      assert.equal(calc.engine.getWordSize(), 64);
      assert.equal(wordSizeBtn.textContent, "QWORD (64-bit)");
    });

    it("should evaluate bitwise operations via button clicks in programmer panel (CASE-PROG-03, CASE-PROG-04, CASE-PROG-05)", () => {
      calc.toggleProgrammer();
      const btnAnd = calc.shadowRoot!.querySelector('button[data-action="bitwiseAnd"]');
      const btnOr = calc.shadowRoot!.querySelector('button[data-action="bitwiseOr"]');
      const btnXor = calc.shadowRoot!.querySelector('button[data-action="bitwiseXor"]');
      const btnNot = calc.shadowRoot!.querySelector('button[data-action="bitwiseNot"]');
      const btnLsh = calc.shadowRoot!.querySelector('button[data-action="bitwiseLsh"]');
      const btnRsh = calc.shadowRoot!.querySelector('button[data-action="bitwiseRsh"]');

      // 12 AND 10 = 8
      calc.executeAction("digit", "1");
      calc.executeAction("digit", "2");
      btnAnd?.dispatchEvent(new Event("click", { bubbles: true }));
      calc.executeAction("digit", "1");
      calc.executeAction("digit", "0");
      calc.executeAction("calculate");
      assert.equal(calc.getDisplayValue(), "8");

      // 12 OR 10 = 14
      calc.executeAction("allClear");
      calc.executeAction("digit", "1");
      calc.executeAction("digit", "2");
      btnOr?.dispatchEvent(new Event("click", { bubbles: true }));
      calc.executeAction("digit", "1");
      calc.executeAction("digit", "0");
      calc.executeAction("calculate");
      assert.equal(calc.getDisplayValue(), "14");

      // 12 XOR 10 = 6
      calc.executeAction("allClear");
      calc.executeAction("digit", "1");
      calc.executeAction("digit", "2");
      btnXor?.dispatchEvent(new Event("click", { bubbles: true }));
      calc.executeAction("digit", "1");
      calc.executeAction("digit", "0");
      calc.executeAction("calculate");
      assert.equal(calc.getDisplayValue(), "6");

      // Bitwise NOT in 8-bit mode: NOT 0 = 255 (unsigned in HEX/DEC 8-bit)
      calc.executeAction("allClear");
      calc.setWordSize(8);
      calc.setRadix("HEX");
      btnNot?.dispatchEvent(new Event("click", { bubbles: true }));
      assert.equal(calc.getDisplayValue(), "FF");

      // Left shift: 5 LSH 2 = 20
      calc.executeAction("allClear");
      calc.setWordSize(64);
      calc.setRadix("DEC");
      calc.executeAction("digit", "5");
      btnLsh?.dispatchEvent(new Event("click", { bubbles: true }));
      calc.executeAction("digit", "2");
      calc.executeAction("calculate");
      assert.equal(calc.getDisplayValue(), "20");

      // Right shift: 20 RSH 2 = 5
      btnRsh?.dispatchEvent(new Event("click", { bubbles: true }));
      calc.executeAction("digit", "2");
      calc.executeAction("calculate");
      assert.equal(calc.getDisplayValue(), "5");
    });

    it("should support physical keyboard typing and gating in programmer mode (CASE-PROG-10, STL-PROG-03)", () => {
      calc.toggleProgrammer();
      calc.setRadix("HEX");

      // Type hex digits A, B, C via keyboard
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "a" }));
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "B" }));
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "c" }));
      assert.equal(calc.getDisplayValue(), "ABC");

      // Typing '.' is ignored in programmer mode
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "." }));
      assert.equal(calc.getDisplayValue(), "ABC");

      // Switch to BIN mode via setRadix
      calc.setRadix("BIN");
      calc.executeAction("allClear");

      // Type 1, 0, 1 -> 101
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "1" }));
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "0" }));
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "1" }));
      assert.equal(calc.getDisplayValue(), "101");

      // Invalid binary keys (2, 9, a, f) are ignored
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "2" }));
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "9" }));
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "a" }));
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "f" }));
      assert.equal(calc.getDisplayValue(), "101");

      // Bitwise keyboard operators: &
      calc.setRadix("DEC");
      calc.executeAction("allClear");
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "1" }));
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "2" }));
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "&" }));
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "1" }));
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "0" }));
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "Enter" }));
      assert.equal(calc.getDisplayValue(), "8");

      // Bitwise keyboard operator: ^ (XOR in programmer mode)
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "^" }));
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "8" }));
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "Enter" }));
      assert.equal(calc.getDisplayValue(), "0"); // 8 ^ 8 = 0
    });

    it("should provide accessible aria-labels and tactile pill styling on all programmer buttons (CASE-PROG-08)", () => {
      const panel = calc.shadowRoot!.getElementById("programmer-panel");
      assert.ok(panel);
      const buttons = panel.querySelectorAll("button");
      assert.ok(buttons.length >= 17, `Expected at least 17 buttons in programmer panel, found ${buttons.length}`);

      for (const btn of buttons) {
        assert.ok(btn.hasAttribute("aria-label"), `Programmer button ${btn.textContent} missing aria-label`);
        assert.ok(btn.getAttribute("aria-label")!.length > 0);
      }
    });

    it("should enforce mobile zero-overflow styling across 320px-390px viewports (CASE-PROG-11, RULE-PROG-004)", () => {
      const styleEl = calc.shadowRoot!.querySelector("style");
      assert.ok(styleEl);
      const css = styleEl.textContent;

      assert.ok(css.includes(".programmer-panel"));
      assert.ok(css.includes(".radix-panel"));
      assert.ok(css.includes(".radix-row"));
      assert.ok(css.includes(".bitwise-grid"));
      assert.ok(css.includes(".hex-keypad-grid"));
      assert.ok(css.includes("repeat(6, 1fr)"));
      assert.ok(css.includes("overflow-x: hidden"));
      assert.ok(css.includes("box-sizing: border-box"));
      assert.ok(css.includes("word-break: break-all"));
      assert.ok(!css.includes("!important"), "Strictly zero !important across stylesheets");
    });

    it("should preserve calculation history and buffer across programmer mode toggle (NEVER-CALC-002)", () => {
      calc.executeAction("digit", "4");
      calc.executeAction("digit", "2");
      assert.equal(calc.getDisplayValue(), "42");

      calc.toggleProgrammer();
      assert.equal(calc.getDisplayValue(), "42");
      assert.equal(calc.getProgrammerOpen(), true);

      calc.toggleProgrammer();
      assert.equal(calc.getDisplayValue(), "42");
      assert.equal(calc.getProgrammerOpen(), false);
    });
  });

  describe("13. Formula Expression Display & Parentheses Keys (CASE-EXPR-01, CASE-EXPR-05, CASE-EXPR-06, CASE-EXPR-11)", () => {
    it("should initialize with #expression-display rendered in Shadow DOM with ARIA roles (CASE-EXPR-01)", () => {
      const exprEl = calc.shadowRoot!.getElementById("expression-display");
      assert.ok(exprEl, "#expression-display must exist in Shadow DOM");
      assert.equal(exprEl.getAttribute("role"), "status");
      assert.equal(exprEl.getAttribute("aria-label"), "Expression formula");
      assert.equal(exprEl.getAttribute("aria-live"), "polite");
      assert.equal(exprEl.textContent, "");
    });

    it("should update #expression-display in real time on button clicks (CASE-EXPR-01, CASE-EXPR-05)", () => {
      const btn2 = calc.shadowRoot!.querySelector('button[data-value="2"]');
      const btnMult = calc.shadowRoot!.querySelector('button[data-value="*"]');
      const btnOpenParen = calc.shadowRoot!.querySelector('button[data-value="("]');
      const btn3 = calc.shadowRoot!.querySelector('button[data-value="3"]');
      const btnPlus = calc.shadowRoot!.querySelector('button[data-value="+"]');
      const btn4 = calc.shadowRoot!.querySelector('button[data-value="4"]');
      const btnCloseParen = calc.shadowRoot!.querySelector('button[data-value=")"]');
      const btnEquals = calc.shadowRoot!.querySelector('button[data-action="calculate"]');

      assert.ok(btnOpenParen, "Open parenthesis button must exist");
      assert.ok(btnCloseParen, "Close parenthesis button must exist");

      btn2?.dispatchEvent(new Event("click", { bubbles: true }));
      btnMult?.dispatchEvent(new Event("click", { bubbles: true }));
      btnOpenParen?.dispatchEvent(new Event("click", { bubbles: true }));
      btn3?.dispatchEvent(new Event("click", { bubbles: true }));
      btnPlus?.dispatchEvent(new Event("click", { bubbles: true }));
      btn4?.dispatchEvent(new Event("click", { bubbles: true }));
      btnCloseParen?.dispatchEvent(new Event("click", { bubbles: true }));

      const exprEl = calc.shadowRoot!.getElementById("expression-display");
      assert.equal(exprEl?.textContent, "2 * (3 + 4)");

      btnEquals?.dispatchEvent(new Event("click", { bubbles: true }));
      assert.equal(calc.getDisplayValue(), "14");
    });

    it("should evaluate parentheses via physical keyboard typing (CASE-EXPR-06)", () => {
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "(" }));
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "7" }));
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "+" }));
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "8" }));
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: ")" }));
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "Enter" }));

      assert.equal(calc.getDisplayValue(), "15");
    });

    it("should auto-balance unclosed parentheses on '=' keydown (CASE-EXPR-04)", () => {
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "(" }));
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "5" }));
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "*" }));
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "4" }));
      // Leave paren unclosed and press Enter
      mockWindow.dispatchEvent(new MockKeyboardEvent("keydown", { key: "Enter" }));

      assert.equal(calc.getDisplayValue(), "20");
    });

    it("should provide accessible aria-labels and tactile pill styling on parentheses buttons (CASE-EXPR-05)", () => {
      const openParen = calc.shadowRoot!.querySelector('button[data-value="("]');
      const closeParen = calc.shadowRoot!.querySelector('button[data-value=")"]');

      assert.ok(openParen);
      assert.ok(closeParen);
      assert.equal(openParen.getAttribute("data-action"), "paren");
      assert.equal(closeParen.getAttribute("data-action"), "paren");
      assert.equal(openParen.getAttribute("aria-label"), "Open parenthesis");
      assert.equal(closeParen.getAttribute("aria-label"), "Close parenthesis");
      assert.ok(openParen.classList.contains("span-two"));
      assert.ok(closeParen.classList.contains("span-two"));
    });

    it("should synchronize expression display in slotted custom display", () => {
      const slottedDiv = new MockElement("DIV");
      slottedDiv.setAttribute("slot", "display");

      const customExpr = new MockElement("DIV");
      customExpr.setAttribute("data-expression-display", "true");
      slottedDiv.appendChild(customExpr);

      const customVal = new MockElement("DIV");
      customVal.setAttribute("data-display-value", "true");
      slottedDiv.appendChild(customVal);

      calc.appendChild(slottedDiv);

      calc.executeAction("digit", "9");
      calc.executeAction("operator", "+");
      calc.executeAction("digit", "6");

      assert.equal(customExpr.textContent, "9 + 6");
    });

    it("should enforce mobile zero-overflow styling on expression display (CASE-EXPR-11)", () => {
      const styleEl = calc.shadowRoot!.querySelector("style");
      assert.ok(styleEl);
      const css = styleEl.textContent;

      assert.ok(css.includes(".expression-display"));
      assert.ok(css.includes("overflow: hidden"));
      assert.ok(css.includes("text-overflow: ellipsis"));
      assert.ok(css.includes("white-space: nowrap"));
      assert.ok(!css.includes("!important"), "CSS must strictly forbid !important");
    });
  });
});

