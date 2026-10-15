import type {
  AngleMode,
  CalcEngineState,
  CalculationRecord,
  MultiRadixState,
  Operator,
  RadixBase,
  WordSize,
} from "./types.ts";

/**
 * Truncates and normalizes IEEE-754 binary floating-point representation noise
 * to a clean fixed precision of up to 10 decimal digits per RULE-CALC-002.
 */
export function normalizePrecision(val: number): number {
  if (Object.is(val, -0) || val === 0) {
    return 0;
  }
  return parseFloat(Number(val).toFixed(10));
}

/**
 * Core precision arithmetic engine for StayCalc.
 *
 * Implements immediate left-to-right pocket calculator execution,
 * decimal precision normalization eliminating IEEE-754 float bugs (0.1 + 0.2 = 0.3),
 * division-by-zero error locking, consecutive operator replacement,
 * multi-radix integer representation (HEX, DEC, OCT, BIN), bitwise operations,
 * selectable word sizes (8, 16, 32, 64-bit), active keypad gating,
 * and Clear (C) vs All Clear (AC) register reset semantics.
 */
export class CalcEngine {
  private accumulator: number | null = null;
  private currentBuffer: string = "0";
  private pendingOperator: Operator | null = null;
  private isWaitingForOperand: boolean = false;
  private isLocked: boolean = false;
  private errorMessage: string | null = null;
  private memory: number = 0;
  private static readonly MAX_HISTORY: number = 50;
  private history: CalculationRecord[] = [];
  private angleMode: AngleMode = "DEG";
  private radix: RadixBase = "DEC";
  private wordSize: WordSize = 64;
  private isProgrammerMode: boolean = false;
  private programmerAccumulator: bigint | null = null;
  private expression: string = "";
  private parenDepth: number = 0;

  /**
   * Appends a numeric or hexadecimal digit to the active input buffer and expression.
   * If the engine is locked by an arithmetic error or the character is invalid
   * for the active radix base, input is rejected per RULE-PROG-003.
   */
  public inputDigit(digit: string): void {
    if (this.isLocked) {
      return;
    }

    if (this.isProgrammerMode) {
      const normalized = digit.toUpperCase();
      let isValid = false;
      let maxLen = 20;

      switch (this.radix) {
        case "HEX":
          isValid = /^[0-9A-F]$/.test(normalized);
          maxLen = 16;
          break;
        case "OCT":
          isValid = /^[0-7]$/.test(normalized);
          maxLen = 22;
          break;
        case "BIN":
          isValid = /^[01]$/.test(normalized);
          maxLen = 64;
          break;
        case "DEC":
        default:
          isValid = /^[0-9]$/.test(normalized);
          maxLen = 20;
          break;
      }

      if (!isValid) {
        return;
      }

      if (this.isWaitingForOperand) {
        this.currentBuffer = normalized;
        this.isWaitingForOperand = false;
      } else {
        if (this.currentBuffer === "0") {
          this.currentBuffer = normalized;
        } else if (this.currentBuffer.length < maxLen) {
          this.currentBuffer += normalized;
        }
      }
      return;
    }

    if (!/^[0-9]$/.test(digit)) {
      return;
    }

    // Reset expression if previous calculation completed with '='
    if (this.expression.includes("=")) {
      this.expression = "";
    }

    if (this.isWaitingForOperand) {
      this.currentBuffer = digit;
      this.isWaitingForOperand = false;
      if (this.expression === "" || this.expression === "0") {
        this.expression = digit;
      } else {
        this.expression += digit;
      }
    } else {
      if (this.currentBuffer === "0") {
        this.currentBuffer = digit;
        if (this.expression === "" || this.expression === "0") {
          this.expression = digit;
        } else if (this.expression.endsWith(" 0")) {
          this.expression = this.expression.slice(0, -1) + digit;
        } else if (this.expression.endsWith("(0")) {
          this.expression = this.expression.slice(0, -1) + digit;
        } else {
          this.expression += digit;
        }
      } else {
        // Enforce maximum buffer length of 16 significant digits
        if (this.currentBuffer.replace(".", "").length < 16) {
          this.currentBuffer += digit;
          this.expression += digit;
        }
      }
    }
  }

  /**
   * Appends a decimal point to the active buffer and expression.
   * Ignores redundant decimal points if one already exists in the buffer.
   * Disabled in Programmer Mode per RULE-PROG-003.
   */
  public inputDecimal(): void {
    if (this.isLocked || this.isProgrammerMode) {
      return;
    }

    if (this.expression.includes("=")) {
      this.expression = "";
    }

    if (this.isWaitingForOperand) {
      this.currentBuffer = "0.";
      this.isWaitingForOperand = false;
      this.expression += (this.expression === "" || this.expression.endsWith(" ") || this.expression.endsWith("(")) ? "0." : ".";
    } else if (!this.currentBuffer.includes(".")) {
      this.currentBuffer += ".";
      this.expression += ".";
    }
  }

  /**
   * Removes the last entered character from the active buffer and expression.
   * If the buffer only contains a single character or is waiting for an operand,
   * resets the buffer back to "0".
   */
  public backspace(): void {
    if (this.isLocked) {
      return;
    }

    if (this.isWaitingForOperand) {
      if (this.expression.endsWith("(")) {
        this.expression = this.expression.slice(0, -1);
        this.parenDepth = Math.max(0, this.parenDepth - 1);
        this.isWaitingForOperand = false;
      }
      return;
    }

    if (this.currentBuffer.length > 1) {
      this.currentBuffer = this.currentBuffer.slice(0, -1);
      if (this.currentBuffer === "-" || this.currentBuffer === "") {
        this.currentBuffer = "0";
      }
    } else {
      this.currentBuffer = "0";
    }

    if (this.expression.length > 0) {
      const lastChar = this.expression[this.expression.length - 1];
      if (lastChar === "(") {
        this.parenDepth = Math.max(0, this.parenDepth - 1);
      } else if (lastChar === ")") {
        this.parenDepth++;
      }
      this.expression = this.expression.slice(0, -1);
    }
  }

  /**
   * Appends an opening or closing parenthesis to the formula expression.
   * Enforces nesting depth invariants and rejects unbalanced closing parentheses.
   */
  public inputParenthesis(paren: "(" | ")"): void {
    if (this.isLocked) {
      return;
    }

    if (this.expression.includes("=")) {
      this.expression = "";
    }

    if (paren === "(") {
      if (!this.isWaitingForOperand && this.currentBuffer !== "0" && this.expression !== "") {
        this.expression += " * (";
      } else if (this.expression === "" || this.expression === "0") {
        this.expression = "(";
      } else {
        this.expression += "(";
      }
      this.parenDepth++;
      this.currentBuffer = "0";
      this.isWaitingForOperand = true;
    } else if (paren === ")") {
      // Reject closing paren if parenDepth is 0 per DEC-EXPR-01
      if (this.parenDepth === 0) {
        return;
      }

      this.expression += ")";
      this.parenDepth--;
      this.isWaitingForOperand = false;

      // Provide live sub-expression evaluation preview in buffer if parseable
      try {
        const preview = this.evaluateExpression(this.expression);
        this.currentBuffer = String(preview);
      } catch {
        // preserve currentBuffer
      }
    }
  }

  /**
   * Returns the ongoing formula expression string suitable for display.
   */
  public getExpression(): string {
    return this.expression;
  }

  /**
   * Ingests an arithmetic or bitwise operator (+, -, *, /, ^, &, |, XOR, etc.).
   *
   * In immediate execution mode:
   * - If an operator was already entered and no new digits followed,
   *   the new operator replaces the pending operator (e.g. 5 + * 2 -> 5 * 2).
   * - Otherwise, evaluates any pending operation immediately left-to-right
   *   when not nested inside parentheses.
   */
  public inputOperator(operator: Operator): void {
    if (this.isLocked) {
      return;
    }

    // Reset expression if previous calculation completed
    if (this.expression.includes("=")) {
      this.expression = `${this.currentBuffer} ${operator} `;
      this.pendingOperator = operator;
      this.accumulator = this.parseBuffer();
      this.isWaitingForOperand = true;
      return;
    }

    // Consecutive operator replacement per RULE-CALC-007
    if (this.pendingOperator !== null && this.isWaitingForOperand && !this.expression.endsWith("(")) {
      this.pendingOperator = operator;
      this.expression = this.expression.replace(/[\+\-\*\/\^]\s*$/, `${operator} `);
      return;
    }

    // Append operator to expression
    if (this.expression === "" || this.expression === "0") {
      this.expression = `${this.currentBuffer} ${operator} `;
    } else {
      this.expression += ` ${operator} `;
    }

    // When inside parentheses or expression contains parens, do not prematurely collapse
    if (this.parenDepth > 0 || this.expression.includes("(") || this.expression.includes(")")) {
      this.pendingOperator = operator;
      this.isWaitingForOperand = true;
      return;
    }

    const isBitwiseOp =
      operator === "&" ||
      operator === "|" ||
      operator === "XOR" ||
      operator === "LSH" ||
      operator === "RSH" ||
      operator === "<<" ||
      operator === ">>";

    if (this.isProgrammerMode || isBitwiseOp) {
      const currentOperand = this.parseBufferBigInt();
      if (this.programmerAccumulator === null) {
        this.programmerAccumulator = currentOperand;
        this.accumulator = Number(BigInt.asIntN(53, currentOperand));
      } else if (this.pendingOperator !== null) {
        if (this.pendingOperator === "/" && currentOperand === 0n) {
          this.setDivisionByZeroError();
          return;
        }
        const op1 = this.programmerAccumulator;
        const op = this.pendingOperator;
        const result = this.executeProgrammerMath(op1, op, currentOperand);
        this.programmerAccumulator = result;
        this.accumulator = Number(BigInt.asIntN(53, result));
        this.currentBuffer = this.formatValueForRadix(result, this.radix);
        this.pushHistory({
          operand1: Number(BigInt.asIntN(53, op1)),
          operator: op,
          operand2: Number(BigInt.asIntN(53, currentOperand)),
          result: Number(BigInt.asIntN(53, result)),
          timestamp: Date.now(),
          expression: `${this.formatValueForRadix(op1, this.radix)} ${op} ${this.formatValueForRadix(currentOperand, this.radix)} = ${this.currentBuffer}`,
        });
      } else {
        this.programmerAccumulator = currentOperand;
        this.accumulator = Number(BigInt.asIntN(53, currentOperand));
      }

      this.pendingOperator = operator;
      this.isWaitingForOperand = true;
      return;
    }

    const currentOperand = this.parseBuffer();

    if (this.accumulator === null) {
      this.accumulator = currentOperand;
    } else if (this.pendingOperator !== null) {
      // Immediate evaluation for standard sequential pocket calculator mode
      if (this.pendingOperator === "/" && currentOperand === 0) {
        this.setDivisionByZeroError();
        return;
      }
      if (this.pendingOperator === "^") {
        if (this.accumulator === 0 && currentOperand < 0) {
          this.setDivisionByZeroError();
          return;
        }
        if (this.accumulator !== null && this.accumulator < 0 && !Number.isInteger(currentOperand)) {
          this.setDomainError("Invalid input");
          return;
        }
      }

      const op1 = this.accumulator;
      const op = this.pendingOperator;
      const result = this.executeMath(op1, op, currentOperand);
      this.accumulator = result;
      this.currentBuffer = String(result);
      this.pushHistory({
        operand1: op1,
        operator: op,
        operand2: currentOperand,
        result,
        timestamp: Date.now(),
        expression: `${op1} ${op} ${currentOperand} = ${result}`,
      });
    } else {
      this.accumulator = currentOperand;
    }

    this.pendingOperator = operator;
    this.isWaitingForOperand = true;
  }

  /**
   * Executes the pending arithmetic calculation and updates registers.
   * Auto-balances unclosed parentheses and applies algebraic precedence (BODMAS/PEMDAS).
   * Returns the final display string (result or error).
   */
  public calculate(): string {
    if (this.isLocked) {
      return this.errorMessage ?? "Cannot divide by zero";
    }

    if (this.isProgrammerMode || (this.pendingOperator && (
      this.pendingOperator === "&" ||
      this.pendingOperator === "|" ||
      this.pendingOperator === "XOR" ||
      this.pendingOperator === "LSH" ||
      this.pendingOperator === "RSH" ||
      this.pendingOperator === "<<" ||
      this.pendingOperator === ">>"
    ))) {
      if (this.pendingOperator === null || this.programmerAccumulator === null) {
        return this.getDisplay();
      }

      const currentOperand = this.parseBufferBigInt();
      if (this.pendingOperator === "/" && currentOperand === 0n) {
        this.setDivisionByZeroError();
        return "Cannot divide by zero";
      }

      const op1 = this.programmerAccumulator;
      const op = this.pendingOperator;
      const result = this.executeProgrammerMath(op1, op, currentOperand);
      this.programmerAccumulator = result;
      this.accumulator = Number(BigInt.asIntN(53, result));
      this.currentBuffer = this.formatValueForRadix(result, this.radix);
      this.pendingOperator = null;
      this.isWaitingForOperand = true;
      this.pushHistory({
        operand1: Number(BigInt.asIntN(53, op1)),
        operator: op,
        operand2: Number(BigInt.asIntN(53, currentOperand)),
        result: Number(BigInt.asIntN(53, result)),
        timestamp: Date.now(),
        expression: `${this.formatValueForRadix(op1, this.radix)} ${op} ${this.formatValueForRadix(currentOperand, this.radix)} = ${this.currentBuffer}`,
      });

      return this.currentBuffer;
    }

    // Auto-balance unclosed open parentheses per DEC-EXPR-02 & REC-EXPR-01
    while (this.parenDepth > 0) {
      this.expression += ")";
      this.parenDepth--;
    }

    // If expression contains parentheses or explicit formula expression
    if (this.expression.includes("(") || this.expression.includes(")")) {
      const exprToEval = this.expression;
      try {
        const result = this.evaluateExpression(exprToEval);
        this.accumulator = result;
        this.currentBuffer = String(result);
        this.pendingOperator = null;
        this.isWaitingForOperand = true;
        this.pushHistory({
          operand1: 0,
          operator: "+",
          operand2: result,
          result,
          timestamp: Date.now(),
          expression: `${exprToEval} = ${result}`,
        });
        this.expression = `${exprToEval} = ${result}`;
        return this.currentBuffer;
      } catch (err: any) {
        if (err.message === "Cannot divide by zero") {
          this.setDivisionByZeroError();
          return "Cannot divide by zero";
        }
        this.setDomainError("Invalid input");
        return "Invalid input";
      }
    }

    if (this.pendingOperator === null || this.accumulator === null) {
      return this.getDisplay();
    }

    const currentOperand = this.parseBuffer();

    if (this.pendingOperator === "/" && currentOperand === 0) {
      this.setDivisionByZeroError();
      return "Cannot divide by zero";
    }
    if (this.pendingOperator === "^") {
      if (this.accumulator === 0 && currentOperand < 0) {
        this.setDivisionByZeroError();
        return "Cannot divide by zero";
      }
      if (this.accumulator !== null && this.accumulator < 0 && !Number.isInteger(currentOperand)) {
        this.setDomainError("Invalid input");
        return "Invalid input";
      }
    }

    const op1 = this.accumulator;
    const op = this.pendingOperator;
    const result = this.executeMath(op1, op, currentOperand);
    this.accumulator = result;
    this.currentBuffer = String(result);
    this.pendingOperator = null;
    this.isWaitingForOperand = true;
    const exprStr = `${op1} ${op} ${currentOperand} = ${result}`;
    this.pushHistory({
      operand1: op1,
      operator: op,
      operand2: currentOperand,
      result,
      timestamp: Date.now(),
      expression: exprStr,
    });
    this.expression = exprStr;

    return this.currentBuffer;
  }

  /**
   * Clear Entry (C):
   * Clears the active input buffer back to "0" and unlocks error state,
   * while preserving the pending accumulator and operator.
   */
  public clear(): void {
    if (this.isLocked) {
      this.isLocked = false;
      this.errorMessage = null;
    }
    this.currentBuffer = "0";
    this.isWaitingForOperand = false;
    if (this.expression.includes("=")) {
      this.expression = "";
    } else {
      this.expression = this.expression.replace(/[0-9.]+\s*$/, "");
    }
  }

  /**
   * All Clear (AC):
   * Completely resets all registers and error states to initial clean state.
   */
  public allClear(): void {
    this.accumulator = null;
    this.programmerAccumulator = null;
    this.pendingOperator = null;
    this.currentBuffer = "0";
    this.isWaitingForOperand = false;
    this.isLocked = false;
    this.errorMessage = null;
    this.expression = "";
    this.parenDepth = 0;
  }

  /**
   * Evaluates an algebraic mathematical expression adhering strictly to
   * standard operator precedence (BODMAS/PEMDAS: Parentheses, Exponents,
   * Multiplication/Division, Addition/Subtraction).
   *
   * Executes without dynamic eval() or new Function() per NEVER-CALC-001.
   * Enforces division by zero safeguard per RULE-CALC-001 and
   * precision normalization per RULE-CALC-002.
   */
  public evaluateExpression(expr: string): number {
    if (!expr || expr.trim() === "") {
      return 0;
    }

    // Strip trailing equals if present
    const cleanExpr = expr.replace(/=\s*$/, "").trim();

    // 1. Tokenize expression
    const tokens: string[] = [];
    let i = 0;
    const len = cleanExpr.length;

    while (i < len) {
      const ch = cleanExpr[i];

      if (/\s/.test(ch)) {
        i++;
        continue;
      }

      if (ch === "(" || ch === ")") {
        tokens.push(ch);
        i++;
        continue;
      }

      if (ch === "+" || ch === "*" || ch === "/" || ch === "^") {
        tokens.push(ch);
        i++;
        continue;
      }

      if (ch === "-") {
        // Distinguish binary minus from unary negative number
        const prevToken = tokens[tokens.length - 1];
        const isUnary =
          tokens.length === 0 ||
          prevToken === "(" ||
          prevToken === "+" ||
          prevToken === "-" ||
          prevToken === "*" ||
          prevToken === "/" ||
          prevToken === "^";

        if (isUnary && i + 1 < len && /[0-9.]/.test(cleanExpr[i + 1])) {
          let numStr = "-";
          i++;
          while (i < len && /[0-9.]/.test(cleanExpr[i])) {
            numStr += cleanExpr[i];
            i++;
          }
          tokens.push(numStr);
          continue;
        } else {
          tokens.push("-");
          i++;
          continue;
        }
      }

      if (/[0-9.]/.test(ch)) {
        let numStr = "";
        while (i < len && /[0-9.]/.test(cleanExpr[i])) {
          numStr += cleanExpr[i];
          i++;
        }
        tokens.push(numStr);
        continue;
      }

      i++;
    }

    if (tokens.length === 0) {
      return 0;
    }

    // Handle implicit multiplication: e.g. 2(3) -> 2 * (3), (2)(3) -> (2) * (3), (2)3 -> (2) * 3
    const expandedTokens: string[] = [];
    for (let k = 0; k < tokens.length; k++) {
      const curr = tokens[k];
      const prev = expandedTokens[expandedTokens.length - 1];

      if (prev) {
        const prevIsNumOrClose = !["+", "-", "*", "/", "^", "("].includes(prev);
        const currIsNumOrOpen = !["+", "-", "*", "/", "^", ")"].includes(curr);

        if (prevIsNumOrClose && curr === "(") {
          expandedTokens.push("*");
        } else if (prev === ")" && currIsNumOrOpen) {
          expandedTokens.push("*");
        }
      }
      expandedTokens.push(curr);
    }

    // Auto-balance unclosed open parentheses in tokens
    let openCount = 0;
    for (const t of expandedTokens) {
      if (t === "(") openCount++;
      if (t === ")") openCount = Math.max(0, openCount - 1);
    }
    while (openCount > 0) {
      expandedTokens.push(")");
      openCount--;
    }

    // 2. Shunting-Yard Algorithm to convert infix tokens to RPN
    const precedence: Record<string, number> = {
      "+": 2,
      "-": 2,
      "*": 3,
      "/": 3,
      "^": 4,
    };

    const isRightAssociative: Record<string, boolean> = {
      "^": true,
    };

    const outputQueue: string[] = [];
    const operatorStack: string[] = [];

    for (const token of expandedTokens) {
      if (token === "(") {
        operatorStack.push(token);
      } else if (token === ")") {
        while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== "(") {
          outputQueue.push(operatorStack.pop()!);
        }
        if (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] === "(") {
          operatorStack.pop();
        }
      } else if (token in precedence) {
        const op1 = token;
        const prec1 = precedence[op1];
        const rightAssoc = isRightAssociative[op1] ?? false;

        while (operatorStack.length > 0) {
          const top = operatorStack[operatorStack.length - 1];
          if (top === "(") break;
          const precTop = precedence[top] ?? 0;
          if ((!rightAssoc && prec1 <= precTop) || (rightAssoc && prec1 < precTop)) {
            outputQueue.push(operatorStack.pop()!);
          } else {
            break;
          }
        }
        operatorStack.push(op1);
      } else {
        outputQueue.push(token);
      }
    }

    while (operatorStack.length > 0) {
      const op = operatorStack.pop()!;
      if (op !== "(" && op !== ")") {
        outputQueue.push(op);
      }
    }

    if (outputQueue.length === 0) {
      return 0;
    }

    // 3. Evaluate RPN
    const evalStack: number[] = [];

    for (const token of outputQueue) {
      if (token in precedence) {
        if (evalStack.length < 2) {
          if (evalStack.length === 1 && token === "-") {
            const val = evalStack.pop()!;
            evalStack.push(normalizePrecision(-val));
            continue;
          }
          continue;
        }
        const b = evalStack.pop()!;
        const a = evalStack.pop()!;

        switch (token) {
          case "+":
            evalStack.push(normalizePrecision(a + b));
            break;
          case "-":
            evalStack.push(normalizePrecision(a - b));
            break;
          case "*":
            evalStack.push(normalizePrecision(a * b));
            break;
          case "/":
            if (b === 0) {
              throw new Error("Cannot divide by zero");
            }
            evalStack.push(normalizePrecision(a / b));
            break;
          case "^":
            if (a === 0 && b < 0) {
              throw new Error("Cannot divide by zero");
            }
            if (a < 0 && !Number.isInteger(b)) {
              throw new Error("Invalid input");
            }
            evalStack.push(normalizePrecision(Math.pow(a, b)));
            break;
        }
      } else {
        const num = parseFloat(token);
        evalStack.push(Number.isNaN(num) ? 0 : num);
      }
    }

    const finalResult = evalStack.length > 0 ? evalStack[evalStack.length - 1] : 0;
    return normalizePrecision(finalResult);
  }

  /**
   * Adds the current active buffer value to the memory register.
   * Normalizes precision to eliminate IEEE-754 representation noise.
   * If the engine is locked by an error, input is ignored.
   */
  public memoryAdd(): void {
    if (this.isLocked) {
      return;
    }
    const currentOperand = this.parseBuffer();
    this.memory = normalizePrecision(this.memory + currentOperand);
    this.isWaitingForOperand = true;
  }

  /**
   * Subtracts the current active buffer value from the memory register.
   * Normalizes precision to eliminate IEEE-754 representation noise.
   * If the engine is locked by an error, input is ignored.
   */
  public memorySubtract(): void {
    if (this.isLocked) {
      return;
    }
    const currentOperand = this.parseBuffer();
    this.memory = normalizePrecision(this.memory - currentOperand);
    this.isWaitingForOperand = true;
  }

  /**
   * Recalls the value stored in the memory register into the active buffer.
   * Sets isWaitingForOperand to false to enable immediate operand chaining.
   * If the engine is locked by an error, input is ignored.
   */
  public memoryRecall(): void {
    if (this.isLocked) {
      return;
    }
    this.currentBuffer = String(this.memory);
    this.isWaitingForOperand = false;
  }

  /**
   * Resets the memory register back to 0.
   * If the engine is locked by an error, input is ignored.
   */
  public memoryClear(): void {
    if (this.isLocked) {
      return;
    }
    this.memory = 0;
  }

  /**
   * Returns true if the memory register contains a non-zero value.
   */
  public hasMemory(): boolean {
    return this.memory !== 0;
  }

  /**
   * Returns the current numeric value stored in the memory register.
   */
  public getMemoryValue(): number {
    return this.memory;
  }

  /**
   * Returns the formatted string suitable for the calculator display.
   */
  public getDisplay(): string {
    if (this.errorMessage !== null) {
      return this.errorMessage;
    }
    return this.currentBuffer;
  }

  /**
   * Returns a copy of the calculation history buffer.
   */
  public getHistory(): CalculationRecord[] {
    return [...this.history];
  }

  /**
   * Recalls the calculation result from history at the specified index
   * into the active input buffer.
   * Returns null if index is invalid or engine is locked.
   */
  public recallHistory(index: number): CalculationRecord | null {
    if (this.isLocked || !Number.isInteger(index) || index < 0 || index >= this.history.length) {
      return null;
    }
    const entry = this.history[index];
    if (this.isProgrammerMode) {
      this.currentBuffer = this.formatValueForRadix(BigInt(Math.trunc(entry.result)), this.radix);
    } else {
      this.currentBuffer = String(entry.result);
    }
    // In idle state without pending operator, set isWaitingForOperand to true so subsequent
    // digit input starts a fresh operand rather than appending to recalled result.
    // When an operator is pending, set to false so the recalled value acts as the second operand.
    this.isWaitingForOperand = this.pendingOperator === null;
    return entry;
  }

  /**
   * Clears all calculation history entries.
   */
  public clearHistory(): void {
    this.history = [];
  }

  /**
   * Appends a calculation record to the bounded FIFO history tape (max 50 entries).
   */
  private pushHistory(record: CalculationRecord): void {
    this.history.push(record);
    if (this.history.length > CalcEngine.MAX_HISTORY) {
      this.history.shift();
    }
  }

  /**
   * Returns active angle mode ("DEG" or "RAD").
   */
  public getAngleMode(): AngleMode {
    return this.angleMode;
  }

  /**
   * Toggles the angle mode between "DEG" and "RAD".
   * Returns the updated angle mode.
   */
  public toggleAngleMode(): AngleMode {
    this.angleMode = this.angleMode === "DEG" ? "RAD" : "DEG";
    return this.angleMode;
  }

  /**
   * Evaluates sine function on active buffer value with respect to active angle mode.
   */
  public sin(): void {
    if (this.isLocked) {
      return;
    }
    const val = this.parseBuffer();
    let res: number;
    if (this.angleMode === "DEG") {
      const mod = val % 360;
      if (mod === 0 || Math.abs(mod) === 180) {
        res = 0;
      } else if (mod === 90 || mod === -270) {
        res = 1;
      } else if (mod === 270 || mod === -90) {
        res = -1;
      } else {
        res = Math.sin(val * (Math.PI / 180));
      }
    } else {
      res = Math.sin(val);
    }
    const normalized = normalizePrecision(res);
    this.currentBuffer = String(normalized);
    this.isWaitingForOperand = true;
  }

  /**
   * Evaluates cosine function on active buffer value with respect to active angle mode.
   */
  public cos(): void {
    if (this.isLocked) {
      return;
    }
    const val = this.parseBuffer();
    let res: number;
    if (this.angleMode === "DEG") {
      const mod = val % 360;
      if (Math.abs(mod) === 90 || Math.abs(mod) === 270) {
        res = 0;
      } else if (mod === 0) {
        res = 1;
      } else if (Math.abs(mod) === 180) {
        res = -1;
      } else {
        res = Math.cos(val * (Math.PI / 180));
      }
    } else {
      res = Math.cos(val);
    }
    const normalized = normalizePrecision(res);
    this.currentBuffer = String(normalized);
    this.isWaitingForOperand = true;
  }

  /**
   * Evaluates tangent function on active buffer value with respect to active angle mode.
   * Asymptotes trigger an "Invalid input" domain error state.
   */
  public tan(): void {
    if (this.isLocked) {
      return;
    }
    const val = this.parseBuffer();
    let res: number;
    if (this.angleMode === "DEG") {
      if (Math.abs(val % 180) === 90) {
        this.setDomainError("Invalid input");
        return;
      }
      const mod = val % 180;
      if (mod === 0) {
        res = 0;
      } else if (mod === 45 || mod === -135) {
        res = 1;
      } else if (mod === 135 || mod === -45) {
        res = -1;
      } else {
        res = Math.tan(val * (Math.PI / 180));
      }
    } else {
      if (Math.abs(Math.cos(val)) < 1e-15) {
        this.setDomainError("Invalid input");
        return;
      }
      res = Math.tan(val);
    }
    const normalized = normalizePrecision(res);
    this.currentBuffer = String(normalized);
    this.isWaitingForOperand = true;
  }

  /**
   * Evaluates square (x²) on active buffer value.
   */
  public square(): void {
    if (this.isLocked) {
      return;
    }
    const val = this.parseBuffer();
    const normalized = normalizePrecision(val * val);
    this.currentBuffer = String(normalized);
    this.isWaitingForOperand = true;
  }

  /**
   * Evaluates square root (√) on active buffer value.
   * Negative inputs trigger an "Invalid input" domain error state.
   */
  public sqrt(): void {
    if (this.isLocked) {
      return;
    }
    const val = this.parseBuffer();
    if (val < 0) {
      this.setDomainError("Invalid input");
      return;
    }
    const normalized = normalizePrecision(Math.sqrt(val));
    this.currentBuffer = String(normalized);
    this.isWaitingForOperand = true;
  }

  /**
   * Evaluates reciprocal (1/x) on active buffer value.
   * Zero input triggers a "Cannot divide by zero" error state.
   */
  public reciprocal(): void {
    if (this.isLocked) {
      return;
    }
    const val = this.parseBuffer();
    if (val === 0) {
      this.setDivisionByZeroError();
      return;
    }
    const normalized = normalizePrecision(1 / val);
    this.currentBuffer = String(normalized);
    this.isWaitingForOperand = true;
  }

  /**
   * Evaluates natural logarithm (ln) on active buffer value.
   * Non-positive inputs trigger an "Invalid input" domain error state.
   */
  public ln(): void {
    if (this.isLocked) {
      return;
    }
    const val = this.parseBuffer();
    if (val <= 0) {
      this.setDomainError("Invalid input");
      return;
    }
    const normalized = normalizePrecision(Math.log(val));
    this.currentBuffer = String(normalized);
    this.isWaitingForOperand = true;
  }

  /**
   * Evaluates common base-10 logarithm (log) on active buffer value.
   * Non-positive inputs trigger an "Invalid input" domain error state.
   */
  public log(): void {
    if (this.isLocked) {
      return;
    }
    const val = this.parseBuffer();
    if (val <= 0) {
      this.setDomainError("Invalid input");
      return;
    }
    const normalized = normalizePrecision(Math.log10(val));
    this.currentBuffer = String(normalized);
    this.isWaitingForOperand = true;
  }

  /**
   * Inserts a mathematical constant (π or e) into the active buffer.
   */
  public inputConstant(constant: "pi" | "e"): void {
    if (this.isLocked) {
      return;
    }
    const val = constant === "pi" ? Math.PI : Math.E;
    this.currentBuffer = String(normalizePrecision(val));
    this.isWaitingForOperand = true;
  }

  /**
   * Returns active radix numeral base ("HEX", "DEC", "OCT", or "BIN").
   */
  public getRadix(): RadixBase {
    return this.radix;
  }

  /**
   * Sets active radix numeral base and reformats the active buffer without losing value.
   */
  public setRadix(radix: RadixBase): void {
    if (this.radix === radix) {
      return;
    }
    if (!this.isLocked) {
      const val = this.parseBufferBigInt();
      this.radix = radix;
      this.currentBuffer = this.formatValueForRadix(val, radix);
    } else {
      this.radix = radix;
    }
  }

  /**
   * Returns active bit-width word size (8, 16, 32, or 64).
   */
  public getWordSize(): WordSize {
    return this.wordSize;
  }

  /**
   * Sets active word size and clamps the active buffer and accumulator to the new bit width.
   */
  public setWordSize(wordSize: WordSize): void {
    this.wordSize = wordSize;
    if (!this.isLocked) {
      const val = this.parseBufferBigInt();
      const clamped = BigInt.asUintN(wordSize, val);
      this.currentBuffer = this.formatValueForRadix(clamped, this.radix);
      if (this.programmerAccumulator !== null) {
        this.programmerAccumulator = BigInt.asUintN(wordSize, this.programmerAccumulator);
      }
    }
  }

  /**
   * Cycles word size (64 -> 32 -> 16 -> 8 -> 64) and returns the updated word size.
   */
  public cycleWordSize(): WordSize {
    const cycleMap: Record<WordSize, WordSize> = {
      64: 32,
      32: 16,
      16: 8,
      8: 64,
    };
    const next = cycleMap[this.wordSize] || 64;
    this.setWordSize(next);
    return next;
  }

  /**
   * Returns true if Programmer Mode is active.
   */
  public isProgrammerModeActive(): boolean {
    return this.isProgrammerMode;
  }

  /**
   * Returns true if Programmer Mode is active.
   */
  public getProgrammerMode(): boolean {
    return this.isProgrammerMode;
  }

  /**
   * Enables or disables Programmer Mode.
   */
  public setProgrammerMode(enabled: boolean): void {
    this.isProgrammerMode = enabled;
    if (enabled) {
      if (!this.isLocked) {
        const floatVal = parseFloat(this.currentBuffer);
        const intVal = Number.isFinite(floatVal) ? BigInt(Math.trunc(floatVal)) : 0n;
        this.currentBuffer = this.formatValueForRadix(intVal, this.radix);
        if (this.accumulator !== null) {
          this.programmerAccumulator = BigInt(Math.trunc(this.accumulator));
        }
      }
    } else {
      if (!this.isLocked && this.radix !== "DEC") {
        const val = this.parseBufferBigInt();
        this.currentBuffer = val.toString(10);
      }
    }
  }

  /**
   * Returns real-time multi-radix state representations across all 4 bases.
   */
  public getMultiRadixState(): MultiRadixState {
    if (this.isLocked || this.errorMessage !== null) {
      return { hex: "0", dec: "0", oct: "0", bin: "0" };
    }
    const val = this.parseBufferBigInt();
    const unsignedVal = BigInt.asUintN(this.wordSize, val);
    const signedVal = BigInt.asIntN(this.wordSize, val);
    return {
      hex: unsignedVal.toString(16).toUpperCase(),
      dec: signedVal.toString(10),
      oct: unsignedVal.toString(8),
      bin: unsignedVal.toString(2),
    };
  }

  /**
   * Performs unary bitwise NOT (~) on active buffer within active word size.
   */
  public bitwiseNot(): void {
    if (this.isLocked) {
      return;
    }
    const val = this.parseBufferBigInt();
    const inverted = BigInt.asUintN(this.wordSize, ~val);
    this.currentBuffer = this.formatValueForRadix(inverted, this.radix);
    this.isWaitingForOperand = true;
  }

  /**
   * Prepares bitwise AND operation.
   */
  public bitwiseAnd(): void {
    this.inputOperator("&");
  }

  /**
   * Prepares bitwise OR operation.
   */
  public bitwiseOr(): void {
    this.inputOperator("|");
  }

  /**
   * Prepares bitwise XOR operation.
   */
  public bitwiseXor(): void {
    this.inputOperator("XOR");
  }

  /**
   * Prepares bitwise Left Shift (<<) operation.
   */
  public bitwiseLsh(): void {
    this.inputOperator("LSH");
  }

  /**
   * Prepares bitwise Right Shift (>>) operation.
   */
  public bitwiseRsh(): void {
    this.inputOperator("RSH");
  }

  /**
   * Returns a snapshot of the current engine register state.
   */
  public getState(): CalcEngineState {
    return {
      accumulator: this.accumulator,
      currentBuffer: this.currentBuffer,
      pendingOperator: this.pendingOperator,
      isWaitingForOperand: this.isWaitingForOperand,
      isLocked: this.isLocked,
      errorMessage: this.errorMessage,
      display: this.getDisplay(),
      memory: this.memory,
      hasMemory: this.hasMemory(),
      history: this.getHistory(),
      angleMode: this.angleMode,
      radix: this.radix,
      wordSize: this.wordSize,
      multiRadix: this.getMultiRadixState(),
      isProgrammerMode: this.isProgrammerMode,
      expression: this.expression,
      parenDepth: this.parenDepth,
    };
  }

  /**
   * Parses the active buffer into a numeric value.
   */
  private parseBuffer(): number {
    const val = parseFloat(this.currentBuffer);
    return Number.isNaN(val) ? 0 : val;
  }

  /**
   * Parses active buffer into BigInt based on active radix and mode.
   */
  private parseBufferBigInt(): bigint {
    if (this.currentBuffer === "0" || this.currentBuffer === "" || this.isLocked) {
      return 0n;
    }
    try {
      if (!this.isProgrammerMode && this.radix === "DEC") {
        const floatVal = parseFloat(this.currentBuffer);
        if (!Number.isFinite(floatVal)) return 0n;
        return BigInt(Math.trunc(floatVal));
      }
      const isNegative = this.currentBuffer.startsWith("-");
      const clean = isNegative ? this.currentBuffer.slice(1) : this.currentBuffer;
      let val: bigint;
      switch (this.radix) {
        case "HEX":
          val = BigInt("0x" + clean);
          break;
        case "OCT":
          val = BigInt("0o" + clean);
          break;
        case "BIN":
          val = BigInt("0b" + clean);
          break;
        case "DEC":
        default:
          val = BigInt(clean.includes(".") ? Math.trunc(parseFloat(clean)).toString() : clean);
          break;
      }
      return isNegative ? -val : val;
    } catch {
      return 0n;
    }
  }

  /**
   * Formats a BigInt value into a string for the target radix base and active word size.
   */
  private formatValueForRadix(val: bigint, radix: RadixBase): string {
    const unsigned = BigInt.asUintN(this.wordSize, val);
    switch (radix) {
      case "HEX":
        return unsigned.toString(16).toUpperCase();
      case "OCT":
        return unsigned.toString(8);
      case "BIN":
        return unsigned.toString(2);
      case "DEC":
      default:
        return BigInt.asIntN(this.wordSize, val).toString(10);
    }
  }

  /**
   * Executes binary arithmetic with precision normalization.
   */
  private executeMath(op1: number, operator: Operator, op2: number): number {
    switch (operator) {
      case "+":
        return normalizePrecision(op1 + op2);
      case "-":
        return normalizePrecision(op1 - op2);
      case "*":
        return normalizePrecision(op1 * op2);
      case "/":
        return normalizePrecision(op1 / op2);
      case "^":
        return normalizePrecision(Math.pow(op1, op2));
      default:
        return op2;
    }
  }

  /**
   * Executes programmer integer and bitwise binary operations with word size clamping.
   */
  private executeProgrammerMath(op1: bigint, operator: Operator, op2: bigint): bigint {
    const wordSize = this.wordSize;
    let raw: bigint;
    switch (operator) {
      case "+":
        raw = op1 + op2;
        break;
      case "-":
        raw = op1 - op2;
        break;
      case "*":
        raw = op1 * op2;
        break;
      case "/":
        if (op2 === 0n) {
          throw new Error("Division by zero");
        }
        raw = op1 / op2;
        break;
      case "&":
        raw = op1 & op2;
        break;
      case "|":
        raw = op1 | op2;
        break;
      case "^":
      case "XOR":
        raw = op1 ^ op2;
        break;
      case "<<":
      case "LSH": {
        const maxShift = BigInt(wordSize - 1);
        const shift = op2 < 0n ? 0n : op2 > maxShift ? maxShift : op2;
        raw = op1 << shift;
        break;
      }
      case ">>":
      case "RSH": {
        const maxShift = BigInt(wordSize - 1);
        const shift = op2 < 0n ? 0n : op2 > maxShift ? maxShift : op2;
        const unsignedOp1 = BigInt.asUintN(wordSize, op1);
        raw = unsignedOp1 >> shift;
        break;
      }
      default:
        raw = op2;
        break;
    }
    return BigInt.asUintN(wordSize, raw);
  }

  /**
   * Locks the engine in an error state on division by zero.
   */
  private setDivisionByZeroError(): void {
    this.isLocked = true;
    this.errorMessage = "Cannot divide by zero";
    this.currentBuffer = "Cannot divide by zero";
    this.accumulator = null;
    this.programmerAccumulator = null;
    this.pendingOperator = null;
    this.isWaitingForOperand = false;
  }

  /**
   * Locks the engine in an error state on mathematical domain errors.
   */
  private setDomainError(msg: string = "Invalid input"): void {
    this.isLocked = true;
    this.errorMessage = msg;
    this.currentBuffer = msg;
    this.accumulator = null;
    this.programmerAccumulator = null;
    this.pendingOperator = null;
    this.isWaitingForOperand = false;
  }
}
