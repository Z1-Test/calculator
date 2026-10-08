import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { StayCalcApp } from '../../src/components/stay-calc-app.js';
import { StayCalcDisplay } from '../../src/components/stay-calc-display.js';
import { StayCalcHeader } from '../../src/components/stay-calc-header.js';
import { STANDARD_BUTTONS, StayCalcKeypad } from '../../src/components/stay-calc-keypad.js';
import { registerCustomElements } from '../../src/main.js';

describe('Custom Elements UI Suite', () => {
  beforeEach(() => {
    registerCustomElements();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('StayCalcHeader', () => {
    it('renders brand title, mode selector pills, and theme toggle button', () => {
      const header = document.createElement(StayCalcHeader.TAG) as StayCalcHeader;
      document.body.appendChild(header);

      const root = header.shadowRoot;
      expect(root).not.toBeNull();

      const brandTitle = root?.querySelector('.brand-title');
      expect(brandTitle?.textContent?.trim()).toBe('StayCalc');

      const modePills = root?.querySelectorAll('.mode-pill');
      expect(modePills?.length).toBe(3);

      const themeBtn = root?.querySelector('#theme-toggle-btn');
      expect(themeBtn).not.toBeNull();
      expect(themeBtn?.getAttribute('aria-label')).toBeTruthy();
    });

    it('emits mode-change event when mode pill is clicked', () => {
      const header = document.createElement(StayCalcHeader.TAG) as StayCalcHeader;
      document.body.appendChild(header);

      let emittedMode = '';
      header.addEventListener('mode-change', (e) => {
        emittedMode = (e as CustomEvent).detail.mode;
      });

      const sciBtn = header.shadowRoot?.querySelector<HTMLButtonElement>('[data-mode="scientific"]');
      sciBtn?.click();

      expect(emittedMode).toBe('scientific');
    });
  });

  describe('StayCalcDisplay', () => {
    it('renders primary line, secondary line, and accessibility attributes', () => {
      const display = document.createElement(StayCalcDisplay.TAG) as StayCalcDisplay;
      document.body.appendChild(display);

      const root = display.shadowRoot;
      expect(root).not.toBeNull();

      const primary = root?.querySelector('#primary-display');
      expect(primary).not.toBeNull();
      expect(primary?.getAttribute('role')).toBe('status');
      expect(primary?.getAttribute('aria-live')).toBe('polite');
      expect(primary?.getAttribute('aria-atomic')).toBe('true');
      expect(primary?.textContent?.trim()).toBe('0');

      const secondary = root?.querySelector('#secondary-display');
      expect(secondary).not.toBeNull();
    });

    it('updates display values dynamically via updateDisplay()', () => {
      const display = document.createElement(StayCalcDisplay.TAG) as StayCalcDisplay;
      document.body.appendChild(display);

      display.updateDisplay({
        primaryValue: '42',
        secondaryExpression: '20 + 22 =',
        memoryActive: true,
      });

      const primary = display.shadowRoot?.querySelector('#primary-display');
      const secondary = display.shadowRoot?.querySelector('#secondary-display');
      const badge = display.shadowRoot?.querySelector('.memory-badge');

      expect(primary?.textContent?.trim()).toBe('42');
      expect(secondary?.textContent?.trim()).toBe('20 + 22 =');
      expect(badge?.getAttribute('aria-hidden')).toBe('false');
    });
  });

  describe('StayCalcKeypad', () => {
    it('renders all 19 standard arithmetic buttons with accessible labels', () => {
      const keypad = document.createElement(StayCalcKeypad.TAG) as StayCalcKeypad;
      document.body.appendChild(keypad);

      const root = keypad.shadowRoot;
      const buttons = root?.querySelectorAll('.calc-key');
      expect(buttons?.length).toBe(STANDARD_BUTTONS.length);

      buttons?.forEach((btn) => {
        expect(btn.getAttribute('aria-label')).toBeTruthy();
        expect(btn.getAttribute('type')).toBe('button');
      });
    });

    it('dispatches calc-input custom event when digit button is clicked', () => {
      const keypad = document.createElement(StayCalcKeypad.TAG) as StayCalcKeypad;
      document.body.appendChild(keypad);

      let inputValue = '';
      keypad.addEventListener('calc-input', (e) => {
        inputValue = (e as CustomEvent).detail.value;
      });

      const btn7 = keypad.shadowRoot?.querySelector<HTMLButtonElement>('#btn-7');
      btn7?.click();

      expect(inputValue).toBe('7');
    });

    it('dispatches calc-action custom event when operator button is clicked', () => {
      const keypad = document.createElement(StayCalcKeypad.TAG) as StayCalcKeypad;
      document.body.appendChild(keypad);

      let actionValue = '';
      keypad.addEventListener('calc-action', (e) => {
        actionValue = (e as CustomEvent).detail.action;
      });

      const btnAdd = keypad.shadowRoot?.querySelector<HTMLButtonElement>('#btn-add');
      btnAdd?.click();

      expect(actionValue).toBe('add');
    });

    it('dispatches calc-clear custom event when C button is clicked', () => {
      const keypad = document.createElement(StayCalcKeypad.TAG) as StayCalcKeypad;
      document.body.appendChild(keypad);

      let cleared = false;
      keypad.addEventListener('calc-clear', () => {
        cleared = true;
      });

      const btnClear = keypad.shadowRoot?.querySelector<HTMLButtonElement>('#btn-clear');
      btnClear?.click();

      expect(cleared).toBe(true);
    });
  });

  describe('StayCalcApp Shell Integration', () => {
    it('mounts complete calculator hierarchy and executes basic addition', () => {
      const app = document.createElement(StayCalcApp.TAG) as StayCalcApp;
      document.body.appendChild(app);

      const root = app.shadowRoot;
      expect(root?.querySelector(StayCalcHeader.TAG)).not.toBeNull();
      expect(root?.querySelector(StayCalcDisplay.TAG)).not.toBeNull();
      expect(root?.querySelector(StayCalcKeypad.TAG)).not.toBeNull();

      // Simulate input sequence: 5 + 3 =
      app.handleInput('5');
      expect(app.getDisplay()?.getPrimaryValue()).toBe('5');

      app.handleAction('add');
      expect(app.getDisplay()?.getSecondaryExpression()).toBe('5 +');

      app.handleInput('3');
      expect(app.getDisplay()?.getPrimaryValue()).toBe('3');

      app.handleAction('equals');
      expect(app.getDisplay()?.getPrimaryValue()).toBe('8');
      expect(app.getDisplay()?.getSecondaryExpression()).toBe('5 + 3 =');
    });

    it('handles decimal input preventing duplicate points', () => {
      const app = document.createElement(StayCalcApp.TAG) as StayCalcApp;
      document.body.appendChild(app);

      app.handleInput('3');
      app.handleInput('.');
      app.handleInput('1');
      app.handleInput('.');
      app.handleInput('4');

      expect(app.getDisplay()?.getPrimaryValue()).toBe('3.14');
    });

    it('handles negation and percentage actions', () => {
      const app = document.createElement(StayCalcApp.TAG) as StayCalcApp;
      document.body.appendChild(app);

      app.handleInput('50');
      app.handleAction('negate');
      expect(app.getDisplay()?.getPrimaryValue()).toBe('-50');

      app.handleAction('negate');
      expect(app.getDisplay()?.getPrimaryValue()).toBe('50');

      app.handleAction('percent');
      expect(app.getDisplay()?.getPrimaryValue()).toBe('0.5');
    });

    it('handles clear and keyboard interactions', () => {
      const app = document.createElement(StayCalcApp.TAG) as StayCalcApp;
      document.body.appendChild(app);

      app.handleInput('9');
      app.handleClear(true);
      expect(app.getDisplay()?.getPrimaryValue()).toBe('0');

      // Test keyboard dispatch
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '7' }));
      expect(app.getDisplay()?.getPrimaryValue()).toBe('7');

      window.dispatchEvent(new KeyboardEvent('keydown', { key: '+' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '2' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

      expect(app.getDisplay()?.getPrimaryValue()).toBe('9');
    });
  });
});
