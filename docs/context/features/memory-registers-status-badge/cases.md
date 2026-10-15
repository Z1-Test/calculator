---
type: Test Cases
title: "Memory Registers and Status Badge Test Cases"
status: stable
description: "Unified test scenarios, 11 universal cases, stall matrix, and traceability for memory registers and active status badge."
tags: [cases, test-cases, memory, status-badge, okf-v0.2]
generated: { by: "process:implement", at: "2026-10-15T00:00:00Z" }
sources:
  - id: source-feature
    resource: ./feature.md
    title: Feature Specification
  - id: source-flow
    resource: ./flow.md
    title: User Flow
---

# Test Cases: Memory Registers and Status Badge

Authoritative test scenarios for StayCalc discrete memory registers (`M+`, `M-`, `MR`, `MC`), visual status badge indicator, and keypad integration. Grounded in `feature.md` invariants (`RULE-*` / `NEVER-*`) and `flow.md` decisions.

---

## 1. Universal Scenarios (11 Standard Types)

### `CASE-MEM-01`: Happy Path Memory Accumulation (`M+`) and Recall (`MR`)
- **Actor**: `StandardUser`
- **Preconditions**: Freshly initialized `CalcEngine` (`hasMemory() === false`).
- **Action Sequence / Input**: Input `1` -> `5` -> `memoryAdd()` -> input `2` -> `5` -> `memoryAdd()` -> `clear()` -> `memoryRecall()`.
- **Expected Outcome**: Memory register equals `40`. Recalled display shows `"40"`, `hasMemory() === true`.
- **Enforces**: `RULE-CALC-006`, `RULE-CALC-009`, `SEAM-MEM-01`

### `CASE-MEM-02`: Empty State & Initial Memory Register
- **Actor**: `StandardUser`
- **Preconditions**: Initial engine state.
- **Action Sequence / Input**: Query `hasMemory()` and `getMemoryValue()` before any memory interaction.
- **Expected Outcome**: `hasMemory()` returns `false`, `getMemoryValue()` returns `0`. Display shows `"0"`.
- **Enforces**: `RULE-CALC-006`, `SEAM-MEM-02`

### `CASE-MEM-03`: Error State Guard (Memory Mutation Rejected when Locked)
- **Actor**: `StandardUser`
- **Preconditions**: Engine locked after division by zero (`isLocked = true`).
- **Action Sequence / Input**: Invoke `memoryAdd()`, `memorySubtract()`, `memoryRecall()`.
- **Expected Outcome**: Engine rejects memory mutations with no-op; memory remains `0`, `hasMemory()` remains `false`, display retains error message.
- **Enforces**: `NEVER-CALC-006`, `DEC-MEM-01`

### `CASE-MEM-04`: Memory Subtraction (`M-`) and Zero Transition
- **Actor**: `StandardUser`
- **Preconditions**: Memory holds value `50` (`hasMemory() === true`).
- **Action Sequence / Input**: Input `5` -> `0` -> `memorySubtract()`.
- **Expected Outcome**: Memory register transitions to exactly `0`. `hasMemory()` becomes `false`.
- **Enforces**: `RULE-CALC-006`, `DEC-MEM-02`

### `CASE-MEM-05`: Memory Recall Chained Operation (`5 + MR =`)
- **Actor**: `StandardUser`
- **Preconditions**: Memory register holds `25`.
- **Action Sequence / Input**: Input `5` -> `+` -> `memoryRecall()` -> `calculate()`.
- **Expected Outcome**: Recalled operand `25` correctly evaluates with pending operator `+` yielding `30`.
- **Enforces**: `DEC-MEM-03`, `SEAM-MEM-01`

### `CASE-MEM-06`: Memory Persistence Across Clear (`C`) and All Clear (`AC`)
- **Actor**: `StandardUser`
- **Preconditions**: Memory holds value `100`.
- **Action Sequence / Input**: Input `9` -> `9` -> invoke `clear()` (`C`), verify memory, then invoke `allClear()` (`AC`), verify memory.
- **Expected Outcome**: Active calculation buffer resets to `"0"`, but memory register remains `100` and `hasMemory() === true`.
- **Enforces**: `RULE-CALC-006`, `NEVER-CALC-005`

### `CASE-MEM-07`: Memory Clear (`MC`) Operation
- **Actor**: `StandardUser`
- **Preconditions**: Memory register holds `88`.
- **Action Sequence / Input**: Invoke `memoryClear()`.
- **Expected Outcome**: Memory register resets to `0`, `hasMemory()` evaluates to `false`.
- **Enforces**: `RULE-CALC-006`, `EXT-MEM-02`

### `CASE-MEM-08`: Float Precision Normalization in Memory Accumulator
- **Actor**: `StandardUser`
- **Preconditions**: Memory holds `0`.
- **Action Sequence / Input**: Input `0.1` -> `memoryAdd()` -> input `0.2` -> `memoryAdd()`.
- **Expected Outcome**: Memory register holds clean `0.3` without IEEE-754 representation noise (`0.30000000000000004`).
- **Enforces**: `RULE-CALC-002`, `RULE-CALC-009`

### `CASE-MEM-09`: Active Visual `M` Badge DOM Rendering & Toggle in `<stay-calc>`
- **Actor**: `StandardUser`
- **Preconditions**: `<stay-calc>` element mounted in DOM.
- **Action Sequence / Input**: Click `7` -> click `M+` -> verify badge -> click `MC` -> verify badge.
- **Expected Outcome**: `#memory-badge` gains `.active` class and displays (`inline-block`) after `M+`; loses `.active` and hides (`none`) after `MC`.
- **Enforces**: `RULE-UI-007`, `SEAM-MEM-02`

### `CASE-MEM-10`: Accessible Keypad Buttons (`MC`, `MR`, `M-`, `M+`)
- **Actor**: `StandardUser`
- **Preconditions**: `<stay-calc>` element mounted in DOM.
- **Action Sequence / Input**: Inspect `MC`, `MR`, `M-`, `M+` button elements in `#keypad-grid`.
- **Expected Outcome**: Buttons exist with descriptive `aria-label` attributes (`Memory Clear`, `Memory Recall`, `Memory Subtract`, `Memory Add`), 9999px border-radius, and `:focus-visible` outline styles.
- **Enforces**: `RULE-UI-008`, `RULE-UI-005`

### `CASE-MEM-11`: Consecutive Memory Operations Without Intervening Calculation
- **Actor**: `StandardUser`
- **Preconditions**: Display shows `10`.
- **Action Sequence / Input**: Click `M+` -> click `M+` -> click `M-`.
- **Expected Outcome**: Memory adds `10`, adds `10`, then subtracts `10`, resulting in `10`.
- **Enforces**: `RULE-CALC-006`, `RULE-CALC-009`

---

## 2. Stall & Edge Case Matrix

| Stall ID | Scenario | Trigger Condition | System Stall / Failure Mode | Mitigating Invariant |
| :--- | :--- | :--- | :--- | :--- |
| `STL-MEM-01` | Recall with Empty Memory | User clicks `MR` when memory is `0` | Buffer corrupted with `null` or `NaN` | Returns `"0"` safely; `hasMemory` remains `false` |
| `STL-MEM-02` | Sub-Penny Decimal Accumulation | Repeated `M+` of `0.0000000001` | Floating point drift | Precision normalized to 10 decimal digits (`RULE-CALC-009`) |
| `STL-MEM-03` | Memory Action in Error State | User clicks `M+` when display shows `"Cannot divide by zero"` | Error message parsed as `NaN` into memory | Guard checks `if (this.isLocked) return;` (`NEVER-CALC-006`) |
| `STL-MEM-04` | Keypad Layout Overflow | Adding memory row to 4-column keypad | Keypad overflows 320px viewport | Grid maintains `repeat(4, 1fr)` with 8px gap (`RULE-UI-006`) |
| `STL-MEM-05` | Consecutive Digit After Memory Add | User types `5`, clicks `M+`, then types `3` | Number becomes `53` instead of new operand `3` | `memoryAdd()` sets `isWaitingForOperand = true` |
| `STL-MEM-06` | Memory Subtract to Negative Number | Memory holds `10`, user subtracts `30` | Register underflow or unexpected sign | Memory correctly holds `-20`, `hasMemory()` remains `true` |
| `STL-MEM-07` | Slotted Custom Display Badge Sync | Consumer provides custom `<slot name="display">` | Slotted display misses badge updates | `updateDisplay()` queries `[data-memory-badge]` or `#memory-badge` in slotted DOM |
| `STL-MEM-08` | Memory Register State Export | Consumer calls `getState()` | State snapshot missing memory values | `getState()` includes `memory` and `hasMemory` |
| `STL-MEM-09` | Clear Entry Preserves Memory | User enters calculation with memory active, clicks `C` | Memory inadvertently wiped | `clear()` explicitly does not touch `this.memory` |
| `STL-MEM-10` | All Clear Preserves Memory | User clicks `AC` | Memory inadvertently wiped | `allClear()` explicitly does not touch `this.memory` |
| `STL-MEM-11` | Disconnected Custom Element | Memory button clicked while element unmounted | Memory leak or orphan event listeners | Event listeners properly bound/unbound on lifecycle hooks |
| `STL-MEM-12` | Memory Clear with Zero Value | User clicks `MC` when memory is already `0` | Unexpected state mutation or error | Idempotent operation: memory remains `0`, `hasMemory` remains `false` |
