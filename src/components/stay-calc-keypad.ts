import type { CalcActionDetail, CalcClearDetail, CalcInputDetail, KeypadButtonConfig } from '../types/index.js';

export const STANDARD_BUTTONS: KeypadButtonConfig[] = [
  // Row 1
  { id: 'btn-clear', label: 'C', action: 'clear', type: 'action', ariaLabel: 'Clear input', variant: 'secondary' },
  { id: 'btn-negate', label: '±', action: 'negate', type: 'action', ariaLabel: 'Negate number', variant: 'secondary' },
  { id: 'btn-percent', label: '%', action: 'percent', type: 'action', ariaLabel: 'Percent', variant: 'secondary' },
  { id: 'btn-divide', label: '÷', action: 'divide', type: 'operator', ariaLabel: 'Divide', variant: 'accent' },

  // Row 2
  { id: 'btn-7', label: '7', value: '7', type: 'digit', ariaLabel: '7', variant: 'surface' },
  { id: 'btn-8', label: '8', value: '8', type: 'digit', ariaLabel: '8', variant: 'surface' },
  { id: 'btn-9', label: '9', value: '9', type: 'digit', ariaLabel: '9', variant: 'surface' },
  { id: 'btn-multiply', label: '×', action: 'multiply', type: 'operator', ariaLabel: 'Multiply', variant: 'accent' },

  // Row 3
  { id: 'btn-4', label: '4', value: '4', type: 'digit', ariaLabel: '4', variant: 'surface' },
  { id: 'btn-5', label: '5', value: '5', type: 'digit', ariaLabel: '5', variant: 'surface' },
  { id: 'btn-6', label: '6', value: '6', type: 'digit', ariaLabel: '6', variant: 'surface' },
  { id: 'btn-subtract', label: '−', action: 'subtract', type: 'operator', ariaLabel: 'Subtract', variant: 'accent' },

  // Row 4
  { id: 'btn-1', label: '1', value: '1', type: 'digit', ariaLabel: '1', variant: 'surface' },
  { id: 'btn-2', label: '2', value: '2', type: 'digit', ariaLabel: '2', variant: 'surface' },
  { id: 'btn-3', label: '3', value: '3', type: 'digit', ariaLabel: '3', variant: 'surface' },
  { id: 'btn-add', label: '+', action: 'add', type: 'operator', ariaLabel: 'Add', variant: 'accent' },

  // Row 5
  { id: 'btn-0', label: '0', value: '0', type: 'digit', ariaLabel: '0', gridSpan: 2, variant: 'surface' },
  { id: 'btn-decimal', label: '.', value: '.', type: 'digit', ariaLabel: 'Decimal point', variant: 'surface' },
  { id: 'btn-equals', label: '=', action: 'equals', type: 'operator', ariaLabel: 'Calculate result', variant: 'primary' },
];

export class StayCalcKeypad extends HTMLElement {
  public static readonly TAG = 'stay-calc-keypad';

  constructor() {
    super();
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
    }
  }

  connectedCallback(): void {
    this.render();
    this.setupListeners();
  }

  private setupListeners(): void {
    const grid = this.shadowRoot?.querySelector('.keypad-grid');
    if (!grid) return;

    grid.addEventListener('click', (e) => {
      const target = (e.target as HTMLElement).closest<HTMLButtonElement>('.calc-key');
      if (!target) return;

      const keyType = target.dataset.type;
      const value = target.dataset.value;
      const action = target.dataset.action;

      if (keyType === 'digit' && value !== undefined) {
        this.dispatchEvent(
          new CustomEvent<CalcInputDetail>('calc-input', {
            detail: { value },
            bubbles: true,
            composed: true,
          })
        );
      } else if (keyType === 'action' && action === 'clear') {
        this.dispatchEvent(
          new CustomEvent<CalcClearDetail>('calc-clear', {
            detail: { all: false },
            bubbles: true,
            composed: true,
          })
        );
      } else if (action) {
        this.dispatchEvent(
          new CustomEvent<CalcActionDetail>('calc-action', {
            detail: { action },
            bubbles: true,
            composed: true,
          })
        );
      }
    });
  }

  private render(): void {
    if (!this.shadowRoot) return;

    const buttonsHtml = STANDARD_BUTTONS.map((btn) => {
      const spanClass = btn.gridSpan === 2 ? 'span-2' : '';
      const variantClass = `variant-${btn.variant || 'surface'}`;

      return `
        <button
          id="${btn.id}"
          class="calc-key ${variantClass} ${spanClass}"
          data-type="${btn.type}"
          ${btn.value !== undefined ? `data-value="${btn.value}"` : ''}
          ${btn.action !== undefined ? `data-action="${btn.action}"` : ''}
          aria-label="${btn.ariaLabel}"
          type="button"
        >
          ${btn.label}
        </button>
      `;
    }).join('');

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
        }

        .keypad-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--sl-space-sm);
          padding: var(--sl-space-md);
          background-color: var(--sl-surface);
          border-radius: 0 0 var(--sl-radius-lg) var(--sl-radius-lg);
          transition: var(--sl-transition-theme);
        }

        .calc-key {
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--sl-font-display);
          font-size: 20px;
          font-weight: 600;
          height: 58px;
          min-height: 48px;
          border-radius: var(--sl-radius-full);
          border: 1px solid transparent;
          cursor: pointer;
          user-select: none;
          -webkit-user-select: none;
          touch-action: manipulation;
          transition: transform 80ms ease, background-color var(--sl-transition-fast), border-color var(--sl-transition-fast);
        }

        .calc-key:active {
          transform: scale(0.95);
        }

        .calc-key:focus-visible {
          outline: 2px solid var(--sl-primary);
          outline-offset: 2px;
        }

        /* Key variants */
        .variant-surface {
          background-color: var(--sl-container-high);
          color: var(--sl-text-primary);
          border-color: var(--sl-outline-low);
        }

        .variant-surface:hover {
          background-color: var(--sl-surface-active);
        }

        .variant-secondary {
          background-color: var(--sl-container-low);
          color: var(--sl-text-primary);
        }

        .variant-secondary:hover {
          background-color: var(--sl-surface-active);
        }

        .variant-accent {
          background-color: var(--sl-container-low);
          color: var(--sl-primary);
          font-weight: 700;
        }

        .variant-accent:hover {
          background-color: var(--sl-surface-active);
        }

        .variant-primary {
          background-color: var(--sl-primary);
          color: var(--sl-on-primary);
          font-weight: 700;
        }

        .variant-primary:hover {
          filter: brightness(1.1);
        }

        .span-2 {
          grid-column: span 2;
          aspect-ratio: auto;
          justify-content: flex-start;
          padding-left: var(--sl-space-lg);
        }

        @media (max-width: 360px) {
          .keypad-grid {
            gap: var(--sl-space-xs);
            padding: var(--sl-space-sm);
          }
          .calc-key {
            height: 50px;
            font-size: 18px;
          }
        }
      </style>

      <div class="keypad-grid" role="group" aria-label="Calculator Keypad">
        ${buttonsHtml}
      </div>
    `;
  }
}
