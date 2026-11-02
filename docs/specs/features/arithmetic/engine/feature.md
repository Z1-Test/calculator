---
type: Feature
title: Precision arithmetic engine
status: draft
description: High-precision immediate execution arithmetic engine with sequential evaluation.
level: L3
tier: T2
owner: unassigned
last_reviewed: 2026-11-02
tags: [feature, arithmetic]
depends_on: []
---

# Precision arithmetic engine

Up: [Arithmetic capability](../../../capabilities/arithmetic.md). Modules: [flow](./flow.md), [cases](./cases.md).

## In plain words

- The user enters numbers and operations on the calculator.
- Calculations evaluate sequentially from left to right as each operator is typed.
- Numbers round cleanly to ten display digits without floating-point errors.
- Clear Entry resets the current number while All Clear resets everything.

## How it works

The engine takes numbers and operators sequentially, applying immediate execution. Division by zero yields `ERR-CALC-0001`.

```mermaid
flowchart TD
  A["User enters operator"] --> B{"Is pending operator present?"}
  B -- yes --> C["Execute pending operation"]
  B -- no --> D["Store accumulator and operator"]
  C --> E{"Division by zero?"}
  E -- yes --> F["Set ERR-CALC-0001 and lock"]
  E -- no --> G["Format result to LIM-CALC-DIGITS"]
```

## Tier and risk

Proposed T2, confirmed by the owner: yes.

| Question | Answer |
| :--- | :--- |
| Data class | none |
| Blast radius | one user |
| Reversibility | undo |
| Residency | none |
| Recovery targets | not defined |

## Rules

- `RULE-CALC-001`: Division by zero returns `ERR-CALC-0001` and locks numeric input.
- `RULE-CALC-002`: Floating-point results round cleanly up to `LIM-CALC-DIGITS` digits.
- `RULE-CALC-007`: Sequential operations evaluate left-to-right immediately per `DEC-CALC-01`.
- `RULE-CALC-008`: Consecutive operator presses replace the pending operator in place.
- `RULE-CALC-009`: Clear Entry (C) resets active buffer to zero preserving accumulator.
- `RULE-CALC-010`: All Clear (AC) resets accumulator, buffer, operator, and error state.
- `NEVER-CALC-001`: Never use dynamic code evaluation like eval or new Function.

## Examples

- **Sequential addition and multiplication.** Alice enters two plus three times four equals. The engine evaluates two plus three to five, then times four to twenty. The display shows twenty. Rules: `RULE-CALC-007`.
- **Consecutive operator replacement.** Bob enters five plus then presses multiply by two equals. The engine replaces plus with multiply and computes five times two. The display shows ten. Rules: `RULE-CALC-008`.
- **Floating point normalization.** Carol enters zero point one plus zero point two equals. The engine computes the sum and normalizes the decimal result. The display shows zero point three. Rules: `RULE-CALC-002`.

## Code anchors

- `src/engine/arithmetic.ts` `PrecisionArithmeticEngine.inputDigit`: Enforces input buffer entry (`RULE-CALC-002`).
- `src/engine/arithmetic.ts` `PrecisionArithmeticEngine.inputOperator`: Enforces sequential immediate execution (`RULE-CALC-007`, `RULE-CALC-008`).
- `src/engine/arithmetic.ts` `PrecisionArithmeticEngine.clear`: Enforces C buffer reset (`RULE-CALC-009`).
- `src/engine/arithmetic.ts` `PrecisionArithmeticEngine.allClear`: Enforces AC full reset (`RULE-CALC-010`).

## Seams

- Cites `SEAM-CALC-01`.
