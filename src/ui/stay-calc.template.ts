/**
 * Declarative Shadow DOM (DSD) template for <stay-calc>.
 * Implements accessible keypad grid, display readout, and polite ARIA live region.
 * Satisfies RULE-UI-001, RULE-UI-006.
 */
import { stayCalcStyles } from "./stay-calc.styles.ts";

export function renderStayCalcTemplate(): string {
  return `
<style>${stayCalcStyles}</style>
<div class="calc-shell" part="shell">
  <div class="calc-header" part="header">
    <slot name="header"></slot>
  </div>
  <div class="calc-display-wrapper" part="display-wrapper">
    <slot name="display">
      <div
        id="display"
        class="calc-display"
        part="display"
        role="textbox"
        aria-readonly="true"
        aria-label="Calculator display"
      >0</div>
    </slot>
  </div>
  <div
    id="status"
    class="calc-status sr-only"
    part="status"
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >0</div>
  <div class="calc-keypad" part="keypad" role="group" aria-label="Calculator keypad">
    <slot name="keypad">
      <!-- Row 1 -->
      <button type="button" class="calc-btn calc-btn-secondary" data-action="all-clear" aria-label="All clear">AC</button>
      <button type="button" class="calc-btn calc-btn-secondary" data-action="clear" aria-label="Clear entry">C</button>
      <button type="button" class="calc-btn calc-btn-secondary" data-action="toggle-sign" aria-label="Toggle sign">+/-</button>
      <button type="button" class="calc-btn calc-btn-operator" data-operator="/" aria-label="Divide">÷</button>

      <!-- Row 2 -->
      <button type="button" class="calc-btn calc-btn-digit" data-digit="7" aria-label="Digit 7">7</button>
      <button type="button" class="calc-btn calc-btn-digit" data-digit="8" aria-label="Digit 8">8</button>
      <button type="button" class="calc-btn calc-btn-digit" data-digit="9" aria-label="Digit 9">9</button>
      <button type="button" class="calc-btn calc-btn-operator" data-operator="*" aria-label="Multiply">×</button>

      <!-- Row 3 -->
      <button type="button" class="calc-btn calc-btn-digit" data-digit="4" aria-label="Digit 4">4</button>
      <button type="button" class="calc-btn calc-btn-digit" data-digit="5" aria-label="Digit 5">5</button>
      <button type="button" class="calc-btn calc-btn-digit" data-digit="6" aria-label="Digit 6">6</button>
      <button type="button" class="calc-btn calc-btn-operator" data-operator="-" aria-label="Subtract">-</button>

      <!-- Row 4 -->
      <button type="button" class="calc-btn calc-btn-digit" data-digit="1" aria-label="Digit 1">1</button>
      <button type="button" class="calc-btn calc-btn-digit" data-digit="2" aria-label="Digit 2">2</button>
      <button type="button" class="calc-btn calc-btn-digit" data-digit="3" aria-label="Digit 3">3</button>
      <button type="button" class="calc-btn calc-btn-operator" data-operator="+" aria-label="Add">+</button>

      <!-- Row 5 -->
      <button type="button" class="calc-btn calc-btn-digit calc-btn-zero" data-digit="0" aria-label="Digit 0">0</button>
      <button type="button" class="calc-btn calc-btn-digit" data-action="decimal" aria-label="Decimal point">.</button>
      <button type="button" class="calc-btn calc-btn-action" data-action="percent" aria-label="Percent">%</button>
      <button type="button" class="calc-btn calc-btn-primary" data-action="equals" aria-label="Equals">=</button>
    </slot>
  </div>
  <div class="calc-footer" part="footer">
    <slot name="footer"></slot>
  </div>
</div>
`.trim();
}
