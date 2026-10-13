---
type: Cases
title: "F1: Precision Arithmetic Engine Test Scenarios"
description: "Universal test cases, edge cases, floating point precision assertions, and stall scenarios for F1."
status: stable
tags: [cases, engine, arithmetic, f1]
generated: { by: "factory:planner", at: "2026-10-13T14:00:00Z" }
sources:
  - id: source-feature
    resource: docs/context/features/f1-precision-engine/feature.md
    title: F1 Feature Specification
---

# Test Scenarios: Precision Arithmetic Engine (F1)

## 1. Universal Cases

1. **`CASE-F1-001` (Basic Addition)**: `2 + 3 =` $\to$ displays `"5"`.
2. **`CASE-F1-002` (Basic Subtraction)**: `10 - 4 =` $\to$ displays `"6"`.
3. **`CASE-F1-003` (Basic Multiplication)**: `7 * 6 =` $\to$ displays `"42"`.
4. **`CASE-F1-004` (Basic Division)**: `84 / 2 =` $\to$ displays `"42"`.
5. **`CASE-F1-005` (Floating Point Precision Normalization)**:
   - `0.1 + 0.2 =` $\to$ displays `"0.3"` (NOT `0.30000000000000004`).
   - `0.7 + 0.1 =` $\to$ displays `"0.8"` (NOT `0.7999999999999999`).
6. **`CASE-F1-006` (Sequential Immediate Execution)**: `2 + 3 * 4 =` $\to$ displays `"20"` (`(2 + 3) * 4`), not `14`.
7. **`CASE-F1-007` (Division by Zero Safeguard)**:
   - `10 / 0 =` $\to$ displays `"Cannot divide by zero"`, sets `hasError: true`.
   - Further numeric keys (e.g. `5`) are ignored while locked in error.
8. **`CASE-F1-008` (Operator Replacement)**:
   - `5 + * 2 =` $\to$ evaluated as `5 * 2 = 10`.
   - `9 - + 3 =` $\to$ evaluated as `9 + 3 = 12`.
9. **`CASE-F1-009` (Clear Entry vs All Clear)**:
   - `5 + 9 [C] 4 =` $\to$ evaluates as `5 + 4 = 9`.
   - `5 + 9 [AC]` $\to$ full reset: display `"0"`, accumulator `null`, operator `null`.
10. **`CASE-F1-010` (Percentage)**: `50 + 10 % =` $\to$ `50 + 5 = 55` or `50 %` $\to$ `0.5`.
11. **`CASE-F1-011` (Toggle Sign)**: `42 [+/-]` $\to$ `"-42"`, `"-42" [+/-]` $\to$ `"42"`.

## 2. Stalls & Boundary Cases

- **`STALL-F1-001` (Multiple Decimal Points)**: Entering `1 . 2 . 3` results in `"1.23"` (second decimal point ignored).
- **`STALL-F1-002` (Leading Zeroes)**: Entering `0 0 7` results in `"7"`.
- **`STALL-F1-003` (Chained Equals)**: Pressing `=` repeatedly does not throw or corrupt state.
