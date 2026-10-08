import type { ActiveTheme, ThemeChangeDetail, ThemeMode } from '../types/index.js';

export const THEME_STORAGE_KEY = 'staycalc_theme';

export class ThemeManager {
  private static instance: ThemeManager | null = null;
  private currentMode: ThemeMode = 'system';
  private mediaQueryList: MediaQueryList | null = null;
  private inMemoryFallbackMode: ThemeMode = 'system';

  private constructor() {
    this.init();
  }

  public static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  public init(): void {
    if (typeof window === 'undefined') return;

    this.currentMode = this.readStorageMode();

    if (typeof window.matchMedia === 'function') {
      this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
      this.mediaQueryList.addEventListener('change', this.handleSystemMediaChange);
    }

    this.applyTheme(this.currentMode, false);
  }

  public getMode(): ThemeMode {
    return this.currentMode;
  }

  public getActiveTheme(): ActiveTheme {
    return this.resolveActiveTheme(this.currentMode);
  }

  public setMode(mode: ThemeMode): void {
    this.applyTheme(mode, true);
  }

  public toggle(): ActiveTheme {
    const active = this.getActiveTheme();
    const nextMode: ThemeMode = active === 'dark' ? 'light' : 'dark';
    this.setMode(nextMode);
    return this.getActiveTheme();
  }

  private resolveActiveTheme(mode: ThemeMode): ActiveTheme {
    if (mode === 'light' || mode === 'dark') {
      return mode;
    }
    return this.getSystemPreference();
  }

  private getSystemPreference(): ActiveTheme {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }

  private applyTheme(mode: ThemeMode, persist = true): void {
    this.currentMode = mode;
    const activeTheme = this.resolveActiveTheme(mode);

    if (typeof document !== 'undefined' && document.documentElement) {
      if (mode === 'system') {
        document.documentElement.setAttribute('data-theme', activeTheme);
      } else {
        document.documentElement.setAttribute('data-theme', mode);
      }
    }

    if (persist) {
      this.writeStorageMode(mode);
    }

    this.notifyThemeChange(activeTheme, mode);
  }

  private handleSystemMediaChange = (): void => {
    if (this.currentMode === 'system') {
      const active = this.getSystemPreference();
      if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.setAttribute('data-theme', active);
      }
      this.notifyThemeChange(active, 'system');
    }
  };

  private notifyThemeChange(theme: ActiveTheme, mode: ThemeMode): void {
    if (typeof window !== 'undefined') {
      const detail: ThemeChangeDetail = { theme, mode };
      window.dispatchEvent(new CustomEvent('theme-changed', { detail }));
    }
  }

  private readStorageMode(): ThemeMode {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          return stored;
        }
      }
    } catch {
      // Storage access blocked (private mode or sandbox)
      return this.inMemoryFallbackMode;
    }
    return 'system';
  }

  private writeStorageMode(mode: ThemeMode): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(THEME_STORAGE_KEY, mode);
      }
    } catch {
      // Fallback for sandboxed storage
      this.inMemoryFallbackMode = mode;
    }
  }

  public destroy(): void {
    if (this.mediaQueryList) {
      this.mediaQueryList.removeEventListener('change', this.handleSystemMediaChange);
      this.mediaQueryList = null;
    }
    ThemeManager.instance = null;
  }
}
