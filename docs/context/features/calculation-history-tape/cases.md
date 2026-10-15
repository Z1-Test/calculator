---
type: Test Cases
title: "Calculation History Tape Test Cases"
status: stable
description: "Unified test scenarios, 11 universal cases, stall matrix, and traceability for calculation history tape and interactive recall drawer."
tags: [cases, test-cases, history, drawer, recall, okf-v0.2]
generated: { by: "process:implement", at: "2026-10-15T00:00:00Z" }
sources:
  - id: source-feature
    resource: ./feature.md
    title: Feature Specification
  - id: source-flow
    resource: ./flow.md
    title: User Flow
---

# Test Cases: Calculation History Tape

Authoritative test scenarios for StayCalc calculation history tape, FIFO eviction limit (50 entries), interactive recall, drawer panel UI, and accessibility integration. Grounded in `feature.md` invariants (`RULE-*` / `NEVER-*`) and `flow.md` decisions.

---

## 1. Universal Scenarios (11 Standard Types)

### `CASE-HIST-01`: Happy Path Calculation Recording on Calculate (`=`)
- **Actor**: `StandardUser`
- **Preconditions**: Freshly initialized `CalcEngine` (`getHistory().length === 0`).
- **Action Sequence / Input**: Input `2` -> `+` -> `3` -> `calculate()`.
- **Expected Outcome**: `getHistory()` contains 1 entry with `expression: "2 + 3 = 5"`, `operand1: 2`, `operator: "+"`, `operand2: 3`, `result: 5`.
- **Enforces**: `RULE-CALC-005`, `NEVER-CALC-001`, `SEAM-HIST-02`

### `CASE-HIST-02`: Chained Evaluation History Recording
- **Actor**: `StandardUser`
- **Preconditions**: Freshly initialized `CalcEngine`.
- **Action Sequence / Input**: Input `1` -> `0` -> `+` -> `5` -> `*` -> `2` -> `=`.
- **Expected Outcome**: History tape contains 2 records: first `10 + 5 = 15`, second `15 * 2 = 30`.
- **Enforces**: `RULE-CALC-005`, `SEAM-HIST-02`

### `CASE-HIST-03`: Error State Safeguard (Division by Zero Rejected)
- **Actor**: `StandardUser`
- **Preconditions**: Engine in initial clean state.
- **Action Sequence / Input**: Input `8` -> `/` -> `0` -> `calculate()`.
- **Expected Outcome**: Engine displays `"Cannot divide by zero"`, locks in error state, and records 0 entries in `getHistory()`.
- **Enforces**: `NEVER-CALC-007`, `DEC-HIST-03`

### `CASE-HIST-04`: Bounded History Capacity & FIFO Eviction (Max 50 Entries)
- **Actor**: `StandardUser`
- **Preconditions**: Engine in initial state.
- **Action Sequence / Input**: Perform 55 sequential calculations (`1 + 1 = 2`, `2 + 1 = 3`, ..., `55 + 1 = 56`).
- **Expected Outcome**: `getHistory().length` strictly equals 50. First entry is `6 + 1 = 7`, and the oldest 5 entries are pruned via FIFO eviction.
- **Enforces**: `RULE-CALC-005`, `DEC-HIST-02`

### `CASE-HIST-05`: Interactive Result Recall into Active Register
- **Actor**: `StandardUser`
- **Preconditions**: Engine contains past calculation `12 + 13 = 25`.
- **Action Sequence / Input**: Invoke `recallHistory(0)`.
- **Expected Outcome**: Active buffer updates to `"25"`, `isWaitingForOperand` becomes `false`, allowing immediate chaining with subsequent operator (e.g. `+ 5 = 30`).
- **Enforces**: `SEAM-HIST-03`, `RULE-UI-011`

### `CASE-HIST-06`: Out-of-Bounds Recall Safety
- **Actor**: `StandardUser`
- **Preconditions**: Engine with 1 history entry, current display `"7"`.
- **Action Sequence / Input**: Invoke `recallHistory(-1)` or `recallHistory(99)`.
- **Expected Outcome**: Engine returns `null`, display remains `"7"`, active buffer is unaltered, no error is thrown.
- **Enforces**: `REC-HIST-01`

### `CASE-HIST-07`: History Persistence Across Clear Entry (`C`) and All Clear (`AC`)
- **Actor**: `StandardUser`
- **Preconditions**: Engine contains 3 recorded calculations.
- **Action Sequence / Input**: Input `4` -> `5` -> `clear()` (`C`), verify history; then `allClear()` (`AC`), verify history.
- **Expected Outcome**: `getHistory().length` remains 3 across both `C` and `AC` calls.
- **Enforces**: `NEVER-CALC-008`

### `CASE-HIST-08`: Clear History Operation
- **Actor**: `StandardUser`
- **Preconditions**: Engine contains recorded calculations.
- **Action Sequence / Input**: Invoke `clearHistory()`.
- **Expected Outcome**: `getHistory().length` resets to 0. `getState().history` is empty array `[]`.
- **Enforces**: `EXT-HIST-02`

### `CASE-HIST-09`: Drawer Open/Close Toggle & ARIA Synchronization in `<stay-calc>`
- **Actor**: `StandardUser`
- **Preconditions**: `<stay-calc>` mounted in DOM.
- **Action Sequence / Input**: Click `#history-toggle` -> verify open -> click `#history-toggle` -> verify closed.
- **Expected Outcome**: `#history-drawer` gains/loses `open` class; `#history-toggle` reflects `aria-expanded="true"` and `"false"`.
- **Enforces**: `RULE-UI-010`, `EXT-HIST-03`

### `CASE-HIST-10`: Keyboard Recall Activation (`Enter` and `Space`)
- **Actor**: `StandardUser`
- **Preconditions**: `<stay-calc>` with history entry in open drawer.
- **Action Sequence / Input**: Focus history item -> dispatch `keydown` with key `"Enter"`, then with key `" "`.
- **Expected Outcome**: History item result is recalled into display value `"25"`.
- **Enforces**: `RULE-UI-011`, `SEAM-HIST-03`

### `CASE-HIST-11`: Mobile Zero-Overflow Bounds Across 320px–390px Viewports
- **Actor**: `StandardUser`
- **Preconditions**: Drawer open with long expressions (e.g. `123456789.98765 + 987654321 = 1111111110.98765`).
- **Action Sequence / Input**: Measure container and drawer styling.
- **Expected Outcome**: Drawer and items declare `max-width: 100%`, `box-sizing: border-box`, `overflow-x: hidden`, ensuring `scrollWidth <= clientWidth`.
- **Enforces**: `RULE-UI-009`

---

## 2. Stall & Edge Case Matrix

| Stall ID | Scenario | Trigger Condition | System Stall / Failure Mode | Mitigating Invariant |
| :--- | :--- | :--- | :--- | :--- |
| `STL-HIST-01` | Recall with Empty History | User clicks recall on empty tape | Buffer corrupted with `undefined` | Guard checks bounds, returns `null` (`REC-HIST-01`) |
| `STL-HIST-02` | Division by Zero Attempt | Evaluation triggers `n / 0` | Corrupted NaN record in history | Calculation rejected from history tape (`NEVER-CALC-007`) |
| `STL-HIST-03` | Rapid Sequential Calculations | User completes >50 calculations quickly | Memory leak from unbounded array | Strict 50-entry FIFO eviction (`RULE-CALC-005`) |
| `STL-HIST-04` | Long Expression Overflow | Numbers with 10 decimal digits | Horizontal scrollbar on 320px screen | Text wraps and truncates with tabular digits (`RULE-UI-009`) |
| `STL-HIST-05` | Clear Button on Empty History | User clicks `#history-clear` when empty | Crash or unhandled null | Idempotent clear: history remains empty array (`CASE-HIST-08`) |
| `STL-HIST-06` | Consecutive Calculate Presses | User presses `=` repeatedly | Duplicate records created | Calculate when no pending operator does not append (`CASE-HIST-01`) |
| `STL-HIST-07` | Recall During Pending Operator | User has `5 +` and recalls `8` | Operator erased or overwritten | Recalled value becomes active second operand: `5 + 8` (`CASE-HIST-05`) |
| `STL-HIST-08` | Drawer Keyboard Escape | User presses `Escape` with drawer open | User trapped in drawer | Keypad handler or toggle cleanly unbinds focus (`RULE-UI-010`) |
| `STL-HIST-09` | Recall while Engine Locked | Engine locked in "Cannot divide by zero" | Invalid operand recalled over error | Guard checks `if (this.isLocked) return null;` (`NEVER-CALC-006`) |
| `STL-HIST-10` | Non-Integer Index Recall | Consumer passes `NaN` or non-integer index | Array index access error | Guard checks `Number.isInteger(index)` (`CASE-HIST-06`) |
| `STL-HIST-11` | Clear Entry (C) Misconception | User presses `C` expecting history wipe | User confused or history accidentally cleared | History persists; only `#history-clear` wipes tape (`NEVER-CALC-008`) |
| `STL-HIST-12` | Unmounted Component Event Leak | Element removed from DOM while drawer open | Memory leak from event handlers | Lifecycle unbinds all delegated and global listeners (`RULE-UI-008`) |
