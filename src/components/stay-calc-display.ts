import type { CalcDisplayState } from '../types/index.js';

export class StayCalcDisplay extends HTMLElement {
  public static readonly TAG = 'stay-calc-display';

  private primaryValue = '0';
  private secondaryExpression = '';
  private memoryActive = false;
  private hasError = false;

  constructor() {
    super();
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
    }
  }

  connectedCallback(): void {
    this.render();
  }

  public updateDisplay(state: Partial<CalcDisplayState>): void {
    if (state.primaryValue !== undefined) {
      this.primaryValue = state.primaryValue;
    }
    if (state.secondaryExpression !== undefined) {
      this.secondaryExpression = state.secondaryExpression;
    }
    if (state.memoryActive !== undefined) {
      this.memoryActive = state.memoryActive;
    }
    if (state.hasError !== undefined) {
      this.hasError = state.hasError;
    }
    this.render();
  }

  public getPrimaryValue(): string {
    return this.primaryValue;
  }

  public getSecondaryExpression(): string {
    return this.secondaryExpression;
  }

  private calculateFontSize(): string {
    const len = this.primaryValue.length;
    if (len <= 8) return 'clamp(28px, 6vw, 44px)';
    if (len <= 12) return 'clamp(22px, 4.5vw, 32px)';
    if (len <= 16) return 'clamp(18px, 3.5vw, 26px)';
    return 'clamp(14px, 2.8vw, 20px)';
  }

  private render(): void {
    if (!this.shadowRoot) return;

    const fontSize = this.calculateFontSize();

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
        }

        .display-card {
          background-color: var(--sl-background);
          border-bottom: 1px solid var(--sl-outline-low);
          padding: var(--sl-space-base) var(--sl-space-lg);
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          justify-content: flex-end;
          min-height: 120px;
          position: relative;
          box-sizing: border-box;
          transition: var(--sl-transition-theme);
        }

        .meta-bar {
          position: absolute;
          top: var(--sl-space-xs);
          left: var(--sl-space-base);
          display: flex;
          align-items: center;
          gap: var(--sl-space-xs);
        }

        .memory-badge {
          font-family: var(--sl-font-mono);
          font-size: 11px;
          font-weight: 700;
          color: var(--sl-primary);
          background-color: var(--sl-container-low);
          padding: 2px 6px;
          border-radius: var(--sl-radius-xs);
          opacity: ${this.memoryActive ? '1' : '0'};
          transition: opacity var(--sl-transition-fast);
        }

        .secondary-line {
          font-family: var(--sl-font-display);
          font-size: 14px;
          font-weight: 500;
          color: var(--sl-text-secondary);
          min-height: 20px;
          letter-spacing: 0.02em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
          font-variant-numeric: tabular-nums;
        }

        .primary-line {
          font-family: var(--sl-font-display);
          font-size: ${fontSize};
          font-weight: 700;
          color: ${this.hasError ? 'var(--sl-error)' : 'var(--sl-text-primary)'};
          line-height: 1.15;
          letter-spacing: -0.02em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: clip;
          max-width: 100%;
          word-break: break-all;
          font-variant-numeric: tabular-nums;
          transition: font-size 100ms ease, color var(--sl-transition-fast);
        }
      </style>

      <div class="display-card" role="region" aria-label="Calculator display">
        <div class="meta-bar">
          <span class="memory-badge" aria-hidden="${!this.memoryActive}">M</span>
        </div>
        <div id="secondary-display" class="secondary-line" aria-label="Expression history">
          ${this.secondaryExpression}
        </div>
        <div
          id="primary-display"
          class="primary-line"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          aria-label="Active value: ${this.primaryValue}"
        >
          ${this.primaryValue}
        </div>
      </div>
    `;
  }
}
