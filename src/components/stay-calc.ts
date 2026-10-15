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
  .display-status {
    font-size: 12px;
    font-weight: 500;
    color: var(--calc-text-secondary, #71717a);
    min-height: 16px;
    line-height: 1.33;
    text-align: right;
    width: 100%;
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
`;

const TEMPLATE_HTML = `
  <style>${STYLES}</style>
  <div class="calc-container" part="container">
    <slot name="display">
      <div class="display-card" id="display-card" part="display">
        <div class="display-status" id="display-status" part="status"></div>
        <div class="display-value" id="display-value" part="value">0</div>
      </div>
    </slot>
    <slot name="keypad">
      <div class="keypad-grid" id="keypad-grid" part="keypad">
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
  private keydownListener: ((event: KeyboardEvent) => void) | null = null;
  private keypadClickListener: ((event: Event) => void) | null = null;

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
        const value = target.getAttribute("data-value");
        this.executeAction(action, value);
      };
      keypadContainer.addEventListener("click", this.keypadClickListener);
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

    if (this.keydownListener && typeof window !== "undefined") {
      window.removeEventListener("keydown", this.keydownListener);
      this.keydownListener = null;
    }
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
    }

    this.updateDisplay();
  }

  /**
   * Handles keyboard navigation and key mapping for physical keyboard typing.
   */
  public handleKeyDown(event: KeyboardEvent): void {
    // Preserve browser shortcuts (e.g. Ctrl+C, Cmd+R) per RULE-UI-004 & DEC-UI-01
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    const key = event.key;

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
