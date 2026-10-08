import { ThemeManager } from '../theme/theme-manager.js';
import type { CalcMode, ThemeChangeDetail } from '../types/index.js';

export class StayCalcHeader extends HTMLElement {
  public static readonly TAG = 'stay-calc-header';

  private activeMode: CalcMode = 'standard';
  private themeManager = ThemeManager.getInstance();

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

  disconnectedCallback(): void {
    window.removeEventListener('theme-changed', this.handleThemeChanged);
  }

  private setupListeners(): void {
    window.addEventListener('theme-changed', this.handleThemeChanged);

    const themeBtn = this.shadowRoot?.querySelector('#theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        this.themeManager.toggle();
      });
    }

    const modeButtons = this.shadowRoot?.querySelectorAll<HTMLButtonElement>('.mode-pill');
    modeButtons?.forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode as CalcMode;
        if (mode && mode !== this.activeMode) {
          this.setMode(mode);
        }
      });
    });
  }

  public setMode(mode: CalcMode): void {
    this.activeMode = mode;
    this.render();
    this.setupListeners();
    this.dispatchEvent(
      new CustomEvent('mode-change', {
        detail: { mode },
        bubbles: true,
        composed: true,
      })
    );
  }

  private handleThemeChanged = (event: Event): void => {
    const detail = (event as CustomEvent<ThemeChangeDetail>).detail;
    const themeBtn = this.shadowRoot?.querySelector('#theme-toggle-btn');
    if (themeBtn) {
      themeBtn.setAttribute('aria-label', `Current theme: ${detail.theme}. Click to toggle.`);
    }
  };

  private render(): void {
    if (!this.shadowRoot) return;

    const currentTheme = this.themeManager.getActiveTheme();
    const isDark = currentTheme === 'dark';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
        }

        .header-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--sl-space-sm) var(--sl-space-md);
          background-color: var(--sl-surface);
          border-bottom: 1px solid var(--sl-outline-low);
          border-radius: var(--sl-radius-lg) var(--sl-radius-lg) 0 0;
          transition: var(--sl-transition-theme);
        }

        .brand-section {
          display: flex;
          align-items: center;
          gap: var(--sl-space-xs);
        }

        .brand-icon {
          width: 20px;
          height: 20px;
          color: var(--sl-primary);
        }

        .brand-title {
          font-family: var(--sl-font-display);
          font-size: 16px;
          font-weight: 700;
          letter-spacing: -0.01em;
          color: var(--sl-text-primary);
        }

        .controls-section {
          display: flex;
          align-items: center;
          gap: var(--sl-space-xs);
        }

        .mode-selector {
          display: flex;
          align-items: center;
          background-color: var(--sl-container-low);
          padding: 2px;
          border-radius: var(--sl-radius-full);
          gap: 2px;
        }

        .mode-pill {
          background: transparent;
          border: none;
          color: var(--sl-text-secondary);
          font-family: var(--sl-font-body);
          font-size: 12px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: var(--sl-radius-full);
          cursor: pointer;
          transition: var(--sl-transition-fast);
        }

        .mode-pill:hover {
          color: var(--sl-text-primary);
        }

        .mode-pill.active {
          background-color: var(--sl-background);
          color: var(--sl-primary);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .icon-button {
          background: var(--sl-surface);
          border: 1px solid var(--sl-outline-low);
          border-radius: var(--sl-radius-full);
          color: var(--sl-text-primary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          transition: var(--sl-transition-fast);
        }

        .icon-button:hover {
          background-color: var(--sl-surface-active);
          border-color: var(--sl-primary);
          color: var(--sl-primary);
        }

        .icon-button:focus-visible,
        .mode-pill:focus-visible {
          outline: 2px solid var(--sl-primary);
          outline-offset: 2px;
        }

        .theme-icon {
          width: 18px;
          height: 18px;
        }
      </style>

      <header class="header-container" role="banner">
        <div class="brand-section">
          <svg class="brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect width="16" height="20" x="4" y="2" rx="2"></rect>
            <line x1="8" x2="16" y1="6" y2="6"></line>
            <line x1="16" x2="16" y1="14"></line>
            <line x1="16" x2="16" y1="18"></line>
            <path d="M8 10h.01"></path>
            <path d="M12 10h.01"></path>
            <path d="M16 10h.01"></path>
            <path d="M8 14h.01"></path>
            <path d="M12 14h.01"></path>
            <path d="M8 18h.01"></path>
            <path d="M12 18h.01"></path>
          </svg>
          <span class="brand-title">StayCalc</span>
        </div>

        <div class="controls-section">
          <nav class="mode-selector" aria-label="Calculation Mode">
            <button class="mode-pill ${this.activeMode === 'standard' ? 'active' : ''}" data-mode="standard" aria-pressed="${this.activeMode === 'standard'}">Standard</button>
            <button class="mode-pill ${this.activeMode === 'scientific' ? 'active' : ''}" data-mode="scientific" aria-pressed="${this.activeMode === 'scientific'}">Sci</button>
            <button class="mode-pill ${this.activeMode === 'programmer' ? 'active' : ''}" data-mode="programmer" aria-pressed="${this.activeMode === 'programmer'}">Prog</button>
          </nav>

          <button id="theme-toggle-btn" class="icon-button" aria-label="Toggle theme mode" title="Toggle theme">
            ${
              isDark
                ? `<svg class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="4"></circle>
                    <path d="M12 2v2"></path>
                    <path d="M12 20v2"></path>
                    <path d="m4.93 4.93 1.41 1.41"></path>
                    <path d="m17.66 17.66 1.41 1.41"></path>
                    <path d="M2 12h2"></path>
                    <path d="M20 12h2"></path>
                    <path d="m6.34 17.66-1.41 1.41"></path>
                    <path d="m19.07 4.93-1.41 1.41"></path>
                  </svg>`
                : `<svg class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
                  </svg>`
            }
          </button>
        </div>
      </header>
    `;
  }
}
