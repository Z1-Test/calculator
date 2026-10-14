/**
 * src/components/stay-calc.ts
 *
 * W3C Autonomous Custom Element <stay-calc> providing:
 * - Encapsulated Declarative Shadow DOM (DSD) template and slot projection graph
 * - Integration with F1/F5 CalculatorEngine via SEAM-ENGINE-01
 * - Full interactive keypad buttons (0-9, ., +, -, *, /, =, C, AC, +/-, ⌫)
 * - Scientific mode toggle (#modeToggle) and angle unit toggle (#angleUnitToggle / #angleUnitIndicator)
 * - Scientific functions grid (#scientificKeys: √, x², xʸ, π, e, sin, cos, tan)
 * - Calculation history tape and slide-out drawer panel (#historyDrawer, #historyToggle)
 * - Physical keyboard interception (0-9, operators, ^, Enter, Backspace, Escape, .)
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
  CalculationHistoryEntry,
  Operator,
  CalculatorMode,
  AngleUnit,
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
    justify-content: space-between;
    align-items: stretch;
    overflow: hidden;
    transition: border-color 0.15s ease, background-color 0.15s ease;
  }

  .memory-indicator {
    font-size: 14px;
    font-weight: 700;
    color: var(--calc-primary, #2563eb);
    line-height: 1;
    align-self: flex-start;
    visibility: hidden;
    opacity: 0;
    transition: opacity 0.15s ease, visibility 0.15s ease;
  }

  .memory-indicator.active {
    visibility: visible;
    opacity: 1;
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
    margin-inline-start: auto;
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

  .calc-btn, .sci-btn {
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

  .calc-btn:hover, .sci-btn:hover {
    background-color: var(--calc-container-low, #e4e4e7);
  }

  .calc-btn:active, .sci-btn:active {
    transform: scale(0.96);
  }

  .calc-btn:focus-visible, .sci-btn:focus-visible {
    outline: 2px solid var(--calc-primary, #2563eb);
    outline-offset: 2px;
  }

  .calc-btn.btn-memory {
    background-color: var(--calc-container-medium, #f4f4f5);
    color: var(--calc-text-primary, #09090b);
    font-size: 15px;
    font-weight: 600;
  }

  .calc-btn.btn-memory:hover {
    background-color: var(--calc-container-low, #e4e4e7);
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

  .calc-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    inline-size: 100%;
    gap: 8px;
  }

  .header-left, .header-right {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .mode-toggle-btn, .angle-unit-toggle-btn, .history-toggle-btn {
    appearance: none;
    -webkit-appearance: none;
    border: 1px solid var(--calc-outline-low, #e4e4e7);
    background-color: var(--calc-surface, #f4f4f5);
    color: var(--calc-text-primary, #09090b);
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    line-height: 1;
    border-radius: 8px;
    padding-inline: 10px;
    padding-block: 6px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    user-select: none;
    transition: background-color 0.15s ease, border-color 0.15s ease;
    touch-action: manipulation;
  }

  .mode-toggle-btn:hover, .angle-unit-toggle-btn:hover, .history-toggle-btn:hover {
    background-color: var(--calc-container-low, #e4e4e7);
  }

  .mode-toggle-btn:focus-visible, .angle-unit-toggle-btn:focus-visible, .history-toggle-btn:focus-visible {
    outline: 2px solid var(--calc-primary, #2563eb);
    outline-offset: 2px;
  }

  .angle-unit-indicator {
    font-size: 11px;
    font-weight: 700;
    color: var(--calc-primary, #2563eb);
    letter-spacing: 0.05em;
  }

  .scientific-keys {
    display: none;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    inline-size: 100%;
  }

  .scientific-keys.visible {
    display: grid;
  }

  .sci-btn {
    font-size: 16px;
    min-block-size: 46px;
    padding-inline: 8px;
    padding-block: 10px;
    background-color: var(--calc-container-medium, #f4f4f5);
  }

  .history-drawer {
    display: none;
    flex-direction: column;
    gap: 10px;
    inline-size: 100%;
    max-block-size: 240px;
    overflow-y: auto;
    padding-inline: 14px;
    padding-block: 12px;
    background-color: var(--calc-surface, #f4f4f5);
    border: 1px solid var(--calc-outline-low, #e4e4e7);
    border-radius: 12px;
    box-sizing: border-box;
  }

  .history-drawer.open {
    display: flex;
  }

  .history-drawer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    inline-size: 100%;
    padding-block-end: 6px;
    border-block-end: 1px solid var(--calc-outline-low, #e4e4e7);
  }

  .history-drawer-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--calc-text-primary, #09090b);
  }

  .clear-history-btn {
    appearance: none;
    -webkit-appearance: none;
    border: 1px solid var(--calc-outline-low, #e4e4e7);
    background: transparent;
    color: var(--calc-error, #ff453a);
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    border-radius: 6px;
    padding-inline: 8px;
    padding-block: 4px;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }

  .clear-history-btn:hover {
    background-color: rgba(255, 69, 58, 0.1);
  }

  .clear-history-btn:focus-visible {
    outline: 2px solid var(--calc-error, #ff453a);
    outline-offset: 1px;
  }

  .history-empty {
    font-size: 13px;
    color: var(--calc-text-secondary, #71717a);
    text-align: center;
    padding-block: 14px;
  }

  .history-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    inline-size: 100%;
  }

  .history-entry {
    appearance: none;
    -webkit-appearance: none;
    border: 1px solid var(--calc-outline-low, #e4e4e7);
    background-color: var(--calc-container-high, #ffffff);
    color: var(--calc-text-primary, #09090b);
    font-family: inherit;
    border-radius: 8px;
    padding-inline: 10px;
    padding-block: 8px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
    cursor: pointer;
    inline-size: 100%;
    transition: background-color 0.12s ease, border-color 0.12s ease;
    box-sizing: border-box;
  }

  .history-entry:hover {
    background-color: var(--calc-container-low, #e4e4e7);
    border-color: var(--calc-primary, #2563eb);
  }

  .history-entry:focus-visible {
    outline: 2px solid var(--calc-primary, #2563eb);
    outline-offset: 1px;
  }

  .history-entry-expr {
    font-size: 12px;
    color: var(--calc-text-secondary, #71717a);
    font-variant-numeric: tabular-nums;
  }

  .history-entry-result {
    font-size: 17px;
    font-weight: 700;
    color: var(--calc-text-primary, #09090b);
    font-variant-numeric: tabular-nums;
  }

  @container calc-host (max-width: 390px) {
    .calc-container {
      padding-inline: 10px;
      padding-block: 12px;
      gap: 10px;
    }
    .history-drawer {
      max-block-size: 200px;
      padding-inline: 10px;
      padding-block: 8px;
    }
    .history-entry-result {
      font-size: 15px;
    }
    .scientific-keys {
      gap: 6px;
    }
    .sci-btn {
      min-block-size: 40px;
      font-size: 14px;
      padding-inline: 6px;
      padding-block: 8px;
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
    <div class="calc-header">
      <div class="header-left">
        <button
          type="button"
          class="mode-toggle-btn"
          id="modeToggle"
          data-action="toggle-mode"
          aria-label="Switch to scientific mode"
        >
          <span class="mode-text" id="modeText">Scientific</span>
        </button>
        <button
          type="button"
          class="angle-unit-toggle-btn"
          id="angleUnitToggle"
          data-action="toggle-angle-unit"
          aria-label="Switch angle unit to radians"
          style="display: none;"
        >
          <span class="angle-unit-indicator" id="angleUnitIndicator">DEG</span>
        </button>
      </div>
      <div class="header-right">
        <button
          type="button"
          class="history-toggle-btn"
          id="historyToggle"
          data-action="history-toggle"
          aria-expanded="false"
          aria-controls="historyDrawer"
          aria-label="Toggle calculation history"
          title="Calculation History"
        >
          <span aria-hidden="true">⏱</span> History
        </button>
      </div>
    </div>
    <div
      class="history-drawer"
      id="historyDrawer"
      role="region"
      aria-label="Calculation History"
      aria-hidden="true"
    >
      <div class="history-drawer-header">
        <span class="history-drawer-title">Calculation History</span>
        <button
          type="button"
          class="clear-history-btn"
          id="clearHistory"
          data-action="clear-history"
          aria-label="Clear calculation history"
        >
          Clear
        </button>
      </div>
      <div class="history-empty" id="historyEmpty">No calculations yet</div>
      <div class="history-list" id="historyList" role="list"></div>
    </div>
    <div class="display-slot-wrapper">
      <slot name="display">
        <div class="display-screen" id="defaultDisplay" role="status" aria-live="polite" aria-atomic="true">
          <span class="memory-indicator" id="memoryIndicator" aria-hidden="true">M</span>
          <span class="display-value" id="displayValue">0</span>
        </div>
      </slot>
    </div>
    <div class="scientific-keys" id="scientificKeys" role="group" aria-label="Scientific Functions" aria-hidden="true" style="display: none;">
      <button type="button" class="sci-btn" id="btnSqrt" data-action="square-root" aria-label="Square Root">√</button>
      <button type="button" class="sci-btn" id="btnSquare" data-action="square" aria-label="Square">x²</button>
      <button type="button" class="sci-btn" id="btnPower" data-action="operator" data-value="^" aria-label="Power">xʸ</button>
      <button type="button" class="sci-btn" id="btnPi" data-action="constant" data-value="pi" aria-label="Pi">π</button>
      <button type="button" class="sci-btn" id="btnE" data-action="constant" data-value="e" aria-label="Euler's number">e</button>
      <button type="button" class="sci-btn" id="btnSin" data-action="sin" aria-label="Sine">sin</button>
      <button type="button" class="sci-btn" id="btnCos" data-action="cos" aria-label="Cosine">cos</button>
      <button type="button" class="sci-btn" id="btnTan" data-action="tan" aria-label="Tangent">tan</button>
    </div>
    <div class="keypad-slot-wrapper">
      <slot name="keypad">
        <div class="keypad-grid" id="defaultKeypad" role="group" aria-label="Calculator Keypad">
          <button type="button" class="calc-btn btn-memory" data-action="memory-clear" aria-label="Memory Clear">MC</button>
          <button type="button" class="calc-btn btn-memory" data-action="memory-recall" aria-label="Memory Recall">MR</button>
          <button type="button" class="calc-btn btn-memory" data-action="memory-subtract" aria-label="Memory Subtract">M−</button>
          <button type="button" class="calc-btn btn-memory" data-action="memory-add" aria-label="Memory Add">M+</button>

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
  private memoryIndicatorEl: HTMLElement | null = null;
  private keypadEl: HTMLElement | null = null;
  private historyToggleBtn: HTMLElement | null = null;
  private historyDrawerEl: HTMLElement | null = null;
  private clearHistoryBtn: HTMLElement | null = null;
  private historyEmptyEl: HTMLElement | null = null;
  private historyListEl: HTMLElement | null = null;
  private modeToggleBtn: HTMLElement | null = null;
  private modeTextEl: HTMLElement | null = null;
  private angleUnitToggleBtn: HTMLElement | null = null;
  private angleUnitIndicatorEl: HTMLElement | null = null;
  private scientificKeysEl: HTMLElement | null = null;
  private isDrawerOpen = false;
  private isConnectedToDOM = false;
  private lastHistorySnapshot: string = '';
  private lastModeSnapshot: string = '';

  constructor() {
    super();
    this.engine = new CalculatorEngine();
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeypadClick = this.handleKeypadClick.bind(this);
    this.handleHistoryToggleClick = this.handleHistoryToggleClick.bind(this);
    this.handleClearHistoryClick = this.handleClearHistoryClick.bind(this);
    this.handleHistoryDrawerClick = this.handleHistoryDrawerClick.bind(this);
    this.handleModeToggleClick = this.handleModeToggleClick.bind(this);
    this.handleAngleUnitToggleClick = this.handleAngleUnitToggleClick.bind(this);
    this.handleScientificKeysClick = this.handleScientificKeysClick.bind(this);
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
    this.memoryIndicatorEl = shadow.querySelector('#memoryIndicator');
    this.keypadEl = shadow.querySelector('#defaultKeypad');
    this.historyToggleBtn = shadow.querySelector('#historyToggle');
    this.historyDrawerEl = shadow.querySelector('#historyDrawer');
    this.clearHistoryBtn = shadow.querySelector('#clearHistory');
    this.historyEmptyEl = shadow.querySelector('#historyEmpty');
    this.historyListEl = shadow.querySelector('#historyList');
    this.modeToggleBtn = shadow.querySelector('#modeToggle');
    this.modeTextEl = shadow.querySelector('#modeText');
    this.angleUnitToggleBtn = shadow.querySelector('#angleUnitToggle');
    this.angleUnitIndicatorEl = shadow.querySelector('#angleUnitIndicator');
    this.scientificKeysEl = shadow.querySelector('#scientificKeys');
  }

  public connectedCallback(): void {
    this.isConnectedToDOM = true;

    // Attach keypad button delegation
    if (this.keypadEl) {
      this.keypadEl.addEventListener('click', this.handleKeypadClick);
    }

    // Attach mode and angle unit interactions
    if (this.modeToggleBtn) {
      this.modeToggleBtn.addEventListener('click', this.handleModeToggleClick);
    }
    if (this.angleUnitToggleBtn) {
      this.angleUnitToggleBtn.addEventListener('click', this.handleAngleUnitToggleClick);
    }
    if (this.scientificKeysEl) {
      this.scientificKeysEl.addEventListener('click', this.handleScientificKeysClick);
    }

    // Attach history drawer interactions
    if (this.historyToggleBtn) {
      this.historyToggleBtn.addEventListener('click', this.handleHistoryToggleClick);
    }
    if (this.clearHistoryBtn) {
      this.clearHistoryBtn.addEventListener('click', this.handleClearHistoryClick);
    }
    if (this.historyDrawerEl) {
      this.historyDrawerEl.addEventListener('click', this.handleHistoryDrawerClick);
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

    if (this.modeToggleBtn) {
      this.modeToggleBtn.removeEventListener('click', this.handleModeToggleClick);
    }
    if (this.angleUnitToggleBtn) {
      this.angleUnitToggleBtn.removeEventListener('click', this.handleAngleUnitToggleClick);
    }
    if (this.scientificKeysEl) {
      this.scientificKeysEl.removeEventListener('click', this.handleScientificKeysClick);
    }

    if (this.historyToggleBtn) {
      this.historyToggleBtn.removeEventListener('click', this.handleHistoryToggleClick);
    }
    if (this.clearHistoryBtn) {
      this.clearHistoryBtn.removeEventListener('click', this.handleClearHistoryClick);
    }
    if (this.historyDrawerEl) {
      this.historyDrawerEl.removeEventListener('click', this.handleHistoryDrawerClick);
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
    this.isDrawerOpen = false;
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

  public pressMemoryAdd(): CalculatorState {
    return this.dispatch({ type: 'MEMORY_ADD' });
  }

  public pressMemorySubtract(): CalculatorState {
    return this.dispatch({ type: 'MEMORY_SUBTRACT' });
  }

  public pressMemoryRecall(): CalculatorState {
    return this.dispatch({ type: 'MEMORY_RECALL' });
  }

  public pressMemoryClear(): CalculatorState {
    return this.dispatch({ type: 'MEMORY_CLEAR' });
  }

  public getHistory(): readonly CalculationHistoryEntry[] {
    return this.engine.getHistory();
  }

  public clearHistory(): CalculatorState {
    const state = this.engine.clearHistory();
    this.syncUI();
    this.dispatchHistoryEvent();
    return state;
  }

  public loadHistoryEntry(entryOrId: CalculationHistoryEntry | string): CalculatorState {
    const state = this.engine.loadHistoryEntry(entryOrId);
    this.syncUI();
    this.dispatchHistoryEvent();
    return state;
  }

  public toggleMode(): CalculatorState {
    const state = this.engine.toggleMode();
    this.syncUI();
    return state;
  }

  public toggleAngleUnit(): CalculatorState {
    const state = this.engine.toggleAngleUnit();
    this.syncUI();
    return state;
  }

  public getMode(): CalculatorMode {
    return this.engine.getMode();
  }

  public getAngleUnit(): AngleUnit {
    return this.engine.getAngleUnit();
  }

  public squareRoot(): CalculatorState {
    const state = this.engine.squareRoot();
    this.syncUI();
    return state;
  }

  public square(): CalculatorState {
    const state = this.engine.square();
    this.syncUI();
    return state;
  }

  public sin(): CalculatorState {
    const state = this.engine.sin();
    this.syncUI();
    return state;
  }

  public cos(): CalculatorState {
    const state = this.engine.cos();
    this.syncUI();
    return state;
  }

  public tan(): CalculatorState {
    const state = this.engine.tan();
    this.syncUI();
    return state;
  }

  public loadConstant(constant: 'pi' | 'e'): CalculatorState {
    const state = this.engine.loadConstant(constant);
    this.syncUI();
    return state;
  }

  public toggleHistoryDrawer(open?: boolean): boolean {
    this.isDrawerOpen = open !== undefined ? open : !this.isDrawerOpen;
    this.syncHistoryDrawerUI();
    return this.isDrawerOpen;
  }

  public openHistoryDrawer(): void {
    this.toggleHistoryDrawer(true);
  }

  public closeHistoryDrawer(): void {
    this.toggleHistoryDrawer(false);
  }

  public isHistoryDrawerOpen(): boolean {
    return this.isDrawerOpen;
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
      case 'memory-add':
      case 'm-plus':
        return this.dispatch({ type: 'MEMORY_ADD' });
      case 'memory-subtract':
      case 'm-minus':
        return this.dispatch({ type: 'MEMORY_SUBTRACT' });
      case 'memory-recall':
      case 'mr':
        return this.dispatch({ type: 'MEMORY_RECALL' });
      case 'memory-clear':
      case 'mc':
        return this.dispatch({ type: 'MEMORY_CLEAR' });
      case 'history-toggle':
        this.toggleHistoryDrawer();
        return this.getState();
      case 'clear-history':
        return this.clearHistory();
      case 'mode-toggle':
      case 'toggle-mode':
        return this.toggleMode();
      case 'angle-unit-toggle':
      case 'toggle-angle-unit':
        return this.toggleAngleUnit();
      case 'sqrt':
      case 'square-root':
        return this.squareRoot();
      case 'square':
        return this.square();
      case 'sin':
        return this.sin();
      case 'cos':
        return this.cos();
      case 'tan':
        return this.tan();
      case 'constant':
      case 'load-constant':
        return this.loadConstant((value as 'pi' | 'e') || 'pi');
      default:
        return this.getState();
    }
  }

  /**
   * Physical keyboard event interceptor complying with RULE-UI-002:
   * Intercepts 0-9, +, -, *, /, ^, Enter, Backspace, Escape, and .
   * Leaves browser hotkeys (Cmd, Ctrl, Alt) untouched.
   * Dismisses open history drawer on Escape without clearing calculator state.
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
    } else if (key === '+' || key === '-' || key === '*' || key === '/' || key === '^') {
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
      if (this.isDrawerOpen) {
        this.closeHistoryDrawer();
        if (typeof event.preventDefault === 'function') {
          event.preventDefault();
        }
        return; // Do NOT clear calculator registers! (RULE-UI-002)
      }
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

  private handleModeToggleClick(event: Event): void {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }
    this.toggleMode();
  }

  private handleAngleUnitToggleClick(event: Event): void {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }
    this.toggleAngleUnit();
  }

  private handleScientificKeysClick(event: Event): void {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    const btn = target.closest ? (target.closest('button[data-action]') as HTMLElement | null) : null;
    if (!btn) return;

    const action = btn.getAttribute('data-action');
    const value = btn.getAttribute('data-value') ?? undefined;

    if (action) {
      this.pressButton(action, value);
    }
  }

  private handleHistoryToggleClick(event: Event): void {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }
    this.toggleHistoryDrawer();
  }

  private handleClearHistoryClick(event: Event): void {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }
    this.clearHistory();
  }

  private handleHistoryDrawerClick(event: Event): void {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    if (target.closest && target.closest('#clearHistory')) {
      this.clearHistory();
      return;
    }

    const entryBtn = target.closest ? (target.closest('.history-entry') as HTMLElement | null) : null;
    if (entryBtn) {
      const id = entryBtn.getAttribute('data-id');
      const result = entryBtn.getAttribute('data-result');
      if (id) {
        this.loadHistoryEntry(id);
      } else if (result) {
        this.loadHistoryEntry(result);
      }
    }
  }

  private syncHistoryDrawerUI(): void {
    if (this.historyToggleBtn) {
      this.historyToggleBtn.setAttribute('aria-expanded', this.isDrawerOpen ? 'true' : 'false');
    }
    if (this.historyDrawerEl) {
      this.historyDrawerEl.setAttribute('aria-hidden', this.isDrawerOpen ? 'false' : 'true');
      if (this.isDrawerOpen) {
        this.historyDrawerEl.classList.add('open');
      } else {
        this.historyDrawerEl.classList.remove('open');
      }
    }
    this.renderHistoryList();
  }

  private renderHistoryList(): void {
    const history = this.engine.getHistory();
    if (this.historyEmptyEl) {
      if (history.length === 0) {
        if (this.historyEmptyEl.style) this.historyEmptyEl.style.display = 'block';
        this.historyEmptyEl.classList.remove('hidden');
      } else {
        if (this.historyEmptyEl.style) this.historyEmptyEl.style.display = 'none';
        this.historyEmptyEl.classList.add('hidden');
      }
    }

    if (this.clearHistoryBtn) {
      if (history.length === 0) {
        this.clearHistoryBtn.setAttribute('disabled', 'true');
      } else if (typeof this.clearHistoryBtn.removeAttribute === 'function') {
        this.clearHistoryBtn.removeAttribute('disabled');
      } else {
        this.clearHistoryBtn.setAttribute('disabled', 'false');
      }
    }

    if (this.historyListEl) {
      // Clear existing children
      this.historyListEl.textContent = '';
      if ((this.historyListEl as any).children) {
        (this.historyListEl as any).children = [];
      }

      for (const entry of history) {
        const btn = typeof globalThis.document !== 'undefined' && globalThis.document.createElement
          ? globalThis.document.createElement('button')
          : null;
        if (!btn) continue;

        btn.setAttribute('type', 'button');
        btn.setAttribute('class', 'history-entry');
        if (btn.classList && typeof btn.classList.add === 'function') {
          btn.classList.add('history-entry');
        }
        btn.setAttribute('data-id', entry.id);
        btn.setAttribute('data-result', entry.result);
        btn.setAttribute('aria-label', `${entry.expression} equals ${entry.result}`);

        const exprSpan = globalThis.document.createElement('span');
        exprSpan.setAttribute('class', 'history-entry-expr');
        if (exprSpan.classList && typeof exprSpan.classList.add === 'function') {
          exprSpan.classList.add('history-entry-expr');
        }
        exprSpan.textContent = `${entry.expression} =`;

        const resSpan = globalThis.document.createElement('span');
        resSpan.setAttribute('class', 'history-entry-result');
        if (resSpan.classList && typeof resSpan.classList.add === 'function') {
          resSpan.classList.add('history-entry-result');
        }
        resSpan.textContent = entry.result;

        btn.appendChild(exprSpan);
        btn.appendChild(resSpan);
        this.historyListEl.appendChild(btn);
      }
    }
  }

  private dispatchHistoryEvent(): void {
    if (typeof this.dispatchEvent === 'function') {
      const historyEvent = new CustomEvent('history-change', {
        detail: { history: this.engine.getHistory() },
        bubbles: true,
        composed: true,
      });
      this.dispatchEvent(historyEvent);
    }
  }

  private dispatchModeEvent(): void {
    if (typeof this.dispatchEvent === 'function') {
      const state = this.engine.getState();
      const modeEvent = new CustomEvent('mode-change', {
        detail: { mode: state.mode, angleUnit: state.angleUnit },
        bubbles: true,
        composed: true,
      });
      this.dispatchEvent(modeEvent);
    }
  }

  /**
   * Synchronizes visual display, ARIA live region, history drawer, mode indicators, and dispatches events.
   */
  public syncUI(): void {
    const state = this.engine.getState();

    if (this.displayValueEl) {
      this.displayValueEl.textContent = state.display;
    }

    if (this.memoryIndicatorEl) {
      if (state.hasActiveMemory) {
        this.memoryIndicatorEl.classList.add('active');
      } else {
        this.memoryIndicatorEl.classList.remove('active');
      }
      if (this.memoryIndicatorEl.style) {
        this.memoryIndicatorEl.style.visibility = state.hasActiveMemory ? 'visible' : 'hidden';
      }
    }

    if (this.defaultDisplayEl) {
      if (state.isLocked) {
        this.defaultDisplayEl.classList.add('error');
      } else {
        this.defaultDisplayEl.classList.remove('error');
      }
    }

    // Sync Mode Toggle Button & Text
    if (this.modeToggleBtn) {
      const isScientific = state.mode === 'scientific';
      this.modeToggleBtn.setAttribute(
        'aria-label',
        isScientific ? 'Switch to standard mode' : 'Switch to scientific mode'
      );
      if (this.modeTextEl) {
        this.modeTextEl.textContent = isScientific ? 'Standard' : 'Scientific';
      }
    }

    // Sync Angle Unit Toggle & Indicator
    if (this.angleUnitToggleBtn) {
      const isScientific = state.mode === 'scientific';
      if (this.angleUnitToggleBtn.style) {
        this.angleUnitToggleBtn.style.display = isScientific ? 'inline-flex' : 'none';
      }
      this.angleUnitToggleBtn.setAttribute(
        'aria-label',
        state.angleUnit === 'DEG' ? 'Switch angle unit to radians' : 'Switch angle unit to degrees'
      );
      if (isScientific) {
        this.angleUnitToggleBtn.classList.add('visible');
      } else {
        this.angleUnitToggleBtn.classList.remove('visible');
      }
    }

    if (this.angleUnitIndicatorEl) {
      this.angleUnitIndicatorEl.textContent = state.angleUnit;
    }

    // Sync Scientific Keys Visibility
    if (this.scientificKeysEl) {
      const isScientific = state.mode === 'scientific';
      if (this.scientificKeysEl.style) {
        this.scientificKeysEl.style.display = isScientific ? 'grid' : 'none';
      }
      this.scientificKeysEl.setAttribute('aria-hidden', isScientific ? 'false' : 'true');
      if (isScientific) {
        this.scientificKeysEl.classList.add('visible');
      } else {
        this.scientificKeysEl.classList.remove('visible');
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

    const slottedMemory = this.querySelector('[slot="memory"]');
    if (slottedMemory) {
      if (state.hasActiveMemory) {
        slottedMemory.classList.add('active');
      } else {
        slottedMemory.classList.remove('active');
      }
      if ((slottedMemory as HTMLElement).style) {
        (slottedMemory as HTMLElement).style.visibility = state.hasActiveMemory ? 'visible' : 'hidden';
      }
    }

    // Sync History Drawer UI
    this.syncHistoryDrawerUI();

    // Check if mode/angleUnit mutated to dispatch mode-change
    const currentModeSnapshot = `${state.mode}:${state.angleUnit}`;
    if (currentModeSnapshot !== this.lastModeSnapshot) {
      this.lastModeSnapshot = currentModeSnapshot;
      this.dispatchModeEvent();
    }

    // Check if history mutated to dispatch history-change
    const currentHistory = this.engine.getHistory();
    const currentSnapshot = JSON.stringify(currentHistory);
    if (currentSnapshot !== this.lastHistorySnapshot) {
      this.lastHistorySnapshot = currentSnapshot;
      this.dispatchHistoryEvent();
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
