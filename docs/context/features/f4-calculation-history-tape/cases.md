---
type: Test Cases
title: "Calculation History Tape & Drawer Test Cases"
status: stable
description: "Unified test scenarios CASE-01 to CASE-11, 12-stall matrix, traceability chain, and N/A declarations for Calculation History Tape and Drawer."
tags: [cases, test-cases, history, tape, drawer, okf-v0.2]
sources:
  - resource: ./feature.md
  - resource: ./flow.md
---

# Test Cases: Calculation History Tape & Drawer

Authoritative test scenarios for the StayCalc calculation history tape audit subsystem and accessible drawer panel. Grounded in `docs/context/project/domain-rules.md`, Feature rules (`RULE-*` / `NEVER-*`), and Flow decisions.

---

## 1. Universal Scenarios (11 Standard Types)

### `CASE-01`: Happy Path Nominal Execution (Calculation Logging & Drawer Visibility)
- **Actor**: `GeneralUser`
- **Preconditions**: Initial clean calculator state with empty history tape.
- **Action Sequence / Input**:
  - Enter `12 + 8 =`.
  - Enter `5 * 4 =`.
  - Toggle `#historyToggle` button to open drawer.
- **Expected Outcome**:
  - History tape records 2 distinct entries in reverse chronological order (newest first).
  - Most recent entry is `5 * 4 = 20`.
  - Previous entry is `12 + 8 = 20`.
  - History drawer expands with `aria-expanded="true"` displaying 2 interactive entry buttons.
  - Zero dynamic evaluation (`eval()` or `new Function()`) is utilized (`NEVER-CALC-001`).
- **Enforces**: `RULE-CALC-005`, `RULE-UI-002`, `SEAM-ENGINE-02`, `NEVER-CALC-001`

### `CASE-02`: Empty State & First Use (Clean Initial Bootstrap & "No calculations yet")
- **Actor**: `GeneralUser`
- **Preconditions**: Freshly mounted `<stay-calc>` component without any calculation evaluated.
- **Action Sequence / Input**:
  - Click `#historyToggle` button.
- **Expected Outcome**:
  - Drawer opens with `aria-expanded="true"`.
  - `#historyEmpty` is visible containing `"No calculations yet"`.
  - Zero `.history-entry` items are rendered.
  - `#clearHistory` button is present.
- **Enforces**: `RULE-UI-002`, `RULE-RESP-001`

### `CASE-03`: Error State & Input Lock (Division by Zero Safeguard & Error Isolation)
- **Actor**: `GeneralUser`
- **Preconditions**: Calculator contains 1 existing valid calculation (`7 + 3 = 10`).
- **Action Sequence / Input**:
  - Enter `50 / 0 =` -> Engine transitions to locked error state (`"Cannot divide by zero"`).
  - Inspect history tape entries.
- **Expected Outcome**:
  - Division by zero error is NOT added to history tape (`RULE-CALC-007`).
  - Existing history remains intact with exactly 1 entry (`7 + 3 = 10`).
- **Enforces**: `RULE-CALC-001`, `RULE-CALC-007`, `NEVER-CALC-004`

### `CASE-04`: Mid-Flow Operator Replacement & History Integrity
- **Actor**: `GeneralUser`
- **Preconditions**: Clean calculator state.
- **Action Sequence / Input**:
  - Enter `6 + * - 2 =`.
- **Expected Outcome**:
  - Calculation evaluates `6 - 2 = 4` (operator replacement).
  - History tape logs the final evaluated expression: `expression: "6 - 2"`, `result: "4"`.
  - Intermediate discarded operators (`+`, `*`) are not present in history.
- **Enforces**: `RULE-CALC-008`, `SEAM-ENGINE-02`

### `CASE-05`: Idempotency & Repeated Operations (Repeated Equals & History Integrity)
- **Actor**: `GeneralUser`
- **Preconditions**: Clean calculator state.
- **Action Sequence / Input**:
  - Enter `9 * 9 =` (logs `9 * 9 = 81`).
  - Press `=` again 3 times without entering new operands or operators.
- **Expected Outcome**:
  - Repeated `=` does not spam duplicate entries into the history tape.
  - History tape length remains exactly 1.
- **Enforces**: `RULE-CALC-005`, `SEAM-ENGINE-02`

### `CASE-06`: Precision Normalization in History Tape (IEEE 754 Float Artifact Elimination)
- **Actor**: `GeneralUser`
- **Preconditions**: Clean calculator state.
- **Action Sequence / Input**:
  - Enter `0.1 + 0.2 =`.
  - Enter `0.7 + 0.1 =`.
- **Expected Outcome**:
  - First entry records expression `"0.1 + 0.2"` with clean normalized result `"0.3"` (not `0.30000000000000004`).
  - Second entry records expression `"0.7 + 0.1"` with clean normalized result `"0.8"`.
- **Enforces**: `RULE-CALC-002`, `RULE-CALC-005`

### `CASE-07`: History Reload into Active Buffer (Clickable Past Result Recall)
- **Actor**: `GeneralUser`
- **Preconditions**: History tape has entry `25 * 4 = 100`.
- **Action Sequence / Input**:
  - User clears input or performs other calculations.
  - Open history drawer and click the `.history-entry` corresponding to `100`.
  - User immediately presses `+ 5 =`.
- **Expected Outcome**:
  - Active display updates to `"100"` with `waitingForOperand = true`.
  - Subsequent addition evaluates `100 + 5 = 105`.
  - New calculation `100 + 5 = 105` is prepended to history tape.
- **Enforces**: `SEAM-ENGINE-02`, `RULE-UI-002`

### `CASE-08`: Clear Registers C and AC (History Tape Persistence Across Clears)
- **Actor**: `GeneralUser`
- **Preconditions**: History tape has 3 recorded calculations.
- **Action Sequence / Input**:
  - Press Clear (`C`).
  - Type new digits, then press All Clear (`AC`).
- **Expected Outcome**:
  - Display buffer and accumulator reset to `"0"`.
  - All 3 history tape entries remain fully intact and accessible (`RULE-CALC-008`).
- **Enforces**: `RULE-CALC-008`, `RULE-CALC-009`

### `CASE-09`: Explicit History Tape Clear (#clearHistory & CLEAR_HISTORY Action)
- **Actor**: `GeneralUser`
- **Preconditions**: History tape contains recorded calculations.
- **Action Sequence / Input**:
  - Open history drawer.
  - Click `#clearHistory` button.
- **Expected Outcome**:
  - History tape is completely cleared (`history.length === 0`).
  - Drawer displays `#historyEmpty` ("No calculations yet").
  - `history-change` and `calc-change` events are dispatched.
  - Active calculator display and accumulator are preserved untouched.
- **Enforces**: `RULE-CALC-008`, `RULE-UI-002`, `SEAM-UI-01`

### `CASE-10`: 100-Entry FIFO Cap Enforcement (Oldest Entry Pruning Under Continuous Load)
- **Actor**: `GeneralUser`
- **Preconditions**: Clean calculator state.
- **Action Sequence / Input**:
  - Execute 105 distinct calculations sequentially (`1 + 1 =`, `1 + 2 =`, ..., `1 + 105 =`).
- **Expected Outcome**:
  - History tape contains exactly 100 entries (`RULE-CALC-005`).
  - Oldest 5 entries (`1 + 1 = 2` through `1 + 5 = 6`) have been pruned (FIFO).
  - Newest entry `1 + 105 = 106` is at index 0.
- **Enforces**: `RULE-CALC-005`

### `CASE-11`: Component UI, Escape Key Dismissal & Event Synchronization
- **Actor**: `KeyboardPowerUser` / `ScreenReaderUser`
- **Preconditions**: In-progress calculation with `15 +` pending; drawer is open.
- **Action Sequence / Input**:
  - Press `Escape` key on keyboard while history drawer is open.
- **Expected Outcome**:
  - History drawer closes (`aria-expanded="false"`, `aria-hidden="true"`).
  - Accumulator `15` and pending operator `+` are NOT cleared (`RULE-UI-002`).
  - User can immediately type `5 =` to evaluate `20`.
  - Focus returns to `#historyToggle` or host element without disruption.
- **Enforces**: `RULE-UI-002`, `RULE-RESP-001`, `SEAM-UI-01`

---

## 2. Lived-System Stall Matrix (12 Canonical Stalls)

| Stall # & Name | Trigger Condition | Visible System Response | Recovery Action | Target Test File |
| :--- | :--- | :--- | :--- | :--- |
| **1. Empty or zero match** | First drawer open before calculations | `#historyEmpty` renders "No calculations yet" | User completes calculation | `test/history.test.ts` |
| **2. Stuck or slow wait** | Rapid calculations in tight loop | Synchronous FIFO evaluation (`< 1ms`) | N/A (instant execution) | `test/history.test.ts` |
| **3. Bad or incomplete input** | Equals clicked without operands | Idempotent no-op; no garbage logged | User enters complete expression | `test/history.test.ts` |
| **4. Hard failure or outage** | Division by zero evaluated | Error displayed; tape excluded | User clears error with `C` | `test/history.test.ts` |
| **5. Double-tap or race** | Consecutive equals key presses | Evaluated once; duplicate tape entries suppressed | N/A | `test/history.test.ts` |
| **6. Two concurrent sessions** | Multiple `<stay-calc>` instances | History states isolated per component instance | N/A | `test/history.test.ts` |
| **7. Partial success** | 105 entries calculated | Exactly 100 entries retained; oldest 5 pruned | Continuous FIFO enforcement | `test/history.test.ts` |
| **8. Leave and return** | Drawer open mid-calculation | User presses Escape; accumulator preserved | User resumes arithmetic seamlessly | `test/history.test.ts` |
| **9. Offline** | Complete offline execution | 100% zero-dependency local code | Full offline capability | `test/history.test.ts` |
| **10. Stale seam arrival** | Unknown action dispatched | History tape preserved unchanged | Dispatch valid action | `test/history.test.ts` |
| **11. UI desync** | History list out of sync with engine | `syncUI()` ensures 1:1 state reflection | Automatic DOM synchronization | `test/history.test.ts` |
| **12. Auth halfway** | N/A (Guest-safe utility) | Unrestricted local utility | N/A | `test/history.test.ts` |

---

## 3. Traceability Chain

| Rule / Invariant ID | Flow Decision | Seam ID | Case ID | Test Category | Target Test File |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `RULE-CALC-005` | `DEC-HIST-01` | `SEAM-ENGINE-02` | `CASE-01` | Calculation Logging | `test/history.test.ts` |
| `NEVER-CALC-001` | `DEC-HIST-01` | `SEAM-ENGINE-02` | `CASE-01` | Zero Dynamic Eval | `test/history.test.ts` |
| `RULE-UI-002` | `DEC-HIST-02` | `SEAM-UI-01` | `CASE-02` | Empty State Display | `test/history.test.ts` |
| `RULE-CALC-007` | `DEC-HIST-01` | `SEAM-ENGINE-02` | `CASE-03` | Error Isolation | `test/history.test.ts` |
| `RULE-CALC-008` | `DEC-HIST-01` | `SEAM-ENGINE-02` | `CASE-04` | Operator Replacement | `test/history.test.ts` |
| `RULE-CALC-005` | `DEC-HIST-01` | `SEAM-ENGINE-02` | `CASE-05` | Repeated Equals Idempotency | `test/history.test.ts` |
| `RULE-CALC-002` | `DEC-HIST-01` | `SEAM-ENGINE-02` | `CASE-06` | Precision Normalization | `test/history.test.ts` |
| `SEAM-ENGINE-02` | `DEC-HIST-04` | `SEAM-ENGINE-02` | `CASE-07` | History Result Reload | `test/history.test.ts` |
| `RULE-CALC-008` | `DEC-HIST-03` | `SEAM-ENGINE-02` | `CASE-08` | Clear & AC Persistence | `test/history.test.ts` |
| `RULE-CALC-008` | `DEC-HIST-02` | `SEAM-UI-01` | `CASE-09` | Clear History Action | `test/history.test.ts` |
| `RULE-CALC-005` | `DEC-HIST-02` | `SEAM-ENGINE-02` | `CASE-10` | 100-Entry FIFO Cap | `test/history.test.ts` |
| `RULE-UI-002` | `DEC-HIST-03` | `SEAM-UI-01` | `CASE-11` | Escape Dismissal & Events | `test/history.test.ts` |

---

## 4. Cases N/A Declarations

- **Network Latency & Timeout (`CASE-06` in macro catalog)**: N/A (History operations are synchronous in-memory state transitions without network calls).
- **Tenant Auth & Permissions (`CASE-03` in macro catalog)**: N/A (StayCalc history tape operates locally within the client browser session without user access controls).

---

## 5. References
- [Feature Specification](./feature.md)
- [User Flow & Decision Trees](./flow.md)
