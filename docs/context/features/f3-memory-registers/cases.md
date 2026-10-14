---
type: Test Cases
title: "Memory Registers & Active Indicator Test Cases"
status: stable
description: "Unified test scenarios CASE-01 to CASE-11, 12-stall matrix, traceability chain, and N/A declarations for Memory Registers & Active Indicator."
tags: [cases, test-cases, memory, indicator, okf-v0.2]
sources:
  - resource: ./feature.md
  - resource: ./flow.md
---

# Test Cases: Memory Registers & Active Indicator

Authoritative test scenarios for the StayCalc memory register subsystems (M+, M-, MR, MC) and visual active memory indicator badge. Grounded in `docs/context/project/domain-rules.md`, Feature rules (`RULE-*` / `NEVER-*`), and Flow decisions.

---

## 1. Universal Scenarios (11 Standard Types)

### `CASE-01`: Happy Path Nominal Execution (Memory Store & Recall across Operations)
- **Actor**: `GeneralUser`
- **Preconditions**: Initial calculator state with empty memory (`memory: 0`, `hasActiveMemory: false`).
- **Action Sequence / Input**:
  - Enter `5`, click `M+` -> memory stores `5`, `hasActiveMemory` is `true`.
  - Enter `10`, click `M+` -> memory stores `15`.
  - Enter `3`, click `M-` -> memory stores `12`.
  - Click `MR` -> display renders `"12"`.
- **Expected Outcome**: Memory register accurately accumulates and subtracts display values; `MR` recalls current memory value into the active input buffer without dynamic code evaluation (`eval` / `new Function`).
- **Enforces**: `RULE-CALC-006`, `RULE-CALC-002`, `NEVER-CALC-001`

### `CASE-02`: Empty State & First Use (Clean Initial Bootstrap)
- **Actor**: `GeneralUser`
- **Preconditions**: Calculator element mounted or newly initialized.
- **Action Sequence / Input**: Inspect initial engine and UI state before any user input.
- **Expected Outcome**: `state.memory` is `0`, `state.hasActiveMemory` is `false`, `#memoryIndicator` element has `visibility: hidden` and lacks `.active` class.
- **Enforces**: `RULE-CALC-006`, `RULE-UI-001`

### `CASE-03`: Error State & Input Lock (Division by Zero Safeguard & Memory Preservation)
- **Actor**: `GeneralUser`
- **Preconditions**: Memory holds value `42` (`hasActiveMemory: true`).
- **Action Sequence / Input**:
  - Enter `10 / 0 =` -> engine enters locked error state (`"Cannot divide by zero"`).
  - Attempt to click `M+` or `MR` while locked.
  - Press Clear (`C`).
- **Expected Outcome**: Division by zero locks display and error state, but `state.memory` remains `42` and `hasActiveMemory` remains `true`. Memory operations are rejected while locked. Pressing `C` unlocks display back to `"0"` while preserving memory `42` (`RULE-CALC-006`).
- **Enforces**: `RULE-CALC-001`, `RULE-CALC-006`, `NEVER-CALC-004`

### `CASE-04`: Mid-Flow Operator Replacement & Memory Interaction
- **Actor**: `GeneralUser`
- **Preconditions**: Calculator has pending operation `8 +`.
- **Action Sequence / Input**:
  - User clicks `M+` (adding active display `8` to memory).
  - User immediately clicks `*` (operator replacement).
  - User enters `3` and clicks `=`.
- **Expected Outcome**: Memory register correctly stores `8`, pending operator switches to `*`, and calculation evaluates `8 * 3 = 24`.
- **Enforces**: `RULE-CALC-008`, `RULE-CALC-006`

### `CASE-05`: Idempotency & Repeated Operations (Repeated MR and MC)
- **Actor**: `GeneralUser`
- **Preconditions**: Memory holds value `25`.
- **Action Sequence / Input**:
  - Click `MR` 3 consecutive times.
  - Click `MC` 2 consecutive times.
- **Expected Outcome**: Repeated `MR` repeatedly recalls `"25"` into display without modifying memory state. Repeated `MC` resets memory to `0` and maintains clean state without errors.
- **Enforces**: `RULE-CALC-006`, `RULE-CALC-009`

### `CASE-06`: Precision Normalization (IEEE 754 Float Artifact Elimination)
- **Actor**: `GeneralUser`
- **Preconditions**: Engine in ready state with memory `0`.
- **Action Sequence / Input**:
  - Enter `0.1`, click `M+`.
  - Enter `0.2`, click `M+`.
  - Click `MR`.
- **Expected Outcome**: Memory register stores exactly `0.3` (not `0.30000000000000004`); display renders `"0.3"`, eliminating IEEE 754 precision artifacts.
- **Enforces**: `RULE-CALC-002`

### `CASE-07`: Decimal Formatting & Input Handling (Negative Memory & Exact Zero Clearance)
- **Actor**: `GeneralUser`
- **Preconditions**: Engine in ready state.
- **Action Sequence / Input**:
  - Enter `5`, click `M-` -> memory stores `-5`, `hasActiveMemory` is `true`.
  - Click `MR` -> display shows `"-5"`.
  - Enter `5`, click `M+` -> memory stores `0`.
- **Expected Outcome**: Negative numbers in memory are fully supported and display with leading minus; when subtraction brings memory to exact `0`, `hasActiveMemory` becomes `false` and "M" badge is dismissed.
- **Enforces**: `RULE-CALC-002`, `RULE-CALC-006`

### `CASE-08`: Clear Register C (Input Buffer Reset with Memory Persistence)
- **Actor**: `GeneralUser`
- **Preconditions**: Memory holds value `100` (`hasActiveMemory: true`).
- **Action Sequence / Input**:
  - User enters `999`.
  - User clicks Clear (`C`).
  - User clicks `MR`.
- **Expected Outcome**: `C` resets display buffer to `"0"`, but `state.memory` remains `100` and `hasActiveMemory` remains `true` with visual "M" badge visible. Subsequent `MR` recalls `"100"`.
- **Enforces**: `RULE-CALC-009`, `RULE-CALC-006`

### `CASE-09`: All Clear Register AC (Complete Reset of All Registers)
- **Actor**: `GeneralUser`
- **Preconditions**: Memory holds value `75` (`hasActiveMemory: true`).
- **Action Sequence / Input**:
  - User clicks All Clear (`AC`).
  - User clicks `MR`.
- **Expected Outcome**: `AC` completely flushes accumulator, display, and memory register (`memory = 0`, `hasActiveMemory = false`). Visual "M" badge is hidden. Subsequent `MR` outputs `"0"`.
- **Enforces**: `RULE-CALC-009`

### `CASE-10`: Memory Recall with Chained Arithmetic
- **Actor**: `GeneralUser`
- **Preconditions**: Memory holds value `5` (`hasActiveMemory: true`).
- **Action Sequence / Input**:
  - Enter `10`, click `+`.
  - Click `MR` (display shows `5`, `waitingForOperand` is `true`).
  - Click `=`.
- **Expected Outcome**: Expression evaluates `10 + 5 = 15`. The recalled memory value seamlessly acts as the second operand in chained calculations.
- **Enforces**: `RULE-CALC-006`, `RULE-CALC-007`

### `CASE-11`: Component UI & Event Synchronization (Keypad Grid, "M" Badge & CustomEvent)
- **Actor**: `GeneralUser` / `ScreenReaderUser`
- **Preconditions**: `<stay-calc>` mounted in DOM with event listener attached for `calc-change`.
- **Action Sequence / Input**:
  - Click `MC`, `MR`, `M-`, `M+` buttons on `<stay-calc>` shadow DOM keypad.
  - Observe `#memoryIndicator` class and visibility.
  - Inspect `calc-change` event payload `event.detail`.
- **Expected Outcome**: Keypad renders 4 memory buttons with accessible `aria-label` attributes; `#memoryIndicator` toggles `.active` class and visibility in lockstep with memory state; `calc-change` event dispatches payload containing updated `memory` and `hasActiveMemory`.
- **Enforces**: `RULE-UI-001`, `SEAM-ENGINE-01`, `SEAM-UI-01`

---

## 2. Lived-System Stall Matrix (12 Canonical Stalls)

| Stall # & Name | Trigger Condition | Visible System Response | Recovery Action | Target Test File |
| :--- | :--- | :--- | :--- | :--- |
| **1. Empty or zero match** | Initial startup | Memory is 0; "M" badge hidden | User enters number and presses `M+` | `test/memory.test.ts` |
| **2. Stuck or slow wait** | Rapid memory key presses | Immediate evaluation (`< 1ms`) | N/A (synchronous) | `test/memory.test.ts` |
| **3. Bad or incomplete input** | Memory action on malformed buffer | Fallback to current numeric value | Engine sanitizes buffer | `test/memory.test.ts` |
| **4. Hard failure or outage** | Division by zero while memory active | Display locked with error; memory preserved | User presses `C` to unlock | `test/memory.test.ts` |
| **5. Double-tap or race** | Consecutive `M+` presses | Successive addition to memory | User presses `M-` or `MC` | `test/memory.test.ts` |
| **6. Two concurrent sessions** | Independent `<stay-calc>` elements | Memory registers strictly isolated per element | N/A | `test/memory.test.ts` |
| **7. Partial success** | Memory subtracted to exact zero | "M" badge dismissed automatically | Next operation proceeds | `test/memory.test.ts` |
| **8. Leave and return** | Buffer mistype during formula | User presses `C`; memory stays intact | Enter correct operand | `test/memory.test.ts` |
| **9. Offline** | Complete offline execution | 100% zero-dependency local code | Full offline capability | `test/memory.test.ts` |
| **10. Stale seam arrival** | Unknown action dispatched | Memory state preserved unchanged | Dispatch valid action | `test/memory.test.ts` |
| **11. UI desync** | Display badge out of sync with state | `syncUI()` enforces bidirectional parity | Deterministic reducer | `test/memory.test.ts` |
| **12. Auth halfway** | N/A (Guest-safe utility) | Unrestricted local utility | N/A | `test/memory.test.ts` |

---

## 3. Traceability Chain

| Rule / Invariant ID | Flow Decision | Seam ID | Case ID | Test Category | Target Test File |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `RULE-CALC-006` | `DEC-MEM-02` | `SEAM-ENGINE-01` | `CASE-01` | Memory Accumulation | `test/memory.test.ts` |
| `NEVER-CALC-001` | `DEC-MEM-02` | `SEAM-ENGINE-01` | `CASE-01` | Zero Dynamic Eval | `test/memory.test.ts` |
| `RULE-CALC-006` | `DEC-MEM-02` | `SEAM-ENGINE-01` | `CASE-02` | Empty State / First Use | `test/memory.test.ts` |
| `RULE-CALC-001` | `DEC-MEM-01` | `SEAM-ENGINE-01` | `CASE-03` | Error Lock & Preservation | `test/memory.test.ts` |
| `NEVER-CALC-004` | `DEC-MEM-01` | `SEAM-ENGINE-01` | `CASE-03` | No Unhandled NaN/Infinity | `test/memory.test.ts` |
| `RULE-CALC-008` | `DEC-MEM-02` | `SEAM-ENGINE-01` | `CASE-04` | Operator Replacement | `test/memory.test.ts` |
| `RULE-CALC-006` | `DEC-MEM-02` | `SEAM-ENGINE-01` | `CASE-05` | Repeated MR / MC Idempotency | `test/memory.test.ts` |
| `RULE-CALC-002` | `DEC-MEM-02` | `SEAM-ENGINE-01` | `CASE-06` | Float Precision Normalization | `test/memory.test.ts` |
| `RULE-CALC-002` | `DEC-MEM-02` | `SEAM-ENGINE-01` | `CASE-07` | Negative Numbers & Zero Clear | `test/memory.test.ts` |
| `RULE-CALC-009` | `DEC-MEM-03` | `SEAM-ENGINE-01` | `CASE-08` | Clear Register C | `test/memory.test.ts` |
| `RULE-CALC-009` | `DEC-MEM-03` | `SEAM-ENGINE-01` | `CASE-09` | All Clear Register AC | `test/memory.test.ts` |
| `RULE-CALC-007` | `DEC-MEM-04` | `SEAM-ENGINE-01` | `CASE-10` | Chained Calculation with MR | `test/memory.test.ts` |
| `RULE-UI-001` | `DEC-MEM-02` | `SEAM-UI-01` | `CASE-11` | Component UI & Indicator Sync | `test/memory.test.ts` |

---

## 4. Cases N/A Declarations

- **Network Latency & Timeout (`CASE-06` in macro catalog)**: N/A (Memory operations are synchronous in-memory state transitions without network calls).
- **Tenant Auth & Permissions (`CASE-03` in macro catalog)**: N/A (StayCalc memory registers operate locally within the client browser session without user access controls).

---

## 5. References
- [Feature Specification](./feature.md)
- [User Flow & Decision Trees](./flow.md)
