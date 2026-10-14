/**
 * src/components/stay-calc.ts
 *
 * W3C Autonomous Custom Element <stay-calc> providing:
 * - Encapsulated Declarative Shadow DOM (DSD) template and slot projection graph
 * - Integration with F1 CalculatorEngine via SEAM-ENGINE-01
 * - Full interactive keypad buttons (0-9, ., +, -, *, /, =, C, AC, +/-, ⌫)
 * - Physical keyboard interception (0-9, operators, Enter, Backspace, Escape, .)
 * - WCAG 2.2 AA contrast compliance and visible focus rings (:focus-visible)
 * - CSS logical properties and container query responsive layout
 * - Mobile viewport zero horizontal scroll overflow (320px–390px)
 * - Polite ARIA live region (aria-live="polite", aria-atomic="true")
 * - Strictly zero external runtime dependencies
 */

import {
  CalculatorEngine,
  createInitialState,
} from '../engine/calculator-engine.ts';
import type {
  CalculatorAction,
  CalculatorState,
  Operator,
} from '../engine/types.ts';

const TEMPLATE_STYLES = `
  :host {
    --calc-primary: #2563eb;
    --calc-on-primary: #ffffff;
    --calc-secondary: #475569;
    --calc-tertiary: #f4f4f5;
    --calc-background: #ffffff;
    --calc-surface: #f4f4f5;
    --calc-container-high: #ffffff;
    --calc-container-medium: #f4f4f5;
    --calc-container-low: #e4e4e7;
    --calc-text-primary: #09090b;
    --calc-text-secondary: #71717a;
    --calc-outline-low: #e4e4e7;
    --calc-error: #ff453a;
    display: block;
    box-sizing: border-box;
    inline-size: 100%;
    max-inline-size: 400px;
    margin-inline: auto;
    font-family: 'Plus Jakarta Sans', Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    container-type: inline-size;
    container-name: calc-host;
  }

  *, *::before, *::after {
    box-sizing: border-box;
  }

  .calc-container {
    inline-size: 100%;
    padding-inline: 16px;
    padding-block: 20px;
    background-color: var(--calc-background, #ffffff);
    border: 1px solid var(--calc-outline-low, #e4e4e7);
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    box-sizing: border-box;
  }

  .display-slot-wrapper {
    inline-size: 100%;
  }

  .display-screen {
    inline-size: 100%;
    min-block-size: 72px;
    padding-inline: 20px;
    padding-block: 16px;
    background-color: var(--calc-surface, #f4f4f5);
    border: 1px solid var(--calc-outline-low, #e4e4e7);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: flex-end;
    overflow: hidden;
    transition: border-color 0.15s ease, background-color 0.15s ease;
  }

  .display-screen.error {
    border-color: var(--calc-error, #ff453a);
    background-color: rgba(255, 69, 58, 0.08);
  }

  .display-value {
    font-size: 32px;
    font-weight: 700;
    color: var(--calc-text-primary, #09090b);
    font-variant-numeric: tabular-nums;
    line-height: 1.15;
    letter-spacing: -0.02em;
    text-align: end;
    word-break: break-all;
    max-inline-size: 100%;
  }

  .display-screen.error .display-value {
    font-size: 20px;
    color: var(--calc-error, #ff453a);
  }

  .keypad-slot-wrapper {
    inline-size: 100%;
  }

  .keypad-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    inline-size: 100%;
  }

  .calc-btn {
    appearance: none;
    -webkit-appearance: none;
    border: 1px solid var(--calc-outline-low, #e4e4e7);
    background-color: var(--calc-surface, #f4f4f5);
    color: var(--calc-text-primary, #09090b);
    font-family: inherit;
    font-size: 18px;
    font-weight: 600;
    line-height: 1;
    min-block-size: 52px;
    border-radius: 9999px;
    padding-inline: 12px;
    padding-block: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
    transition: background-color 0.15s ease, transform 0.1s ease, border-color 0.15s ease;
    touch-action: manipulation;
  }

  .calc-btn:hover {
    background-color: var(--calc-container-low, #e4e4e7);
  }

  .calc-btn:active {
    transform: scale(0.96);
  }

  .calc-btn:focus-visible {
    outline: 2px solid var(--calc-primary, #2563eb);
    outline-offset: 2px;
  }

  .calc-btn.btn-op {
    background-color: var(--calc-tertiary, #f4f4f5);
    color: var(--calc-secondary, #475569);
  }

  .calc-btn.btn-action {
    background-color: var(--calc-container-low, #e4e4e7);
    color: var(--calc-text-primary, #09090b);
  }

  .calc-btn.btn-equals {
    background-color: var(--calc-primary, #2563eb);
    color: var(--calc-on-primary, #ffffff);
    border-color: var(--calc-primary, #2563eb);
  }

  .calc-btn.btn-equals:hover {
    background-color: #1d4ed8;
  }

  @container calc-host (max-width: 390px) {
    .calc-container {
      padding-inline: 10px;
      padding-block: 12px;
      gap: 10px;
    }
    .keypad-grid {
      gap: 8px;
    }
    .calc-btn {
      min-block-size: 46px;
      font-size: 16px;
      padding-inline: 8px;
      padding-block: 10px;
    }
    .display-value {
      font-size: 26px;
    }
  }
`;

const TEMPLATE_HTML = `
  <style>${TEMPLATE_STYLES}</style>
  <div class="calc-container" part="container">
    <div class="display-slot-wrapper">
      <slot name="display">
        <div class="display-screen" id="defaultDisplay" role="status" aria-live="polite" aria-atomic="true">
          <span class="display-value" id="displayValue">0</span>
        </div>
      </slot>
    </div>
    <div class="keypad-slot-wrapper">
      <slot name="keypad">
        <div class="keypad-grid" id="defaultKeypad" role="group" aria-label="Calculator Keypad">
          <button type="button" class="calc-btn btn-action" data-action="all-clear" aria-label="All Clear">AC</button>
          <button type="button" class="calc-btn btn-action" data-action="clear" aria-label="Clear">C</button>
          <button type="button" class="calc-btn btn-action" data-action="negate" aria-label="Toggle Sign">+/-</button>
          <button type="button" class="calc-btn btn-op" data-action="operator" data-value="/" aria-label="Divide">÷</button>

          <button type="button" class="calc-btn" data-action="digit" data-value="7" aria-label="7">7</button>
          <button type="button" class="calc-btn" data-action="digit" data-value="8" aria-label="8">8</button>
          <button type="button" class="calc-btn" data-action="digit" data-value="9" aria-label="9">9</button>
          <button type="button" class="calc-btn btn-op" data-action="operator" data-value="*" aria-label="Multiply">×</button>

          <button type="button" class="calc-btn" data-action="digit" data-value="4" aria-label="4">4</button>
          <button type="button" class="calc-btn" data-action="digit" data-value="5" aria-label="5">5</button>
          <button type="button" class="calc-btn" data-action="digit" data-value="6" aria-label="6">6</button>
          <button type="button" class="calc-btn btn-op" data-action="operator" data-value="-" aria-label="Subtract">−</button>

          <button type="button" class="calc-btn" data-action="digit" data-value="1" aria-label="1">1</button>
          <button type="button" class="calc-btn" data-action="digit" data-value="2" aria-label="2">2</button>
          <button type="button" class="calc-btn" data-action="digit" data-value="3" aria-label="3">3</button>
          <button type="button" class="calc-btn btn-op" data-action="operator" data-value="+" aria-label="Add">+</button>

          <button type="button" class="calc-btn" data-action="digit" data-value="0" aria-label="0">0</button>
          <button type="button" class="calc-btn" data-action="decimal" aria-label="Decimal Point">.</button>
          <button type="button" class="calc-btn btn-action" data-action="backspace" aria-label="Backspace">⌫</button>
          <button type="button" class="calc-btn btn-equals" data-action="equals" aria-label="Equals">=</button>
        </div>
      </slot>
    </div>
  </div>
`;

// Universal BaseElement supporting browser and test harness environments
const BaseClass: { new (): any } =
  typeof globalThis.HTMLElement !== 'undefined'
    ? globalThis.HTMLElement
    : class {};

export class StayCalc extends BaseClass {
  private engine: CalculatorEngine;
  private defaultDisplayEl: HTMLElement | null = null;
  private displayValueEl: HTMLElement | null = null;
  private keypadEl: HTMLElement | null = null;
  private isConnectedToDOM = false;

  constructor() {
    super();
    this.engine = new CalculatorEngine();
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeypadClick = this.handleKeypadClick.bind(this);
    this.setupShadowDOM();
  }

  private setupShadowDOM(): void {
    if (typeof this.attachShadow !== 'function') {
      return;
    }

    const shadow = this.shadowRoot ?? this.attachShadow({ mode: 'open' });
    if (!shadow.innerHTML || shadow.innerHTML.trim() === '') {
      shadow.innerHTML = TEMPLATE_HTML;
    }

    this.defaultDisplayEl = shadow.querySelector('#defaultDisplay');
    this.displayValueEl = shadow.querySelector('#displayValue');
    this.keypadEl = shadow.querySelector('#defaultKeypad');
  }

  public connectedCallback(): void {
    this.isConnectedToDOM = true;

    // Attach keypad button delegation
    if (this.keypadEl) {
      this.keypadEl.addEventListener('click', this.handleKeypadClick);
    }

    // Attach physical keyboard listener to window or host
    if (typeof globalThis.window !== 'undefined' && globalThis.window.addEventListener) {
      globalThis.window.addEventListener('keydown', this.handleKeyDown);
    } else if (typeof this.addEventListener === 'function') {
      this.addEventListener('keydown', this.handleKeyDown);
    }

    this.syncUI();
  }

  public disconnectedCallback(): void {
    this.isConnectedToDOM = false;

    if (this.keypadEl) {
      this.keypadEl.removeEventListener('click', this.handleKeypadClick);
    }

    if (typeof globalThis.window !== 'undefined' && globalThis.window.removeEventListener) {
      globalThis.window.removeEventListener('keydown', this.handleKeyDown);
    } else if (typeof this.removeEventListener === 'function') {
      this.removeEventListener('keydown', this.handleKeyDown);
    }
  }

  /**
   * Returns current internal state of the precision calculation engine.
   */
  public getState(): CalculatorState {
    return this.engine.getState();
  }

  /**
   * Resets engine state and visual display back to initial clean state.
   */
  public reset(): void {
    this.engine = new CalculatorEngine();
    this.syncUI();
  }

  /**
   * Dispatches a strongly-typed action to the engine, synchronizes UI, and emits change event.
   */
  public dispatch(action: CalculatorAction): CalculatorState {
    const newState = this.engine.dispatch(action);
    this.syncUI();
    return newState;
  }

  /**
   * Handles button click actions triggered from keypad.
   */
  public pressButton(action: string, value?: string): CalculatorState {
    switch (action) {
      case 'digit':
        return this.dispatch({ type: 'DIGIT', digit: value ?? '' });
      case 'decimal':
        return this.dispatch({ type: 'DECIMAL' });
      case 'operator':
        return this.dispatch({ type: 'OPERATOR', operator: value as Operator });
      case 'equals':
        return this.dispatch({ type: 'EQUALS' });
      case 'clear':
        return this.dispatch({ type: 'CLEAR' });
      case 'all-clear':
        return this.dispatch({ type: 'ALL_CLEAR' });
      case 'backspace':
        return this.dispatch({ type: 'BACKSPACE' });
      case 'negate':
        return this.dispatch({ type: 'NEGATE' });
      default:
        return this.getState();
    }
  }

  /**
   * Physical keyboard event interceptor complying with RULE-UI-002:
   * Intercepts 0-9, +, -, *, /, Enter, Backspace, Escape, and .
   * Leaves browser hotkeys (Cmd, Ctrl, Alt) untouched.
   */
  public handleKeyDown(event: KeyboardEvent): void {
    if (!event) return;

    // Never intercept when modifier keys are pressed
    if (event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }

    const key = event.key;
    let intercepted = false;

    if (/^[0-9]$/.test(key)) {
      intercepted = true;
      this.engine.pressDigit(key);
    } else if (key === '.') {
      intercepted = true;
      this.engine.pressDecimal();
    } else if (key === '+' || key === '-' || key === '*' || key === '/') {
      intercepted = true;
      this.engine.pressOperator(key as Operator);
    } else if (key === 'Enter' || key === '=') {
      intercepted = true;
      this.engine.pressEquals();
    } else if (key === 'Backspace') {
      intercepted = true;
      this.engine.pressBackspace();
    } else if (key === 'Escape') {
      intercepted = true;
      this.engine.pressAllClear();
    } else if (key === 'c' || key === 'C') {
      intercepted = true;
      this.engine.pressClear();
    }

    if (intercepted) {
      if (typeof event.preventDefault === 'function') {
        event.preventDefault();
      }
      this.syncUI();
    }
  }

  private handleKeypadClick(event: Event): void {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    const btn = target.closest('button[data-action]') as HTMLElement | null;
    if (!btn) return;

    const action = btn.getAttribute('data-action');
    const value = btn.getAttribute('data-value') ?? undefined;

    if (action) {
      this.pressButton(action, value);
    }
  }

  /**
   * Synchronizes visual display, ARIA live region, and dispatches calc-change event (SEAM-UI-01).
   */
  public syncUI(): void {
    const state = this.engine.getState();

    if (this.displayValueEl) {
      this.displayValueEl.textContent = state.display;
    }

    if (this.defaultDisplayEl) {
      if (state.isLocked) {
        this.defaultDisplayEl.classList.add('error');
      } else {
        this.defaultDisplayEl.classList.remove('error');
      }
    }

    // Check for light-DOM slotted display element enhancement
    const slottedDisplay = this.querySelector('[slot="display"]');
    if (slottedDisplay) {
      slottedDisplay.textContent = state.display;
      if (state.isLocked) {
        slottedDisplay.classList.add('error');
      } else {
        slottedDisplay.classList.remove('error');
      }
    }

    // Dispatch SEAM-UI-01 calc-change custom event
    if (typeof this.dispatchEvent === 'function') {
      const changeEvent = new CustomEvent('calc-change', {
        detail: state,
        bubbles: true,
        composed: true,
      });
      this.dispatchEvent(changeEvent);
    }
  }
}

// Register autonomous custom element if customElements registry is available
if (
  typeof globalThis.customElements !== 'undefined' &&
  !globalThis.customElements.get('stay-calc')
) {
  globalThis.customElements.define('stay-calc', StayCalc);
}
