---
type: Test Cases
title: "Formula Expression Display & Parentheses Precedence Test Cases"
status: stable
description: "Unified verification scenarios, 11 universal cases, stall recovery matrix, and traceability for formula display bar and parentheses engine."
tags: [cases, test-cases, expression, parentheses, bodmas, okf-v0.2]
generated: { by: "process:implement", at: "2026-10-15T00:00:00Z" }
sources:
  - id: source-feature
    resource: ./feature.md
    title: Feature Specification
  - id: source-flow
    resource: ./flow.md
    title: User Flow
---

# Test Cases: Formula Expression Display & Parentheses Precedence

Authoritative test scenarios for the StayCalc formula expression display bar and parentheses precedence engine. Grounded in `feature.md` invariants (`RULE-*` / `NEVER-*`) and `flow.md` decisions.

## 1. Universal Scenarios (11 Standard Types)

### `CASE-EXPR-01`: Live Formula Expression Display Bar Real-Time Rendering
- **Actor**: `StandardUser`
- **Preconditions**: Initialized `<stay-calc>` element.
- **Action Sequence**: Input `2`, `+`, `3`. Inspect `#expression-display` textContent.
- **Expected Outcome**: `#expression-display` contains `"2 + 3"`, reflecting ongoing expression context.
- **Enforces**: `RULE-CALC-011`

### `CASE-EXPR-02`: Multi-Level Nested Parentheses Evaluation
- **Actor**: `StandardUser`
- **Preconditions**: Initialized `CalcEngine`.
- **Action Sequence**: Enter `(`, `(`, `2`, `+`, `3`, `)`, `*`, `2`, `)`, press `=`.
- **Expected Outcome**: Result evaluates to `10` (`((2 + 3) * 2) = 10`).
- **Enforces**: `RULE-CALC-010`

### `CASE-EXPR-03`: Algebraic Operator Precedence (BODMAS/PEMDAS)
- **Actor**: `StandardUser`
- **Preconditions**: Initialized `CalcEngine`.
- **Action Sequence**: Evaluate algebraic expression `2 + 3 * 4` via `evaluateExpression`.
- **Expected Outcome**: Evaluates to `14` (`2 + 12 = 14`), strictly prioritizing multiplication over addition with precision normalization.
- **Enforces**: `RULE-CALC-002`, `RULE-CALC-010`, `NEVER-CALC-001`

### `CASE-EXPR-04`: Unclosed Parentheses Auto-Balancing on Equals
- **Actor**: `StandardUser`
- **Preconditions**: Initialized `CalcEngine`.
- **Action Sequence**: Input `2`, `*`, `(`, `3`, `+`, `4`, press `=`.
- **Expected Outcome**: Open parenthesis auto-closes to `2 * (3 + 4)` yielding `14` without syntax crash.
- **Enforces**: `RULE-CALC-010`

### `CASE-EXPR-05`: Dedicated Parentheses Keypad Button Clicks
- **Actor**: `StandardUser`
- **Preconditions**: `<stay-calc>` rendered in Shadow DOM.
- **Action Sequence**: Click `button[data-action="paren"][data-value="("]` and `button[data-action="paren"][data-value=")"]`.
- **Expected Outcome**: Dispatches paren actions to `CalcEngine` and updates `#expression-display`.
- **Enforces**: `RULE-CALC-010`, `RULE-CALC-011`

### `CASE-EXPR-06`: Physical Keyboard Event Mapping for `(` and `)`
- **Actor**: `StandardUser`
- **Preconditions**: Focused `<stay-calc>` interface.
- **Action Sequence**: Dispatch keydown event with `key: "("` and `key: ")"`.
- **Expected Outcome**: Maps correctly to `inputParenthesis` actions and appends tokens.
- **Enforces**: `RULE-CALC-010`

### `CASE-EXPR-07`: Division by Zero Inside Parentheses Safeguard
- **Actor**: `StandardUser`
- **Preconditions**: Initialized `CalcEngine`.
- **Action Sequence**: Evaluate `10 / (5 - 5)` and press `=`.
- **Expected Outcome**: Engine locks in error state displaying `"Cannot divide by zero"`.
- **Enforces**: `RULE-CALC-001`, `NEVER-CALC-003`

### `CASE-EXPR-08`: Mismatched Closing Parenthesis Rejection
- **Actor**: `StandardUser`
- **Preconditions**: Initialized `CalcEngine` (`parenDepth === 0`).
- **Action Sequence**: Attempt to input `)` when `parenDepth === 0`.
- **Expected Outcome**: Input rejected, expression buffer unchanged, no unbalanced closing paren added.
- **Enforces**: `RULE-CALC-010`

### `CASE-EXPR-09`: Backspace Synchronization with Expression Tokens
- **Actor**: `StandardUser`
- **Preconditions**: Expression with open parenthesis `(` entered.
- **Action Sequence**: Invoke `backspace()`.
- **Expected Outcome**: Trailing paren removed, `parenDepth` decremented from `1` to `0`.
- **Enforces**: `RULE-CALC-011`

### `CASE-EXPR-10`: Clear (`C`) vs All Clear (`AC`) Synchronization
- **Actor**: `StandardUser`
- **Preconditions**: Ongoing formula `2 * (3 + 4)`.
- **Action Sequence**: Press `C` (clears active operand buffer); press `AC` (clears entire expression and resets `parenDepth` to `0`).
- **Expected Outcome**: `C` keeps previous tokens and memory registers; `AC` resets `#expression-display` to empty string without losing memory or history.
- **Enforces**: `RULE-CALC-011`, `NEVER-CALC-002`

### `CASE-EXPR-11`: Mobile Viewport Zero-Overflow Bounds (320px–390px)
- **Actor**: `StandardUser`
- **Preconditions**: Long formula expression entered.
- **Action Sequence**: Inspect `#expression-display` on 320px, 375px, and 390px viewport widths.
- **Expected Outcome**: CSS text-overflow ellipsis active, `scrollWidth <= clientWidth`, zero horizontal overflow.
- **Enforces**: `RULE-CALC-011`

## 2. Stall Recovery & Edge Case Matrix

| Stall ID | Scenario | Root Cause | System Response |
| :--- | :--- | :--- | :--- |
| `STL-EXPR-01` | Mismatched closing paren | User presses `)` at root level | Input ignored; `parenDepth` remains `0` |
| `STL-EXPR-02` | Unclosed paren on equals | User omits closing parens | Auto-append matching `)` tokens and evaluate |
| `STL-EXPR-03` | Division by zero in paren | Denominator evaluates to `0` | Lock engine, display `"Cannot divide by zero"` |
| `STL-EXPR-04` | Long expression string | Many nested terms entered | Ellipsis truncation; mobile `scrollWidth <= clientWidth` |
