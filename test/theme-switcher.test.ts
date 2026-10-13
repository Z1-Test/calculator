import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ThemeController } from '../src/components/theme-controller.ts';
import { setupMockDom } from './test-dom-helper.ts';

setupMockDom();
const { StayCalcElement } = await import('../src/components/stay-calc.ts');

describe('Dynamic Visual Theme Switcher Tests (F8)', () => {
  test('CASE-F8-001: Initial default theme is "light"', () => {
    const controller = new ThemeController();
    assert.equal(controller.getTheme(), 'light');
    assert.equal(controller.getLabel(), '☀️ Light');
  });

  test('CASE-F8-002: Cycle sequence transitions light -> dark -> oled -> light', () => {
    const controller = new ThemeController();
    assert.equal(controller.cycle(), 'dark');
    assert.equal(controller.getLabel(), '🌙 Dark');

    assert.equal(controller.cycle(), 'oled');
    assert.equal(controller.getLabel(), '⚡ OLED');

    assert.equal(controller.cycle(), 'light');
    assert.equal(controller.getLabel(), '☀️ Light');
  });

  test('CASE-F8-003: Direct theme set to "dark"', () => {
    const controller = new ThemeController();
    controller.setTheme('dark');
    assert.equal(controller.getTheme(), 'dark');
  });

  test('CASE-F8-004: Direct theme set to "oled"', () => {
    const controller = new ThemeController();
    controller.setTheme('oled');
    assert.equal(controller.getTheme(), 'oled');
  });

  test('CASE-F8-005: Invalid theme fallback returns "light"', () => {
    const controller = new ThemeController();
    controller.setTheme('neon-cyberpunk');
    assert.equal(controller.getTheme(), 'light');
  });

  test('CASE-F8-006: Host data-theme attribute reflection in component', () => {
    const calc = new StayCalcElement();
    calc.connectedCallback();

    assert.equal((calc as any).getAttribute('data-theme'), 'light');

    calc.setTheme('dark');
    assert.equal((calc as any).getAttribute('data-theme'), 'dark');

    calc.setTheme('oled');
    assert.equal((calc as any).getAttribute('data-theme'), 'oled');
  });

  test('CASE-F8-007: Custom event dispatch on theme change', () => {
    const calc = new StayCalcElement();
    calc.connectedCallback();

    let receivedTheme = '';
    (calc as any).addEventListener('theme-change', (e: any) => {
      receivedTheme = e.detail?.theme;
    });

    calc.setTheme('dark');
    assert.equal(receivedTheme, 'dark');

    calc.cycleTheme();
    assert.equal(receivedTheme, 'oled');
  });

  test('CASE-F8-008: Standalone ThemeController constructor initialization', () => {
    const darkCtrl = new ThemeController('dark');
    assert.equal(darkCtrl.getTheme(), 'dark');

    const oledCtrl = new ThemeController('oled');
    assert.equal(oledCtrl.getTheme(), 'oled');
  });

  test('CASE-F8-009: Theme toggle button text synchronization in shadow root', () => {
    const calc = new StayCalcElement();
    calc.connectedCallback();

    const btn = (calc as any).shadowRoot.getElementById('btn-toggle-theme');
    assert.ok(btn, 'Theme toggle button must exist');
    assert.equal(btn.textContent, '☀️ Light');

    calc.cycleTheme();
    assert.equal(btn.textContent, '🌙 Dark');

    calc.cycleTheme();
    assert.equal(btn.textContent, '⚡ OLED');
  });

  test('CASE-F8-010: Dark mode CSS token definition present in component template', () => {
    const calc = new StayCalcElement();
    calc.connectedCallback();

    const shadow = (calc as any).shadowRoot;
    assert.ok(shadow.innerHTML.includes(':host([data-theme="dark"])'));
    assert.ok(shadow.innerHTML.includes('--calc-surface: #18181b;'));
  });

  test('CASE-F8-011: OLED mode CSS token definition present in component template', () => {
    const calc = new StayCalcElement();
    calc.connectedCallback();

    const shadow = (calc as any).shadowRoot;
    assert.ok(shadow.innerHTML.includes(':host([data-theme="oled"])'));
    assert.ok(shadow.innerHTML.includes('--calc-surface: #000000;'));
  });
});
