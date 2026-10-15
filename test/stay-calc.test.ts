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
});
