---
type: Flow
title: "F1: Precision Arithmetic Engine Logic Flow"
description: "State transition, decision points, and execution lifecycle for StayCalc arithmetic engine."
status: stable
tags: [flow, engine, arithmetic, f1]
generated: { by: "factory:planner", at: "2026-10-13T14:00:00Z" }
sources:
  - id: source-feature
    resource: docs/context/features/f1-precision-engine/feature.md
    title: F1 Feature Specification
---

# Logic Flow: Precision Arithmetic Engine (F1)

## 1. Engine State Machine

```mermaid
stateDiagram-v2
    [*] --> Idle: Initialize (display: "0")
    
    Idle --> EnteringOperand: Digit / Decimal
    EnteringOperand --> EnteringOperand: Digit / Decimal
    
    EnteringOperand --> OperatorPending: Operator (+, -, *, /)
    OperatorPending --> OperatorPending: Operator Replace
    OperatorPending --> EnteringOperand: Digit / Decimal
    
    EnteringOperand --> Evaluated: Equals (=)
    Evaluated --> OperatorPending: Operator (+, -, *, /)
    Evaluated --> EnteringOperand: Digit / Decimal
    
    EnteringOperand --> ErrorLocked: Divide by Zero
    OperatorPending --> ErrorLocked: Divide by Zero
    
    ErrorLocked --> Idle: AC / C Pressed
    EnteringOperand --> Idle: AC Pressed
    OperatorPending --> Idle: AC Pressed
    
    EnteringOperand --> OperandCleared: C Pressed
    OperandCleared --> EnteringOperand: Digit
```

## 2. Decision Tree (`DEC-*`)

- **`DEC-F1-001` (Input In Locked Error)**:
  - If state is `hasError: true`, any input other than `C` or `AC` is ignored.
- **`DEC-F1-002` (Operator Key Pressed)**:
  - If `waitingForOperand: true`, update `pendingOperator` to new operator (Operator replacement, `RULE-CALC-004`).
  - If `waitingForOperand: false` and `accumulator !== null`, evaluate pending operation immediately, display normalized result, store in accumulator, set `pendingOperator` to new operator, set `waitingForOperand: true`.
- **`DEC-F1-003` (Equals Key Pressed)**:
  - If `accumulator !== null` and `pendingOperator !== null`, calculate `accumulator <op> display`, format result, clear `pendingOperator`, set `waitingForOperand: true`.
- **`DEC-F1-004` (Division By Zero)**:
  - If operation is `/` and operand is `0`, set `hasError: true`, `errorMessage: "Cannot divide by zero"`, lock input.
