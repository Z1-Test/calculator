import { PrecisionArithmeticEngine } from "../engine/index.ts";
import type { EngineState, Operator } from "../engine/index.ts";
import { renderStayCalcTemplate } from "./stay-calc.template.ts";

// Safe BaseElement fallback for headless/SSR/Node.js environments
const BaseElement: {
  new (): HTMLElement;
  prototype: HTMLElement;
} = typeof HTMLElement !== "undefined" ? HTMLElement : (class {} as unknown as typeof HTMLElement);

/**
 * StayCalc Autonomous Custom Element
 * Implements accessible, responsive calculator with Declarative Shadow DOM (DSD),
 * keyboard delegation, polite ARIA live updates, and zero external dependencies.
 * Satisfies RULE-UI-001..006, NEVER-UI-001, DEC-CALC-02, SEAM-CALC-01.
 */
export class StayCalc extends BaseElement {
  public static readonly TAG_NAME = "stay-calc";

  private readonly engine: PrecisionArithmeticEngine = new PrecisionArithmeticEngine();
  private displayElement: HTMLElement | null = null;
  private statusElement: HTMLElement | null = null;
  private keypadElement: HTMLElement | null = null;

  private boundHandleKeypadClick = this.handleKeypadClick.bind(this);
  private boundHandleKeyDown = this.handleKeyDown.bind(this);

  constructor() {
    super();
  }

  public connectedCallback(): void {
    if (!this.shadowRoot) {
      if (typeof this.attachShadow === "function") {
        const shadow = this.attachShadow({ mode: "open" });
        shadow.innerHTML = renderStayCalcTemplate();
      }
    } else if (this.shadowRoot.children.length === 0) {
      this.shadowRoot.innerHTML = renderStayCalcTemplate();
    }

    if (this.shadowRoot) {
      this.displayElement = this.shadowRoot.querySelector("#display");
      this.statusElement = this.shadowRoot.querySelector("#status");
      this.keypadElement = this.shadowRoot.querySelector(".calc-keypad");
    }

    if (this.keypadElement) {
      this.keypadElement.addEventListener("click", this.boundHandleKeypadClick);
    }

    if (typeof window !== "undefined") {
      window.addEventListener("keydown", this.boundHandleKeyDown);
    }

    this.updateDisplay();
  }

  public disconnectedCallback(): void {
    if (this.keypadElement) {
      this.keypadElement.removeEventListener("click", this.boundHandleKeypadClick);
    }
    if (typeof window !== "undefined") {
      window.removeEventListener("keydown", this.boundHandleKeyDown);
    }
  }

  /**
   * Returns current visible display string.
   */
  public getDisplay(): string {
    return this.engine.getDisplay();
  }

  /**
   * Returns copy of internal arithmetic engine state.
   */
  public getState(): Readonly<EngineState> {
    return this.engine.getState();
  }

  /**
   * Inputs a single numeric digit ('0'-'9').
   */
  public inputDigit(digit: string): string {
    const val = this.engine.inputDigit(digit);
    this.updateDisplay();
    return val;
  }

  /**
   * Inputs a decimal point ('.').
   */
  public inputDecimal(): string {
    const val = this.engine.inputDecimal();
    this.updateDisplay();
    return val;
  }

  /**
   * Inputs an operator (+, -, *, /, etc.).
   */
  public inputOperator(op: Operator | string): string {
    const val = this.engine.inputOperator(op);
    this.updateDisplay();
    return val;
  }

  /**
   * Evaluates pending calculation (=).
   */
  public calculate(): string {
    const val = this.engine.calculate();
    this.updateDisplay();
    return val;
  }

  /**
   * Alias for calculate().
   */
  public equals(): string {
    return this.calculate();
  }

  /**
   * Resets active buffer to 0 preserving accumulator (C).
   */
  public clear(): string {
    const val = this.engine.clear();
    this.updateDisplay();
    return val;
  }

  /**
   * Resets all registers, pending operations, and errors (AC).
   */
  public allClear(): string {
    const val = this.engine.allClear();
    this.updateDisplay();
    return val;
  }

  /**
   * Toggles sign (+/-) of current buffer.
   */
  public toggleSign(): string {
    const val = this.engine.toggleSign();
    this.updateDisplay();
    return val;
  }

  /**
   * Divides current buffer by 100 for percentage calculation.
   */
  public inputPercent(): string {
    const val = this.engine.inputPercent();
    this.updateDisplay();
    return val;
  }

  /**
   * Delegates button clicks on keypad.
   */
  public handleKeypadClick(event: MouseEvent | Event): void {
    const target = event.target as HTMLElement | null;
    const button = target?.closest ? target.closest("button") : null;
    if (!button) return;

    if (button.dataset.digit !== undefined) {
      this.inputDigit(button.dataset.digit);
      return;
    }

    if (button.dataset.operator !== undefined) {
      this.inputOperator(button.dataset.operator);
      return;
    }

    const action = button.dataset.action;
    switch (action) {
      case "all-clear":
        this.allClear();
        break;
      case "clear":
        this.clear();
        break;
      case "equals":
        this.calculate();
        break;
      case "decimal":
        this.inputDecimal();
        break;
      case "toggle-sign":
        this.toggleSign();
        break;
      case "percent":
        this.inputPercent();
        break;
    }
  }

  /**
   * Delegates physical keyboard events.
   */
  public handleKeyDown(event: KeyboardEvent): void {
    // Ignore keystrokes if the user is typing inside an input/textarea
    const activeEl = (event.target as HTMLElement | null)?.tagName?.toLowerCase();
    if (activeEl === "input" || activeEl === "textarea" || (event.target as HTMLElement | null)?.isContentEditable) {
      return;
    }

    // Ignore system key combinations (Cmd+R, Ctrl+C, etc.)
    if (event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }

    const key = event.key;
    const code = event.code;

    // Digits: '0'-'9'
    if (typeof key === "string" && /^[0-9]$/.test(key)) {
      if (typeof event.preventDefault === "function") event.preventDefault();
      this.inputDigit(key);
      return;
    }
    if (typeof code === "string" && /^Numpad[0-9]$/.test(code)) {
      if (typeof event.preventDefault === "function") event.preventDefault();
      const digit = code.replace("Numpad", "");
      this.inputDigit(digit);
      return;
    }

    // Operators
    if (key === "+" || code === "NumpadAdd") {
      if (typeof event.preventDefault === "function") event.preventDefault();
      this.inputOperator("+");
      return;
    }
    if (key === "-" || code === "NumpadSubtract") {
      if (typeof event.preventDefault === "function") event.preventDefault();
      this.inputOperator("-");
      return;
    }
    if (key === "*" || code === "NumpadMultiply" || key?.toLowerCase() === "x") {
      if (typeof event.preventDefault === "function") event.preventDefault();
      this.inputOperator("*");
      return;
    }
    if (key === "/" || code === "NumpadDivide") {
      if (typeof event.preventDefault === "function") event.preventDefault();
      this.inputOperator("/");
      return;
    }

    // Equals / Calculate
    if (key === "=" || key === "Enter" || code === "NumpadEnter") {
      if (typeof event.preventDefault === "function") event.preventDefault();
      this.calculate();
      return;
    }

    // Decimal
    if (key === "." || key === "," || code === "NumpadDecimal" || key === "Decimal") {
      if (typeof event.preventDefault === "function") event.preventDefault();
      this.inputDecimal();
      return;
    }

    // Clear and All Clear
    if (key === "Escape") {
      if (typeof event.preventDefault === "function") event.preventDefault();
      this.allClear();
      return;
    }
    if (key === "Backspace" || key?.toLowerCase() === "c") {
      if (typeof event.preventDefault === "function") event.preventDefault();
      this.clear();
      return;
    }

    // Percent
    if (key === "%") {
      if (typeof event.preventDefault === "function") event.preventDefault();
      this.inputPercent();
      return;
    }
  }

  /**
   * Synchronizes visible display and announces changes to ARIA live region.
   */
  private updateDisplay(): void {
    const text = this.engine.getDisplay();
    if (this.displayElement) {
      this.displayElement.textContent = text;
    }
    if (this.statusElement) {
      this.statusElement.textContent = text;
    }
  }
}

/**
 * Convenience registration function to register <stay-calc> if not already defined.
 */
export function defineStayCalc(): typeof StayCalc {
  if (typeof customElements !== "undefined" && !customElements.get(StayCalc.TAG_NAME)) {
    customElements.define(StayCalc.TAG_NAME, StayCalc);
  }
  return StayCalc;
}

// Auto-register in standard browser environment
if (typeof customElements !== "undefined" && !customElements.get(StayCalc.TAG_NAME)) {
  customElements.define(StayCalc.TAG_NAME, StayCalc);
}
