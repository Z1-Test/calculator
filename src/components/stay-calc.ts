import { CalcEngine, formatDisplay } from '../engine/calc-engine.ts';
import { MemoryStore } from '../engine/memory-store.ts';
import { HistoryStore } from '../engine/history-store.ts';
import { ScientificEngine } from '../engine/scientific-engine.ts';

export class StayCalcElement extends (typeof HTMLElement !== 'undefined' ? HTMLElement : (class {} as unknown as typeof HTMLElement)) {
  public engine: CalcEngine;
  public memory: MemoryStore;
  public history: HistoryStore;
  public scientific: ScientificEngine;
  private shadowRootRef: ShadowRoot | null = null;
  private displayElement: HTMLElement | null = null;
  private badgeElement: HTMLElement | null = null;
  private drawerElement: HTMLElement | null = null;
  private sciPanelElement: HTMLElement | null = null;
  private isHistoryOpen: boolean = false;
  private isScientificOpen: boolean = false;
  private boundKeyHandler: (e: KeyboardEvent) => void;

  constructor() {
    super();
    this.engine = new CalcEngine();
    this.memory = new MemoryStore();
    this.history = new HistoryStore();
    this.scientific = new ScientificEngine();
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
    this.updateDisplay();
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
    } else if (key === '+' || key === '-' || key === '*' || key === '/' || key === '^') {
      this.engine.inputOperator(key as any);
      this.updateDisplay();
      event.preventDefault();
    } else if (key === 'Enter' || key === '=') {
      this.triggerCalculate();
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

  public triggerCalculate(): void {
    const state = this.engine.calculate();
    if (state.lastExpression && !state.hasError) {
      this.history.addEntry(state.lastExpression, state.display);
    }
    this.updateDisplay();
    this.updateHistoryList();
  }

  public loadHistoryRecord(result: string): void {
    this.engine.setDisplayValue(result);
    this.updateDisplay();
  }

  public toggleHistory(): void {
    this.isHistoryOpen = !this.isHistoryOpen;
    if (this.drawerElement) {
      this.drawerElement.style.display = this.isHistoryOpen ? 'block' : 'none';
    }
  }

  public toggleScientific(): void {
    this.isScientificOpen = !this.isScientificOpen;
    if (this.sciPanelElement) {
      this.sciPanelElement.style.display = this.isScientificOpen ? 'grid' : 'none';
    }
  }

  public updateDisplay(): void {
    if (this.displayElement) {
      this.displayElement.textContent = this.engine.getState().display;
    }
    if (this.badgeElement) {
      this.badgeElement.style.display = this.memory.hasMemory() ? 'inline-block' : 'none';
    }
  }

  public updateHistoryList(): void {
    if (!this.shadowRootRef) return;
    const listContainer = this.shadowRootRef.getElementById('history-records');
    if (!listContainer) return;

    const entries = this.history.getEntries();
    if (entries.length === 0) {
      listContainer.innerHTML = '<div class="history-empty" id="history-empty">No calculations yet</div>';
      return;
    }

    listContainer.innerHTML = entries.map(e => `
      <div class="history-item" data-result="${e.result}" role="button" tabindex="0" aria-label="Load ${e.result}">
        <span class="hist-expr">${e.expression}</span>
        <span class="hist-res">= ${e.result}</span>
      </div>
    `).join('');
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
          --calc-surface-mem: #f1f5f9;
          --calc-surface-sci: #e0e7ff;
          --calc-text-primary: #09090b;
          --calc-text-secondary: #64748b;
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
          gap: 12px;
          width: 100%;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
        }

        .display-container {
          position: relative;
          background: #ffffff;
          border: 1px solid var(--calc-border);
          border-radius: 16px;
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 96px;
        }

        .display-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 24px;
        }

        .meta-badges {
          display: flex;
          gap: 6px;
          align-items: center;
        }

        .memory-badge {
          background: #dbeafe;
          color: #1e40af;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 9999px;
          display: none;
        }

        .meta-actions {
          display: flex;
          gap: 8px;
        }

        .history-toggle-btn {
          background: none;
          border: none;
          font-size: 12px;
          font-weight: 600;
          color: var(--calc-text-secondary);
          cursor: pointer;
          padding: 2px 6px;
          border-radius: 6px;
        }

        .history-toggle-btn:focus-visible {
          outline: 2px solid var(--calc-focus-ring);
        }

        .display-card {
          text-align: right;
          font-size: 36px;
          font-weight: 700;
          color: var(--calc-text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-variant-numeric: tabular-nums;
          line-height: 1.2;
        }

        .history-drawer {
          display: none;
          background: #ffffff;
          border: 1px solid var(--calc-border);
          border-radius: 14px;
          padding: 12px;
          max-height: 160px;
          overflow-y: auto;
          font-size: 13px;
        }

        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          padding-bottom: 4px;
          border-bottom: 1px solid var(--calc-border);
          font-weight: 600;
          color: var(--calc-text-secondary);
        }

        .history-clear-btn {
          background: none;
          border: none;
          color: #dc2626;
          font-size: 11px;
          cursor: pointer;
        }

        .history-item {
          display: flex;
          justify-content: space-between;
          padding: 6px 8px;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.1s ease;
        }

        .history-item:hover {
          background-color: var(--calc-surface-mem);
        }

        .hist-res {
          font-weight: 700;
          color: var(--calc-primary);
        }

        .history-empty {
          text-align: center;
          color: var(--calc-text-secondary);
          padding: 12px;
          font-style: italic;
        }

        .scientific-grid {
          display: none;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          background: var(--calc-surface-sci);
          padding: 10px;
          border-radius: 16px;
          border: 1px solid #c7d2fe;
        }

        button.sci-btn {
          background: #ffffff;
          color: #3730a3;
          border: 1px solid #c7d2fe;
          border-radius: 9999px;
          height: 38px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.08s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        button.sci-btn:active {
          transform: scale(0.95);
        }

        button.sci-btn:focus-visible {
          outline: 2px solid var(--calc-focus-ring);
        }

        .memory-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }

        button.mem-btn {
          background: var(--calc-surface-mem);
          color: var(--calc-text-secondary);
          border: 1px solid var(--calc-border);
          border-radius: 9999px;
          height: 36px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.08s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        button.mem-btn:active {
          transform: scale(0.95);
        }

        button.mem-btn:focus-visible {
          outline: 2px solid var(--calc-focus-ring);
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
          height: 52px;
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
          button.calc-btn { height: 46px; font-size: 16px; }
          .display-card { font-size: 28px; }
        }
      </style>
      <div class="calc-container" part="container">
        <slot name="header"></slot>
        <div class="display-container" part="display-container">
          <div class="display-meta">
            <div class="meta-badges">
              <span id="memory-badge" class="memory-badge" part="memory-badge">M</span>
              <button type="button" id="btn-angle-mode" class="history-toggle-btn" aria-label="Toggle angle unit">${this.scientific.getAngleMode()}</button>
            </div>
            <div class="meta-actions">
              <button type="button" id="btn-toggle-sci" class="history-toggle-btn" aria-label="Toggle scientific keypad">🔬 Sci</button>
              <button type="button" id="btn-toggle-history" class="history-toggle-btn" aria-label="Toggle calculation history">📜 History</button>
            </div>
          </div>
          <div id="display" class="display-card" role="status" aria-live="polite" aria-label="Calculation result" part="display">
            ${this.engine.getState().display}
          </div>
        </div>

        <div id="scientific-panel" class="scientific-grid" part="scientific-panel">
          <button type="button" class="sci-btn" data-sci="sqrt" aria-label="Square root">√x</button>
          <button type="button" class="sci-btn" data-sci="square" aria-label="Square">x²</button>
          <button type="button" class="sci-btn" data-sci="power" aria-label="Power">xʸ</button>
          <button type="button" class="sci-btn" data-sci="pi" aria-label="Pi">π</button>
          <button type="button" class="sci-btn" data-sci="e" aria-label="Euler number">e</button>
          <button type="button" class="sci-btn" data-sci="sin" aria-label="Sine">sin</button>
          <button type="button" class="sci-btn" data-sci="cos" aria-label="Cosine">cos</button>
          <button type="button" class="sci-btn" data-sci="tan" aria-label="Tangent">tan</button>
        </div>

        <div id="history-drawer" class="history-drawer" part="history-drawer">
          <div class="history-header">
            <span>Calculation Tape</span>
            <button type="button" id="btn-clear-history" class="history-clear-btn" aria-label="Clear calculation history">Clear</button>
          </div>
          <div id="history-records">
            <div class="history-empty" id="history-empty">No calculations yet</div>
          </div>
        </div>

        <div id="memory-row" class="memory-row" role="group" aria-label="Memory registers" part="memory-row">
          <button type="button" class="mem-btn" data-mem="MC" aria-label="Memory Clear">MC</button>
          <button type="button" class="mem-btn" data-mem="MR" aria-label="Memory Recall">MR</button>
          <button type="button" class="mem-btn" data-mem="M+" aria-label="Memory Add">M+</button>
          <button type="button" class="mem-btn" data-mem="M-" aria-label="Memory Subtract">M−</button>
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
    this.badgeElement = this.shadowRootRef.getElementById('memory-badge') as HTMLElement;
    this.drawerElement = this.shadowRootRef.getElementById('history-drawer') as HTMLElement;
    if (this.drawerElement) this.drawerElement.style.display = 'none';
    this.sciPanelElement = this.shadowRootRef.getElementById('scientific-panel') as HTMLElement;
    if (this.sciPanelElement) this.sciPanelElement.style.display = 'none';

    const toggleBtn = this.shadowRootRef.getElementById('btn-toggle-history');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggleHistory());
    }

    const toggleSciBtn = this.shadowRootRef.getElementById('btn-toggle-sci');
    if (toggleSciBtn) {
      toggleSciBtn.addEventListener('click', () => this.toggleScientific());
    }

    const angleBtn = this.shadowRootRef.getElementById('btn-angle-mode');
    if (angleBtn) {
      angleBtn.addEventListener('click', () => {
        const newMode = this.scientific.toggleAngleMode();
        angleBtn.textContent = newMode;
      });
    }

    const clearHistBtn = this.shadowRootRef.getElementById('btn-clear-history');
    if (clearHistBtn) {
      clearHistBtn.addEventListener('click', () => {
        this.history.clear();
        this.updateHistoryList();
      });
    }

    const historyRecords = this.shadowRootRef.getElementById('history-records');
    if (historyRecords) {
      historyRecords.addEventListener('click', (e) => {
        const item = (e.target as HTMLElement).closest('[data-result]');
        if (item) {
          const res = item.getAttribute('data-result');
          if (res) this.loadHistoryRecord(res);
        }
      });
    }

    const sciPanel = this.shadowRootRef.getElementById('scientific-panel');
    if (sciPanel) {
      sciPanel.addEventListener('click', (e) => {
        const btn = (e.target as HTMLElement).closest('button');
        if (!btn) return;
        const sciOp = btn.getAttribute('data-sci');
        const val = parseFloat(this.engine.getState().display) || 0;

        if (sciOp === 'sqrt') {
          const res = this.scientific.sqrt(val);
          if (res === 'Invalid input') {
            this.engine.setError('Invalid input');
          } else {
            this.engine.setDisplayValue(formatDisplay(res));
          }
        } else if (sciOp === 'square') {
          const res = this.scientific.square(val);
          this.engine.setDisplayValue(formatDisplay(res));
        } else if (sciOp === 'power') {
          this.engine.inputOperator('^');
        } else if (sciOp === 'pi') {
          this.engine.setDisplayValue(formatDisplay(this.scientific.pi()));
        } else if (sciOp === 'e') {
          this.engine.setDisplayValue(formatDisplay(this.scientific.e()));
        } else if (sciOp === 'sin') {
          const res = this.scientific.sin(val);
          this.engine.setDisplayValue(formatDisplay(res));
        } else if (sciOp === 'cos') {
          const res = this.scientific.cos(val);
          this.engine.setDisplayValue(formatDisplay(res));
        } else if (sciOp === 'tan') {
          const res = this.scientific.tan(val);
          if (res === 'Invalid input') {
            this.engine.setError('Invalid input');
          } else {
            this.engine.setDisplayValue(formatDisplay(res));
          }
        }

        this.updateDisplay();
      });
    }

    const memoryRow = this.shadowRootRef.getElementById('memory-row');
    if (memoryRow) {
      memoryRow.addEventListener('click', (e) => {
        const btn = (e.target as HTMLElement).closest('button');
        if (!btn) return;
        const memAction = btn.getAttribute('data-mem');
        const currentVal = parseFloat(this.engine.getState().display) || 0;

        if (memAction === 'MC') {
          this.memory.clear();
        } else if (memAction === 'MR') {
          const val = this.memory.recall();
          this.engine.setDisplayValue(formatDisplay(val));
        } else if (memAction === 'M+') {
          this.memory.add(currentVal);
          this.engine.allClear();
        } else if (memAction === 'M-') {
          this.memory.subtract(currentVal);
          this.engine.allClear();
        }

        this.updateDisplay();
      });
    }

    const keypad = this.shadowRootRef.getElementById('keypad');
    if (keypad) {
      keypad.addEventListener('click', (e) => {
        const btn = (e.target as HTMLElement).closest('button');
        if (!btn) return;

        const digit = btn.getAttribute('data-digit');
        const op = btn.getAttribute('data-op') as '+' | '-' | '*' | '/' | '^' | null;
        const action = btn.getAttribute('data-action');

        if (digit !== null) {
          this.engine.inputDigit(digit);
        } else if (op !== null) {
          this.engine.inputOperator(op);
        } else if (action === 'calculate') {
          this.triggerCalculate();
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
