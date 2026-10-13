/**
 * StayCalc Precision Arithmetic Engine
 * Pure ES Module with zero external runtime dependencies.
 * Adheres strictly to the Calculator Behavioral Contract Table.
 */

export type Operator = '+' | '-' | '*' | '/' | '^' | null;

export interface EngineState {
  display: string;
  accumulator: number | null;
  pendingOperator: Operator;
  waitingForOperand: boolean;
  hasError: boolean;
  errorMessage: string | null;
  lastExpression: string | null;
}

export function normalizePrecision(n: number): number {
  if (!Number.isFinite(n)) return n;
  return Number(parseFloat(n.toPrecision(12)));
}

export function formatDisplay(val: number | string): string {
  if (typeof val === 'string') return val;
  if (!Number.isFinite(val)) return 'Error';
  const norm = normalizePrecision(val);
  const str = norm.toString();
  if (str.length <= 10) return str;
  if (Math.abs(norm) >= 1e10 || (Math.abs(norm) < 1e-6 && norm !== 0)) {
    return norm.toExponential(4);
  }
  return Number(norm.toPrecision(10)).toString();
}

export class CalcEngine {
  private state: EngineState;

  constructor() {
    this.state = this.initialState();
  }

  private initialState(): EngineState {
    return {
      display: '0',
      accumulator: null,
      pendingOperator: null,
      waitingForOperand: false,
      hasError: false,
      errorMessage: null,
      lastExpression: null,
    };
  }

  public getState(): Readonly<EngineState> {
    return { ...this.state };
  }

  public inputDigit(digit: string): Readonly<EngineState> {
    if (this.state.hasError) return this.getState();
    if (!/^[0-9]$/.test(digit)) return this.getState();

    if (this.state.waitingForOperand) {
      this.state.display = digit;
      this.state.waitingForOperand = false;
    } else {
      if (this.state.display === '0') {
        this.state.display = digit;
      } else if (this.state.display === '-0') {
        this.state.display = '-' + digit;
      } else {
        if (this.state.display.replace('-', '').replace('.', '').length < 12) {
          this.state.display += digit;
        }
      }
    }
    return this.getState();
  }

  public inputDecimal(): Readonly<EngineState> {
    if (this.state.hasError) return this.getState();

    if (this.state.waitingForOperand) {
      this.state.display = '0.';
      this.state.waitingForOperand = false;
      return this.getState();
    }

    if (!this.state.display.includes('.')) {
      this.state.display += '.';
    }
    return this.getState();
  }

  public inputOperator(op: '+' | '-' | '*' | '/' | '^'): Readonly<EngineState> {
    if (this.state.hasError) return this.getState();

    const inputValue = parseFloat(this.state.display);

    // Operator replacement when an operator is pressed sequentially
    if (this.state.waitingForOperand && this.state.accumulator !== null) {
      this.state.pendingOperator = op;
      return this.getState();
    }

    if (this.state.accumulator === null) {
      this.state.accumulator = inputValue;
    } else if (this.state.pendingOperator) {
      const result = this.executeMath(this.state.accumulator, inputValue, this.state.pendingOperator);
      if (this.state.hasError) return this.getState();
      this.state.display = formatDisplay(result);
      this.state.accumulator = result;
    }

    this.state.pendingOperator = op;
    this.state.waitingForOperand = true;
    return this.getState();
  }

  public calculate(): Readonly<EngineState> {
    if (this.state.hasError) return this.getState();
    if (this.state.accumulator === null || this.state.pendingOperator === null) {
      return this.getState();
    }

    const currentOperand = parseFloat(this.state.display);
    const op = this.state.pendingOperator;
    const acc = this.state.accumulator;

    const result = this.executeMath(acc, currentOperand, op);
    if (this.state.hasError) return this.getState();

    this.state.lastExpression = `${formatDisplay(acc)} ${op} ${formatDisplay(currentOperand)} = ${formatDisplay(result)}`;
    this.state.display = formatDisplay(result);
    this.state.accumulator = null;
    this.state.pendingOperator = null;
    this.state.waitingForOperand = true;

    return this.getState();
  }

  public clearEntry(): Readonly<EngineState> {
    if (this.state.hasError) {
      return this.allClear();
    }
    this.state.display = '0';
    this.state.waitingForOperand = true;
    return this.getState();
  }

  public allClear(): Readonly<EngineState> {
    this.state = this.initialState();
    return this.getState();
  }

  public toggleSign(): Readonly<EngineState> {
    if (this.state.hasError) return this.getState();
    if (this.state.display === '0') {
      this.state.display = '-0';
      return this.getState();
    }
    if (this.state.display === '-0') {
      this.state.display = '0';
      return this.getState();
    }
    if (this.state.display.startsWith('-')) {
      this.state.display = this.state.display.slice(1);
    } else {
      this.state.display = '-' + this.state.display;
    }
    return this.getState();
  }

  public percentage(): Readonly<EngineState> {
    if (this.state.hasError) return this.getState();
    const current = parseFloat(this.state.display);

    if (this.state.accumulator !== null && (this.state.pendingOperator === '+' || this.state.pendingOperator === '-')) {
      const percentVal = normalizePrecision((this.state.accumulator * current) / 100);
      this.state.display = formatDisplay(percentVal);
    } else {
      const res = normalizePrecision(current / 100);
      this.state.display = formatDisplay(res);
    }
    return this.getState();
  }

  public setDisplayValue(value: string): Readonly<EngineState> {
    if (this.state.hasError) return this.getState();
    this.state.display = value;
    this.state.waitingForOperand = false;
    return this.getState();
  }

  public setError(msg: string): Readonly<EngineState> {
    this.state.hasError = true;
    this.state.errorMessage = msg;
    this.state.display = msg;
    this.state.accumulator = null;
    this.state.pendingOperator = null;
    this.state.waitingForOperand = true;
    return this.getState();
  }

  private executeMath(a: number, b: number, op: '+' | '-' | '*' | '/' | '^'): number {
    let raw = 0;
    switch (op) {
      case '+':
        raw = a + b;
        break;
      case '-':
        raw = a - b;
        break;
      case '*':
        raw = a * b;
        break;
      case '^':
        raw = Math.pow(a, b);
        break;
      case '/':
        if (b === 0) {
          this.state.hasError = true;
          this.state.errorMessage = 'Cannot divide by zero';
          this.state.display = 'Cannot divide by zero';
          this.state.accumulator = null;
          this.state.pendingOperator = null;
          this.state.waitingForOperand = true;
          return 0;
        }
        raw = a / b;
        break;
    }
    return normalizePrecision(raw);
  }
}
