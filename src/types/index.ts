export type ThemeMode = 'light' | 'dark' | 'system';
export type ActiveTheme = 'light' | 'dark';
export type CalcMode = 'standard' | 'scientific' | 'programmer';

export type KeypadKeyType = 'digit' | 'operator' | 'action' | 'function';

export interface KeypadButtonConfig {
  id: string;
  label: string;
  value?: string;
  action?: string;
  type: KeypadKeyType;
  ariaLabel: string;
  gridSpan?: number;
  variant?: 'primary' | 'secondary' | 'surface' | 'accent';
}

export interface CalcDisplayState {
  primaryValue: string;
  secondaryExpression: string;
  memoryActive: boolean;
  hasError: boolean;
}

export interface CalcInputDetail {
  value: string;
}

export interface CalcActionDetail {
  action: string;
}

export interface CalcClearDetail {
  all?: boolean;
}

export interface ThemeChangeDetail {
  theme: ActiveTheme;
  mode: ThemeMode;
}
