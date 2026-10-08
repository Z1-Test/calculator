---
type: Concept
title: "StayCalc Entity Statuses & State Machines"
description: "State transition models for calculator engine, theme modes, and PWA network states."
status: stable
tags: [entity-statuses, state-machine, lifecycles]
generated: { by: "human:maintainer", at: "2026-10-08T00:00:00Z" }
sources:
  - id: source-architecture
    resource: docs/context/project/architecture.md
    title: System Architecture
---

# StayCalc Entity Statuses & State Machines

## 1. Calculator Engine State Machine

The calculator core transitions across discrete states during user interactions:

```mermaid
stateDiagram-v2
  [*] --> IDLE
  IDLE --> ENTERING_OPERAND: Keypress (Digit / Decimal)
  ENTERING_OPERAND --> ENTERING_OPERAND: Keypress (Digit / Decimal)
  ENTERING_OPERAND --> OPERATOR_PENDING: Keypress (Operator +, -, ×, ÷)
  OPERATOR_PENDING --> ENTERING_OPERAND: Keypress (Digit / Decimal)
  ENTERING_OPERAND --> COMPUTING: Keypress (= or Enter)
  COMPUTING --> RESULT_DISPLAYED: Evaluation Success
  COMPUTING --> ERROR_STATE: Evaluation Failure (Divide by Zero, Syntax)
  RESULT_DISPLAYED --> ENTERING_OPERAND: Keypress (Digit / Decimal - New Expression)
  RESULT_DISPLAYED --> OPERATOR_PENDING: Keypress (Operator - Chain Result)
  ERROR_STATE --> IDLE: Keypress (Clear / AC / Escape)
  RESULT_DISPLAYED --> IDLE: Keypress (Clear / AC / Escape)
```

## 2. Theme State Machine

- **`SYSTEM_AUTO`**: Follows browser/OS `prefers-color-scheme`.
- **`LIGHT`**: Forced light theme (`sl-background: #ffffff`).
- **`DARK`**: Forced dark theme (`sl-background: #09090b`).

## 3. PWA Lifecycle States

- **`INSTALLING`**: Service worker downloading assets.
- **`OFFLINE_READY`**: Assets cached, app fully operable offline.
- **`UPDATE_AVAILABLE`**: New application version detected; banner ready to prompt reload.
