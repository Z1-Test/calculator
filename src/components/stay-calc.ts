import { CalcEngine } from "../engine/calc-engine.ts";
import type { CalcEngineState, Operator } from "../engine/types.ts";

const STYLES = `
  :host {
    display: block;
    width: 100%;
    max-width: 380px;
    margin: 0 auto;
    box-sizing: border-box;
    font-family: Inter, system-ui, -apple-system, sans-serif;
  }
  *, *::before, *::after {
    box-sizing: inherit;
  }
  .calc-container {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    background: var(--calc-background, #ffffff);
    border: 1px solid var(--calc-outline-low, #e4e4e7);
    border-radius: 24px;
    padding: 16px;
    box-sizing: border-box;
  }
  .display-card {
    background: var(--calc-surface, #f4f4f5);
    border: 1px solid var(--calc-outline-low, #e4e4e7);
    border-radius: 16px;
    padding: 16px 20px;
    min-height: 84px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: flex-end;
    margin-bottom: 14px;
    box-sizing: border-box;
  }
  .display-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    min-height: 18px;
    margin-bottom: 4px;
    box-sizing: border-box;
  }
  .memory-badge {
    display: none;
    font-family: "Plus Jakarta Sans", system-ui, -apple-system, sans-serif;
    font-size: 11px;
    font-weight: 700;
    line-height: 1;
    color: var(--calc-primary, #2563eb);
    background: var(--calc-container-low, #e4e4e7);
    border-radius: 4px;
    padding: 2px 6px;
    letter-spacing: 0.05em;
  }
  .memory-badge.active {
    display: inline-block;
  }
  .display-status {
    font-size: 12px;
    font-weight: 500;
    color: var(--calc-text-secondary, #71717a);
    min-height: 16px;
    line-height: 1.33;
    text-align: right;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .display-value {
    font-family: "Plus Jakarta Sans", system-ui, -apple-system, sans-serif;
    font-size: 36px;
    font-weight: 700;
    line-height: 1.15;
    letter-spacing: -0.02em;
    color: var(--calc-text-primary, #09090b);
    font-variant-numeric: tabular-nums;
    text-align: right;
    width: 100%;
    word-break: break-all;
    overflow-wrap: break-word;
  }
  .display-card.error .display-value {
    font-size: 20px;
    color: var(--calc-error, #ff453a);
  }
  .keypad-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    width: 100%;
    box-sizing: border-box;
  }
  button {
    font-family: Inter, system-ui, -apple-system, sans-serif;
    font-size: 18px;
    font-weight: 600;
    line-height: 1.25;
    letter-spacing: -0.01em;
    height: 56px;
    min-width: 0;
    border-radius: 9999px;
    border: 1px solid var(--calc-outline-low, #e4e4e7);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
    background-color: var(--calc-surface, #f4f4f5);
    color: var(--calc-text-primary, #09090b);
    transition: transform 0.08s ease, background-color 0.1s ease;
    box-sizing: border-box;
    padding: 0;
  }
  button:active {
    transform: scale(0.96);
  }
  button:focus-visible {
    outline: 2px solid var(--calc-primary, #2563eb);
    outline-offset: 2px;
  }
  .btn-operator {
    background-color: var(--calc-secondary, #475569);
    color: #ffffff;
    border-color: var(--calc-secondary, #475569);
  }
  .btn-action {
    background-color: var(--calc-container-low, #e4e4e7);
    color: var(--calc-text-primary, #09090b);
  }
  .btn-primary {
    background-color: var(--calc-primary, #2563eb);
    color: var(--calc-on-primary, #ffffff);
    border-color: var(--calc-primary, #2563eb);
  }
  .span-two {
    grid-column: span 2;
  }
  .calc-top-bar {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    width: 100%;
    margin-bottom: 8px;
    box-sizing: border-box;
  }
  .btn-history-toggle {
    height: 32px;
    padding: 0 14px;
    font-size: 13px;
    font-weight: 600;
    border-radius: 9999px;
    background-color: var(--calc-surface, #f4f4f5);
    color: var(--calc-text-primary, #09090b);
    border: 1px solid var(--calc-outline-low, #e4e4e7);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: background-color 0.1s ease, transform 0.08s ease;
  }
  .btn-history-toggle:hover {
    background-color: var(--calc-container-low, #e4e4e7);
  }
  .btn-history-toggle:focus-visible {
    outline: 2px solid var(--calc-primary, #2563eb);
    outline-offset: 2px;
  }
  .history-drawer {
    display: none;
    width: 100%;
    max-width: 100%;
    background: var(--calc-surface, #f4f4f5);
    border: 1px solid var(--calc-outline-low, #e4e4e7);
    border-radius: 16px;
    padding: 12px 14px;
    margin-bottom: 12px;
    box-sizing: border-box;
    max-height: 220px;
    overflow-y: auto;
    overflow-x: hidden;
  }
  .history-drawer.open {
    display: block;
  }
  .history-panel {
    width: 100%;
    box-sizing: border-box;
  }
  .history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding-bottom: 8px;
    margin-bottom: 8px;
    border-bottom: 1px solid var(--calc-outline-low, #e4e4e7);
    box-sizing: border-box;
  }
  .history-title {
    font-family: "Plus Jakarta Sans", system-ui, -apple-system, sans-serif;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--calc-text-secondary, #71717a);
  }
  .btn-history-clear {
    height: 26px;
    padding: 0 10px;
    font-size: 11px;
    font-weight: 600;
    border-radius: 9999px;
    background: transparent;
    color: var(--calc-error, #ff453a);
    border: 1px solid var(--calc-error, #ff453a);
    cursor: pointer;
  }
  .btn-history-clear:hover {
    background: rgba(255, 69, 58, 0.1);
  }
  .btn-history-clear:focus-visible {
    outline: 2px solid var(--calc-error, #ff453a);
    outline-offset: 2px;
  }
  .history-empty {
    font-size: 13px;
    color: var(--calc-text-secondary, #71717a);
    text-align: center;
    padding: 14px 0;
  }
  .history-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    box-sizing: border-box;
  }
  .history-item {
    width: 100%;
    min-height: 38px;
    padding: 8px 12px;
    border-radius: 8px;
    background: var(--calc-background, #ffffff);
    border: 1px solid var(--calc-outline-low, #e4e4e7);
    color: var(--calc-text-primary, #09090b);
    font-family: Inter, system-ui, -apple-system, sans-serif;
    font-size: 13px;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    text-align: right;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    word-break: break-all;
    overflow-wrap: break-word;
    cursor: pointer;
    box-sizing: border-box;
    transition: background-color 0.1s ease;
  }
  .history-item:hover {
    background-color: var(--calc-container-low, #e4e4e7);
  }
  .history-item:focus-visible {
    outline: 2px solid var(--calc-primary, #2563eb);
    outline-offset: 2px;
  }
`;

const TEMPLATE_HTML = `
  <style>${STYLES}</style>
  <div class="calc-container" part="container">
    <nav class="calc-top-bar" part="top-bar">
      <button type="button" class="btn-history-toggle" id="history-toggle" part="history-toggle" data-action="toggleHistory" aria-expanded="false" aria-controls="history-drawer" aria-label="Toggle calculation history">History</button>
    </nav>
    <section class="history-drawer" id="history-drawer" part="history-drawer" aria-label="Calculation History" role="region">
      <article class="history-panel" id="history-panel" part="history-panel">
        <header class="history-header">
          <span class="history-title">History</span>
          <button type="button" class="btn-history-clear" id="history-clear" part="history-clear" data-action="clearHistory" aria-label="Clear calculation history">Clear History</button>
        </header>
        <p class="history-empty" id="history-empty" part="history-empty">No calculations yet</p>
        <ul class="history-list" id="history-list" part="history-list" role="list"></ul>
      </article>
    </section>
    <slot name="display">
      <div class="display-card" id="display-card" part="display">
        <header class="display-header" part="header">
          <span class="memory-badge" id="memory-badge" part="memory-badge" aria-label="Memory Active" style="display: none;">M</span>
          <span class="display-status" id="display-status" part="status"></span>
        </header>
        <div class="display-value" id="display-value" part="value">0</div>
      </div>
    </slot>
    <slot name="keypad">
      <div class="keypad-grid" id="keypad-grid" part="keypad">
        <button type="button" class="btn-action" data-action="memoryClear" aria-label="Memory Clear">MC</button>
        <button type="button" class="btn-action" data-action="memoryRecall" aria-label="Memory Recall">MR</button>
        <button type="button" class="btn-action" data-action="memorySubtract" aria-label="Memory Subtract">M-</button>
        <button type="button" class="btn-action" data-action="memoryAdd" aria-label="Memory Add">M+</button>

        <button type="button" class="btn-action" data-action="clear" aria-label="Clear Entry">C</button>
        <button type="button" class="btn-action" data-action="allClear" aria-label="All Clear">AC</button>
        <button type="button" class="btn-action" data-action="backspace" aria-label="Backspace">⌫</button>
        <button type="button" class="btn-operator" data-action="operator" data-value="/" aria-label="Divide">÷</button>

        <button type="button" class="btn-numeric" data-action="digit" data-value="7">7</button>
        <button type="button" class="btn-numeric" data-action="digit" data-value="8">8</button>
        <button type="button" class="btn-numeric" data-action="digit" data-value="9">9</button>
        <button type="button" class="btn-operator" data-action="operator" data-value="*" aria-label="Multiply">×</button>

        <button type="button" class="btn-numeric" data-action="digit" data-value="4">4</button>
        <button type="button" class="btn-numeric" data-action="digit" data-value="5">5</button>
        <button type="button" class="btn-numeric" data-action="digit" data-value="6">6</button>
        <button type="button" class="btn-operator" data-action="operator" data-value="-" aria-label="Subtract">−</button>

        <button type="button" class="btn-numeric" data-action="digit" data-value="1">1</button>
        <button type="button" class="btn-numeric" data-action="digit" data-value="2">2</button>
        <button type="button" class="btn-numeric" data-action="digit" data-value="3">3</button>
        <button type="button" class="btn-operator" data-action="operator" data-value="+" aria-label="Add">+</button>

        <button type="button" class="btn-numeric span-two" data-action="digit" data-value="0">0</button>
        <button type="button" class="btn-numeric" data-action="decimal" aria-label="Decimal Point">.</button>
        <button type="button" class="btn-primary" data-action="calculate" aria-label="Equals">=</button>
      </div>
    </slot>
  </div>
`;

const HTMLElementBase =
  typeof HTMLElement !== "undefined"
    ? HTMLElement
    : (class {
        shadowRoot: any = null;
        attachShadow(_options: ShadowRootInit) {
          return {
            innerHTML: "",
            getElementById: () => null,
            addEventListener: () => {},
            removeEventListener: () => {},
          };
        }
      } as unknown as typeof HTMLElement);

/**
 * Autonomous W3C Custom Element representing the StayCalc interactive calculator.
 * Supports Declarative Shadow DOM (DSD), slot projection, keyboard navigation,
 * and zero horizontal scroll overflow on mobile viewports.
 */
export class StayCalc extends HTMLElementBase {
  public engine: CalcEngine;
  private isConnectedToDOM: boolean = false;
  private isHistoryOpen: boolean = false;
  private keydownListener: ((event: KeyboardEvent) => void) | null = null;
  private keypadClickListener: ((event: Event) => void) | null = null;
  private historyClickListener: ((event: Event) => void) | null = null;
  private historyToggleListener: ((event: Event) => void) | null = null;
  private historyKeydownListener: ((event: KeyboardEvent) => void) | null = null;

  constructor() {
    super();
    this.engine = new CalcEngine();

    // Attach or adopt Declarative Shadow DOM
    let root = this.shadowRoot;
    if (!root && typeof this.attachShadow === "function") {
      root = this.attachShadow({ mode: "open" });
    }

    if (root && (!root.childNodes || root.childNodes.length === 0)) {
      root.innerHTML = TEMPLATE_HTML;
    }
  }

  /**
   * Lifecycle callback invoked when the element is appended to a document.
   */
  public connectedCallback(): void {
    this.isConnectedToDOM = true;

    // Attach click listener on keypad slot container (delegated)
    const keypadContainer =
      this.shadowRoot?.getElementById("keypad-grid") || this.shadowRoot;
    if (keypadContainer) {
      this.keypadClickListener = (event: Event) => {
        const target = (event.target as HTMLElement)?.closest?.("button");
        if (!target) return;
        const action = target.getAttribute("data-action");
        const value = target.getAttribute("data-value") ?? target.getAttribute("data-index");
        this.executeAction(action, value);
      };
      keypadContainer.addEventListener("click", this.keypadClickListener);
    }

    // Attach click listener on history drawer (delegated for recall and clear)
    const historyDrawer = this.shadowRoot?.getElementById("history-drawer");

    if (historyDrawer) {
      this.historyClickListener = (event: Event) => {
        const target = (event.target as HTMLElement)?.closest?.("button");
        if (!target) return;
        const action = target.getAttribute("data-action");
        const value = target.getAttribute("data-value") ?? target.getAttribute("data-index");
        this.executeAction(action, value);
      };
      historyDrawer.addEventListener("click", this.historyClickListener);
    }

    // Attach click listener on history toggle button
    const historyToggle = this.shadowRoot?.getElementById("history-toggle");
    if (historyToggle) {
      this.historyToggleListener = (_event: Event) => {
        this.executeAction("toggleHistory");
      };
      historyToggle.addEventListener("click", this.historyToggleListener);
    }

    // Attach keydown listener on history drawer for Enter/Space recall
    if (historyDrawer) {
      this.historyKeydownListener = (event: KeyboardEvent) => {
        const target = (event.target as HTMLElement)?.closest?.("button");
        if (
          target &&
          target.getAttribute("data-action") === "recallHistory" &&
          (event.key === "Enter" || event.key === " ")
        ) {
          event.preventDefault?.();
          event.stopPropagation?.();
          const index = target.getAttribute("data-index");
          this.executeAction("recallHistory", index);
        }
      };
      historyDrawer.addEventListener("keydown", this.historyKeydownListener);
    }

    // Attach global window keyboard listener
    if (typeof window !== "undefined") {
      this.keydownListener = (event: KeyboardEvent) => {
        this.handleKeyDown(event);
      };
      window.addEventListener("keydown", this.keydownListener);
    }

    this.updateDisplay();
  }

  /**
   * Lifecycle callback invoked when the element is removed from a document.
   */
  public disconnectedCallback(): void {
    this.isConnectedToDOM = false;

    if (this.keypadClickListener && this.shadowRoot) {
      const keypadContainer =
        this.shadowRoot.getElementById("keypad-grid") || this.shadowRoot;
      keypadContainer?.removeEventListener("click", this.keypadClickListener);
      this.keypadClickListener = null;
    }

    if (this.historyClickListener && this.shadowRoot) {
      const historyDrawer = this.shadowRoot.getElementById("history-drawer");
      historyDrawer?.removeEventListener("click", this.historyClickListener);
      this.historyClickListener = null;
    }

    if (this.historyToggleListener && this.shadowRoot) {
      const historyToggle = this.shadowRoot.getElementById("history-toggle");
      historyToggle?.removeEventListener("click", this.historyToggleListener);
      this.historyToggleListener = null;
    }

    if (this.historyKeydownListener && this.shadowRoot) {
      const historyDrawer = this.shadowRoot.getElementById("history-drawer");
      historyDrawer?.removeEventListener("keydown", this.historyKeydownListener);
      this.historyKeydownListener = null;
    }

    if (this.keydownListener && typeof window !== "undefined") {
      window.removeEventListener("keydown", this.keydownListener);
      this.keydownListener = null;
    }
  }

  /**
   * Toggles the visibility of the calculation history drawer and synchronizes ARIA attributes.
   */
  public toggleHistory(): void {
    this.isHistoryOpen = !this.isHistoryOpen;
    if (this.shadowRoot) {
      const drawer = this.shadowRoot.getElementById("history-drawer");
      const toggle = this.shadowRoot.getElementById("history-toggle");
      if (drawer) {
        if (this.isHistoryOpen) {
          drawer.classList.add("open");
          drawer.style.display = "block";
        } else {
          drawer.classList.remove("open");
          drawer.style.display = "none";
        }
      }
      if (toggle) {
        toggle.setAttribute("aria-expanded", String(this.isHistoryOpen));
      }
    }
  }

  /**
   * Returns true if the history drawer is currently open.
   */
  public getHistoryOpen(): boolean {
    return this.isHistoryOpen;
  }

  /**
   * Dispatches an action command to the arithmetic engine and updates the display.
   */
  public executeAction(action: string | null | undefined, value?: string | null): void {
    if (!action) return;

    switch (action) {
      case "digit":
        if (value !== undefined && value !== null) {
          this.engine.inputDigit(value);
        }
        break;
      case "decimal":
        this.engine.inputDecimal();
        break;
      case "operator":
        if (value) {
          this.engine.inputOperator(value as Operator);
        }
        break;
      case "calculate":
        this.engine.calculate();
        break;
      case "clear":
        this.engine.clear();
        break;
      case "allClear":
        this.engine.allClear();
        break;
      case "backspace":
        this.engine.backspace();
        break;
      case "memoryAdd":
        this.engine.memoryAdd();
        break;
      case "memorySubtract":
        this.engine.memorySubtract();
        break;
      case "memoryRecall":
        this.engine.memoryRecall();
        break;
      case "memoryClear":
        this.engine.memoryClear();
        break;
      case "toggleHistory":
        this.toggleHistory();
        break;
      case "recallHistory":
        if (value !== undefined && value !== null) {
          this.engine.recallHistory(Number(value));
        }
        break;
      case "clearHistory":
        this.engine.clearHistory();
        break;
    }

    this.updateDisplay();
  }

  /**
   * Handles keyboard navigation and key mapping for physical keyboard typing.
   */
  public handleKeyDown(event: KeyboardEvent): void {
    if (event.defaultPrevented) {
      return;
    }

    // Preserve browser shortcuts (e.g. Ctrl+C, Cmd+R) per RULE-UI-004 & DEC-UI-01
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    const key = event.key;

    // Support Enter or Space on focused history item
    const target = event.target as HTMLElement | null;
    const historyItem = target?.closest?.("button");
    if (
      historyItem &&
      historyItem.getAttribute("data-action") === "recallHistory" &&
      (key === "Enter" || key === " ")
    ) {
      event.preventDefault?.();
      const index = historyItem.getAttribute("data-index");
      this.executeAction("recallHistory", index);
      return;
    }

    if (key >= "0" && key <= "9") {
      event.preventDefault?.();
      this.executeAction("digit", key);
    } else if (key === ".") {
      event.preventDefault?.();
      this.executeAction("decimal");
    } else if (key === "+" || key === "-" || key === "*" || key === "/") {
      event.preventDefault?.();
      this.executeAction("operator", key);
    } else if (key === "Enter" || key === "=") {
      event.preventDefault?.();
      this.executeAction("calculate");
    } else if (key === "Escape" || key === "c" || key === "C") {
      event.preventDefault?.();
      this.executeAction("clear");
    } else if (key === "Delete") {
      event.preventDefault?.();
      this.executeAction("allClear");
    } else if (key === "Backspace") {
      event.preventDefault?.();
      this.executeAction("backspace");
    }
  }

  /**
   * Synchronizes the displayed value and status with the underlying CalcEngine state.
   */
  public updateDisplay(): void {
    const displayVal = this.engine.getDisplay();
    const state: CalcEngineState = this.engine.getState();

    // 1. Slotted custom display support
    if (typeof this.querySelector === "function") {
      const slottedDisplay = this.querySelector('[slot="display"]');
      if (slottedDisplay) {
        const customValue =
          slottedDisplay.querySelector?.("[data-display-value]") || slottedDisplay;
        if (customValue) {
          customValue.textContent = displayVal;
        }
        if (state.isLocked) {
          slottedDisplay.classList?.add?.("error");
        } else {
          slottedDisplay.classList?.remove?.("error");
        }

        const slottedBadge =
          slottedDisplay.querySelector?.("[data-memory-badge]") ||
          slottedDisplay.querySelector?.("#memory-badge");
        if (slottedBadge) {
          if (state.hasMemory) {
            slottedBadge.classList?.add?.("active");
            if (slottedBadge.style) slottedBadge.style.display = "inline-block";
          } else {
            slottedBadge.classList?.remove?.("active");
            if (slottedBadge.style) slottedBadge.style.display = "none";
          }
        }
      }
    }

    // 2. Default Shadow DOM display card
    if (this.shadowRoot) {
      const valueEl = this.shadowRoot.getElementById("display-value");
      if (valueEl) {
        valueEl.textContent = displayVal;
      }

      const cardEl = this.shadowRoot.getElementById("display-card");
      if (cardEl) {
        if (state.isLocked) {
          cardEl.classList.add("error");
        } else {
          cardEl.classList.remove("error");
        }
      }

      const statusEl = this.shadowRoot.getElementById("display-status");
      if (statusEl) {
        if (state.pendingOperator && state.accumulator !== null && !state.isLocked) {
          statusEl.textContent = `${state.accumulator} ${state.pendingOperator}`;
        } else {
          statusEl.textContent = "";
        }
      }

      const memoryBadge = this.shadowRoot.getElementById("memory-badge");
      if (memoryBadge) {
        if (state.hasMemory) {
          memoryBadge.classList.add("active");
          memoryBadge.style.display = "inline-block";
        } else {
          memoryBadge.classList.remove("active");
          memoryBadge.style.display = "none";
        }
      }

      // 3. History Drawer synchronization
      const historyList = this.shadowRoot.getElementById("history-list");
      const historyEmpty = this.shadowRoot.getElementById("history-empty");
      const history = this.engine.getHistory();

      if (historyList && historyEmpty) {
        if (history.length === 0) {
          historyEmpty.style.display = "block";
          historyList.style.display = "none";
          historyList.innerHTML = "";
        } else {
          historyEmpty.style.display = "none";
          historyList.style.display = "flex";
          let itemsHtml = "";
          for (let i = 0; i < history.length; i++) {
            const entry = history[i];
            itemsHtml += `<button type="button" class="history-item" data-action="recallHistory" data-index="${i}" role="button" tabindex="0" aria-label="Recall calculation ${entry.expression}">${entry.expression}</button>`;
          }
          historyList.innerHTML = itemsHtml;
        }
      }
    }
  }

  /**
   * Returns current display string.
   */
  public getDisplayValue(): string {
    return this.engine.getDisplay();
  }
}

// Register custom element in standard customElements registry
if (typeof customElements !== "undefined" && !customElements.get("stay-calc")) {
  customElements.define("stay-calc", StayCalc);
}
