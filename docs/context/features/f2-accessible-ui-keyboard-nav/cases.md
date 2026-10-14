---
type: Test Cases
title: "Accessible UI & Keyboard Navigation Test Cases"
status: stable
description: "Unified test scenarios CASE-01 to CASE-11, 12-stall matrix, traceability chain, and N/A declarations for Accessible UI & Keyboard Navigation."
tags: [cases, test-cases, ui, keyboard, accessibility, okf-v0.2]
sources:
  - resource: ./feature.md
  - resource: ./flow.md
---

# Test Cases: Accessible UI & Keyboard Navigation

Authoritative test scenarios for the `<stay-calc>` autonomous custom element. Grounded in `docs/context/project/design.md`, Feature rules (`RULE-*` / `NEVER-*`), and Flow decisions.

---

## 1. Universal Scenarios (11 Standard Types)

### `CASE-01`: Happy Path Nominal Execution (Keypad Click & Keyboard Arithmetic)
- **Actor**: `GeneralUser` / `KeyboardPowerUser`
- **Preconditions**: `<stay-calc>` mounted in DOM in initial clean state.
- **Action Sequence / Input**:
  - Click button `2`, operator `+`, button `3`, equals `=` -> display updates to `"5"`.
  - Type physical keys `1`, `0`, `-`, `4`, `Enter` -> display updates to `"6"`.
  - Type physical keys `6`, `*`, `7`, `=` -> display updates to `"42"`.
  - Type physical keys `2`, `0`, `/`, `4`, `Enter` -> display updates to `"5"`.
  - Sequential immediate execution via keyboard: `2`, `+`, `3`, `*`, `4`, `Enter` -> display updates to `"20"`.
- **Expected Outcome**: Display updates reactively to each button click and keyboard stroke, rendering correct evaluated result without error.
- **Enforces**: `RULE-UI-001`, `RULE-UI-002`, `RULE-CALC-007`

### `CASE-02`: Empty State & First Use (Mount & DSD Slots)
- **Actor**: `GeneralUser`
- **Preconditions**: `<stay-calc>` instantiated and attached to document body.
- **Action Sequence / Input**: Inspect custom element Shadow DOM, `<slot name="display">`, `<slot name="keypad">`, and default text.
- **Expected Outcome**: Display text renders `"0"`, `aria-live="polite"` is set on display region, and 19 interactive keypad buttons are rendered with accessible labels.
- **Enforces**: `RULE-UI-001`, `RULE-A11Y-002`

### `CASE-03`: Error State & Input Lock (Division by Zero UI Lockout & Escape Unlock)
- **Actor**: `GeneralUser` / `KeyboardPowerUser`
- **Preconditions**: User inputs `5`, `/`, `0`, `=`.
- **Action Sequence / Input**:
  - User triggers division by zero.
  - User attempts to press button `9` or type key `9`.
  - User presses physical key `Escape` (or clicks `AC`).
- **Expected Outcome**: Display renders `"Cannot divide by zero"` with error styling. Subsequent digit and operator inputs are ignored while locked. Pressing `Escape` or `AC` clears error state and unlocks display back to `"0"`.
- **Enforces**: `RULE-CALC-001`, `RULE-UI-002`

### `CASE-04`: Mid-Flow Operator Replacement (Visual Feedback)
- **Actor**: `GeneralUser` / `KeyboardPowerUser`
- **Preconditions**: User enters `5` and presses `+`.
- **Action Sequence / Input**: User immediately presses `*`, then enters `2` and presses `=`.
- **Expected Outcome**: Pending operator updates to `*` without intermediate calculation error; evaluates `5 * 2 = 10`.
- **Enforces**: `RULE-CALC-008`, `RULE-UI-002`

### `CASE-05`: Idempotency & Repeated Equals (Enter Key Repeating Result)
- **Actor**: `KeyboardPowerUser`
- **Preconditions**: User evaluates `4 + 5 Enter` resulting in display `9`.
- **Action Sequence / Input**: User presses `Enter` key repeatedly 3 times.
- **Expected Outcome**: Display remains `9` stably without throwing exceptions, duplicating digits, or crashing component.
- **Enforces**: `RULE-CALC-007`, `RULE-UI-002`

### `CASE-06`: Precision Normalization (Visual Display of Normalized Decimals)
- **Actor**: `GeneralUser` / `KeyboardPowerUser`
- **Preconditions**: Component in ready state.
- **Action Sequence / Input**:
  - Type `0.1 + 0.2 Enter` -> display renders `"0.3"` (no float representation noise).
  - Type `0.7 + 0.1 Enter` -> display renders `"0.8"`.
- **Expected Outcome**: Display text eliminates IEEE 754 precision noise, displaying clean decimal values within 10-digit limit.
- **Enforces**: `RULE-CALC-002`, `RULE-UI-001`

### `CASE-07`: Decimal Formatting & Input Handling (Decimal Button and Keypress)
- **Actor**: `GeneralUser` / `KeyboardPowerUser`
- **Preconditions**: Component in ready state.
- **Action Sequence / Input**:
  - Press `3`, `.`, `1`, `.`, `4` -> display shows `"3.14"` (duplicate `.` suppressed).
  - Press `.` followed by `5` -> display shows `"0.5"`.
- **Expected Outcome**: Display handles decimal clicks and keyboard `.` accurately.
- **Enforces**: `RULE-CALC-002`, `RULE-UI-002`

### `CASE-08`: Clear Register C (Active Buffer Reset)
- **Actor**: `GeneralUser`
- **Preconditions**: User enters `15 + 99`.
- **Action Sequence / Input**: User clicks keypad button `C`, enters `5`, clicks `=`.
- **Expected Outcome**: `C` clears only active buffer `"99"` to `"0"`; preserves accumulator `15` and operator `+`. Result evaluates to `20`.
- **Enforces**: `RULE-CALC-009`, `RULE-UI-001`

### `CASE-09`: All Clear Register AC & Escape Key (Complete Reset)
- **Actor**: `KeyboardPowerUser`
- **Preconditions**: Active calculation in progress or locked error state.
- **Action Sequence / Input**: User presses `Escape` key.
- **Expected Outcome**: Completely flushes accumulator, pending operator, input buffer, error state, and input lock back to `"0"`.
- **Enforces**: `RULE-CALC-009`, `RULE-UI-002`

### `CASE-10`: Negative Numbers & Sign Toggle (`+/-` Key)
- **Actor**: `GeneralUser`
- **Preconditions**: Component in ready state.
- **Action Sequence / Input**:
  - Press `5`, click `+/-` -> display shows `"-5"`.
  - Click `+/-` again -> display returns to `"5"`.
  - Type `3 - 8 Enter` -> display shows `"-5"`.
- **Expected Outcome**: Sign toggle updates display promptly and propagates to subsequent calculations.
- **Enforces**: `RULE-CALC-007`, `RULE-UI-001`

### `CASE-11`: Display Boundary & Backspace Key Handling
- **Actor**: `KeyboardPowerUser`
- **Preconditions**: User types `1 2 3 4 5`.
- **Action Sequence / Input**:
  - User presses `Backspace` key twice.
  - User presses `Backspace` until buffer is empty.
- **Expected Outcome**: Display shows `"123"`, and after backspacing past the last digit, displays `"0"`.
- **Enforces**: `RULE-UI-002`, `RULE-CALC-002`

---

## 2. Lived-System Stall Matrix (12 Canonical Stalls)

| Stall # & Name | Trigger Condition | Visible System Response | Recovery Action | Target Test File |
| :--- | :--- | :--- | :--- | :--- |
| **1. Empty or zero match** | First mount | Display shows `"0"` | Click or type digit | `test/stay-calc.test.ts` |
| **2. Stuck or slow wait** | Rapid clicks / keys | Synchronous update (`<= 16ms`) | N/A (instant dispatch) | `test/stay-calc.test.ts` |
| **3. Bad or incomplete input** | Multiple decimal clicks (`. . .`) | Only single decimal point rendered | User continues typing | `test/stay-calc.test.ts` |
| **4. Hard failure or outage** | Division by zero (`n / 0`) | Banner shows `"Cannot divide by zero"` | Press `Escape` or click `AC` | `test/stay-calc.test.ts` |
| **5. Double-tap or race** | Consecutive operators (`+ *`) | Pending operator replaced cleanly | Enters next operand | `test/stay-calc.test.ts` |
| **6. Two concurrent sessions** | Multiple `<stay-calc>` on one page | Each element maintains isolated engine | N/A | `test/stay-calc.test.ts` |
| **7. Partial success** | Chained operator (`5 + 2 *`) | Running total `"7"` displayed | Next operand evaluated | `test/stay-calc.test.ts` |
| **8. Leave and return** | User mistypes digit | Press `Backspace` or `C` | Enter correct digit | `test/stay-calc.test.ts` |
| **9. Offline** | Complete offline execution | 100% native W3C Custom Element | Full offline capability | `test/stay-calc.test.ts` |
| **10. Stale seam arrival** | Unknown key event pressed | Event allowed to bubble to browser | N/A | `test/stay-calc.test.ts` |
| **11. UI desync** | DOM display vs engine state | Display synchronized via engine state | Reactive DOM sync | `test/stay-calc.test.ts` |
| **12. Auth halfway** | N/A (Client-only utility) | Unrestricted guest accessibility | N/A | `test/stay-calc.test.ts` |

---

## 3. Traceability Chain

| Rule / Invariant ID | Flow Decision | Seam ID | Case ID | Test Category | Target Test File |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `RULE-UI-001` | `DEC-UI-03` | `SEAM-ENGINE-01` | `CASE-01`, `CASE-02` | Custom Element & DSD Slots | `test/stay-calc.test.ts` |
| `RULE-UI-002` | `DEC-UI-01` | `SEAM-ENGINE-01` | `CASE-01`, `CASE-05` | Keyboard Navigation | `test/stay-calc.test.ts` |
| `RULE-A11Y-001` | `DEC-UI-03` | `SEAM-UI-01` | `CASE-02` | WCAG Contrast & Focus Rings | `test/stay-calc.test.ts` |
| `RULE-A11Y-002` | `DEC-UI-03` | `SEAM-ENGINE-01` | `CASE-02`, `CASE-03` | ARIA Polite Live Region | `test/stay-calc.test.ts` |
| `RULE-RESP-001` | `DEC-UI-04` | `SEAM-UI-01` | `CASE-01` | Mobile Viewport Zero Overflow | `test/stay-calc.test.ts` |
| `NEVER-UI-001` | `DEC-UI-03` | `SEAM-UI-01` | `CASE-02` | Zero External Frameworks | `test/stay-calc.test.ts` |

---

## 4. Cases N/A Declarations

- **Network Latency & Timeout**: N/A (The `<stay-calc>` UI component and calculation engine are client-side in-memory modules with no network requests).
- **Tenant Auth & Permissions**: N/A (StayCalc is an open client-side calculator utility accessible without login or RBAC requirements).

---

## 5. References
- [Feature Specification](./feature.md)
- [User Flow & Decision Trees](./flow.md)
