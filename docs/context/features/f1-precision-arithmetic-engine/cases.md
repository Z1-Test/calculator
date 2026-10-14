---
type: Test Cases
title: "Precision Arithmetic Engine Test Cases & Lived-System Scenarios"
status: stable
description: "Unified test scenarios CASE-01 to CASE-11, 12-stall matrix, traceability chain, and N/A declarations for Precision Arithmetic Engine."
tags: [cases, test-cases, arithmetic-engine, okf-v0.2]
sources:
  - resource: ./feature.md
  - resource: ./flow.md
---

# Test Cases: Precision Arithmetic Engine

Authoritative test scenarios for the StayCalc arithmetic engine. Grounded in `docs/context/project/domain-rules.md`, Feature rules (`RULE-*` / `NEVER-*`), and Flow decisions.

---

## 1. Universal Scenarios (11 Standard Types)

### `CASE-01`: Happy Path Nominal Execution
- **Actor**: `GeneralUser`
- **Preconditions**: Initial engine state.
- **Action Sequence / Input**:
  - `2 + 3 =` -> `5`
  - `10 - 4 =` -> `6`
  - `6 * 7 =` -> `42`
  - `20 / 4 =` -> `5`
  - Sequential immediate execution: `2 + 3 * 4 =` -> `20`
- **Expected Outcome**: Operations evaluate sequentially left-to-right (`2 + 3` evaluates to `5`, then `5 * 4` evaluates to `20`) using deterministic mathematical functions without dynamic code evaluation (`eval` / `new Function`).
- **Enforces**: `RULE-CALC-007`, `NEVER-CALC-001`

### `CASE-02`: Empty State & First Use
- **Actor**: `GeneralUser`
- **Preconditions**: Engine fresh bootstrap or initial reset.
- **Action Sequence / Input**: Engine initialized via `new CalculatorEngine()`.
- **Expected Outcome**: `display` is `"0"`, `accumulator` is `null`, `pendingOperator` is `null`, `isLocked` is `false`, `error` is `null`.
- **Enforces**: `RULE-CALC-009`

### `CASE-03`: Error State & Input Lock (Division by Zero Safeguard)
- **Actor**: `GeneralUser`
- **Preconditions**: Operand `5` entered with pending division `/`.
- **Action Sequence / Input**: User enters `0`, presses `=`. Then attempts to press `7`, `+`, `=`.
- **Expected Outcome**: Display shows `"Cannot divide by zero"`, `isLocked` is `true`, `error` is `"Cannot divide by zero"`. Subsequent digit and operator inputs are ignored until `C` or `AC` is pressed, preventing exposure of `Infinity` or `NaN`.
- **Enforces**: `RULE-CALC-001`, `NEVER-CALC-004`

### `CASE-04`: Mid-Flow Operator Replacement
- **Actor**: `GeneralUser`
- **Preconditions**: User enters `5` and presses `+`.
- **Action Sequence / Input**: User immediately presses `*`, then enters `2` and presses `=`.
- **Expected Outcome**: Pending operator replaces `+` with `*` without intermediate calculation; evaluates `5 * 2 = 10`.
- **Enforces**: `RULE-CALC-008`

### `CASE-05`: Idempotency & Repeated Equals
- **Actor**: `GeneralUser`
- **Preconditions**: User performs `5 + 3 =` resulting in display `8`.
- **Action Sequence / Input**: User presses `=` repeatedly 3 additional times.
- **Expected Outcome**: Display remains `8` without throwing errors, duplicating state, or mutating accumulator unexpectedly.
- **Enforces**: `RULE-CALC-007`

### `CASE-06`: Precision Normalization (IEEE 754 Float Artifact Elimination)
- **Actor**: `GeneralUser`
- **Preconditions**: Engine in ready state.
- **Action Sequence / Input**:
  - `0.1 + 0.2 =` -> `"0.3"` (eliminates `0.30000000000000004`)
  - `0.7 + 0.1 =` -> `"0.8"` (eliminates `0.7999999999999999`)
  - `0.3 - 0.2 =` -> `"0.1"`
  - `0.1 * 0.2 =` -> `"0.02"`
  - `0.3 / 0.1 =` -> `"3"`
- **Expected Outcome**: Truncates representation noise to clean decimal representation adhering to `RULE-CALC-002`.
- **Enforces**: `RULE-CALC-002`

### `CASE-07`: Decimal Formatting & Input Handling
- **Actor**: `GeneralUser`
- **Preconditions**: Engine in ready state.
- **Action Sequence / Input**:
  - Enters `3 . 1 . 4` -> display shows `"3.14"` (second `.` ignored).
  - Enters `.` followed by `5` -> display shows `"0.5"`.
  - Enters `0 0 7` -> display shows `"7"` (no redundant leading zeros).
- **Expected Outcome**: Deterministic numeric parsing preventing malformed decimal literals.
- **Enforces**: `RULE-CALC-002`

### `CASE-08`: Clear Register C (Active Buffer Reset)
- **Actor**: `GeneralUser`
- **Preconditions**: Calculation in progress: `15 + 99`.
- **Action Sequence / Input**: User presses `C`, enters `5`, presses `=`.
- **Expected Outcome**: `C` clears only active buffer `"99"` to `"0"`; preserves accumulator `15` and operator `+`. Result evaluates to `20`.
- **Enforces**: `RULE-CALC-009`

### `CASE-09`: All Clear Register AC (Complete Reset)
- **Actor**: `GeneralUser`
- **Preconditions**: Calculation in progress or engine in locked error state (`Cannot divide by zero`).
- **Action Sequence / Input**: User presses `AC`.
- **Expected Outcome**: Complete flush of accumulator, pending operator, input buffer, error state, and input lock back to initial `"0"`.
- **Enforces**: `RULE-CALC-009`

### `CASE-10`: Negative Numbers & Sign Toggle
- **Actor**: `GeneralUser`
- **Preconditions**: Engine in ready state.
- **Action Sequence / Input**:
  - `3 - 8 =` -> `"-5"`
  - `5` then `+/-` -> `"-5"`, followed by `* 4 =` -> `"-20"`
  - `0` then `+/-` -> `"0"`
- **Expected Outcome**: Proper sign preservation and toggle behavior for negative values.
- **Enforces**: `RULE-CALC-007`

### `CASE-11`: Display Boundary & Overflow
- **Actor**: `GeneralUser`
- **Preconditions**: Engine in ready state.
- **Action Sequence / Input**:
  - `1 / 3 =` -> `"0.33333333"` (clean max 10 display digits).
  - `355 / 113 =` -> `"3.14159292"`.
- **Expected Outcome**: Formats infinite or long repeating fractions to fit within maximum 10 display digits without scientific notation noise.
- **Enforces**: `RULE-CALC-002`

---

## 2. Lived-System Stall Matrix (12 Canonical Stalls)

| Stall # & Name | Trigger Condition | Visible System Response | Recovery Action | Target Test File |
| :--- | :--- | :--- | :--- | :--- |
| **1. Empty or zero match** | Initial startup | Display shows `"0"` | User presses numeric digit | `test/calc-engine.test.ts` |
| **2. Stuck or slow wait** | Complex computation | Immediate evaluation (`< 1ms`) | N/A (synchronous) | `test/calc-engine.test.ts` |
| **3. Bad or incomplete input** | Multiple decimal points (`3..1.4`) | Second `.` suppressed (`3.14`) | User continues typing | `test/calc-engine.test.ts` |
| **4. Hard failure or outage** | Division by zero (`n / 0`) | `"Cannot divide by zero"` | User presses `C` or `AC` | `test/calc-engine.test.ts` |
| **5. Double-tap or race** | Consecutive operators (`+ *`) | Operator replaced (`RULE-CALC-008`) | Enters next operand | `test/calc-engine.test.ts` |
| **6. Two concurrent sessions** | N/A (Client in-memory state) | Isolated per-element instance | N/A | `test/calc-engine.test.ts` |
| **7. Partial success** | Intermediate chained operator (`2 + 3 *`) | Intermediate result `"5"` displayed | Next operand evaluated | `test/calc-engine.test.ts` |
| **8. Leave and return** | Buffer mistype during formula | User presses `C` to retype operand | Enter correct operand | `test/calc-engine.test.ts` |
| **9. Offline** | Complete offline execution | 100% zero-dependency local code | Full offline capability | `test/calc-engine.test.ts` |
| **10. Stale seam arrival** | Unknown action type dispatched | State returned unchanged | Handle valid action | `test/calc-engine.test.ts` |
| **11. UI desync** | Display buffer mismatch | Deterministic state snapshot | Pure functional reducer | `test/calc-engine.test.ts` |
| **12. Auth halfway** | N/A (Guest-safe utility) | Unrestricted local utility | N/A | `test/calc-engine.test.ts` |

---

## 3. Traceability Chain

| Rule / Invariant ID | Flow Decision | Seam ID | Case ID | Test Category | Target Test File |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `RULE-CALC-007` | `DEC-CALC-02` | `SEAM-ENGINE-01` | `CASE-01` | Sequential Arithmetic | `test/calc-engine.test.ts` |
| `NEVER-CALC-001` | `DEC-CALC-01` | `SEAM-ENGINE-01` | `CASE-01` | Zero Dynamic Eval | `test/calc-engine.test.ts` |
| `RULE-CALC-009` | `DEC-CALC-01` | `SEAM-ENGINE-01` | `CASE-02` | Empty / First Use | `test/calc-engine.test.ts` |
| `RULE-CALC-001` | `DEC-CALC-03` | `SEAM-ENGINE-01` | `CASE-03` | Division by Zero Safeguard | `test/calc-engine.test.ts` |
| `NEVER-CALC-004` | `DEC-CALC-03` | `SEAM-ENGINE-01` | `CASE-03` | No Unhandled NaN/Infinity | `test/calc-engine.test.ts` |
| `RULE-CALC-008` | `DEC-CALC-02` | `SEAM-ENGINE-01` | `CASE-04` | Operator Replacement | `test/calc-engine.test.ts` |
| `RULE-CALC-007` | `DEC-CALC-01` | `SEAM-ENGINE-01` | `CASE-05` | Repeated Equals Idempotency | `test/calc-engine.test.ts` |
| `RULE-CALC-002` | `DEC-CALC-01` | `SEAM-ENGINE-01` | `CASE-06` | Precision Normalization | `test/calc-engine.test.ts` |
| `RULE-CALC-002` | `DEC-CALC-04` | `SEAM-ENGINE-01` | `CASE-07` | Decimal Formatting | `test/calc-engine.test.ts` |
| `RULE-CALC-009` | `DEC-CALC-01` | `SEAM-ENGINE-01` | `CASE-08` | Clear Register C | `test/calc-engine.test.ts` |
| `RULE-CALC-009` | `DEC-CALC-01` | `SEAM-ENGINE-01` | `CASE-09` | All Clear Register AC | `test/calc-engine.test.ts` |
| `RULE-CALC-007` | `DEC-CALC-01` | `SEAM-ENGINE-01` | `CASE-10` | Negative & Sign Toggle | `test/calc-engine.test.ts` |
| `RULE-CALC-002` | `DEC-CALC-01` | `SEAM-ENGINE-01` | `CASE-11` | Max Display Boundary | `test/calc-engine.test.ts` |

---

## 4. Cases N/A Declarations

- **Network Latency & Timeout (`CASE-06` in macro catalog)**: N/A (The arithmetic calculation engine is a synchronous, zero-latency in-memory module with no network dependencies).
- **Tenant Auth & Permissions (`CASE-03` in macro catalog)**: N/A (StayCalc calculation engine is a client-side calculator utility accessible to all actors without RBAC restrictions).

---

## 5. References
- [Feature Specification](./feature.md)
- [User Flow & Decision Trees](./flow.md)
