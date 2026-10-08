import { ThemeManager } from '../theme/theme-manager.js';
import type { CalcActionDetail, CalcClearDetail, CalcInputDetail } from '../types/index.js';
import { StayCalcDisplay } from './stay-calc-display.js';
import { StayCalcHeader } from './stay-calc-header.js';
import { StayCalcKeypad } from './stay-calc-keypad.js';

export class StayCalcApp extends HTMLElement {
  public static readonly TAG = 'stay-calc-app';

  private currentInput = '0';
  private currentExpression = '';
  private storedOperand: number | null = null;
  private pendingOperator: string | null = null;
  private waitingForOperand = false;
  private memoryRegister = 0;

  private displayComponent: StayCalcDisplay | null = null;
  private headerComponent: StayCalcHeader | null = null;
  private keypadComponent: StayCalcKeypad | null = null;

  constructor() {
    super();
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
    }
  }

  public getDisplay(): StayCalcDisplay | null {
    return this.displayComponent;
  }

  public getHeader(): StayCalcHeader | null {
    return this.headerComponent;
  }

  public getKeypad(): StayCalcKeypad | null {
    return this.keypadComponent;
  }

  connectedCallback(): void {
    ThemeManager.getInstance().init();
    this.render();
    this.bindSubcomponents();
    this.setupListeners();

    if (typeof window !== 'undefined' && window.location?.search) {
      const params = new URLSearchParams(window.location.search);
      const initialInput = params.get('input');
      const initialExp = params.get('expr');
      if (initialInput) this.currentInput = initialInput;
      if (initialExp) this.currentExpression = initialExp;
      this.syncDisplay();
    }
  }

  private bindSubcomponents(): void {
    if (!this.shadowRoot) return;
    this.displayComponent = this.shadowRoot.querySelector(StayCalcDisplay.TAG);
    this.headerComponent = this.shadowRoot.querySelector(StayCalcHeader.TAG);
    this.keypadComponent = this.shadowRoot.querySelector(StayCalcKeypad.TAG);
  }

  private setupListeners(): void {
    if (!this.shadowRoot) return;

    this.shadowRoot.addEventListener('calc-input', (e) => {
      const detail = (e as CustomEvent<CalcInputDetail>).detail;
      this.handleInput(detail.value);
    });

    this.shadowRoot.addEventListener('calc-action', (e) => {
      const detail = (e as CustomEvent<CalcActionDetail>).detail;
      this.handleAction(detail.action);
    });

    this.shadowRoot.addEventListener('calc-clear', (e) => {
      const detail = (e as CustomEvent<CalcClearDetail>).detail;
      this.handleClear(detail?.all ?? false);
    });

    window.addEventListener('keydown', this.handleKeyDown);
  }

  disconnectedCallback(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  public handleInput(digit: string): void {
    if (digit === '.') {
      if (this.waitingForOperand) {
        this.currentInput = '0.';
        this.waitingForOperand = false;
      } else if (!this.currentInput.includes('.')) {
        this.currentInput += '.';
      }
    } else {
      if (this.currentInput === '0' || this.waitingForOperand) {
        this.currentInput = digit;
        this.waitingForOperand = false;
      } else {
        if (this.currentInput.length < 18) {
          this.currentInput += digit;
        }
      }
    }

    this.syncDisplay();
  }

  public handleAction(action: string): void {
    const inputValue = parseFloat(this.currentInput);

    switch (action) {
      case 'negate': {
        if (this.currentInput !== '0') {
          if (this.currentInput.startsWith('-')) {
            this.currentInput = this.currentInput.slice(1);
          } else {
            this.currentInput = '-' + this.currentInput;
          }
          this.syncDisplay();
        }
        break;
      }

      case 'percent': {
        const val = parseFloat(this.currentInput);
        if (!isNaN(val)) {
          this.currentInput = String(val / 100);
          this.syncDisplay();
        }
        break;
      }

      case 'add':
      case 'subtract':
      case 'multiply':
      case 'divide': {
        const opSymbol = action === 'add' ? '+' : action === 'subtract' ? '−' : action === 'multiply' ? '×' : '÷';

        if (this.storedOperand !== null && !this.waitingForOperand && this.pendingOperator) {
          const result = this.calculate(this.storedOperand, inputValue, this.pendingOperator);
          this.storedOperand = result;
          this.currentInput = String(result);
          this.currentExpression = `${result} ${opSymbol}`;
        } else {
          this.storedOperand = inputValue;
          this.currentExpression = `${this.currentInput} ${opSymbol}`;
        }

        this.pendingOperator = action;
        this.waitingForOperand = true;
        this.syncDisplay();
        break;
      }

      case 'equals': {
        if (this.storedOperand !== null && this.pendingOperator) {
          const result = this.calculate(this.storedOperand, inputValue, this.pendingOperator);
          const opSymbol = this.pendingOperator === 'add' ? '+' : this.pendingOperator === 'subtract' ? '−' : this.pendingOperator === 'multiply' ? '×' : '÷';
          this.currentExpression = `${this.storedOperand} ${opSymbol} ${inputValue} =`;
          this.currentInput = String(result);
          this.storedOperand = null;
          this.pendingOperator = null;
          this.waitingForOperand = true;
          this.syncDisplay();
        }
        break;
      }
    }
  }

  public handleClear(all = false): void {
    if (all || this.currentInput === '0') {
      this.currentInput = '0';
      this.currentExpression = '';
      this.storedOperand = null;
      this.pendingOperator = null;
      this.waitingForOperand = false;
    } else {
      this.currentInput = '0';
    }
    this.syncDisplay();
  }

  private calculate(first: number, second: number, operator: string): number {
    switch (operator) {
      case 'add':
        return first + second;
      case 'subtract':
        return first - second;
      case 'multiply':
        return Number((first * second).toPrecision(12)) / 1;
      case 'divide':
        return second === 0 ? NaN : Number((first / second).toPrecision(12)) / 1;
      default:
        return second;
    }
  }

  private syncDisplay(): void {
    const isError = this.currentInput === 'NaN' || this.currentInput === 'Infinity';
    this.displayComponent?.updateDisplay({
      primaryValue: isError ? 'Error' : this.currentInput,
      secondaryExpression: this.currentExpression,
      memoryActive: this.memoryRegister !== 0,
      hasError: isError,
    });
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    if (/^[0-9]$/.test(e.key)) {
      this.handleInput(e.key);
    } else if (e.key === '.') {
      this.handleInput('.');
    } else if (e.key === '+') {
      this.handleAction('add');
    } else if (e.key === '-') {
      this.handleAction('subtract');
    } else if (e.key === '*' || e.key === 'x' || e.key === 'X') {
      this.handleAction('multiply');
    } else if (e.key === '/') {
      e.preventDefault();
      this.handleAction('divide');
    } else if (e.key === 'Enter' || e.key === '=') {
      e.preventDefault();
      this.handleAction('equals');
    } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
      this.handleClear(e.key === 'Escape');
    } else if (e.key === 'Backspace') {
      if (this.currentInput.length > 1 && !this.waitingForOperand) {
        this.currentInput = this.currentInput.slice(0, -1);
      } else {
        this.currentInput = '0';
      }
      this.syncDisplay();
    }
  };

  private render(): void {
    if (!this.shadowRoot) return;

    // Preserve existing child components if already slotted or pre-rendered
    if (this.shadowRoot.querySelector('.calculator-shell')) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: var(--sl-space-md);
          box-sizing: border-box;
          background-color: var(--sl-background);
          transition: var(--sl-transition-theme);
        }

        .calculator-shell {
          width: 100%;
          max-width: 380px;
          background-color: var(--sl-surface);
          border: 1px solid var(--sl-outline-low);
          border-radius: var(--sl-radius-lg);
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: var(--sl-transition-theme), box-shadow var(--sl-transition-fast);
        }

        @media (max-width: 480px) {
          :host {
            padding: 0;
            align-items: stretch;
          }
          .calculator-shell {
            max-width: 100%;
            height: 100vh;
            border-radius: 0;
            border: none;
            box-shadow: none;
          }
        }
      </style>

      <main class="calculator-shell" aria-label="StayCalc Calculator Application">
        <stay-calc-header></stay-calc-header>
        <stay-calc-display></stay-calc-display>
        <stay-calc-keypad></stay-calc-keypad>
      </main>
    `;
  }
}
