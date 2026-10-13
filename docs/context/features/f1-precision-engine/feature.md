---
type: Feature
title: "F1: Precision Arithmetic Engine"
description: "Core deterministic arithmetic calculation engine for StayCalc with decimal precision normalization, division-by-zero safeguard, operator replacement, and immediate evaluation."
status: stable
tags: [engine, arithmetic, math, precision, f1]
generated: { by: "factory:planner", at: "2026-10-13T14:00:00Z" }
sources:
  - id: source-vision
    resource: docs/context/project/vision.md
    title: Product Vision
  - id: source-rules
    resource: docs/context/project/domain-rules.md
    title: Domain Rules & Invariants
---

# Feature: Precision Arithmetic Engine (F1)

## 1. Intent & Scope

Deliver the foundational math engine for StayCalc as a pure, zero-dependency ES module. The engine handles all baseline 4-function arithmetic (`+`, `-`, `*`, `/`) with an immediate sequential evaluation model (pocket calculator order), strict decimal normalization, division-by-zero safeguards, operator replacement, and dual clear modes (`C` and `AC`).

## 2. Invariants & Rules

- **`RULE-CALC-001` (Zero Division Safeguard)**: Division by zero (`n / 0`) must immediately return `"Cannot divide by zero"` and set the engine state to `LOCKED_ERROR`. No further numeric or operator inputs are accepted until cleared.
- **`RULE-CALC-002` (Decimal Precision Normalization)**: Arithmetic results must be normalized using decimal arithmetic or scaled rounding to eliminate IEEE 754 precision leakage (e.g., `0.1 + 0.2` must equal `0.3`, `0.7 + 0.1` must equal `0.8`). Display values are bounded to a maximum of 10 significant digits.
- **`RULE-CALC-003` (Immediate Execution Model)**: Operations execute sequentially left-to-right on subsequent operators. For example, `2 + 3 * 4 =` produces `20` (`(2 + 3) * 4`), not `14`.
- **`RULE-CALC-004` (Operator Replacement)**: Pressing an operator key immediately after another operator replaces the pending operator without calculating (e.g., `5 + * 2 =` evaluates as `5 * 2 = 10`).
- **`RULE-CALC-005` (Clear Mode Invariants)**:
  - `C` (Clear Entry): Resets the active input buffer to `"0"` while preserving accumulator and pending operator.
  - `AC` (All Clear): Completely resets accumulator, active buffer, pending operator, and clears error lock.
- **`NEVER-CALC-001` (No Dynamic Eval)**: Calculation logic must never use `eval()`, `new Function()`, or third-party runtime math libraries.

## 3. Interfaces & Contracts

```typescript
export type Operator = '+' | '-' | '*' | '/' | null;

export interface EngineState {
  display: string;
  accumulator: number | null;
  pendingOperator: Operator;
  waitingForOperand: boolean;
  hasError: boolean;
  errorMessage: string | null;
}

export interface CalcEngine {
  getState(): Readonly<EngineState>;
  inputDigit(digit: string): Readonly<EngineState>;
  inputDecimal(): Readonly<EngineState>;
  inputOperator(op: '+' | '-' | '*' | '/'): Readonly<EngineState>;
  calculate(): Readonly<EngineState>;
  clearEntry(): Readonly<EngineState>;
  allClear(): Readonly<EngineState>;
  toggleSign(): Readonly<EngineState>;
  percentage(): Readonly<EngineState>;
}
```
