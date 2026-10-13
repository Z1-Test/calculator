import { CalcEngine, formatDisplay } from '../engine/calc-engine.ts';

export class StayCalcElement extends (typeof HTMLElement !== 'undefined' ? HTMLElement : (class {} as unknown as typeof HTMLElement)) {
  public engine: CalcEngine;
  private shadowRootRef: ShadowRoot | null = null;
  private displayElement: HTMLElement | null = null;
  private boundKeyHandler: (e: KeyboardEvent) => void;

  constructor() {
    super();
    this.engine = new CalcEngine();
    this.boundKeyHandler = this.handleKeydown.bind(this);
    if (typeof this.attachShadow === 'function') {
      this.shadowRootRef = this.attachShadow({ mode: 'open' });
    }
  }

  public get displayValue(): string {
    return this.engine.getState().display;
  }

  public connectedCallback(): void {
    this.render();
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.boundKeyHandler);
    }
  }

  public disconnectedCallback(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.boundKeyHandler);
    }
  }

  public handleKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented) return;
    const key = event.key;

    if (/^[0-9]$/.test(key)) {
      this.engine.inputDigit(key);
      this.updateDisplay();
      event.preventDefault();
    } else if (key === '.') {
      this.engine.inputDecimal();
      this.updateDisplay();
      event.preventDefault();
    } else if (key === '+' || key === '-' || key === '*' || key === '/') {
      this.engine.inputOperator(key);
      this.updateDisplay();
      event.preventDefault();
    } else if (key === 'Enter' || key === '=') {
      this.engine.calculate();
      this.updateDisplay();
      event.preventDefault();
    } else if (key === 'Escape') {
      this.engine.allClear();
      this.updateDisplay();
      event.preventDefault();
    } else if (key === 'c' || key === 'C') {
      this.engine.clearEntry();
      this.updateDisplay();
      event.preventDefault();
    } else if (key === 'Backspace') {
      const state = this.engine.getState();
      if (!state.hasError && state.display.length > 1) {
        this.engine.setDisplayValue(state.display.slice(0, -1));
      } else {
        this.engine.setDisplayValue('0');
      }
      this.updateDisplay();
      event.preventDefault();
    }
  }

  public updateDisplay(): void {
    if (this.displayElement) {
      this.displayElement.textContent = this.engine.getState().display;
    }
  }

  public render(): void {
    if (!this.shadowRootRef) return;

    const template = `
      <style>
        :host {
          display: block;
          max-width: 390px;
          width: 100%;
          margin: 0 auto;
          box-sizing: border-box;
          font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
          --calc-primary: #2563eb;
          --calc-on-primary: #ffffff;
          --calc-surface: #f4f4f5;
          --calc-surface-key: #ffffff;
          --calc-surface-op: #e4e4e7;
          --calc-text-primary: #09090b;
          --calc-border: #e4e4e7;
          --calc-focus-ring: #2563eb;
        }

        *, *::before, *::after {
          box-sizing: border-box;
        }

        .calc-container {
          background: var(--calc-surface);
          border: 1px solid var(--calc-border);
          border-radius: 24px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          width: 100%;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
        }

        .display-card {
          background: #ffffff;
          border: 1px solid var(--calc-border);
          border-radius: 16px;
          padding: 24px 20px;
          text-align: right;
          font-size: 36px;
          font-weight: 700;
          color: var(--calc-text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-height: 88px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          font-variant-numeric: tabular-nums;
        }

        .keypad-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          width: 100%;
        }

        button.calc-btn {
          border: 1px solid var(--calc-border);
          border-radius: 9999px;
          height: 56px;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.08s ease, background-color 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          user-select: none;
          outline: none;
          background: var(--calc-surface-key);
          color: var(--calc-text-primary);
        }

        button.calc-btn:active {
          transform: scale(0.95);
        }

        button.calc-btn:focus-visible {
          outline: 3px solid var(--calc-focus-ring);
          outline-offset: 2px;
        }

        button.btn-op {
          background: var(--calc-surface-op);
          color: #1e293b;
        }

        button.btn-primary {
          background: var(--calc-primary);
          color: var(--calc-on-primary);
          border-color: var(--calc-primary);
        }

        button.btn-clear {
          color: #dc2626;
        }

        @container (max-width: 350px) {
          .calc-container { padding: 12px; }
          button.calc-btn { height: 48px; font-size: 16px; }
          .display-card { font-size: 28px; padding: 16px; }
        }
      </style>
      <div class="calc-container" part="container">
        <slot name="header"></slot>
        <div id="display" class="display-card" role="status" aria-live="polite" aria-label="Calculation result" part="display">
          ${this.engine.getState().display}
        </div>
        <div id="keypad" class="keypad-grid" role="group" aria-label="Calculator keypad" part="keypad">
          <button type="button" class="calc-btn btn-clear" data-action="allClear" aria-label="All Clear">AC</button>
          <button type="button" class="calc-btn" data-action="clearEntry" aria-label="Clear Entry">C</button>
          <button type="button" class="calc-btn btn-op" data-action="percentage" aria-label="Percentage">%</button>
          <button type="button" class="calc-btn btn-op" data-op="/" aria-label="Divide">÷</button>

          <button type="button" class="calc-btn" data-digit="7" aria-label="7">7</button>
          <button type="button" class="calc-btn" data-digit="8" aria-label="8">8</button>
          <button type="button" class="calc-btn" data-digit="9" aria-label="9">9</button>
          <button type="button" class="calc-btn btn-op" data-op="*" aria-label="Multiply">×</button>

          <button type="button" class="calc-btn" data-digit="4" aria-label="4">4</button>
          <button type="button" class="calc-btn" data-digit="5" aria-label="5">5</button>
          <button type="button" class="calc-btn" data-digit="6" aria-label="6">6</button>
          <button type="button" class="calc-btn btn-op" data-op="-" aria-label="Subtract">−</button>

          <button type="button" class="calc-btn" data-digit="1" aria-label="1">1</button>
          <button type="button" class="calc-btn" data-digit="2" aria-label="2">2</button>
          <button type="button" class="calc-btn" data-digit="3" aria-label="3">3</button>
          <button type="button" class="calc-btn btn-op" data-op="+" aria-label="Add">+</button>

          <button type="button" class="calc-btn" data-action="toggleSign" aria-label="Plus or minus">±</button>
          <button type="button" class="calc-btn" data-digit="0" aria-label="0">0</button>
          <button type="button" class="calc-btn" data-action="decimal" aria-label="Decimal point">.</button>
          <button type="button" class="calc-btn btn-primary" data-action="calculate" aria-label="Equals">=</button>
        </div>
        <slot name="footer"></slot>
      </div>
    `;

    this.shadowRootRef.innerHTML = template;
    this.displayElement = this.shadowRootRef.getElementById('display') as HTMLElement;

    const keypad = this.shadowRootRef.getElementById('keypad');
    if (keypad) {
      keypad.addEventListener('click', (e) => {
        const btn = (e.target as HTMLElement).closest('button');
        if (!btn) return;

        const digit = btn.getAttribute('data-digit');
        const op = btn.getAttribute('data-op') as '+' | '-' | '*' | '/' | null;
        const action = btn.getAttribute('data-action');

        if (digit !== null) {
          this.engine.inputDigit(digit);
        } else if (op !== null) {
          this.engine.inputOperator(op);
        } else if (action === 'calculate') {
          this.engine.calculate();
        } else if (action === 'allClear') {
          this.engine.allClear();
        } else if (action === 'clearEntry') {
          this.engine.clearEntry();
        } else if (action === 'toggleSign') {
          this.engine.toggleSign();
        } else if (action === 'percentage') {
          this.engine.percentage();
        } else if (action === 'decimal') {
          this.engine.inputDecimal();
        }

        this.updateDisplay();
      });
    }
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('stay-calc')) {
  customElements.define('stay-calc', StayCalcElement);
}
