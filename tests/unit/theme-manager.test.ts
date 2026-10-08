import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { THEME_STORAGE_KEY, ThemeManager } from '../../src/theme/theme-manager.js';

describe('ThemeManager', () => {
  let themeManager: ThemeManager;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    themeManager = ThemeManager.getInstance();
    themeManager.init();
  });

  afterEach(() => {
    themeManager.destroy();
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    vi.restoreAllMocks();
  });

  it('initializes with system mode by default and applies theme attribute', () => {
    expect(themeManager.getMode()).toBe('system');
    const attr = document.documentElement.getAttribute('data-theme');
    expect(attr === 'light' || attr === 'dark').toBe(true);
  });

  it('sets mode to dark and persists to localStorage', () => {
    themeManager.setMode('dark');
    expect(themeManager.getMode()).toBe('dark');
    expect(themeManager.getActiveTheme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('sets mode to light and persists to localStorage', () => {
    themeManager.setMode('light');
    expect(themeManager.getMode()).toBe('light');
    expect(themeManager.getActiveTheme()).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('toggles theme between dark and light', () => {
    themeManager.setMode('light');
    const toggled = themeManager.toggle();
    expect(toggled).toBe('dark');
    expect(themeManager.getActiveTheme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    const toggledAgain = themeManager.toggle();
    expect(toggledAgain).toBe('light');
    expect(themeManager.getActiveTheme()).toBe('light');
  });

  it('dispatches theme-changed event on window', () => {
    const handler = vi.fn();
    window.addEventListener('theme-changed', handler);

    themeManager.setMode('dark');
    expect(handler).toHaveBeenCalled();
    const event = handler.mock.calls[0][0] as CustomEvent;
    expect(event.detail.theme).toBe('dark');
    expect(event.detail.mode).toBe('dark');

    window.removeEventListener('theme-changed', handler);
  });

  it('handles localStorage throwing SecurityError gracefully', () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError: Access denied');
    });
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('SecurityError: Access denied');
    });

    themeManager.destroy();
    const safeManager = ThemeManager.getInstance();
    expect(() => safeManager.setMode('dark')).not.toThrow();
    expect(safeManager.getActiveTheme()).toBe('dark');

    getItemSpy.mockRestore();
    setItemSpy.mockRestore();
  });
});
