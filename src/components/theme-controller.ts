export type ThemeMode = 'light' | 'dark' | 'oled';

export const VALID_THEMES: ReadonlyArray<ThemeMode> = ['light', 'dark', 'oled'];

export class ThemeController {
  private currentTheme: ThemeMode = 'light';

  constructor(initialTheme?: string) {
    if (initialTheme) {
      this.setTheme(initialTheme);
    }
  }

  public getTheme(): ThemeMode {
    return this.currentTheme;
  }

  public setTheme(theme: string): ThemeMode {
    if (theme === 'dark' || theme === 'oled' || theme === 'light') {
      this.currentTheme = theme;
    } else {
      this.currentTheme = 'light';
    }
    return this.currentTheme;
  }

  public cycle(): ThemeMode {
    if (this.currentTheme === 'light') {
      this.currentTheme = 'dark';
    } else if (this.currentTheme === 'dark') {
      this.currentTheme = 'oled';
    } else {
      this.currentTheme = 'light';
    }
    return this.currentTheme;
  }

  public getLabel(theme?: ThemeMode): string {
    const target = theme || this.currentTheme;
    switch (target) {
      case 'dark':
        return '🌙 Dark';
      case 'oled':
        return '⚡ OLED';
      case 'light':
      default:
        return '☀️ Light';
    }
  }
}
