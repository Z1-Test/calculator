---
type: Test Cases
title: "Precision Arithmetic Engine Test Cases"
status: stable
description: "Unified test scenarios, 11 universal cases, stall matrix, and traceability for precision arithmetic engine."
tags: [cases, test-cases, arithmetic, okf-v0.2]
generated: { by: "process:implement", at: "2026-10-15T00:00:00Z" }
sources:
  - id: source-feature
    resource: ./feature.md
    title: Feature Specification
  - id: source-flow
    resource: ./flow.md
    title: User Flow
---

# Test Cases: Precision Arithmetic Engine

Authoritative test scenarios for the precision arithmetic engine. Grounded in `feature.md` invariants (`RULE-*` / `NEVER-*`) and `flow.md` decisions.

---

## 1. Universal Scenarios (11 Standard Types)

### `CASE-CALC-01`: Happy Path Sequential Arithmetic Evaluation
- **Actor**: `StandardUser`
- **Preconditions**: Engine in initial clean state (`accumulator = null`, `currentBuffer = "0"`).
- **Action Sequence / Input**: `2` -> `+` -> `3` -> `*` -> `4` -> `=`.
- **Expected Outcome**: Immediate left-to-right evaluation: `2 + 3 = 5`, then `5 * 4 = 20`. Returns `20`.
- **Enforces**: `RULE-CALC-002`, `RULE-CALC-007`

### `CASE-CALC-02`: Empty State & Initial Buffer
- **Actor**: `StandardUser`
- **Preconditions**: Freshly instantiated `CalcEngine`.
- **Action Sequence / Input**: Query initial display before any input.
- **Expected Outcome**: Returns display `"0"`, `isLocked = false`, `errorMessage = null`.
- **Enforces**: `RULE-CALC-008`

### `CASE-CALC-03`: Error State Guard (Input Lock on Division by Zero)
- **Actor**: `StandardUser`
- **Preconditions**: Engine locked after division by zero (`isLocked = true`).
- **Action Sequence / Input**: Input digit `5`, operator `+`, or `=`.
- **Expected Outcome**: Engine rejects inputs with no-op; retains error display `"Cannot divide by zero"` until `C` or `AC` is pressed.
- **Enforces**: `RULE-CALC-001`, `NEVER-CALC-004`

### `CASE-CALC-04`: Mid-Flow Operator Replacement
- **Actor**: `StandardUser`
- **Preconditions**: First operand entered and operator pending.
- **Action Sequence / Input**: `5` -> `+` -> `*` -> `2` -> `=`.
- **Expected Outcome**: Consecutive `*` replaces `+` without evaluating; calculates `5 * 2 = 10`. Returns `10`.
- **Enforces**: `RULE-CALC-007`, `DEC-CALC-02`

### `CASE-CALC-05`: Idempotency of Repeated Equals and Redundant Decimals
- **Actor**: `StandardUser`
- **Preconditions**: Valid number in buffer (`5.2`).
- **Action Sequence / Input**: Input `.` again, or press `=` repeatedly after evaluation.
- **Expected Outcome**: Redundant `.` is ignored (`5.2`); repeated `=` preserves computed result without drift.
- **Enforces**: `RULE-CALC-002`, `DEC-CALC-03`

### `CASE-CALC-06`: Division by Zero Trap & Protection
- **Actor**: `StandardUser`
- **Preconditions**: Non-zero or zero numerator entered.
- **Action Sequence / Input**: `5` -> `/` -> `0` -> `=`.
- **Expected Outcome**: Traps zero division; sets `errorMessage = "Cannot divide by zero"`, `isLocked = true`. Returns error string.
- **Enforces**: `RULE-CALC-001`, `NEVER-CALC-001`

### `CASE-CALC-07`: Decimal Precision Normalization (IEEE-754 Mitigation)
- **Actor**: `StandardUser`
- **Preconditions**: Engine unlocked.
- **Action Sequence / Input**: `0.1` -> `+` -> `0.2` -> `=`.
- **Expected Outcome**: Returns clean `"0.3"` without IEEE-754 precision leakage (`0.30000000000000004`).
- **Enforces**: `RULE-CALC-002`

### `CASE-CALC-08`: Clear Entry (`C`) vs All Clear (`AC`) Register Reset
- **Actor**: `StandardUser`
- **Preconditions**: Chained calculation in progress (`10 + 4`).
- **Action Sequence / Input**:
  - Sub-test 1: Press `C` -> Buffer resets to `"0"`, pending accumulator (`10`) and operator (`+`) remain. Entering `5` -> `=` yields `15`.
  - Sub-test 2: From `10 + 4`, press `AC` -> Wipes all registers. Entering `5` -> `=` yields `5`.
- **Enforces**: `RULE-CALC-008`, `REC-CALC-01`, `REC-CALC-02`

### `CASE-CALC-09`: Long Chained Arithmetic Chaining
- **Actor**: `StandardUser`
- **Preconditions**: Fresh engine.
- **Action Sequence / Input**: `1` -> `+` -> `2` -> `+` -> `3` -> `+` -> `4` -> `+` -> `5` -> `=`.
- **Expected Outcome**: Returns `15` with accurate sequential accumulator evaluation.
- **Enforces**: `RULE-CALC-002`

### `CASE-CALC-10`: Decimal Input Formatting & Leading Zero
- **Actor**: `StandardUser`
- **Preconditions**: Initial state `"0"`.
- **Action Sequence / Input**:
  - Sub-test 1: Multiple leading zeros `0` -> `0` -> `0` -> Buffer remains `"0"`.
  - Sub-test 2: `.` pressed on empty/zero buffer -> Buffer becomes `"0."`.
  - Sub-test 3: `5.` -> `+` -> `2` -> Buffer parsed cleanly as `5 + 2 = 7`.
- **Enforces**: `DEC-CALC-03`

### `CASE-CALC-11`: Status and Error Propagation
- **Actor**: `StandardUser`
- **Preconditions**: Arithmetic error state or normal evaluation.
- **Action Sequence / Input**: Query `getState()` after operations.
- **Expected Outcome**: Returns accurate state snapshot `{ display, accumulator, pendingOperator, isLocked, errorMessage }`.
- **Enforces**: `SEAM-CALC-02`

---

## 2. Lived-System Stall Table

| Stall ID | Stall Category | Trigger Condition | System Behavior | Recovery Mechanism |
| :--- | :--- | :--- | :--- | :--- |
| `STL-CALC-01` | Zero Division | Divisor input is `0` on `/` | Locks engine with `"Cannot divide by zero"` | Press `C` to re-enter divisor or `AC` to restart |
| `STL-CALC-02` | Rapid Operator Taps | User presses `+` then `*` quickly | Overwrites pending operator to `*` without computing | Continue entering next operand digits |
| `STL-CALC-03` | Redundant Decimal | User presses `.` multiple times | Drops extra decimal inputs | Valid decimal string preserved in buffer |
| `STL-CALC-04` | Locked Keypress | User attempts digits while locked in error | Ignores input; prevents corrupted accumulator | User must press `C` or `AC` |

---

## 3. Trace Matrix

| Test Case | Governing Rules | Decision Points | Recovery Paths |
| :--- | :--- | :--- | :--- |
| `CASE-CALC-01` | `RULE-CALC-002`, `RULE-CALC-007` | `DEC-CALC-02` | N/A |
| `CASE-CALC-02` | `RULE-CALC-008` | `DEC-CALC-01` | N/A |
| `CASE-CALC-03` | `RULE-CALC-001`, `NEVER-CALC-004` | `DEC-CALC-01` | `REC-CALC-01` |
| `CASE-CALC-04` | `RULE-CALC-007` | `DEC-CALC-02` | N/A |
| `CASE-CALC-05` | `RULE-CALC-002` | `DEC-CALC-03` | N/A |
| `CASE-CALC-06` | `RULE-CALC-001`, `NEVER-CALC-001` | `DEC-CALC-01`, `DEC-CALC-02` | `REC-CALC-01`, `REC-CALC-02` |
| `CASE-CALC-07` | `RULE-CALC-002` | `DEC-CALC-02` | N/A |
| `CASE-CALC-08` | `RULE-CALC-008` | `DEC-CALC-01` | `REC-CALC-01`, `REC-CALC-02` |
| `CASE-CALC-09` | `RULE-CALC-002` | `DEC-CALC-02` | N/A |
| `CASE-CALC-10` | `RULE-CALC-002` | `DEC-CALC-03` | N/A |
| `CASE-CALC-11` | `RULE-CALC-001`, `RULE-CALC-002` | `DEC-CALC-01` | N/A |

---

## 4. Justified Cases N/A

- **Network Drops / Offline Sync**: N/A for pure in-memory client-side math engine executing synchronously.
- **Multi-Tenant Permissions / RBAC**: N/A for client-side calculator without tenant access boundaries.
- **Server Webhooks / Latency Timeouts**: N/A for local arithmetic operations completing within 1ms.
