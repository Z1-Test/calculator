import { CalcEngine } from "../engine/calc-engine.ts";
import type { CalcEngineState, Operator, RadixBase, WordSize } from "../engine/types.ts";

const STYLES = `
  :host {
    display: block;
    width: 100%;
    max-width: 380px;
    margin: 0 auto;
    box-sizing: border-box;
    font-family: Inter, system-ui, -apple-system, sans-serif;
  }
  *, *::before, *::after {
    box-sizing: inherit;
  }
  .calc-container {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    background: var(--calc-background, #ffffff);
    border: 1px solid var(--calc-outline-low, #e4e4e7);
    border-radius: 24px;
    padding: 16px;
    box-sizing: border-box;
  }
  .display-card {
    background: var(--calc-surface, #f4f4f5);
    border: 1px solid var(--calc-outline-low, #e4e4e7);
    border-radius: 16px;
    padding: 16px 20px;
    min-height: 84px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: flex-end;
    margin-bottom: 14px;
    box-sizing: border-box;
  }
  .display-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    min-height: 18px;
    margin-bottom: 4px;
    box-sizing: border-box;
  }
  .memory-badge {
    display: none;
    font-family: "Plus Jakarta Sans", system-ui, -apple-system, sans-serif;
    font-size: 11px;
    font-weight: 700;
    line-height: 1;
    color: var(--calc-primary, #2563eb);
    background: var(--calc-container-low, #e4e4e7);
    border-radius: 4px;
    padding: 2px 6px;
    letter-spacing: 0.05em;
  }
  .memory-badge.active {
    display: inline-block;
  }
  .display-status {
    font-size: 12px;
    font-weight: 500;
    color: var(--calc-text-secondary, #71717a);
    min-height: 16px;
    line-height: 1.33;
    text-align: right;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .expression-display {
    font-family: Inter, system-ui, -apple-system, sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: var(--calc-text-secondary, #71717a);
    min-height: 18px;
    line-height: 1.38;
    text-align: right;
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-bottom: 2px;
    box-sizing: border-box;
  }
  .display-value {
    font-family: "Plus Jakarta Sans", system-ui, -apple-system, sans-serif;
    font-size: 36px;
    font-weight: 700;
    line-height: 1.15;
    letter-spacing: -0.02em;
    color: var(--calc-text-primary, #09090b);
    font-variant-numeric: tabular-nums;
    text-align: right;
    width: 100%;
    word-break: break-all;
    overflow-wrap: break-word;
  }
  .display-card.error .display-value {
    font-size: 20px;
    color: var(--calc-error, #ff453a);
  }
  .keypad-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    width: 100%;
    box-sizing: border-box;
  }
  button {
    font-family: Inter, system-ui, -apple-system, sans-serif;
    font-size: 18px;
    font-weight: 600;
    line-height: 1.25;
    letter-spacing: -0.01em;
    height: 56px;
    min-width: 0;
    border-radius: 9999px;
    border: 1px solid var(--calc-outline-low, #e4e4e7);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
    background-color: var(--calc-surface, #f4f4f5);
    color: var(--calc-text-primary, #09090b);
    transition: transform 0.08s ease, background-color 0.1s ease;
    box-sizing: border-box;
    padding: 0;
  }
  button:active {
    transform: scale(0.96);
  }
  button:focus-visible {
    outline: 2px solid var(--calc-primary, #2563eb);
    outline-offset: 2px;
  }
  .btn-operator {
    background-color: var(--calc-secondary, #475569);
    color: #ffffff;
    border-color: var(--calc-secondary, #475569);
  }
  .btn-action {
    background-color: var(--calc-container-low, #e4e4e7);
    color: var(--calc-text-primary, #09090b);
  }
  .btn-primary {
    background-color: var(--calc-primary, #2563eb);
    color: var(--calc-on-primary, #ffffff);
    border-color: var(--calc-primary, #2563eb);
  }
  .span-two {
    grid-column: span 2;
  }
  .calc-top-bar {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 8px;
    width: 100%;
    margin-bottom: 8px;
    box-sizing: border-box;
  }
  .btn-history-toggle,
  .btn-scientific-toggle,
  .btn-programmer-toggle {
    height: 32px;
    padding: 0 14px;
    font-size: 13px;
    font-weight: 600;
    border-radius: 9999px;
    background-color: var(--calc-surface, #f4f4f5);
    color: var(--calc-text-primary, #09090b);
    border: 1px solid var(--calc-outline-low, #e4e4e7);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: background-color 0.1s ease, transform 0.08s ease;
  }
  .btn-history-toggle:hover,
  .btn-scientific-toggle:hover,
  .btn-programmer-toggle:hover {
    background-color: var(--calc-container-low, #e4e4e7);
  }
  .btn-history-toggle:focus-visible,
  .btn-scientific-toggle:focus-visible,
  .btn-programmer-toggle:focus-visible {
    outline: 2px solid var(--calc-primary, #2563eb);
    outline-offset: 2px;
  }
  .btn-scientific-toggle.active,
  .btn-programmer-toggle.active {
    background-color: var(--calc-primary, #2563eb);
    color: var(--calc-on-primary, #ffffff);
    border-color: var(--calc-primary, #2563eb);
  }
  .programmer-panel {
    display: none;
    width: 100%;
    max-width: 100%;
    background: var(--calc-surface, #f4f4f5);
    border: 1px solid var(--calc-outline-low, #e4e4e7);
    border-radius: 16px;
    padding: 10px 12px;
    margin-bottom: 12px;
    box-sizing: border-box;
    overflow-x: hidden;
  }
  .programmer-panel.open {
    display: block;
  }
  .radix-panel {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
    margin-bottom: 8px;
    box-sizing: border-box;
  }
  .radix-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    min-height: 28px;
    padding: 4px 10px;
    border-radius: 8px;
    border: 1px solid var(--calc-outline-low, #e4e4e7);
    background: var(--calc-background, #ffffff);
    color: var(--calc-text-primary, #09090b);
    cursor: pointer;
    font-size: 12px;
    font-family: Inter, system-ui, -apple-system, sans-serif;
    box-sizing: border-box;
    transition: background-color 0.1s ease, border-color 0.1s ease;
  }
  .radix-row:hover {
    background-color: var(--calc-container-low, #e4e4e7);
  }
  .radix-row.active {
    border-color: var(--calc-primary, #2563eb);
    background-color: var(--calc-surface, #f4f4f5);
    font-weight: 700;
  }
  .radix-row:focus-visible {
    outline: 2px solid var(--calc-primary, #2563eb);
    outline-offset: 1px;
  }
  .radix-label {
    font-weight: 700;
    font-size: 11px;
    color: var(--calc-text-secondary, #71717a);
    margin-right: 8px;
    flex-shrink: 0;
  }
  .radix-row.active .radix-label {
    color: var(--calc-primary, #2563eb);
  }
  .radix-value {
    font-variant-numeric: tabular-nums;
    font-size: 11px;
    font-weight: 600;
    text-align: right;
    word-break: break-all;
    overflow-wrap: break-word;
    flex: 1;
    min-width: 0;
  }
  .programmer-controls {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    margin-bottom: 8px;
    box-sizing: border-box;
  }
  .btn-word-size {
    height: 30px;
    font-size: 12px;
    font-weight: 600;
    border-radius: 9999px;
    background: var(--calc-surface, #f4f4f5);
    color: var(--calc-text-primary, #09090b);
    border: 1px solid var(--calc-outline-low, #e4e4e7);
    cursor: pointer;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.1s ease;
    box-sizing: border-box;
  }
  .btn-word-size:hover {
    background: var(--calc-container-low, #e4e4e7);
  }
  .btn-word-size:focus-visible {
    outline: 2px solid var(--calc-primary, #2563eb);
    outline-offset: 2px;
  }
  .bitwise-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 4px;
    width: 100%;
    box-sizing: border-box;
  }
  .btn-bitwise {
    height: 32px;
    font-size: 11px;
    font-weight: 600;
    border-radius: 9999px;
    background: var(--calc-background, #ffffff);
    color: var(--calc-text-primary, #09090b);
    border: 1px solid var(--calc-outline-low, #e4e4e7);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    min-width: 0;
    transition: background-color 0.1s ease, transform 0.08s ease;
    box-sizing: border-box;
  }
  .btn-bitwise:hover {
    background: var(--calc-container-low, #e4e4e7);
  }
  .btn-bitwise:active {
    transform: scale(0.96);
  }
  .btn-bitwise:focus-visible {
    outline: 2px solid var(--calc-primary, #2563eb);
    outline-offset: 2px;
  }
  .hex-keypad-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 4px;
    width: 100%;
    box-sizing: border-box;
  }
  .btn-hex {
    height: 36px;
    font-size: 13px;
    font-weight: 600;
    border-radius: 9999px;
    background: var(--calc-background, #ffffff);
    color: var(--calc-text-primary, #09090b);
    border: 1px solid var(--calc-outline-low, #e4e4e7);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    min-width: 0;
    transition: background-color 0.1s ease, transform 0.08s ease;
    box-sizing: border-box;
  }
  .btn-hex:hover:not(:disabled) {
    background: var(--calc-container-low, #e4e4e7);
  }
  .btn-hex:active:not(:disabled) {
    transform: scale(0.96);
  }
  .btn-hex:focus-visible {
    outline: 2px solid var(--calc-primary, #2563eb);
    outline-offset: 2px;
  }
  button:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
  .scientific-keypad {
    display: none;
    width: 100%;
    max-width: 100%;
    background: var(--calc-surface, #f4f4f5);
    border: 1px solid var(--calc-outline-low, #e4e4e7);
    border-radius: 16px;
    padding: 10px 12px;
    margin-bottom: 12px;
    box-sizing: border-box;
    overflow-x: hidden;
  }
  .scientific-keypad.open {
    display: block;
  }
  .scientific-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
    width: 100%;
    box-sizing: border-box;
  }
  .btn-scientific {
    height: 38px;
    font-size: 14px;
    font-weight: 600;
    border-radius: 9999px;
    background-color: var(--calc-background, #ffffff);
    color: var(--calc-text-primary, #09090b);
    border: 1px solid var(--calc-outline-low, #e4e4e7);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.1s ease, transform 0.08s ease;
    box-sizing: border-box;
    padding: 0;
  }
  .btn-scientific:hover {
    background-color: var(--calc-container-low, #e4e4e7);
  }
  .btn-scientific:active {
    transform: scale(0.96);
  }
  .btn-scientific:focus-visible {
    outline: 2px solid var(--calc-primary, #2563eb);
    outline-offset: 2px;
  }
  .btn-scientific.btn-angle {
    background-color: var(--calc-secondary, #475569);
    color: #ffffff;
    border-color: var(--calc-secondary, #475569);
  }
  .history-drawer {
    display: none;
    width: 100%;
    max-width: 100%;
    background: var(--calc-surface, #f4f4f5);
    border: 1px solid var(--calc-outline-low, #e4e4e7);
    border-radius: 16px;
    padding: 12px 14px;
    margin-bottom: 12px;
    box-sizing: border-box;
    max-height: 220px;
    overflow-y: auto;
    overflow-x: hidden;
  }
  .history-drawer.open {
    display: block;
  }
  .history-panel {
    width: 100%;
    box-sizing: border-box;
  }
  .history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding-bottom: 8px;
    margin-bottom: 8px;
    border-bottom: 1px solid var(--calc-outline-low, #e4e4e7);
    box-sizing: border-box;
  }
  .history-title {
    font-family: "Plus Jakarta Sans", system-ui, -apple-system, sans-serif;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--calc-text-secondary, #71717a);
  }
  .btn-history-clear {
    height: 26px;
    padding: 0 10px;
    font-size: 11px;
    font-weight: 600;
    border-radius: 9999px;
    background: transparent;
    color: var(--calc-error, #ff453a);
    border: 1px solid var(--calc-error, #ff453a);
    cursor: pointer;
  }
  .btn-history-clear:hover {
    background: rgba(255, 69, 58, 0.1);
  }
  .btn-history-clear:focus-visible {
    outline: 2px solid var(--calc-error, #ff453a);
    outline-offset: 2px;
  }
  .history-empty {
    font-size: 13px;
    color: var(--calc-text-secondary, #71717a);
    text-align: center;
    padding: 14px 0;
  }
  .history-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    box-sizing: border-box;
  }
  .history-item {
    width: 100%;
    min-height: 38px;
    padding: 8px 12px;
    border-radius: 8px;
    background: var(--calc-background, #ffffff);
    border: 1px solid var(--calc-outline-low, #e4e4e7);
    color: var(--calc-text-primary, #09090b);
    font-family: Inter, system-ui, -apple-system, sans-serif;
    font-size: 13px;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    text-align: right;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    word-break: break-all;
    overflow-wrap: break-word;
    cursor: pointer;
    box-sizing: border-box;
    transition: background-color 0.1s ease;
  }
  .history-item:hover {
    background-color: var(--calc-container-low, #e4e4e7);
  }
  .history-item:focus-visible {
    outline: 2px solid var(--calc-primary, #2563eb);
    outline-offset: 2px;
  }
`;

const TEMPLATE_HTML = `
  <style>${STYLES}</style>
  <div class="calc-container" part="container">
    <nav class="calc-top-bar" part="top-bar">
      <button type="button" class="btn-history-toggle" id="history-toggle" part="history-toggle" data-action="toggleHistory" aria-expanded="false" aria-controls="history-drawer" aria-label="Toggle calculation history">History</button>
      <button type="button" class="btn-scientific-toggle" id="scientific-toggle" part="scientific-toggle" data-action="toggleScientific" aria-expanded="false" aria-controls="scientific-keypad" aria-label="Toggle scientific mode">Scientific</button>
      <button type="button" class="btn-programmer-toggle" id="programmer-toggle" part="programmer-toggle" data-action="toggleProgrammer" aria-expanded="false" aria-controls="programmer-panel" aria-label="Toggle programmer mode">Programmer</button>
    </nav>
    <section class="history-drawer" id="history-drawer" part="history-drawer" aria-label="Calculation History" role="region">
      <article class="history-panel" id="history-panel" part="history-panel">
        <header class="history-header">
          <span class="history-title">History</span>
          <button type="button" class="btn-history-clear" id="history-clear" part="history-clear" data-action="clearHistory" aria-label="Clear calculation history">Clear History</button>
        </header>
        <p class="history-empty" id="history-empty" part="history-empty">No calculations yet</p>
        <ul class="history-list" id="history-list" part="history-list" role="list"></ul>
      </article>
    </section>
    <slot name="display">
      <div class="display-card" id="display-card" part="display">
        <header class="display-header" part="header">
          <span class="memory-badge" id="memory-badge" part="memory-badge" aria-label="Memory Active" style="display: none;">M</span>
          <span class="display-status" id="display-status" part="status"></span>
        </header>
        <div class="expression-display" id="expression-display" part="expression" role="status" aria-label="Expression formula" aria-live="polite"></div>
        <div class="display-value" id="display-value" part="value">0</div>
      </div>
    </slot>
    <section class="programmer-panel" id="programmer-panel" part="programmer-panel" aria-label="Programmer Panel" role="region">
      <div class="radix-panel" id="radix-panel" part="radix-panel" role="radiogroup" aria-label="Radix base selection">
        <button type="button" class="radix-row" data-action="setRadix" data-value="HEX" role="radio" aria-checked="false" aria-label="Hexadecimal representation">
          <span class="radix-label">HEX</span>
          <span class="radix-value" id="radix-val-hex">0</span>
        </button>
        <button type="button" class="radix-row active" data-action="setRadix" data-value="DEC" role="radio" aria-checked="true" aria-label="Decimal representation">
          <span class="radix-label">DEC</span>
          <span class="radix-value" id="radix-val-dec">0</span>
        </button>
        <button type="button" class="radix-row" data-action="setRadix" data-value="OCT" role="radio" aria-checked="false" aria-label="Octal representation">
          <span class="radix-label">OCT</span>
          <span class="radix-value" id="radix-val-oct">0</span>
        </button>
        <button type="button" class="radix-row" data-action="setRadix" data-value="BIN" role="radio" aria-checked="false" aria-label="Binary representation">
          <span class="radix-label">BIN</span>
          <span class="radix-value" id="radix-val-bin">0</span>
        </button>
      </div>
      <div class="programmer-controls" part="programmer-controls">
        <button type="button" class="btn-word-size" id="word-size-toggle" part="word-size-toggle" data-action="cycleWordSize" aria-label="Word size toggle">QWORD (64-bit)</button>
        <div class="bitwise-grid" part="bitwise-grid">
          <button type="button" class="btn-bitwise" data-action="bitwiseAnd" aria-label="Bitwise AND">AND</button>
          <button type="button" class="btn-bitwise" data-action="bitwiseOr" aria-label="Bitwise OR">OR</button>
          <button type="button" class="btn-bitwise" data-action="bitwiseXor" aria-label="Bitwise XOR">XOR</button>
          <button type="button" class="btn-bitwise" data-action="bitwiseNot" aria-label="Bitwise NOT">NOT</button>
          <button type="button" class="btn-bitwise" data-action="bitwiseLsh" aria-label="Bitwise Left Shift">LSH</button>
          <button type="button" class="btn-bitwise" data-action="bitwiseRsh" aria-label="Bitwise Right Shift">RSH</button>
        </div>
      </div>
      <div class="hex-keypad-grid" id="hex-keypad-grid" part="hex-keypad">
        <button type="button" class="btn-hex" data-action="digit" data-value="A" aria-label="Hex digit A" disabled>A</button>
        <button type="button" class="btn-hex" data-action="digit" data-value="B" aria-label="Hex digit B" disabled>B</button>
        <button type="button" class="btn-hex" data-action="digit" data-value="C" aria-label="Hex digit C" disabled>C</button>
        <button type="button" class="btn-hex" data-action="digit" data-value="D" aria-label="Hex digit D" disabled>D</button>
        <button type="button" class="btn-hex" data-action="digit" data-value="E" aria-label="Hex digit E" disabled>E</button>
        <button type="button" class="btn-hex" data-action="digit" data-value="F" aria-label="Hex digit F" disabled>F</button>
      </div>
    </section>
    <section class="scientific-keypad" id="scientific-keypad" part="scientific-keypad" aria-label="Scientific Keypad" role="region">
      <div class="scientific-grid" id="scientific-grid" part="scientific-grid">
        <button type="button" class="btn-scientific btn-angle" id="angle-mode-toggle" part="angle-mode-toggle" data-action="toggleAngleMode" aria-label="Toggle angle mode DEG or RAD">DEG</button>
        <button type="button" class="btn-scientific" data-action="sin" aria-label="Sine">sin</button>
        <button type="button" class="btn-scientific" data-action="cos" aria-label="Cosine">cos</button>
        <button type="button" class="btn-scientific" data-action="tan" aria-label="Tangent">tan</button>
        <button type="button" class="btn-scientific" data-action="operator" data-value="^" aria-label="Power x to y">xʸ</button>
        <button type="button" class="btn-scientific" data-action="square" aria-label="Square">x²</button>
        <button type="button" class="btn-scientific" data-action="sqrt" aria-label="Square Root">√</button>
        <button type="button" class="btn-scientific" data-action="reciprocal" aria-label="Reciprocal">1/x</button>
        <button type="button" class="btn-scientific" data-action="ln" aria-label="Natural Logarithm">ln</button>
        <button type="button" class="btn-scientific" data-action="log" aria-label="Common Logarithm">log</button>
        <button type="button" class="btn-scientific" data-action="constant" data-value="pi" aria-label="Pi constant">π</button>
        <button type="button" class="btn-scientific" data-action="constant" data-value="e" aria-label="Euler constant">e</button>
      </div>
    </section>
    <slot name="keypad">
      <div class="keypad-grid" id="keypad-grid" part="keypad">
        <button type="button" class="btn-action" data-action="memoryClear" aria-label="Memory Clear">MC</button>
        <button type="button" class="btn-action" data-action="memoryRecall" aria-label="Memory Recall">MR</button>
        <button type="button" class="btn-action" data-action="memorySubtract" aria-label="Memory Subtract">M-</button>
        <button type="button" class="btn-action" data-action="memoryAdd" aria-label="Memory Add">M+</button>

        <button type="button" class="btn-action span-two" data-action="paren" data-value="(" aria-label="Open parenthesis">(</button>
        <button type="button" class="btn-action span-two" data-action="paren" data-value=")" aria-label="Close parenthesis">)</button>

        <button type="button" class="btn-action" data-action="clear" aria-label="Clear Entry">C</button>
        <button type="button" class="btn-action" data-action="allClear" aria-label="All Clear">AC</button>
        <button type="button" class="btn-action" data-action="backspace" aria-label="Backspace">⌫</button>
        <button type="button" class="btn-operator" data-action="operator" data-value="/" aria-label="Divide">÷</button>

        <button type="button" class="btn-numeric" data-action="digit" data-value="7">7</button>
        <button type="button" class="btn-numeric" data-action="digit" data-value="8">8</button>
        <button type="button" class="btn-numeric" data-action="digit" data-value="9">9</button>
        <button type="button" class="btn-operator" data-action="operator" data-value="*" aria-label="Multiply">×</button>

        <button type="button" class="btn-numeric" data-action="digit" data-value="4">4</button>
        <button type="button" class="btn-numeric" data-action="digit" data-value="5">5</button>
        <button type="button" class="btn-numeric" data-action="digit" data-value="6">6</button>
        <button type="button" class="btn-operator" data-action="operator" data-value="-" aria-label="Subtract">−</button>

        <button type="button" class="btn-numeric" data-action="digit" data-value="1">1</button>
        <button type="button" class="btn-numeric" data-action="digit" data-value="2">2</button>
        <button type="button" class="btn-numeric" data-action="digit" data-value="3">3</button>
        <button type="button" class="btn-operator" data-action="operator" data-value="+" aria-label="Add">+</button>

        <button type="button" class="btn-numeric span-two" data-action="digit" data-value="0">0</button>
        <button type="button" class="btn-numeric" data-action="decimal" aria-label="Decimal Point">.</button>
        <button type="button" class="btn-primary" data-action="calculate" aria-label="Equals">=</button>
      </div>
    </slot>
  </div>
`;

const HTMLElementBase =
  typeof HTMLElement !== "undefined"
    ? HTMLElement
    : (class {
        shadowRoot: any = null;
        attachShadow(_options: ShadowRootInit) {
          return {
            innerHTML: "",
            getElementById: () => null,
            addEventListener: () => {},
            removeEventListener: () => {},
          };
        }
      } as unknown as typeof HTMLElement);

/**
 * Autonomous W3C Custom Element representing the StayCalc interactive calculator.
 * Supports Declarative Shadow DOM (DSD), slot projection, keyboard navigation,
 * and zero horizontal scroll overflow on mobile viewports.
 */
export class StayCalc extends HTMLElementBase {
  public engine: CalcEngine;
  private isConnectedToDOM: boolean = false;
  private isHistoryOpen: boolean = false;
  private isScientificOpen: boolean = false;
  private isProgrammerOpen: boolean = false;
  private keydownListener: ((event: KeyboardEvent) => void) | null = null;
  private keypadClickListener: ((event: Event) => void) | null = null;
  private historyClickListener: ((event: Event) => void) | null = null;
  private historyToggleListener: ((event: Event) => void) | null = null;
  private historyKeydownListener: ((event: KeyboardEvent) => void) | null = null;
  private scientificClickListener: ((event: Event) => void) | null = null;
  private scientificToggleListener: ((event: Event) => void) | null = null;
  private programmerClickListener: ((event: Event) => void) | null = null;
  private programmerToggleListener: ((event: Event) => void) | null = null;

  constructor() {
    super();
    this.engine = new CalcEngine();

    // Attach or adopt Declarative Shadow DOM
    let root = this.shadowRoot;
    if (!root && typeof this.attachShadow === "function") {
      root = this.attachShadow({ mode: "open" });
    }

    if (root && (!root.childNodes || root.childNodes.length === 0)) {
      root.innerHTML = TEMPLATE_HTML;
    }
  }

  /**
   * Lifecycle callback invoked when the element is appended to a document.
   */
  public connectedCallback(): void {
    this.isConnectedToDOM = true;

    // Attach click listener on keypad slot container (delegated)
    const keypadContainer =
      this.shadowRoot?.getElementById("keypad-grid") || this.shadowRoot;
    if (keypadContainer) {
      this.keypadClickListener = (event: Event) => {
        const target = (event.target as HTMLElement)?.closest?.("button");
        if (!target) return;
        const action = target.getAttribute("data-action");
        const value = target.getAttribute("data-value") ?? target.getAttribute("data-index");
        this.executeAction(action, value);
      };
      keypadContainer.addEventListener("click", this.keypadClickListener);
    }

    // Attach click listener on history drawer (delegated for recall and clear)
    const historyDrawer = this.shadowRoot?.getElementById("history-drawer");

    if (historyDrawer) {
      this.historyClickListener = (event: Event) => {
        const target = (event.target as HTMLElement)?.closest?.("button");
        if (!target) return;
        const action = target.getAttribute("data-action");
        const value = target.getAttribute("data-value") ?? target.getAttribute("data-index");
        this.executeAction(action, value);
      };
      historyDrawer.addEventListener("click", this.historyClickListener);
    }

    // Attach click listener on history toggle button
    const historyToggle = this.shadowRoot?.getElementById("history-toggle");
    if (historyToggle) {
      this.historyToggleListener = (_event: Event) => {
        this.executeAction("toggleHistory");
      };
      historyToggle.addEventListener("click", this.historyToggleListener);
    }

    // Attach click listener on scientific keypad (delegated)
    const scientificKeypad = this.shadowRoot?.getElementById("scientific-keypad");
    if (scientificKeypad) {
      this.scientificClickListener = (event: Event) => {
        const target = (event.target as HTMLElement)?.closest?.("button");
        if (!target) return;
        const action = target.getAttribute("data-action");
        const value = target.getAttribute("data-value");
        this.executeAction(action, value);
      };
      scientificKeypad.addEventListener("click", this.scientificClickListener);
    }

    // Attach click listener on scientific toggle button
    const scientificToggle = this.shadowRoot?.getElementById("scientific-toggle");
    if (scientificToggle) {
      this.scientificToggleListener = (_event: Event) => {
        this.executeAction("toggleScientific");
      };
      scientificToggle.addEventListener("click", this.scientificToggleListener);
    }

    // Attach click listener on programmer panel (delegated)
    const programmerPanel = this.shadowRoot?.getElementById("programmer-panel");
    if (programmerPanel) {
      this.programmerClickListener = (event: Event) => {
        const target = (event.target as HTMLElement)?.closest?.("button");
        if (!target) return;
        const action = target.getAttribute("data-action");
        const value = target.getAttribute("data-value");
        this.executeAction(action, value);
      };
      programmerPanel.addEventListener("click", this.programmerClickListener);
    }

    // Attach click listener on programmer toggle button
    const programmerToggle = this.shadowRoot?.getElementById("programmer-toggle");
    if (programmerToggle) {
      this.programmerToggleListener = (_event: Event) => {
        this.executeAction("toggleProgrammer");
      };
      programmerToggle.addEventListener("click", this.programmerToggleListener);
    }

    // Attach keydown listener on history drawer for Enter/Space recall
    if (historyDrawer) {
      this.historyKeydownListener = (event: KeyboardEvent) => {
        const target = (event.target as HTMLElement)?.closest?.("button");
        if (
          target &&
          target.getAttribute("data-action") === "recallHistory" &&
          (event.key === "Enter" || event.key === " ")
        ) {
          event.preventDefault?.();
          event.stopPropagation?.();
          const index = target.getAttribute("data-index");
          this.executeAction("recallHistory", index);
        }
      };
      historyDrawer.addEventListener("keydown", this.historyKeydownListener);
    }

    // Attach global window keyboard listener
    if (typeof window !== "undefined") {
      this.keydownListener = (event: KeyboardEvent) => {
        this.handleKeyDown(event);
      };
      window.addEventListener("keydown", this.keydownListener);
    }

    this.updateDisplay();
  }

  /**
   * Lifecycle callback invoked when the element is removed from a document.
   */
  public disconnectedCallback(): void {
    this.isConnectedToDOM = false;

    if (this.keypadClickListener && this.shadowRoot) {
      const keypadContainer =
        this.shadowRoot.getElementById("keypad-grid") || this.shadowRoot;
      keypadContainer?.removeEventListener("click", this.keypadClickListener);
      this.keypadClickListener = null;
    }

    if (this.historyClickListener && this.shadowRoot) {
      const historyDrawer = this.shadowRoot.getElementById("history-drawer");
      historyDrawer?.removeEventListener("click", this.historyClickListener);
      this.historyClickListener = null;
    }

    if (this.historyToggleListener && this.shadowRoot) {
      const historyToggle = this.shadowRoot.getElementById("history-toggle");
      historyToggle?.removeEventListener("click", this.historyToggleListener);
      this.historyToggleListener = null;
    }

    if (this.scientificClickListener && this.shadowRoot) {
      const scientificKeypad = this.shadowRoot.getElementById("scientific-keypad");
      scientificKeypad?.removeEventListener("click", this.scientificClickListener);
      this.scientificClickListener = null;
    }

    if (this.scientificToggleListener && this.shadowRoot) {
      const scientificToggle = this.shadowRoot.getElementById("scientific-toggle");
      scientificToggle?.removeEventListener("click", this.scientificToggleListener);
      this.scientificToggleListener = null;
    }

    if (this.programmerClickListener && this.shadowRoot) {
      const programmerPanel = this.shadowRoot.getElementById("programmer-panel");
      programmerPanel?.removeEventListener("click", this.programmerClickListener);
      this.programmerClickListener = null;
    }

    if (this.programmerToggleListener && this.shadowRoot) {
      const programmerToggle = this.shadowRoot.getElementById("programmer-toggle");
      programmerToggle?.removeEventListener("click", this.programmerToggleListener);
      this.programmerToggleListener = null;
    }

    if (this.historyKeydownListener && this.shadowRoot) {
      const historyDrawer = this.shadowRoot.getElementById("history-drawer");
      historyDrawer?.removeEventListener("keydown", this.historyKeydownListener);
      this.historyKeydownListener = null;
    }

    if (this.keydownListener && typeof window !== "undefined") {
      window.removeEventListener("keydown", this.keydownListener);
      this.keydownListener = null;
    }
  }

  /**
   * Toggles the visibility of the calculation history drawer and synchronizes ARIA attributes.
   */
  public toggleHistory(): void {
    this.isHistoryOpen = !this.isHistoryOpen;
    if (this.shadowRoot) {
      const drawer = this.shadowRoot.getElementById("history-drawer");
      const toggle = this.shadowRoot.getElementById("history-toggle");
      if (drawer) {
        if (this.isHistoryOpen) {
          drawer.classList.add("open");
          drawer.style.display = "block";
        } else {
          drawer.classList.remove("open");
          drawer.style.display = "none";
        }
      }
      if (toggle) {
        toggle.setAttribute("aria-expanded", String(this.isHistoryOpen));
      }
    }
  }

  /**
   * Returns true if the history drawer is currently open.
   */
  public getHistoryOpen(): boolean {
    return this.isHistoryOpen;
  }

  /**
   * Toggles the visibility of the scientific keypad and synchronizes ARIA attributes.
   */
  public toggleScientific(): void {
    this.isScientificOpen = !this.isScientificOpen;
    if (this.shadowRoot) {
      const keypad = this.shadowRoot.getElementById("scientific-keypad");
      const toggle = this.shadowRoot.getElementById("scientific-toggle");
      if (keypad) {
        if (this.isScientificOpen) {
          keypad.classList.add("open");
          keypad.style.display = "block";
        } else {
          keypad.classList.remove("open");
          keypad.style.display = "none";
        }
      }
      if (toggle) {
        toggle.setAttribute("aria-expanded", String(this.isScientificOpen));
        if (this.isScientificOpen) {
          toggle.classList.add("active");
        } else {
          toggle.classList.remove("active");
        }
      }
    }
  }

  /**
   * Returns true if the scientific keypad is currently open.
   */
  public getScientificOpen(): boolean {
    return this.isScientificOpen;
  }

  /**
   * Alias for getScientificOpen().
   */
  public isScientificKeypadOpen(): boolean {
    return this.isScientificOpen;
  }

  /**
   * Toggles the angle mode (DEG <-> RAD) and updates display.
   */
  /**
   * Toggles the angle mode (DEG <-> RAD) and updates display.
   */
  public toggleAngleMode(): void {
    this.engine.toggleAngleMode();
    this.updateDisplay();
  }

  /**
   * Toggles the visibility of the programmer panel and synchronizes ARIA attributes.
   */
  public toggleProgrammer(): void {
    this.isProgrammerOpen = !this.isProgrammerOpen;
    this.engine.setProgrammerMode(this.isProgrammerOpen);
    if (this.shadowRoot) {
      const panel = this.shadowRoot.getElementById("programmer-panel");
      const toggle = this.shadowRoot.getElementById("programmer-toggle");
      if (panel) {
        if (this.isProgrammerOpen) {
          panel.classList.add("open");
          panel.style.display = "block";
        } else {
          panel.classList.remove("open");
          panel.style.display = "none";
        }
      }
      if (toggle) {
        toggle.setAttribute("aria-expanded", String(this.isProgrammerOpen));
        if (this.isProgrammerOpen) {
          toggle.classList.add("active");
        } else {
          toggle.classList.remove("active");
        }
      }
    }
    this.updateDisplay();
  }

  /**
   * Returns true if the programmer panel is currently open.
   */
  public getProgrammerOpen(): boolean {
    return this.isProgrammerOpen;
  }

  /**
   * Alias for getProgrammerOpen().
   */
  public isProgrammerPanelOpen(): boolean {
    return this.isProgrammerOpen;
  }

  /**
   * Sets programmer mode explicitly.
   */
  public setProgrammerMode(enabled: boolean): void {
    if (this.isProgrammerOpen !== enabled) {
      this.toggleProgrammer();
    }
  }

  /**
   * Cycles word size (QWORD 64 -> DWORD 32 -> WORD 16 -> BYTE 8 -> QWORD 64) and updates display.
   */
  public cycleWordSize(): void {
    this.engine.cycleWordSize();
    this.updateDisplay();
  }

  /**
   * Sets word size directly.
   */
  public setWordSize(size: WordSize): void {
    this.engine.setWordSize(size);
    this.updateDisplay();
  }

  /**
   * Sets active radix base (HEX, DEC, OCT, BIN).
   */
  public setRadix(radix: RadixBase): void {
    this.engine.setRadix(radix);
    this.updateDisplay();
  }

  /**
   * Dispatches an action command to the arithmetic engine and updates the display.
   */
  public executeAction(action: string | null | undefined, value?: string | null): void {
    if (!action) return;

    switch (action) {
      case "paren":
        if (value === "(" || value === ")") {
          this.engine.inputParenthesis(value);
        }
        break;
      case "digit":
        if (value !== undefined && value !== null) {
          this.engine.inputDigit(value);
        }
        break;
      case "decimal":
        this.engine.inputDecimal();
        break;
      case "operator":
        if (value) {
          this.engine.inputOperator(value as Operator);
        }
        break;
      case "calculate":
        this.engine.calculate();
        break;
      case "clear":
        this.engine.clear();
        break;
      case "allClear":
        this.engine.allClear();
        break;
      case "backspace":
        this.engine.backspace();
        break;
      case "memoryAdd":
        this.engine.memoryAdd();
        break;
      case "memorySubtract":
        this.engine.memorySubtract();
        break;
      case "memoryRecall":
        this.engine.memoryRecall();
        break;
      case "memoryClear":
        this.engine.memoryClear();
        break;
      case "toggleHistory":
        this.toggleHistory();
        break;
      case "recallHistory":
        if (value !== undefined && value !== null) {
          this.engine.recallHistory(Number(value));
        }
        break;
      case "clearHistory":
        this.engine.clearHistory();
        break;
      case "toggleScientific":
        this.toggleScientific();
        break;
      case "toggleAngleMode":
        this.toggleAngleMode();
        break;
      case "sin":
        this.engine.sin();
        break;
      case "cos":
        this.engine.cos();
        break;
      case "tan":
        this.engine.tan();
        break;
      case "square":
        this.engine.square();
        break;
      case "sqrt":
        this.engine.sqrt();
        break;
      case "reciprocal":
        this.engine.reciprocal();
        break;
      case "ln":
        this.engine.ln();
        break;
      case "log":
        this.engine.log();
        break;
      case "constant":
        if (value === "pi" || value === "e") {
          this.engine.inputConstant(value);
        }
        break;
      case "toggleProgrammer":
        this.toggleProgrammer();
        break;
      case "setRadix":
        if (value) {
          this.setRadix(value as RadixBase);
        }
        break;
      case "cycleWordSize":
        this.cycleWordSize();
        break;
      case "bitwiseAnd":
        this.engine.bitwiseAnd();
        break;
      case "bitwiseOr":
        this.engine.bitwiseOr();
        break;
      case "bitwiseXor":
        this.engine.bitwiseXor();
        break;
      case "bitwiseNot":
        this.engine.bitwiseNot();
        break;
      case "bitwiseLsh":
        this.engine.bitwiseLsh();
        break;
      case "bitwiseRsh":
        this.engine.bitwiseRsh();
        break;
    }

    this.updateDisplay();
  }

  /**
   * Handles keyboard navigation and key mapping for physical keyboard typing.
   */
  public handleKeyDown(event: KeyboardEvent): void {
    if (event.defaultPrevented) {
      return;
    }

    // Preserve browser shortcuts (e.g. Ctrl+C, Cmd+R) per RULE-UI-004 & DEC-UI-01
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    const key = event.key;

    // Support Enter or Space on focused history item
    const target = event.target as HTMLElement | null;
    const historyItem = target?.closest?.("button");
    if (
      historyItem &&
      historyItem.getAttribute("data-action") === "recallHistory" &&
      (key === "Enter" || key === " ")
    ) {
      event.preventDefault?.();
      const index = historyItem.getAttribute("data-index");
      this.executeAction("recallHistory", index);
      return;
    }

    if (key >= "0" && key <= "9") {
      event.preventDefault?.();
      if (this.isProgrammerOpen) {
        const radix = this.engine.getRadix();
        if (radix === "BIN" && key > "1") {
          return;
        }
        if (radix === "OCT" && key > "7") {
          return;
        }
      }
      this.executeAction("digit", key);
    } else if (key.length === 1 && /^[a-fA-F]$/.test(key)) {
      if (this.isProgrammerOpen && this.engine.getRadix() === "HEX") {
        event.preventDefault?.();
        this.executeAction("digit", key.toUpperCase());
      } else if (key === "c" || key === "C") {
        event.preventDefault?.();
        this.executeAction("clear");
      }
    } else if (key === "(" || key === ")") {
      event.preventDefault?.();
      this.executeAction("paren", key);
    } else if (key === ".") {
      event.preventDefault?.();
      if (this.isProgrammerOpen) {
        return; // Gated out in programmer mode per RULE-PROG-003
      }
      this.executeAction("decimal");
    } else if (key === "&" && this.isProgrammerOpen) {
      event.preventDefault?.();
      this.executeAction("bitwiseAnd");
    } else if (key === "|" && this.isProgrammerOpen) {
      event.preventDefault?.();
      this.executeAction("bitwiseOr");
    } else if (key === "~" && this.isProgrammerOpen) {
      event.preventDefault?.();
      this.executeAction("bitwiseNot");
    } else if (key === "^") {
      event.preventDefault?.();
      if (this.isProgrammerOpen) {
        this.executeAction("bitwiseXor");
      } else {
        this.executeAction("operator", "^");
      }
    } else if (key === "+" || key === "-" || key === "*" || key === "/") {
      event.preventDefault?.();
      this.executeAction("operator", key);
    } else if (key === "Enter" || key === "=") {
      event.preventDefault?.();
      this.executeAction("calculate");
    } else if (key === "Escape" || key === "c" || key === "C") {
      event.preventDefault?.();
      this.executeAction("clear");
    } else if (key === "Delete") {
      event.preventDefault?.();
      this.executeAction("allClear");
    } else if (key === "Backspace") {
      event.preventDefault?.();
      this.executeAction("backspace");
    }
  }

  /**
   * Returns current formula expression string from the underlying engine.
   */
  public getExpression(): string {
    return this.engine.getExpression();
  }

  /**
   * Synchronizes the displayed value and status with the underlying CalcEngine state.
   */
  public updateDisplay(): void {
    const displayVal = this.engine.getDisplay();
    const state: CalcEngineState = this.engine.getState();

    // 1. Slotted custom display support
    if (typeof this.querySelector === "function") {
      const slottedDisplay = this.querySelector('[slot="display"]');
      if (slottedDisplay) {
        const customValue =
          slottedDisplay.querySelector?.("[data-display-value]") || slottedDisplay;
        if (customValue) {
          customValue.textContent = displayVal;
        }
        const customExpr =
          slottedDisplay.querySelector?.("[data-expression-display]") ||
          slottedDisplay.querySelector?.("#expression-display");
        if (customExpr) {
          customExpr.textContent = state.expression;
        }
        if (state.isLocked) {
          slottedDisplay.classList?.add?.("error");
        } else {
          slottedDisplay.classList?.remove?.("error");
        }

        const slottedBadge =
          slottedDisplay.querySelector?.("[data-memory-badge]") ||
          slottedDisplay.querySelector?.("#memory-badge");
        if (slottedBadge) {
          if (state.hasMemory) {
            slottedBadge.classList?.add?.("active");
            if (slottedBadge.style) slottedBadge.style.display = "inline-block";
          } else {
            slottedBadge.classList?.remove?.("active");
            if (slottedBadge.style) slottedBadge.style.display = "none";
          }
        }
      }
    }

    // 2. Default Shadow DOM display card
    if (this.shadowRoot) {
      const valueEl = this.shadowRoot.getElementById("display-value");
      if (valueEl) {
        valueEl.textContent = displayVal;
      }

      const exprEl = this.shadowRoot.getElementById("expression-display");
      if (exprEl) {
        exprEl.textContent = state.expression;
      }

      const cardEl = this.shadowRoot.getElementById("display-card");
      if (cardEl) {
        if (state.isLocked) {
          cardEl.classList.add("error");
        } else {
          cardEl.classList.remove("error");
        }
      }

      const statusEl = this.shadowRoot.getElementById("display-status");
      if (statusEl) {
        if (state.pendingOperator && state.accumulator !== null && !state.isLocked) {
          statusEl.textContent = `${state.accumulator} ${state.pendingOperator}`;
        } else {
          statusEl.textContent = "";
        }
      }

      const memoryBadge = this.shadowRoot.getElementById("memory-badge");
      if (memoryBadge) {
        if (state.hasMemory) {
          memoryBadge.classList.add("active");
          memoryBadge.style.display = "inline-block";
        } else {
          memoryBadge.classList.remove("active");
          memoryBadge.style.display = "none";
        }
      }

      // Update angle mode toggle indicator
      const angleToggle = this.shadowRoot.getElementById("angle-mode-toggle");
      if (angleToggle) {
        angleToggle.textContent = this.engine.getAngleMode();
      }

      // 3. History Drawer synchronization
      const historyList = this.shadowRoot.getElementById("history-list");
      const historyEmpty = this.shadowRoot.getElementById("history-empty");
      const history = this.engine.getHistory();

      if (historyList && historyEmpty) {
        if (history.length === 0) {
          historyEmpty.style.display = "block";
          historyList.style.display = "none";
          historyList.innerHTML = "";
        } else {
          historyEmpty.style.display = "none";
          historyList.style.display = "flex";
          let itemsHtml = "";
          for (let i = 0; i < history.length; i++) {
            const entry = history[i];
            itemsHtml += `<button type="button" class="history-item" data-action="recallHistory" data-index="${i}" role="button" tabindex="0" aria-label="Recall calculation ${entry.expression}">${entry.expression}</button>`;
          }
          historyList.innerHTML = itemsHtml;
        }
      }

      // 4. Programmer Panel synchronization
      const hexValEl = this.shadowRoot.getElementById("radix-val-hex");
      if (hexValEl) hexValEl.textContent = state.multiRadix.hex;
      const decValEl = this.shadowRoot.getElementById("radix-val-dec");
      if (decValEl) decValEl.textContent = state.multiRadix.dec;
      const octValEl = this.shadowRoot.getElementById("radix-val-oct");
      if (octValEl) octValEl.textContent = state.multiRadix.oct;
      const binValEl = this.shadowRoot.getElementById("radix-val-bin");
      if (binValEl) binValEl.textContent = state.multiRadix.bin;

      const radixRows = this.shadowRoot.querySelectorAll(".radix-row");
      radixRows.forEach((row) => {
        const rowRadix = row.getAttribute("data-value");
        if (rowRadix === state.radix) {
          row.classList.add("active");
          row.setAttribute("aria-checked", "true");
        } else {
          row.classList.remove("active");
          row.setAttribute("aria-checked", "false");
        }
      });

      const wordSizeBtn = this.shadowRoot.getElementById("word-size-toggle");
      if (wordSizeBtn) {
        const labels: Record<WordSize, string> = {
          64: "QWORD (64-bit)",
          32: "DWORD (32-bit)",
          16: "WORD (16-bit)",
          8: "BYTE (8-bit)",
        };
        wordSizeBtn.textContent = labels[state.wordSize] || `WORD (${state.wordSize}-bit)`;
      }

      // Keypad gating per active radix & mode (RULE-PROG-003)
      const hexButtons = this.shadowRoot.querySelectorAll(".btn-hex");
      hexButtons.forEach((btn) => {
        (btn as HTMLButtonElement).disabled = !this.isProgrammerOpen || state.radix !== "HEX";
      });

      const keypad = this.shadowRoot.getElementById("keypad-grid");
      if (keypad) {
        const digitButtons = keypad.querySelectorAll('button[data-action="digit"]');
        digitButtons.forEach((btn) => {
          const val = btn.getAttribute("data-value");
          let disabled = false;
          if (this.isProgrammerOpen && val !== null) {
            const d = parseInt(val, 10);
            if (state.radix === "BIN" && d > 1) {
              disabled = true;
            } else if (state.radix === "OCT" && d > 7) {
              disabled = true;
            }
          }
          (btn as HTMLButtonElement).disabled = disabled;
        });

        const decimalBtn = keypad.querySelector('button[data-action="decimal"]');
        if (decimalBtn) {
          (decimalBtn as HTMLButtonElement).disabled = this.isProgrammerOpen;
        }
      }
    }
  }

  /**
   * Returns current display string.
   */
  public getDisplayValue(): string {
    return this.engine.getDisplay();
  }
}

// Register custom element in standard customElements registry
if (typeof customElements !== "undefined" && !customElements.get("stay-calc")) {
  customElements.define("stay-calc", StayCalc);
}
