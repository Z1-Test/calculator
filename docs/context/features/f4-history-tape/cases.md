---
type: Cases
title: "F4: Calculation History Tape Test Scenarios"
description: "Universal test cases verifying history recording, FIFO 100-limit, click-to-load, and clear actions."
status: stable
tags: [cases, history, tape, f4]
generated: { by: "factory:planner", at: "2026-10-13T14:13:00Z" }
sources:
  - id: source-feature
    resource: docs/context/features/f4-history-tape/feature.md
    title: F4 Feature Specification
---

# Test Scenarios: Calculation History Tape (F4)

## 1. Universal Cases

1. **`CASE-F4-001` (Initial Empty State)**: History starts empty (`count() === 0`), empty indicator rendered.
2. **`CASE-F4-002` (Add Record on Calculation)**: Calculating `12 * 4 = 48` creates entry with expression `"12 * 4"` and result `"48"`.
3. **`CASE-F4-003` (Chronological Ordering)**: Subsequent calculations prepend to history so newest is first.
4. **`CASE-F4-004` (FIFO 100-Cap Limit)**: Appending 105 calculations retains exactly 100 entries; oldest 5 are pruned (`RULE-CALC-005`).
5. **`CASE-F4-005` (Click-to-Load)**: Selecting an entry reloads its result into active display buffer.
6. **`CASE-F4-006` (Chained Math on Loaded Result)**: Clicking an entry with result `"48"`, then pressing `+ 2 =` evaluates to `"50"`.
7. **`CASE-F4-007` (Clear History Action)**: Invoking `clear()` resets history count to `0`.
8. **`CASE-F4-008` (No Record on Error)**: Evaluating `10 / 0` (Cannot divide by zero) does NOT append record to history tape.
9. **`CASE-F4-009` (Drawer Visibility Toggle)**: Drawer open/close state toggles on button click.
10. **`CASE-F4-010` (Decimal Precision in Tape)**: Calculating `0.1 + 0.2 =` records clean result `"0.3"`.
11. **`CASE-F4-011` (Memory Independence)**: Clearing history does not alter memory register value.
