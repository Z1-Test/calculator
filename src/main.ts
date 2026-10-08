import './theme/tokens.css';
import { StayCalcApp } from './components/stay-calc-app.js';
import { StayCalcDisplay } from './components/stay-calc-display.js';
import { StayCalcHeader } from './components/stay-calc-header.js';
import { StayCalcKeypad } from './components/stay-calc-keypad.js';
import { ThemeManager } from './theme/theme-manager.js';

export function registerCustomElements(): void {
  if (typeof customElements === 'undefined') return;

  if (!customElements.get(StayCalcHeader.TAG)) {
    customElements.define(StayCalcHeader.TAG, StayCalcHeader);
  }

  if (!customElements.get(StayCalcDisplay.TAG)) {
    customElements.define(StayCalcDisplay.TAG, StayCalcDisplay);
  }

  if (!customElements.get(StayCalcKeypad.TAG)) {
    customElements.define(StayCalcKeypad.TAG, StayCalcKeypad);
  }

  if (!customElements.get(StayCalcApp.TAG)) {
    customElements.define(StayCalcApp.TAG, StayCalcApp);
  }
}

// Auto-register elements and initialize theme manager in browser environment
if (typeof window !== 'undefined') {
  ThemeManager.getInstance().init();
  registerCustomElements();
}

export {
  StayCalcApp,
  StayCalcDisplay,
  StayCalcHeader,
  StayCalcKeypad,
  ThemeManager,
};
