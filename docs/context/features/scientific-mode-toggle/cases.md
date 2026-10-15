---
type: Test Cases
title: "Scientific Mode & Advanced Arithmetic Test Cases"
status: stable
description: "Unified verification scenarios, 11 universal cases, stall matrix, and traceability for scientific keypad, angle modes, and advanced functions."
tags: [cases, test-cases, scientific, trigonometry, okf-v0.2]
generated: { by: "process:implement", at: "2026-10-15T00:00:00Z" }
sources:
  - id: source-feature
    resource: ./feature.md
    title: Feature Specification
  - id: source-flow
    resource: ./flow.md
    title: User Flow
---

# Test Cases: Scientific Mode & Advanced Arithmetic

Authoritative test scenarios for the StayCalc scientific calculation mode. Grounded in `feature.md` invariants (`RULE-*` / `NEVER-*`) and `flow.md` decisions.

## 1. Universal Scenarios (11 Standard Types)

### `CASE-SCI-01`: Angle Mode Toggle & Persistence
- **Actor**: `StandardUser`
- **Preconditions**: Freshly instantiated `CalcEngine` (default `DEG`).
- **Action Sequence**: Query `getAngleMode()`, call `toggleAngleMode()`, verify mode is `RAD`, call again, verify `DEG`.
- **Expected Outcome**: Angle mode toggles cleanly without mutating active buffer or accumulator.
- **Enforces**: `RULE-CALC-003`, `NEVER-CALC-002`

### `CASE-SCI-02`: Trigonometric Functions in Degree Mode (DEG)
- **Actor**: `StandardUser`
- **Preconditions**: Engine in `DEG` mode.
- **Action Sequence**: Evaluate `sin(30)` -> `0.5`, `cos(60)` -> `0.5`, `tan(45)` -> `1`, `cos(90)` -> `0`, `sin(90)` -> `1`.
- **Expected Outcome**: Normalized decimal values with zero floating-point noise (`0.5`, `1`, `0`).
- **Enforces**: `RULE-CALC-002`, `RULE-CALC-003`

### `CASE-SCI-03`: Trigonometric Functions in Radian Mode (RAD)
- **Actor**: `StandardUser`
- **Preconditions**: Engine toggled to `RAD` mode.
- **Action Sequence**: Input `0`, press `cos` -> `1`; input `0`, press `sin` -> `0`. Input `pi`, press `cos` -> `-1`.
- **Expected Outcome**: Correct radian trigonometric evaluations.
- **Enforces**: `RULE-CALC-003`

### `CASE-SCI-04`: Power Operations (`x^y` and `x²`)
- **Actor**: `StandardUser`
- **Preconditions**: Number in buffer (`2`).
- **Action Sequence**: Evaluate `2` -> `xʸ` -> `3` -> `=` (yields `8`); `5` -> `x²` (yields `25`).
- **Expected Outcome**: Correct exponential calculations; results normalized without dynamic eval.
- **Enforces**: `RULE-CALC-002`, `NEVER-CALC-001`

### `CASE-SCI-05`: Square Root (`√`) and Reciprocal (`1/x`)
- **Actor**: `StandardUser`
- **Preconditions**: Number in buffer (`16`, `4`).
- **Action Sequence**: Input `16`, press `√` -> `4`; input `4`, press `1/x` -> `0.25`.
- **Expected Outcome**: Correct unary root and reciprocal calculations.
- **Enforces**: `RULE-CALC-002`

### `CASE-SCI-06`: Logarithms (`ln` and `log`)
- **Actor**: `StandardUser`
- **Preconditions**: Number in buffer (`1`, `100`, `e`).
- **Action Sequence**: Input `1`, press `ln` -> `0`; input `100`, press `log` -> `2`; insert `e`, press `ln` -> `1`.
- **Expected Outcome**: Natural and common logarithms evaluated correctly.
- **Enforces**: `RULE-CALC-002`

### `CASE-SCI-07`: Mathematical Constants (`π` and `e`)
- **Actor**: `StandardUser`
- **Preconditions**: Engine unlocked.
- **Action Sequence**: Press `π` -> buffer updates to high-precision pi (`3.1415926536`); press `e` -> buffer updates to `2.7182818285`.
- **Expected Outcome**: Constants inserted into active buffer, subsequent digit entry starts fresh operand.
- **Enforces**: `RULE-CALC-002`

### `CASE-SCI-08`: Domain Boundary Errors & Input Locking
- **Actor**: `StandardUser`
- **Preconditions**: Engine unlocked.
- **Action Sequence**: Input `-4`, press `√`; input `0`, press `ln`; input `-5`, press `log`; input `0`, press `1/x`.
- **Expected Outcome**: Non-real operations yield `"Invalid input"` and lock engine; `1/0` yields `"Cannot divide by zero"`. Locked engine rejects digit/operator entries until `clear()` or `allClear()`.
- **Enforces**: `RULE-CALC-001`, `RULE-CALC-009`, `NEVER-CALC-003`

### `CASE-SCI-09`: Collapsible Scientific Keypad Panel Toggle
- **Actor**: `StandardUser`
- **Preconditions**: `<stay-calc>` mounted.
- **Action Sequence**: Click `#scientific-toggle`.
- **Expected Outcome**: `#scientific-keypad` toggles `.open` class and display, `#scientific-toggle` synchronizes `aria-expanded` (`true`/`false`).
- **Enforces**: `DEC-SCI-01`

### `CASE-SCI-10`: Accessible Keyboard Navigation
- **Actor**: `StandardUser`
- **Preconditions**: Focus on scientific toggle or buttons.
- **Action Sequence**: Press keyboard keys (`^` for power), inspect `aria-label` on all scientific buttons.
- **Expected Outcome**: Visible focus rings, accessible names on all buttons, seamless keyboard power operator.
- **Enforces**: WCAG 2.2 AA

### `CASE-SCI-11`: Mobile Viewport Zero-Overflow
- **Actor**: `StandardUser`
- **Preconditions**: Viewport widths 320px, 375px, 390px.
- **Action Sequence**: Render `<stay-calc>` with scientific keypad open.
- **Expected Outcome**: `scrollWidth <= clientWidth`, zero horizontal overflow across all mobile viewports.
- **Enforces**: Mobile Responsive Invariant

## 2. Stall Matrix & Recovery

| Stall ID | Cause / Trigger | Manifestation | Resolution |
| :--- | :--- | :--- | :--- |
| `STL-SCI-01` | Sqrt of negative number | Display shows `"Invalid input"` | Press `C` or `AC` to unlock |
| `STL-SCI-02` | Logarithm of zero or negative | Display shows `"Invalid input"` | Press `C` or `AC` to unlock |
| `STL-SCI-03` | Reciprocal of zero | Display shows `"Cannot divide by zero"` | Press `C` or `AC` to unlock |
| `STL-SCI-04` | Tangent at 90° in DEG | Display shows `"Invalid input"` | Press `C` or `AC` to unlock |
| `STL-SCI-05` | Rapid keypad toggling | No visual artifact | Pure boolean state toggle |
