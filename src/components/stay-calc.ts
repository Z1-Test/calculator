/**
 * src/components/stay-calc.ts
 *
 * W3C Autonomous Custom Element <stay-calc> providing:
 * - Encapsulated Declarative Shadow DOM (DSD) template and slot projection graph
 * - Integration with F1/F5/F6 CalculatorEngine via SEAM-ENGINE-01
 * - Full interactive keypad buttons (0-9, ., +, -, *, /, =, C, AC, +/-, ⌫)
 * - Mode switching: Standard, Scientific (#scientificKeys), and Programmer (#programmerKeys)
 * - Radix selector (#radixSelector: HEX, DEC, OCT, BIN) with aria-pressed
 * - Simultaneous multi-radix preview display (#multiRadixPreview: HEX, DEC, OCT, BIN)
 * - Programmer keypad controls: Hex digits A-F, Bitwise buttons AND, OR, XOR, NOT, LSH, RSH
 * - Dynamic keypad gating per active radix (e.g. BIN enables 0-1; locks 2-9, A-F, '.')
 * - Calculation history tape and slide-out drawer panel (#historyDrawer, #historyToggle)
 * - Physical keyboard interception enforcing dynamic radix gating
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
import {
  convertUnits,
  getUnitsForCategory,
  DEFAULT_UNITS,
  isUnitCategory,
} from '../engine/converter.ts';
import type {
  CalculatorAction,
  CalculatorState,
  CalculationHistoryEntry,
  HistoryExportFormat,
  HistoryExportResult,
  Operator,
  CalculatorMode,
  AngleUnit,
  Radix,
  MultiRadixValues,
  CalculatorTheme,
  UnitCategory,
  ConversionUnit,
  ConversionResult,
} from '../engine/types.ts';

export const THEME_STORAGE_KEY = 'staycalc_theme';

/**
 * Safely reads the persisted theme from localStorage with graceful exception fallback.
 */
export function getStoredTheme(): CalculatorTheme | null {
  try {
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      const val = globalThis.localStorage.getItem(THEME_STORAGE_KEY);
      if (val === 'dark' || val === 'light' || val === 'high-contrast') {
        return val as CalculatorTheme;
      }
    }
  } catch {
    // Ignore restricted localStorage security or permission errors
  }
  return null;
}

/**
 * Safely writes the selected theme to localStorage with graceful exception fallback.
 */
export function setStoredTheme(theme: CalculatorTheme): void {
  try {
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      globalThis.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  } catch {
    // Ignore restricted localStorage security or quota errors
  }
}

const TEMPLATE_STYLES = `
  :host {
    /* Design Tokens - Dark (Default) */
    --calc-bg: #18181b;
    --calc-surface: #27272a;
    --calc-text: #f4f4f5;
    --calc-btn-bg: #27272a;
    --calc-btn-text: #f4f4f5;
    --calc-btn-op-bg: #3f3f46;
    --calc-accent-bg: #2563eb;
    --calc-border: #3f3f46;
    --calc-focus-ring: #3b82f6;

    /* Semantic Compatibility Mappings */
    --calc-background: var(--calc-bg);
    --calc-primary: var(--calc-accent-bg);
    --calc-on-primary: #ffffff;
    --calc-secondary: #a1a1aa;
    --calc-tertiary: var(--calc-surface);
    --calc-container-high: var(--calc-btn-bg);
    --calc-container-medium: var(--calc-surface);
    --calc-container-low: var(--calc-btn-op-bg);
    --calc-text-primary: var(--calc-text);
    --calc-text-secondary: #a1a1aa;
    --calc-outline-low: var(--calc-border);
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

  :host([data-theme="dark"]) {
    --calc-bg: #18181b;
    --calc-surface: #27272a;
    --calc-text: #f4f4f5;
    --calc-btn-bg: #27272a;
    --calc-btn-text: #f4f4f5;
    --calc-btn-op-bg: #3f3f46;
    --calc-accent-bg: #2563eb;
    --calc-border: #3f3f46;
    --calc-focus-ring: #3b82f6;

    --calc-background: var(--calc-bg);
    --calc-primary: var(--calc-accent-bg);
    --calc-on-primary: #ffffff;
    --calc-secondary: #a1a1aa;
    --calc-tertiary: var(--calc-surface);
    --calc-container-high: var(--calc-btn-bg);
    --calc-container-medium: var(--calc-surface);
    --calc-container-low: var(--calc-btn-op-bg);
    --calc-text-primary: var(--calc-text);
    --calc-text-secondary: #a1a1aa;
    --calc-outline-low: var(--calc-border);
    --calc-error: #ff453a;
  }

  :host([data-theme="light"]) {
    /* Design Tokens - Light */
    --calc-bg: #ffffff;
    --calc-surface: #f4f4f5;
    --calc-text: #09090b;
    --calc-btn-bg: #ffffff;
    --calc-btn-text: #09090b;
    --calc-btn-op-bg: #f4f4f5;
    --calc-accent-bg: #2563eb;
    --calc-border: #e4e4e7;
    --calc-focus-ring: #2563eb;

    /* Semantic Compatibility Mappings */
    --calc-background: var(--calc-bg);
    --calc-primary: var(--calc-accent-bg);
    --calc-on-primary: #ffffff;
    --calc-secondary: #475569;
    --calc-tertiary: #f4f4f5;
    --calc-container-high: var(--calc-btn-bg);
    --calc-container-medium: var(--calc-surface);
    --calc-container-low: #e4e4e7;
    --calc-text-primary: var(--calc-text);
    --calc-text-secondary: #71717a;
    --calc-outline-low: var(--calc-border);
    --calc-error: #ff453a;
  }

  :host([data-theme="high-contrast"]) {
    /* Design Tokens - High-Contrast (WCAG 2.2 AAA 21:1 Contrast) */
    --calc-bg: #000000;
    --calc-surface: #000000;
    --calc-text: #ffffff;
    --calc-btn-bg: #000000;
    --calc-btn-text: #ffffff;
    --calc-btn-op-bg: #000000;
    --calc-accent-bg: #000000;
    --calc-border: #ffffff;
    --calc-focus-ring: #ffff00;

    /* Semantic Compatibility Mappings */
    --calc-background: var(--calc-bg);
    --calc-primary: #ffffff;
    --calc-on-primary: #000000;
    --calc-secondary: #ffffff;
    --calc-tertiary: #000000;
    --calc-container-high: #000000;
    --calc-container-medium: #000000;
    --calc-container-low: #18181b;
    --calc-text-primary: var(--calc-text);
    --calc-text-secondary: #ffffff;
    --calc-outline-low: var(--calc-border);
    --calc-error: #ff5555;
  }

  /* High-Contrast WCAG 2.2 AAA prominent 2px solid #ffffff borders and 21:1 text contrast */
  :host([data-theme="high-contrast"]) .calc-container,
  :host([data-theme="high-contrast"]) .display-screen,
  :host([data-theme="high-contrast"]) .calc-btn,
  :host([data-theme="high-contrast"]) .sci-btn,
  :host([data-theme="high-contrast"]) .prog-btn,
  :host([data-theme="high-contrast"]) .radix-btn,
  :host([data-theme="high-contrast"]) .mode-toggle-btn,
  :host([data-theme="high-contrast"]) .angle-unit-toggle-btn,
  :host([data-theme="high-contrast"]) .history-toggle-btn,
  :host([data-theme="high-contrast"]) .theme-toggle-btn,
  :host([data-theme="high-contrast"]) .converter-toggle-btn,
  :host([data-theme="high-contrast"]) .multi-radix-preview,
  :host([data-theme="high-contrast"]) .history-drawer,
  :host([data-theme="high-contrast"]) .history-action-btn,
  :host([data-theme="high-contrast"]) .clear-history-btn,
  :host([data-theme="high-contrast"]) .history-entry,
  :host([data-theme="high-contrast"]) .converter-drawer,
  :host([data-theme="high-contrast"]) .converter-select,
  :host([data-theme="high-contrast"]) .converter-input,
  :host([data-theme="high-contrast"]) .converter-output,
  :host([data-theme="high-contrast"]) .converter-load-btn,
  :host([data-theme="high-contrast"]) .toast-notification {
    border: 2px solid #ffffff;
  }

  :host([data-theme="high-contrast"]) .btn-equals,
  :host([data-theme="high-contrast"]) .converter-load-btn {
    background-color: #000000;
    color: #ffffff;
    border: 2px solid #ffffff;
  }

  :host([data-theme="high-contrast"]) .calc-btn:focus-visible,
  :host([data-theme="high-contrast"]) .sci-btn:focus-visible,
  :host([data-theme="high-contrast"]) .prog-btn:focus-visible,
  :host([data-theme="high-contrast"]) .radix-btn:focus-visible,
  :host([data-theme="high-contrast"]) .mode-toggle-btn:focus-visible,
  :host([data-theme="high-contrast"]) .angle-unit-toggle-btn:focus-visible,
  :host([data-theme="high-contrast"]) .history-toggle-btn:focus-visible,
  :host([data-theme="high-contrast"]) .theme-toggle-btn:focus-visible,
  :host([data-theme="high-contrast"]) .converter-toggle-btn:focus-visible,
  :host([data-theme="high-contrast"]) .converter-select:focus-visible,
  :host([data-theme="high-contrast"]) .converter-input:focus-visible,
  :host([data-theme="high-contrast"]) .converter-load-btn:focus-visible,
  :host([data-theme="high-contrast"]) .history-action-btn:focus-visible,
  :host([data-theme="high-contrast"]) .clear-history-btn:focus-visible,
  :host([data-theme="high-contrast"]) .history-entry:focus-visible {
    outline: 2px solid #ffff00;
    outline-offset: 2px;
  }

  *, *::before, *::after {
    box-sizing: border-box;
  }

  .calc-container {
    position: relative;
    inline-size: 100%;
    padding-inline: 16px;
    padding-block: 20px;
    background-color: var(--calc-background, #ffffff);
    border: 1px solid var(--calc-outline-low, #e4e4e7);
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
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
    text-align: end;
    word-break: break-all;
    user-select: all;
  }

  .display-screen.error .display-value {
    color: var(--calc-error, #ff453a);
    font-size: 20px;
  }

  .calc-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    inline-size: 100%;
    gap: 8px;
  }

  .header-left, .header-right {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .mode-toggle-btn, .angle-unit-toggle-btn, .history-toggle-btn, .theme-toggle-btn, .converter-toggle-btn {
    appearance: none;
    -webkit-appearance: none;
    border: 1px solid var(--calc-outline-low, #e4e4e7);
    background-color: var(--calc-surface, #f4f4f5);
    color: var(--calc-text-primary, #09090b);
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    border-radius: 8px;
    padding-inline: 10px;
    padding-block: 6px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  }

  .mode-toggle-btn:hover, .angle-unit-toggle-btn:hover, .history-toggle-btn:hover, .theme-toggle-btn:hover, .converter-toggle-btn:hover {
    background-color: var(--calc-container-low, #e4e4e7);
  }

  .mode-toggle-btn:focus-visible, .angle-unit-toggle-btn:focus-visible, .history-toggle-btn:focus-visible, .theme-toggle-btn:focus-visible, .converter-toggle-btn:focus-visible {
    outline: 2px solid var(--calc-focus-ring, var(--calc-primary, #2563eb));
    outline-offset: 2px;
  }

  .theme-icon {
    font-size: 13px;
    line-height: 1;
    display: inline-block;
  }

  .mode-toggle-btn.active, .mode-toggle-btn[aria-pressed="true"] {
    background-color: var(--calc-primary, #2563eb);
    color: var(--calc-on-primary, #ffffff);
    border-color: var(--calc-primary, #2563eb);
  }

  .angle-unit-indicator {
    font-size: 11px;
    font-weight: 700;
    color: var(--calc-primary, #2563eb);
    letter-spacing: 0.05em;
  }

  /* Multi-Radix Preview Cards */
  .multi-radix-preview {
    display: none;
    flex-direction: column;
    gap: 4px;
    inline-size: 100%;
    padding-inline: 12px;
    padding-block: 8px;
    background-color: var(--calc-surface, #f4f4f5);
    border: 1px solid var(--calc-outline-low, #e4e4e7);
    border-radius: 10px;
    box-sizing: border-box;
  }

  .multi-radix-preview.visible {
    display: flex;
  }

  .radix-preview-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: monospace;
    font-size: 12px;
    color: var(--calc-text-secondary, #71717a);
    padding-inline: 6px;
    padding-block: 3px;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.12s ease;
  }

  .radix-preview-row:hover {
    background-color: var(--calc-container-low, #e4e4e7);
  }

  .radix-preview-row.active {
    color: var(--calc-primary, #2563eb);
    font-weight: 700;
    background-color: rgba(37, 99, 235, 0.08);
  }

  .radix-name {
    font-weight: 700;
    min-inline-size: 36px;
  }

  .radix-val {
    font-variant-numeric: tabular-nums;
    word-break: break-all;
    text-align: end;
  }

  /* Radix Selector Buttons */
  .radix-selector {
    display: none;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    inline-size: 100%;
  }

  .radix-selector.visible {
    display: grid;
  }

  .radix-btn {
    appearance: none;
    -webkit-appearance: none;
    border: 1px solid var(--calc-outline-low, #e4e4e7);
    background-color: var(--calc-container-medium, #f4f4f5);
    color: var(--calc-text-secondary, #71717a);
    font-family: inherit;
    font-size: 13px;
    font-weight: 700;
    border-radius: 8px;
    padding-inline: 8px;
    padding-block: 6px;
    cursor: pointer;
    text-align: center;
    transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  }

  .radix-btn:hover {
    background-color: var(--calc-container-low, #e4e4e7);
  }

  .radix-btn.active, .radix-btn[aria-pressed="true"] {
    background-color: var(--calc-primary, #2563eb);
    color: var(--calc-on-primary, #ffffff);
    border-color: var(--calc-primary, #2563eb);
  }

  .radix-btn:focus-visible {
    outline: 2px solid var(--calc-primary, #2563eb);
    outline-offset: 2px;
  }

  /* Programmer Keys Grid */
  .programmer-keys {
    display: none;
    grid-template-columns: repeat(6, 1fr);
    gap: 8px;
    inline-size: 100%;
  }

  .programmer-keys.visible {
    display: grid;
  }

  .prog-btn {
    appearance: none;
    -webkit-appearance: none;
    border: 1px solid var(--calc-outline-low, #e4e4e7);
    background-color: var(--calc-container-medium, #f4f4f5);
    color: var(--calc-text-primary, #09090b);
    font-family: inherit;
    font-size: 13px;
    font-weight: 700;
    border-radius: 8px;
    min-block-size: 40px;
    padding-inline: 4px;
    padding-block: 8px;
    cursor: pointer;
    text-align: center;
    transition: background-color 0.15s ease, opacity 0.15s ease;
  }

  .prog-btn:hover:not(:disabled) {
    background-color: var(--calc-container-low, #e4e4e7);
  }

  .prog-btn:focus-visible {
    outline: 2px solid var(--calc-primary, #2563eb);
    outline-offset: 2px;
  }

  .btn-hex {
    background-color: var(--calc-container-high, #ffffff);
  }

  /* Scientific Keys Grid */
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
    appearance: none;
    -webkit-appearance: none;
    border: 1px solid var(--calc-outline-low, #e4e4e7);
    border-radius: 10px;
    color: var(--calc-text-primary, #09090b);
    font-family: inherit;
    font-weight: 600;
    cursor: pointer;
    font-size: 16px;
    min-block-size: 46px;
    padding-inline: 8px;
    padding-block: 10px;
    background-color: var(--calc-container-medium, #f4f4f5);
    transition: background-color 0.15s ease;
  }

  .sci-btn:hover {
    background-color: var(--calc-container-low, #e4e4e7);
  }

  .sci-btn:focus-visible {
    outline: 2px solid var(--calc-primary, #2563eb);
    outline-offset: 2px;
  }

  /* Primary Keypad Grid */
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
    background-color: var(--calc-container-high, #ffffff);
    color: var(--calc-text-primary, #09090b);
    font-family: inherit;
    font-size: 18px;
    font-weight: 600;
    border-radius: 10px;
    min-block-size: 52px;
    padding-inline: 12px;
    padding-block: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
    transition: background-color 0.12s ease, transform 0.05s ease, border-color 0.12s ease;
  }

  .calc-btn:hover:not(:disabled) {
    background-color: var(--calc-container-medium, #f4f4f5);
  }

  .calc-btn:active:not(:disabled) {
    transform: scale(0.97);
  }

  .calc-btn:focus-visible {
    outline: 2px solid var(--calc-primary, #2563eb);
    outline-offset: 2px;
  }

  .btn-op {
    background-color: var(--calc-container-medium, #f4f4f5);
    color: var(--calc-primary, #2563eb);
    font-size: 20px;
  }

  .btn-action {
    background-color: var(--calc-container-medium, #f4f4f5);
    color: var(--calc-text-secondary, #71717a);
  }

  .btn-memory {
    background-color: var(--calc-container-medium, #f4f4f5);
    color: var(--calc-text-secondary, #71717a);
    font-size: 14px;
    font-weight: 700;
  }

  .btn-equals {
    background-color: var(--calc-primary, #2563eb);
    color: var(--calc-on-primary, #ffffff);
    border-color: var(--calc-primary, #2563eb);
    font-size: 22px;
  }

  .btn-equals:hover:not(:disabled) {
    background-color: #1d4ed8;
  }

  /* Disabled buttons styling for dynamic keypad gating */
  button:disabled, button[disabled], button[aria-disabled="true"] {
    opacity: 0.35;
    cursor: not-allowed;
    pointer-events: none;
  }

  /* History Drawer */
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

  .history-actions-bar {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
    inline-size: 100%;
    box-sizing: border-box;
  }

  .history-action-btn {
    appearance: none;
    -webkit-appearance: none;
    border: 1px solid var(--calc-outline-low, #e4e4e7);
    background-color: var(--calc-container-high, #ffffff);
    color: var(--calc-text-primary, #09090b);
    font-family: inherit;
    font-size: 11px;
    font-weight: 600;
    border-radius: 6px;
    padding-inline: 8px;
    padding-block: 6px;
    cursor: pointer;
    text-align: center;
    transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.1s ease;
    box-sizing: border-box;
  }

  .history-action-btn:hover {
    background-color: var(--calc-container-low, #e4e4e7);
    border-color: var(--calc-primary, #2563eb);
  }

  .history-action-btn:focus-visible {
    outline: 2px solid var(--calc-primary, #2563eb);
    outline-offset: 1px;
  }

  .history-action-btn:active {
    transform: scale(0.97);
  }

  /* Converter Drawer */
  .converter-drawer {
    display: none;
    flex-direction: column;
    gap: 10px;
    inline-size: 100%;
    padding-inline: 14px;
    padding-block: 12px;
    background-color: var(--calc-surface, #f4f4f5);
    border: 1px solid var(--calc-outline-low, #e4e4e7);
    border-radius: 12px;
    box-sizing: border-box;
  }

  .converter-drawer.open {
    display: flex;
  }

  .converter-drawer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    inline-size: 100%;
    padding-block-end: 6px;
    border-block-end: 1px solid var(--calc-outline-low, #e4e4e7);
  }

  .converter-drawer-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--calc-text-primary, #09090b);
  }

  .converter-controls {
    display: flex;
    flex-direction: column;
    gap: 8px;
    inline-size: 100%;
  }

  .converter-units-row, .converter-input-output-group {
    display: flex;
    align-items: center;
    gap: 8px;
    inline-size: 100%;
  }

  .converter-control-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
    min-inline-size: 0;
  }

  .converter-output-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
    min-inline-size: 0;
  }

  .converter-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--calc-text-secondary, #71717a);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .converter-select, .converter-input {
    appearance: none;
    -webkit-appearance: none;
    box-sizing: border-box;
    inline-size: 100%;
    block-size: 34px;
    padding-inline: 8px;
    padding-block: 4px;
    font-family: inherit;
    font-size: 13px;
    color: var(--calc-text-primary, #09090b);
    background-color: var(--calc-container-low, #e4e4e7);
    border: 1px solid var(--calc-outline-low, #e4e4e7);
    border-radius: 8px;
    transition: border-color 0.15s ease, background-color 0.15s ease;
  }

  .converter-select:focus-visible, .converter-input:focus-visible {
    outline: 2px solid var(--calc-focus-ring, var(--calc-primary, #2563eb));
    outline-offset: 1px;
  }

  .converter-output {
    display: flex;
    align-items: center;
    box-sizing: border-box;
    inline-size: 100%;
    block-size: 34px;
    padding-inline: 8px;
    padding-block: 4px;
    font-family: inherit;
    font-size: 15px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: var(--calc-text-primary, #09090b);
    background-color: var(--calc-container-lowest, #ffffff);
    border: 1px solid var(--calc-outline-low, #e4e4e7);
    border-radius: 8px;
    overflow-x: auto;
    white-space: nowrap;
  }

  .converter-arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    padding-block-start: 16px;
    color: var(--calc-text-secondary, #71717a);
    font-size: 14px;
  }

  .converter-actions-bar {
    display: flex;
    justify-content: flex-end;
    padding-block-start: 4px;
  }

  .converter-load-btn {
    appearance: none;
    -webkit-appearance: none;
    border: 1px solid var(--calc-primary, #2563eb);
    background-color: var(--calc-primary, #2563eb);
    color: var(--calc-on-primary, #ffffff);
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    border-radius: 6px;
    padding-inline: 12px;
    padding-block: 6px;
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease;
  }

  .converter-load-btn:hover {
    background-color: #1d4ed8;
  }

  .converter-load-btn:focus-visible {
    outline: 2px solid var(--calc-focus-ring, var(--calc-primary, #2563eb));
    outline-offset: 2px;
  }

  .toast-notification {
    display: none;
    position: absolute;
    inset-inline-start: 50%;
    inset-block-end: 16px;
    transform: translateX(-50%);
    background-color: var(--calc-container-lowest, #18181b);
    color: var(--calc-on-primary, #ffffff);
    font-size: 12px;
    font-weight: 600;
    padding-inline: 14px;
    padding-block: 8px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    z-index: 20;
    pointer-events: none;
    text-align: center;
    max-inline-size: calc(100% - 32px);
    word-break: break-word;
    box-sizing: border-box;
  }

  .toast-notification.show {
    display: block;
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
    .calc-header {
      gap: 4px;
    }
    .header-left, .header-right {
      gap: 4px;
    }
    .mode-toggle-btn, .angle-unit-toggle-btn, .history-toggle-btn, .theme-toggle-btn, .converter-toggle-btn {
      padding-inline: 6px;
      padding-block: 4px;
      font-size: 11px;
    }
    .converter-drawer {
      padding-inline: 10px;
      padding-block: 8px;
      gap: 6px;
    }
    .converter-units-row, .converter-input-output-group {
      gap: 6px;
    }
    .converter-select, .converter-input {
      font-size: 12px;
      block-size: 30px;
      padding-inline: 6px;
    }
    .converter-output {
      font-size: 13px;
      block-size: 30px;
      padding-inline: 6px;
    }
    .converter-load-btn {
      font-size: 11px;
      padding-inline: 8px;
      padding-block: 5px;
    }
    .history-drawer {
      max-block-size: 200px;
      padding-inline: 10px;
      padding-block: 8px;
    }
    .history-actions-bar {
      gap: 4px;
    }
    .history-action-btn {
      font-size: 10px;
      padding-inline: 4px;
      padding-block: 5px;
    }
    .toast-notification {
      font-size: 11px;
      padding-inline: 10px;
      padding-block: 6px;
      inset-block-end: 10px;
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
    .programmer-keys {
      gap: 4px;
    }
    .prog-btn {
      min-block-size: 36px;
      font-size: 12px;
      padding-inline: 2px;
      padding-block: 6px;
    }
    .radix-selector {
      gap: 4px;
    }
    .radix-btn {
      font-size: 11px;
      padding-inline: 4px;
      padding-block: 4px;
    }
    .multi-radix-preview {
      padding-inline: 8px;
      padding-block: 6px;
    }
    .radix-preview-row {
      font-size: 11px;
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
          class="mode-toggle-btn"
          id="programmerToggle"
          data-action="set-mode"
          data-value="programmer"
          aria-label="Switch to programmer mode"
        >
          <span class="mode-text" id="programmerText">Programmer</span>
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
          class="converter-toggle-btn"
          id="converterToggle"
          data-action="converter-toggle"
          aria-expanded="false"
          aria-controls="converterDrawer"
          aria-label="Toggle unit converter"
          title="Unit Converter"
        >
          <span aria-hidden="true">⇄</span> Converter
        </button>
        <button
          type="button"
          class="theme-toggle-btn"
          id="themeToggle"
          data-action="cycle-theme"
          aria-label="Switch visual theme, current theme: dark"
          aria-haspopup="false"
          title="Switch visual theme"
        >
          <span class="theme-icon" id="themeIcon" aria-hidden="true">🌙</span>
        </button>
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
      <div class="history-actions-bar" id="historyActionsBar" role="toolbar" aria-label="History Actions">
        <button
          type="button"
          class="history-action-btn"
          id="btnCopyResult"
          data-action="copy-result"
          aria-label="Copy active result to clipboard"
        >
          Copy Result
        </button>
        <button
          type="button"
          class="history-action-btn"
          id="btnCopyHistory"
          data-action="copy-history"
          aria-label="Copy full history tape to clipboard"
        >
          Copy History
        </button>
        <button
          type="button"
          class="history-action-btn"
          id="btnExportTxt"
          data-action="export-txt"
          aria-label="Export history tape as text"
        >
          Export TXT
        </button>
        <button
          type="button"
          class="history-action-btn"
          id="btnExportCsv"
          data-action="export-csv"
          aria-label="Export history tape as CSV"
        >
          Export CSV
        </button>
      </div>
      <div class="history-empty" id="historyEmpty">No calculations yet</div>
      <div class="history-list" id="historyList" role="list"></div>
    </div>
    <div
      class="converter-drawer"
      id="converterDrawer"
      role="region"
      aria-label="Unit Converter"
      aria-hidden="true"
      style="display: none;"
    >
      <div class="converter-drawer-header">
        <span class="converter-drawer-title">Unit Converter</span>
      </div>
      <div class="converter-controls">
        <div class="converter-control-group">
          <label for="converterCategory" class="converter-label">Category</label>
          <select id="converterCategory" class="converter-select" aria-label="Unit category">
            <option value="length">Length</option>
            <option value="mass">Mass</option>
            <option value="temperature">Temperature</option>
          </select>
        </div>
        <div class="converter-units-row">
          <div class="converter-control-group">
            <label for="converterSourceUnit" class="converter-label">From</label>
            <select id="converterSourceUnit" class="converter-select" aria-label="Source unit">
              <option value="cm">Centimeters (cm)</option>
              <option value="m">Meters (m)</option>
              <option value="km">Kilometers (km)</option>
              <option value="in">Inches (in)</option>
              <option value="ft">Feet (ft)</option>
            </select>
          </div>
          <div class="converter-arrow" aria-hidden="true">➔</div>
          <div class="converter-control-group">
            <label for="converterTargetUnit" class="converter-label">To</label>
            <select id="converterTargetUnit" class="converter-select" aria-label="Target unit">
              <option value="cm">Centimeters (cm)</option>
              <option value="m" selected>Meters (m)</option>
              <option value="km">Kilometers (km)</option>
              <option value="in">Inches (in)</option>
              <option value="ft">Feet (ft)</option>
            </select>
          </div>
        </div>
        <div class="converter-input-output-group">
          <div class="converter-control-group">
            <label for="converterInput" class="converter-label">Value</label>
            <input
              type="text"
              id="converterInput"
              class="converter-input"
              aria-label="Value to convert"
              placeholder="0"
              autocomplete="off"
            />
          </div>
          <div class="converter-output-group">
            <span class="converter-label">Result</span>
            <div
              id="converterOutput"
              class="converter-output"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >-</div>
          </div>
        </div>
        <div class="converter-actions-bar">
          <button
            type="button"
            class="converter-load-btn"
            id="btnLoadConvertedValue"
            data-action="load-converted-value"
            aria-label="Load converted value into calculator"
          >
            Load Result
          </button>
        </div>
      </div>
    </div>
    <div class="display-slot-wrapper">
      <slot name="display">
        <div class="display-screen" id="defaultDisplay" role="status" aria-live="polite" aria-atomic="true">
          <span class="memory-indicator" id="memoryIndicator" aria-hidden="true">M</span>
          <span class="display-value" id="displayValue">0</span>
        </div>
      </slot>
    </div>

    <div class="multi-radix-preview" id="multiRadixPreview" role="region" aria-label="Multi-radix values" style="display: none;">
      <div class="radix-preview-row active" id="radixRowHex" data-radix="HEX">
        <span class="radix-name">HEX</span>
        <span class="radix-val" id="multiRadixHex">0</span>
      </div>
      <div class="radix-preview-row" id="radixRowDec" data-radix="DEC">
        <span class="radix-name">DEC</span>
        <span class="radix-val" id="multiRadixDec">0</span>
      </div>
      <div class="radix-preview-row" id="radixRowOct" data-radix="OCT">
        <span class="radix-name">OCT</span>
        <span class="radix-val" id="multiRadixOct">0</span>
      </div>
      <div class="radix-preview-row" id="radixRowBin" data-radix="BIN">
        <span class="radix-name">BIN</span>
        <span class="radix-val" id="multiRadixBin">0</span>
      </div>
    </div>

    <div class="radix-selector" id="radixSelector" role="group" aria-label="Radix Selection" style="display: none;">
      <button
        type="button"
        class="radix-btn active"
        id="btnRadixHex"
        data-action="set-radix"
        data-value="HEX"
        aria-pressed="true"
        aria-label="Hexadecimal radix"
      >HEX</button>
      <button
        type="button"
        class="radix-btn"
        id="btnRadixDec"
        data-action="set-radix"
        data-value="DEC"
        aria-pressed="false"
        aria-label="Decimal radix"
      >DEC</button>
      <button
        type="button"
        class="radix-btn"
        id="btnRadixOct"
        data-action="set-radix"
        data-value="OCT"
        aria-pressed="false"
        aria-label="Octal radix"
      >OCT</button>
      <button
        type="button"
        class="radix-btn"
        id="btnRadixBin"
        data-action="set-radix"
        data-value="BIN"
        aria-pressed="false"
        aria-label="Binary radix"
      >BIN</button>
    </div>

    <div class="programmer-keys" id="programmerKeys" role="group" aria-label="Programmer Functions" aria-hidden="true" style="display: none;">
      <button type="button" class="prog-btn btn-bitwise" id="btnAnd" data-action="operator" data-value="AND" aria-label="Bitwise AND">AND</button>
      <button type="button" class="prog-btn btn-bitwise" id="btnOr" data-action="operator" data-value="OR" aria-label="Bitwise OR">OR</button>
      <button type="button" class="prog-btn btn-bitwise" id="btnXor" data-action="operator" data-value="XOR" aria-label="Bitwise XOR">XOR</button>
      <button type="button" class="prog-btn btn-bitwise" id="btnNot" data-action="bitwise-not" aria-label="Bitwise NOT">NOT</button>
      <button type="button" class="prog-btn btn-bitwise" id="btnLsh" data-action="operator" data-value="LSH" aria-label="Bitwise Left Shift">LSH</button>
      <button type="button" class="prog-btn btn-bitwise" id="btnRsh" data-action="operator" data-value="RSH" aria-label="Bitwise Right Shift">RSH</button>

      <button type="button" class="prog-btn btn-hex" id="btnHexA" data-action="digit" data-value="A" aria-label="Hex A">A</button>
      <button type="button" class="prog-btn btn-hex" id="btnHexB" data-action="digit" data-value="B" aria-label="Hex B">B</button>
      <button type="button" class="prog-btn btn-hex" id="btnHexC" data-action="digit" data-value="C" aria-label="Hex C">C</button>
      <button type="button" class="prog-btn btn-hex" id="btnHexD" data-action="digit" data-value="D" aria-label="Hex D">D</button>
      <button type="button" class="prog-btn btn-hex" id="btnHexE" data-action="digit" data-value="E" aria-label="Hex E">E</button>
      <button type="button" class="prog-btn btn-hex" id="btnHexF" data-action="digit" data-value="F" aria-label="Hex F">F</button>
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
    <div
      class="toast-notification"
      id="toastNotification"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    ></div>
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
  private programmerToggleBtn: HTMLElement | null = null;
  private programmerTextEl: HTMLElement | null = null;
  private angleUnitToggleBtn: HTMLElement | null = null;
  private angleUnitIndicatorEl: HTMLElement | null = null;
  private scientificKeysEl: HTMLElement | null = null;
  private radixSelectorEl: HTMLElement | null = null;
  private multiRadixPreviewEl: HTMLElement | null = null;
  private programmerKeysEl: HTMLElement | null = null;
  private btnCopyResult: HTMLElement | null = null;
  private btnCopyHistory: HTMLElement | null = null;
  private btnExportTxt: HTMLElement | null = null;
  private btnExportCsv: HTMLElement | null = null;
  private historyActionsBarEl: HTMLElement | null = null;
  private toastNotificationEl: HTMLElement | null = null;
  private themeToggleBtn: HTMLElement | null = null;
  private themeIconEl: HTMLElement | null = null;
  private converterToggleBtn: HTMLElement | null = null;
  private converterDrawerEl: HTMLElement | null = null;
  private converterCategoryEl: HTMLSelectElement | null = null;
  private converterSourceUnitEl: HTMLSelectElement | null = null;
  private converterTargetUnitEl: HTMLSelectElement | null = null;
  private converterInputEl: HTMLInputElement | null = null;
  private converterOutputEl: HTMLElement | null = null;
  private btnLoadConvertedValue: HTMLElement | null = null;
  private isConverterOpen = false;
  private currentConversionResult: ConversionResult = { value: 0, formatted: '-' };
  private toastTimer: any = null;
  private isDrawerOpen = false;
  private isConnectedToDOM = false;
  private lastHistorySnapshot: string = '';
  private lastModeSnapshot: string = '';

  constructor() {
    super();
    this.engine = new CalculatorEngine();
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeypadClick = this.handleKeypadClick.bind(this);
    this.handleThemeToggleClick = this.handleThemeToggleClick.bind(this);
    this.handleConverterToggleClick = this.handleConverterToggleClick.bind(this);
    this.handleConverterCategoryChange = this.handleConverterCategoryChange.bind(this);
    this.handleConverterUnitChange = this.handleConverterUnitChange.bind(this);
    this.handleConverterInputChange = this.handleConverterInputChange.bind(this);
    this.handleLoadConvertedValueClick = this.handleLoadConvertedValueClick.bind(this);
    this.handleHistoryToggleClick = this.handleHistoryToggleClick.bind(this);
    this.handleClearHistoryClick = this.handleClearHistoryClick.bind(this);
    this.handleHistoryDrawerClick = this.handleHistoryDrawerClick.bind(this);
    this.handleCopyResultClick = this.handleCopyResultClick.bind(this);
    this.handleCopyHistoryClick = this.handleCopyHistoryClick.bind(this);
    this.handleExportTxtClick = this.handleExportTxtClick.bind(this);
    this.handleExportCsvClick = this.handleExportCsvClick.bind(this);
    this.handleModeToggleClick = this.handleModeToggleClick.bind(this);
    this.handleProgrammerToggleClick = this.handleProgrammerToggleClick.bind(this);
    this.handleAngleUnitToggleClick = this.handleAngleUnitToggleClick.bind(this);
    this.handleScientificKeysClick = this.handleScientificKeysClick.bind(this);
    this.handleRadixSelectorClick = this.handleRadixSelectorClick.bind(this);
    this.handleProgrammerKeysClick = this.handleProgrammerKeysClick.bind(this);
    this.handleMultiRadixPreviewClick = this.handleMultiRadixPreviewClick.bind(this);
    this.setupShadowDOM();
  }

  private setupShadowDOM(): void {
    if (typeof this.attachShadow !== 'function') {
      return;
    }

    const shadow = this.shadowRoot ?? this.attachShadow({ mode: 'open' });
    shadow.innerHTML = TEMPLATE_HTML;

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
    this.programmerToggleBtn = shadow.querySelector('#programmerToggle');
    this.programmerTextEl = shadow.querySelector('#programmerText');
    this.angleUnitToggleBtn = shadow.querySelector('#angleUnitToggle');
    this.angleUnitIndicatorEl = shadow.querySelector('#angleUnitIndicator');
    this.scientificKeysEl = shadow.querySelector('#scientificKeys');
    this.radixSelectorEl = shadow.querySelector('#radixSelector');
    this.multiRadixPreviewEl = shadow.querySelector('#multiRadixPreview');
    this.programmerKeysEl = shadow.querySelector('#programmerKeys');
    this.btnCopyResult = shadow.querySelector('#btnCopyResult');
    this.btnCopyHistory = shadow.querySelector('#btnCopyHistory');
    this.btnExportTxt = shadow.querySelector('#btnExportTxt');
    this.btnExportCsv = shadow.querySelector('#btnExportCsv');
    this.historyActionsBarEl = shadow.querySelector('#historyActionsBar');
    this.toastNotificationEl = shadow.querySelector('#toastNotification');
    this.themeToggleBtn = shadow.querySelector('#themeToggle');
    this.themeIconEl = shadow.querySelector('#themeIcon');
    this.converterToggleBtn = shadow.querySelector('#converterToggle');
    this.converterDrawerEl = shadow.querySelector('#converterDrawer');
    this.converterCategoryEl = shadow.querySelector('#converterCategory');
    this.converterSourceUnitEl = shadow.querySelector('#converterSourceUnit');
    this.converterTargetUnitEl = shadow.querySelector('#converterTargetUnit');
    this.converterInputEl = shadow.querySelector('#converterInput');
    this.converterOutputEl = shadow.querySelector('#converterOutput');
    this.btnLoadConvertedValue = shadow.querySelector('#btnLoadConvertedValue');
  }

  public connectedCallback(): void {
    this.isConnectedToDOM = true;
    if (!this.shadowRoot) {
      this.setupShadowDOM();
    }

    // Hydrate theme from data-theme attribute or localStorage on mount
    const hostAttrTheme = typeof this.getAttribute === 'function' ? (this.getAttribute('data-theme') as CalculatorTheme | null) : null;
    const storedTheme = getStoredTheme();
    const effectiveTheme: CalculatorTheme =
      (hostAttrTheme === 'dark' || hostAttrTheme === 'light' || hostAttrTheme === 'high-contrast')
        ? hostAttrTheme
        : (storedTheme ?? this.engine.getTheme());

    this.engine.setTheme(effectiveTheme);
    if (typeof this.setAttribute === 'function') {
      this.setAttribute('data-theme', effectiveTheme);
    }

    // Attach event listeners
    if (this.keypadEl) {
      this.keypadEl.addEventListener('click', this.handleKeypadClick);
    }
    if (this.themeToggleBtn) {
      this.themeToggleBtn.addEventListener('click', this.handleThemeToggleClick);
    }
    if (this.historyToggleBtn) {
      this.historyToggleBtn.addEventListener('click', this.handleHistoryToggleClick);
    }
    if (this.clearHistoryBtn) {
      this.clearHistoryBtn.addEventListener('click', this.handleClearHistoryClick);
    }
    if (this.historyDrawerEl) {
      this.historyDrawerEl.addEventListener('click', this.handleHistoryDrawerClick);
    }
    if (this.btnCopyResult) {
      this.btnCopyResult.addEventListener('click', this.handleCopyResultClick);
    }
    if (this.btnCopyHistory) {
      this.btnCopyHistory.addEventListener('click', this.handleCopyHistoryClick);
    }
    if (this.btnExportTxt) {
      this.btnExportTxt.addEventListener('click', this.handleExportTxtClick);
    }
    if (this.btnExportCsv) {
      this.btnExportCsv.addEventListener('click', this.handleExportCsvClick);
    }
    if (this.modeToggleBtn) {
      this.modeToggleBtn.addEventListener('click', this.handleModeToggleClick);
    }
    if (this.programmerToggleBtn) {
      this.programmerToggleBtn.addEventListener('click', this.handleProgrammerToggleClick);
    }
    if (this.angleUnitToggleBtn) {
      this.angleUnitToggleBtn.addEventListener('click', this.handleAngleUnitToggleClick);
    }
    if (this.scientificKeysEl) {
      this.scientificKeysEl.addEventListener('click', this.handleScientificKeysClick);
    }
    if (this.radixSelectorEl) {
      this.radixSelectorEl.addEventListener('click', this.handleRadixSelectorClick);
    }
    if (this.programmerKeysEl) {
      this.programmerKeysEl.addEventListener('click', this.handleProgrammerKeysClick);
    }
    if (this.multiRadixPreviewEl) {
      this.multiRadixPreviewEl.addEventListener('click', this.handleMultiRadixPreviewClick);
    }
    if (this.converterToggleBtn) {
      this.converterToggleBtn.addEventListener('click', this.handleConverterToggleClick);
    }
    if (this.converterCategoryEl) {
      this.converterCategoryEl.addEventListener('change', this.handleConverterCategoryChange);
    }
    if (this.converterSourceUnitEl) {
      this.converterSourceUnitEl.addEventListener('change', this.handleConverterUnitChange);
    }
    if (this.converterTargetUnitEl) {
      this.converterTargetUnitEl.addEventListener('change', this.handleConverterUnitChange);
    }
    if (this.converterInputEl) {
      this.converterInputEl.addEventListener('input', this.handleConverterInputChange);
    }
    if (this.btnLoadConvertedValue) {
      this.btnLoadConvertedValue.addEventListener('click', this.handleLoadConvertedValueClick);
    }

    if (typeof globalThis.window !== 'undefined' && globalThis.window.addEventListener) {
      globalThis.window.addEventListener('keydown', this.handleKeyDown);
    } else if (typeof this.addEventListener === 'function') {
      this.addEventListener('keydown', this.handleKeyDown);
    }

    this.syncUI();
  }

  public disconnectedCallback(): void {
    this.isConnectedToDOM = false;

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }

    if (this.keypadEl) {
      this.keypadEl.removeEventListener('click', this.handleKeypadClick);
    }
    if (this.themeToggleBtn) {
      this.themeToggleBtn.removeEventListener('click', this.handleThemeToggleClick);
    }
    if (this.modeToggleBtn) {
      this.modeToggleBtn.removeEventListener('click', this.handleModeToggleClick);
    }
    if (this.programmerToggleBtn) {
      this.programmerToggleBtn.removeEventListener('click', this.handleProgrammerToggleClick);
    }
    if (this.angleUnitToggleBtn) {
      this.angleUnitToggleBtn.removeEventListener('click', this.handleAngleUnitToggleClick);
    }
    if (this.scientificKeysEl) {
      this.scientificKeysEl.removeEventListener('click', this.handleScientificKeysClick);
    }
    if (this.radixSelectorEl) {
      this.radixSelectorEl.removeEventListener('click', this.handleRadixSelectorClick);
    }
    if (this.programmerKeysEl) {
      this.programmerKeysEl.removeEventListener('click', this.handleProgrammerKeysClick);
    }
    if (this.multiRadixPreviewEl) {
      this.multiRadixPreviewEl.removeEventListener('click', this.handleMultiRadixPreviewClick);
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
    if (this.btnCopyResult) {
      this.btnCopyResult.removeEventListener('click', this.handleCopyResultClick);
    }
    if (this.btnCopyHistory) {
      this.btnCopyHistory.removeEventListener('click', this.handleCopyHistoryClick);
    }
    if (this.btnExportTxt) {
      this.btnExportTxt.removeEventListener('click', this.handleExportTxtClick);
    }
    if (this.btnExportCsv) {
      this.btnExportCsv.removeEventListener('click', this.handleExportCsvClick);
    }
    if (this.converterToggleBtn) {
      this.converterToggleBtn.removeEventListener('click', this.handleConverterToggleClick);
    }
    if (this.converterCategoryEl) {
      this.converterCategoryEl.removeEventListener('change', this.handleConverterCategoryChange);
    }
    if (this.converterSourceUnitEl) {
      this.converterSourceUnitEl.removeEventListener('change', this.handleConverterUnitChange);
    }
    if (this.converterTargetUnitEl) {
      this.converterTargetUnitEl.removeEventListener('change', this.handleConverterUnitChange);
    }
    if (this.converterInputEl) {
      this.converterInputEl.removeEventListener('input', this.handleConverterInputChange);
    }
    if (this.btnLoadConvertedValue) {
      this.btnLoadConvertedValue.removeEventListener('click', this.handleLoadConvertedValueClick);
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
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
    if (this.toastNotificationEl) {
      this.toastNotificationEl.textContent = '';
      this.toastNotificationEl.classList.remove('show');
      if (this.toastNotificationEl.style) {
        this.toastNotificationEl.style.display = 'none';
      }
    }
    const currentTheme = this.engine.getTheme();
    this.engine = new CalculatorEngine({ theme: currentTheme });
    this.isDrawerOpen = false;
    if (typeof this.setAttribute === 'function') {
      this.setAttribute('data-theme', currentTheme);
    }
    this.syncUI();
  }

  /**
   * Dispatches a strongly-typed action to the engine, synchronizes UI, and emits change event.
   */
  public dispatch(action: CalculatorAction): CalculatorState {
    const previousTheme = this.engine.getTheme();
    const newState = this.engine.dispatch(action);
    if (newState.theme !== previousTheme) {
      if (typeof this.setAttribute === 'function') {
        this.setAttribute('data-theme', newState.theme);
      }
      setStoredTheme(newState.theme);
      if (typeof this.dispatchEvent === 'function') {
        this.dispatchEvent(
          new CustomEvent('theme-change', {
            detail: { theme: newState.theme, previousTheme },
            bubbles: true,
            composed: true,
          })
        );
      }
    }
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

  public setMode(mode: CalculatorMode): CalculatorState {
    const state = this.engine.setMode(mode);
    this.syncUI();
    return state;
  }

  public cycleMode(): CalculatorState {
    const state = this.engine.cycleMode();
    this.syncUI();
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

  /**
   * Returns the active visual theme ('dark' | 'light' | 'high-contrast').
   */
  public getTheme(): CalculatorTheme {
    return this.engine.getTheme();
  }

  /**
   * Sets the active visual theme, updates data-theme attribute, persists in localStorage, and dispatches theme-change event.
   */
  public setTheme(theme: CalculatorTheme): void {
    if (theme !== 'dark' && theme !== 'light' && theme !== 'high-contrast') {
      return;
    }
    const previousTheme = this.engine.getTheme();
    this.engine.setTheme(theme);
    if (typeof this.setAttribute === 'function') {
      this.setAttribute('data-theme', theme);
    }
    setStoredTheme(theme);
    this.syncThemeUI();

    if (theme !== previousTheme && typeof this.dispatchEvent === 'function') {
      this.dispatchEvent(
        new CustomEvent('theme-change', {
          detail: { theme, previousTheme },
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  /**
   * Cycles visual theme in sequence: dark -> light -> high-contrast -> dark.
   */
  public cycleTheme(): CalculatorTheme {
    const previousTheme = this.engine.getTheme();
    let nextTheme: CalculatorTheme;
    if (previousTheme === 'dark') {
      nextTheme = 'light';
    } else if (previousTheme === 'light') {
      nextTheme = 'high-contrast';
    } else {
      nextTheme = 'dark';
    }
    this.setTheme(nextTheme);
    return nextTheme;
  }

  public getAngleUnit(): AngleUnit {
    return this.engine.getAngleUnit();
  }

  public setRadix(radix: Radix): CalculatorState {
    const state = this.engine.setRadix(radix);
    this.syncUI();
    return state;
  }

  public getRadix(): Radix {
    return this.engine.getRadix();
  }

  public getMultiRadix(): MultiRadixValues {
    return this.engine.getMultiRadix();
  }

  public bitwiseNot(): CalculatorState {
    const state = this.engine.bitwiseNot();
    this.syncUI();
    return state;
  }

  public inputHexDigit(digit: string): CalculatorState {
    const state = this.engine.inputHexDigit(digit);
    this.syncUI();
    return state;
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
      case 'input-hex-digit':
      case 'hex-digit':
        return this.inputHexDigit(value ?? '');
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
      case 'copy-result':
        this.copyResult();
        return this.getState();
      case 'copy-history':
        this.copyHistory();
        return this.getState();
      case 'export-txt':
        this.exportHistory('text');
        return this.getState();
      case 'export-csv':
        this.exportHistory('csv');
        return this.getState();
      case 'mode-toggle':
      case 'toggle-mode':
        return this.toggleMode();
      case 'set-mode':
        return this.setMode((value as CalculatorMode) || 'programmer');
      case 'cycle-mode':
        return this.cycleMode();
      case 'set-radix':
        return this.setRadix((value as Radix) || 'HEX');
      case 'bitwise-not':
      case 'not':
        return this.bitwiseNot();
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
   * Intercepts digits, radix-gated keys, operators, Enter, Backspace, Escape, and .
   * Leaves browser hotkeys (Cmd, Ctrl, Alt) untouched.
   */
  public handleKeyDown(event: KeyboardEvent): void {
    if (!event) return;

    // Never intercept when modifier keys are pressed
    if (event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }

    // Never intercept keystrokes when user is typing inside an input, select, or textarea
    const target = (event.target || (event as any).composedPath?.()[0]) as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA')) {
      return;
    }

    const key = event.key;
    let intercepted = false;
    const isProgrammer = this.engine.getMode() === 'programmer';
    const activeRadix = this.engine.getRadix();

    if (/^[0-9]$/.test(key)) {
      if (isProgrammer) {
        const num = parseInt(key, 10);
        let allowed = false;
        if (activeRadix === 'HEX' || activeRadix === 'DEC') allowed = true;
        else if (activeRadix === 'OCT') allowed = num <= 7;
        else if (activeRadix === 'BIN') allowed = num <= 1;

        if (allowed) {
          intercepted = true;
          this.engine.pressDigit(key);
        } else {
          if (typeof event.preventDefault === 'function') {
            event.preventDefault();
          }
          return;
        }
      } else {
        intercepted = true;
        this.engine.pressDigit(key);
      }
    } else if (key === 'c' || key === 'C') {
      if (isProgrammer && activeRadix === 'HEX') {
        intercepted = true;
        this.engine.inputHexDigit('C');
      } else {
        intercepted = true;
        this.engine.pressClear();
      }
    } else if (isProgrammer && activeRadix === 'HEX' && /^[a-fA-F]$/.test(key)) {
      intercepted = true;
      this.engine.inputHexDigit(key.toUpperCase());
    } else if (isProgrammer && /^[a-fA-F]$/.test(key)) {
      if (typeof event.preventDefault === 'function') {
        event.preventDefault();
      }
      return;
    } else if (key === '.') {
      if (isProgrammer) {
        if (typeof event.preventDefault === 'function') {
          event.preventDefault();
        }
        return;
      }
      intercepted = true;
      this.engine.pressDecimal();
    } else if (key === '+' || key === '-' || key === '*' || key === '/') {
      intercepted = true;
      this.engine.pressOperator(key as Operator);
    } else if (key === '^') {
      intercepted = true;
      if (isProgrammer) {
        this.engine.pressOperator('XOR');
      } else {
        this.engine.pressOperator('^');
      }
    } else if (key === '&') {
      if (isProgrammer) {
        intercepted = true;
        this.engine.pressOperator('AND');
      }
    } else if (key === '|') {
      if (isProgrammer) {
        intercepted = true;
        this.engine.pressOperator('OR');
      }
    } else if (key === '~') {
      if (isProgrammer) {
        intercepted = true;
        this.engine.bitwiseNot();
      }
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

    const btn = target.closest ? (target.closest('button[data-action]') as HTMLElement | null) : null;
    if (!btn || btn.hasAttribute('disabled')) return;

    const action = btn.getAttribute('data-action');
    const value = btn.getAttribute('data-value') ?? undefined;

    if (action) {
      this.pressButton(action, value);
    }
  }

  private handleThemeToggleClick(event: Event): void {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }
    this.cycleTheme();
  }

  private handleModeToggleClick(event: Event): void {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }
    this.toggleMode();
  }

  private handleProgrammerToggleClick(event: Event): void {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }
    if (this.getMode() === 'programmer') {
      this.setMode('standard');
    } else {
      this.setMode('programmer');
    }
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
    if (!btn || btn.hasAttribute('disabled')) return;

    const action = btn.getAttribute('data-action');
    const value = btn.getAttribute('data-value') ?? undefined;

    if (action) {
      this.pressButton(action, value);
    }
  }

  private handleRadixSelectorClick(event: Event): void {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    const btn = target.closest ? (target.closest('button[data-action="set-radix"]') as HTMLElement | null) : null;
    if (!btn) return;

    const radix = (btn.getAttribute('data-value') || btn.getAttribute('data-radix')) as Radix | null;
    if (radix) {
      this.setRadix(radix);
    }
  }

  private handleProgrammerKeysClick(event: Event): void {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    const btn = target.closest ? (target.closest('button[data-action]') as HTMLElement | null) : null;
    if (!btn || btn.hasAttribute('disabled')) return;

    const action = btn.getAttribute('data-action');
    const value = btn.getAttribute('data-value') ?? undefined;

    if (action) {
      this.pressButton(action, value);
    }
  }

  private handleMultiRadixPreviewClick(event: Event): void {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    const row = target.closest ? (target.closest('.radix-preview-row') as HTMLElement | null) : null;
    if (!row) return;

    const radix = row.getAttribute('data-radix') as Radix | null;
    if (radix) {
      this.setRadix(radix);
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
    if (target.closest && target.closest('#btnCopyResult')) {
      this.copyResult();
      return;
    }
    if (target.closest && target.closest('#btnCopyHistory')) {
      this.copyHistory();
      return;
    }
    if (target.closest && target.closest('#btnExportTxt')) {
      this.exportHistory('text');
      return;
    }
    if (target.closest && target.closest('#btnExportCsv')) {
      this.exportHistory('csv');
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
      this.historyListEl.textContent = '';
      if ((this.historyListEl as any).children) {
        (this.historyListEl as any).children = [];
      }

      for (const entry of history) {
        const btn =
          typeof globalThis.document !== 'undefined' && globalThis.document.createElement
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

  public toggleConverter(): void {
    this.isConverterOpen = !this.isConverterOpen;
    this.syncConverterDrawerUI();
  }

  public openConverter(): void {
    this.isConverterOpen = true;
    this.syncConverterDrawerUI();
  }

  public closeConverter(): void {
    this.isConverterOpen = false;
    this.syncConverterDrawerUI();
  }

  public getIsConverterOpen(): boolean {
    return this.isConverterOpen;
  }

  public syncConverterDrawerUI(): void {
    if (this.converterToggleBtn) {
      this.converterToggleBtn.setAttribute('aria-expanded', this.isConverterOpen ? 'true' : 'false');
    }
    if (this.converterDrawerEl) {
      this.converterDrawerEl.setAttribute('aria-hidden', this.isConverterOpen ? 'false' : 'true');
      if (this.isConverterOpen) {
        this.converterDrawerEl.classList.add('open');
        if (this.converterDrawerEl.style) {
          this.converterDrawerEl.style.display = 'flex';
        }
      } else {
        this.converterDrawerEl.classList.remove('open');
        if (this.converterDrawerEl.style) {
          this.converterDrawerEl.style.display = 'none';
        }
      }
    }
  }

  public populateUnitSelects(category: UnitCategory): void {
    const units = getUnitsForCategory(category);
    const defaults = DEFAULT_UNITS[category] ?? { source: units[0].value, target: units[1]?.value ?? units[0].value };

    if (this.converterSourceUnitEl) {
      this.converterSourceUnitEl.innerHTML = units
        .map((u) => `<option value="${u.value}"${u.value === defaults.source ? ' selected' : ''}>${u.label}</option>`)
        .join('');
      this.converterSourceUnitEl.value = defaults.source;
    }

    if (this.converterTargetUnitEl) {
      this.converterTargetUnitEl.innerHTML = units
        .map((u) => `<option value="${u.value}"${u.value === defaults.target ? ' selected' : ''}>${u.label}</option>`)
        .join('');
      this.converterTargetUnitEl.value = defaults.target;
    }
  }

  public recomputeConversion(): void {
    const category = (this.converterCategoryEl?.value as UnitCategory) || 'length';
    const sourceUnit = this.converterSourceUnitEl?.value || 'cm';
    const targetUnit = this.converterTargetUnitEl?.value || 'm';
    const inputValue = this.converterInputEl?.value ?? '';

    const result = convertUnits(category, sourceUnit, targetUnit, inputValue);
    this.currentConversionResult = result;

    if (this.converterOutputEl) {
      this.converterOutputEl.textContent = result.formatted;
    }

    if (typeof this.dispatchEvent === 'function') {
      const event = new CustomEvent('unit-convert', {
        detail: {
          category,
          sourceUnit,
          targetUnit,
          inputValue,
          convertedValue: result.value,
          formatted: result.formatted,
          error: result.error,
        },
        bubbles: true,
        composed: true,
      });
      this.dispatchEvent(event);
    }
  }

  public convertUnits(
    category: UnitCategory,
    sourceUnit: string,
    targetUnit: string,
    inputValue: string | number
  ): ConversionResult {
    return convertUnits(category, sourceUnit, targetUnit, inputValue);
  }

  private handleConverterToggleClick(event: Event): void {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }
    this.toggleConverter();
  }

  private handleConverterCategoryChange = (): void => {
    if (!this.converterCategoryEl) return;
    const category = this.converterCategoryEl.value as UnitCategory;
    if (!isUnitCategory(category)) return;

    this.populateUnitSelects(category);
    this.recomputeConversion();
  };

  private handleConverterUnitChange = (): void => {
    this.recomputeConversion();
  };

  private handleConverterInputChange = (): void => {
    this.recomputeConversion();
  };

  private handleLoadConvertedValueClick = (event: Event): void => {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }
    if (this.currentConversionResult.error || !Number.isFinite(this.currentConversionResult.value)) {
      return;
    }
    const convertedValStr = this.currentConversionResult.formatted;
    if (!convertedValStr || convertedValStr === '-') {
      return;
    }

    this.engine.loadBuffer(convertedValStr);
    this.syncUI();
    this.showToast('Loaded into calculator');
  };

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
        detail: { mode: state.mode, angleUnit: state.angleUnit, radix: state.radix },
        bubbles: true,
        composed: true,
      });
      this.dispatchEvent(modeEvent);
    }
  }

  private setButtonDisabled(btn: any, disabled: boolean): void {
    if (!btn) return;
    if (disabled) {
      btn.setAttribute('disabled', 'true');
      btn.setAttribute('aria-disabled', 'true');
    } else {
      if (typeof btn.removeAttribute === 'function') {
        btn.removeAttribute('disabled');
      } else if (btn.attributes && typeof btn.attributes.delete === 'function') {
        btn.attributes.delete('disabled');
      }
      btn.setAttribute('aria-disabled', 'false');
    }
  }

  /**
   * Synchronizes visual display, ARIA live region, history drawer, mode indicators, and dispatches events.
   */
  public syncUI(): void {
    const state = this.engine.getState();
    const isProgrammer = state.mode === 'programmer';
    const isScientific = state.mode === 'scientific';

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
      this.modeToggleBtn.setAttribute(
        'aria-label',
        isScientific ? 'Switch to standard mode' : 'Switch to scientific mode'
      );
      if (this.modeTextEl) {
        this.modeTextEl.textContent = isScientific ? 'Standard' : 'Scientific';
      }
    }

    // Sync Programmer Toggle Button & Text
    if (this.programmerToggleBtn) {
      this.programmerToggleBtn.setAttribute(
        'aria-label',
        isProgrammer ? 'Switch to standard mode' : 'Switch to programmer mode'
      );
      this.programmerToggleBtn.setAttribute('aria-pressed', isProgrammer ? 'true' : 'false');
      if (this.programmerTextEl) {
        this.programmerTextEl.textContent = isProgrammer ? 'Standard' : 'Programmer';
      }
      if (isProgrammer) {
        this.programmerToggleBtn.classList.add('active');
      } else {
        this.programmerToggleBtn.classList.remove('active');
      }
    }

    // Sync Angle Unit Toggle & Indicator (scientific mode only)
    if (this.angleUnitToggleBtn) {
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

    // Sync Radix Selector Visibility & Button States
    if (this.radixSelectorEl) {
      if (this.radixSelectorEl.style) {
        this.radixSelectorEl.style.display = isProgrammer ? 'grid' : 'none';
      }
      this.radixSelectorEl.setAttribute('aria-hidden', isProgrammer ? 'false' : 'true');
      if (isProgrammer) {
        this.radixSelectorEl.classList.add('visible');
      } else {
        this.radixSelectorEl.classList.remove('visible');
      }

      const radices: Array<{ radix: Radix; id: string }> = [
        { radix: 'HEX', id: '#btnRadixHex' },
        { radix: 'DEC', id: '#btnRadixDec' },
        { radix: 'OCT', id: '#btnRadixOct' },
        { radix: 'BIN', id: '#btnRadixBin' },
      ];
      for (const item of radices) {
        const btn = (this.shadowRoot?.querySelector(item.id) ??
          this.radixSelectorEl.querySelector(item.id)) as HTMLButtonElement | null;
        if (btn) {
          const isActive = state.radix === item.radix;
          btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
          if (isActive) {
            btn.classList.add('active');
          } else {
            btn.classList.remove('active');
          }
        }
      }
    }

    // Sync Multi-Radix Preview Panel
    if (this.multiRadixPreviewEl) {
      if (this.multiRadixPreviewEl.style) {
        this.multiRadixPreviewEl.style.display = isProgrammer ? 'flex' : 'none';
      }
      this.multiRadixPreviewEl.setAttribute('aria-hidden', isProgrammer ? 'false' : 'true');
      if (isProgrammer) {
        this.multiRadixPreviewEl.classList.add('visible');
      } else {
        this.multiRadixPreviewEl.classList.remove('visible');
      }

      // Update multi-radix preview text values
      const hexEl = this.shadowRoot?.querySelector('#multiRadixHex');
      const decEl = this.shadowRoot?.querySelector('#multiRadixDec');
      const octEl = this.shadowRoot?.querySelector('#multiRadixOct');
      const binEl = this.shadowRoot?.querySelector('#multiRadixBin');

      if (hexEl) hexEl.textContent = state.multiRadix.hex;
      if (decEl) decEl.textContent = state.multiRadix.dec;
      if (octEl) octEl.textContent = state.multiRadix.oct;
      if (binEl) binEl.textContent = state.multiRadix.bin;

      // Update active row highlight
      const radices: Radix[] = ['HEX', 'DEC', 'OCT', 'BIN'];
      for (const r of radices) {
        const row = this.multiRadixPreviewEl.querySelector(
          `.radix-preview-row[data-radix="${r}"]`
        ) as HTMLElement | null;
        if (row) {
          if (state.radix === r) {
            row.classList.add('active');
          } else {
            row.classList.remove('active');
          }
        }
      }
    }

    // Sync Programmer Keys Panel
    if (this.programmerKeysEl) {
      if (this.programmerKeysEl.style) {
        this.programmerKeysEl.style.display = isProgrammer ? 'grid' : 'none';
      }
      this.programmerKeysEl.setAttribute('aria-hidden', isProgrammer ? 'false' : 'true');
      if (isProgrammer) {
        this.programmerKeysEl.classList.add('visible');
      } else {
        this.programmerKeysEl.classList.remove('visible');
      }
    }

    // Apply dynamic keypad gating in programmer mode
    const keypad = this.shadowRoot?.querySelector('#defaultKeypad');
    if (isProgrammer) {
      const radix = state.radix;

      // Hex keys A-F in #programmerKeys
      const hexKeys = ['A', 'B', 'C', 'D', 'E', 'F'];
      for (const h of hexKeys) {
        const btn = this.shadowRoot?.querySelector(`#btnHex${h}`) as HTMLButtonElement | null;
        if (btn) {
          const isEnabled = radix === 'HEX';
          this.setButtonDisabled(btn, !isEnabled);
        }
      }

      // Dynamic gating on primary keypad keys (0-9, .)
      if (keypad) {
        const allKeypadButtons = keypad.querySelectorAll('button');
        allKeypadButtons.forEach((btn: any) => {
          const action = btn.getAttribute('data-action');
          if (action === 'decimal') {
            this.setButtonDisabled(btn, true);
          } else if (action === 'digit') {
            const val = btn.getAttribute('data-value');
            const d = parseInt(val, 10);
            let isEnabled = false;
            if (radix === 'HEX' || radix === 'DEC') {
              isEnabled = true;
            } else if (radix === 'OCT') {
              isEnabled = d <= 7;
            } else if (radix === 'BIN') {
              isEnabled = d <= 1;
            }
            this.setButtonDisabled(btn, !isEnabled);
          }
        });
      }
    } else {
      // In standard or scientific modes, re-enable all keypad buttons
      if (keypad) {
        const allKeypadButtons = keypad.querySelectorAll('button');
        allKeypadButtons.forEach((btn: any) => {
          this.setButtonDisabled(btn, false);
        });
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

    // Sync Theme UI
    this.syncThemeUI();

    // Sync History Drawer UI
    this.syncHistoryDrawerUI();

    // Sync Converter Drawer UI
    this.syncConverterDrawerUI();

    // Check if mode/angleUnit/radix mutated to dispatch mode-change
    const currentModeSnapshot = `${state.mode}:${state.angleUnit}:${state.radix}`;
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

  /**
   * Synchronizes theme toggle button accessibility attributes, data-theme, and visual indicator.
   */
  public syncThemeUI(): void {
    const theme = this.engine.getTheme();
    if (this.themeToggleBtn) {
      this.themeToggleBtn.setAttribute(
        'aria-label',
        `Switch visual theme, current theme: ${theme}`
      );
      this.themeToggleBtn.setAttribute('data-theme', theme);
    }
    if (this.themeIconEl) {
      if (theme === 'dark') {
        this.themeIconEl.textContent = '🌙';
      } else if (theme === 'light') {
        this.themeIconEl.textContent = '☀️';
      } else {
        this.themeIconEl.textContent = '👁️';
      }
    }
  }

  private handleCopyResultClick(e?: Event): void {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    this.copyResult();
  }

  private handleCopyHistoryClick(e?: Event): void {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    this.copyHistory();
  }

  private handleExportTxtClick(e?: Event): void {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    this.exportHistory('text');
  }

  private handleExportCsvClick(e?: Event): void {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    this.exportHistory('csv');
  }

  /**
   * Accessible toast notification helper with auto-dismiss and debounce timer reset.
   */
  public showToast(message: string, duration: number = 2000): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }

    if (!this.toastNotificationEl) {
      return;
    }

    this.toastNotificationEl.textContent = message;
    this.toastNotificationEl.classList.add('show');
    if (this.toastNotificationEl.style) {
      this.toastNotificationEl.style.display = 'block';
    }

    this.toastTimer = setTimeout(() => {
      if (this.toastNotificationEl) {
        this.toastNotificationEl.textContent = '';
        this.toastNotificationEl.classList.remove('show');
        if (this.toastNotificationEl.style) {
          this.toastNotificationEl.style.display = 'none';
        }
      }
      this.toastTimer = null;
    }, duration);
  }

  /**
   * Safe asynchronous clipboard copy wrapper.
   * Gracefully catches rejection/unsupported environments without throwing runtime errors.
   * Dispatches 'copy-clipboard' CustomEvent.
   */
  public async copyToClipboard(text: string, type?: 'result' | 'history'): Promise<boolean> {
    let success = false;
    try {
      if (typeof globalThis.navigator !== 'undefined' && globalThis.navigator.clipboard?.writeText) {
        await globalThis.navigator.clipboard.writeText(text);
        success = true;
      } else {
        success = false;
      }
    } catch {
      // Gracefully handled without throwing (REC-EXP-02)
      success = false;
    }

    if (typeof this.dispatchEvent === 'function') {
      const detail: { text: string; success: boolean; type?: 'result' | 'history' } = { text, success };
      if (type) detail.type = type;
      this.dispatchEvent(
        new CustomEvent('copy-clipboard', {
          detail,
          bubbles: true,
          composed: true,
        })
      );
    }

    return success;
  }

  /**
   * Copies the active display result to the clipboard.
   */
  public async copyResult(): Promise<boolean> {
    const state = this.engine.getState();
    const textToCopy = state.display;
    this.showToast('Result copied to clipboard', 2000);
    const success = await this.copyToClipboard(textToCopy, 'result');
    return success;
  }

  /**
   * Copies the full formatted calculation history tape to the clipboard.
   */
  public async copyHistory(): Promise<boolean> {
    const history = this.engine.getHistory();
    if (history.length === 0) {
      this.showToast('No history to copy', 2000);
      return false;
    }
    const textToCopy = this.engine.exportHistoryAsText();
    this.showToast('History copied to clipboard', 2000);
    const success = await this.copyToClipboard(textToCopy, 'history');
    return success;
  }

  /**
   * Exports calculation history in either 'text' or 'csv' format.
   * Dispatches 'export-history' CustomEvent.
   */
  public exportHistory(format: HistoryExportFormat = 'text'): HistoryExportResult | null {
    const history = this.engine.getHistory();
    if (history.length === 0) {
      this.showToast('No history to export', 2000);
      return null;
    }

    const res = this.engine.exportHistory(format);
    if (typeof this.dispatchEvent === 'function') {
      this.dispatchEvent(
        new CustomEvent('export-history', {
          detail: res,
          bubbles: true,
          composed: true,
        })
      );
    }

    const toastMsg = format === 'csv' ? 'History exported as CSV' : 'History exported as TXT';
    this.showToast(toastMsg, 2000);
    return res;
  }

  /**
   * Convenience facade to export history as Plain Text.
   */
  public exportHistoryAsText(): HistoryExportResult | null {
    return this.exportHistory('text');
  }

  /**
   * Convenience facade to export history as CSV.
   */
  public exportHistoryAsCsv(): HistoryExportResult | null {
    return this.exportHistory('csv');
  }
}

// Register autonomous custom element if customElements registry is available
if (
  typeof globalThis.customElements !== 'undefined' &&
  !globalThis.customElements.get('stay-calc')
) {
  globalThis.customElements.define('stay-calc', StayCalc);
}
