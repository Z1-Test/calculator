---
type: Feature
title: "F5: Scientific Mode Toggle & Trigonometry"
description: "Expandable scientific functions, power operations, constants, trigonometric calculations with DEG/RAD toggle, and domain error handling."
status: stable
tags: [scientific, math, trigonometry, f5]
generated: { by: "factory:planner", at: "2026-10-13T14:18:00Z" }
sources:
  - id: source-architecture
    resource: docs/context/project/architecture.md
    title: System Architecture
  - id: source-rules
    resource: docs/context/project/domain-rules.md
    title: Domain Rules & Invariants
---

# Feature: Scientific Mode Toggle & Trigonometry (F5)

## 1. Intent & Scope

Provide scientific calculation capabilities in StayCalc via an expandable scientific panel. Supports unary scientific operators ($\sqrt{x}$, $x^2$, $\sin$, $\cos$, $\tan$), constants ($\pi$, $e$), binary exponentiation ($x^y$), an angle unit mode switch (`DEG` / `RAD`), and domain error protection.

## 2. Invariants & Rules

- **`RULE-CALC-003` (Trigonometric Angle Mode)**:
  - Default mode is Degrees (`DEG`).
  - When in `DEG`, inputs to `sin`, `cos`, `tan` are converted from degrees to radians before calling Math functions ($\text{rad} = \text{deg} \times \pi / 180$).
  - When in `RAD`, inputs are evaluated directly as radians.
  - Trigonometric precision must normalize floating-point artifacts (e.g. $\sin(180^\circ) = 0$, $\cos(90^\circ) = 0$, $\tan(45^\circ) = 1$).
- **`RULE-SCI-001` (Domain Error Protection)**:
  - Square root of a negative number ($\sqrt{-n}$ where $n > 0$) must immediately display `"Invalid input"` and set engine to error state.
  - $\tan(90^\circ)$ displays `"Invalid input"`.
- **`RULE-SCI-002` (Constants Precision)**:
  - Pressing $\pi$ inputs `3.1415926536` (rounded cleanly to 10 decimal digits).
  - Pressing $e$ inputs `2.7182818285`.
- **`RULE-SCI-003` (Immediate Evaluation of Unary Functions)**:
  - Unary operations ($\sqrt{x}$, $x^2$, $\sin$, $\cos$, $\tan$) evaluate immediately on the current active display value and update the display.
  - $x^y$ acts as a binary operator, taking the base and prompting for the exponent.

## 3. Interfaces

```typescript
export type AngleMode = 'DEG' | 'RAD';

export class ScientificEngine {
  getAngleMode(): AngleMode;
  toggleAngleMode(): AngleMode;
  sqrt(val: number): number | 'Invalid input';
  square(val: number): number;
  power(base: number, exp: number): number;
  sin(val: number): number;
  cos(val: number): number;
  tan(val: number): number | 'Invalid input';
  pi(): number;
  e(): number;
}
```
