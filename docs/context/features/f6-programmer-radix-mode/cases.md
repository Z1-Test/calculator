---
type: Test Cases
title: "Programmer Radix Mode and Bitwise Operations Test Cases"
status: stable
description: "Unified test scenarios CASE-01 to CASE-11, 12-stall matrix, traceability chain, and N/A declarations for Programmer Mode."
tags: [cases, test-cases, programmer, radix, bitwise, hex, bin, oct, dec, okf-v0.2]
sources:
  - resource: ./feature.md
  - resource: ./flow.md
---

# Test Cases: Programmer Radix Mode and Bitwise Operations

Authoritative test scenarios for the StayCalc programmer calculation subsystem, multi-base radix conversions (`HEX`, `DEC`, `OCT`, `BIN`), 32-bit two's complement integer arithmetic, bitwise operations (`AND`, `OR`, `XOR`, `NOT`, `LSH`, `RSH`), dynamic keypad gating, and simultaneous multi-radix preview display. Grounded in `docs/context/project/domain-rules.md`, Feature rules (`RULE-*` / `NEVER-*`), and Flow decisions.

---

## 1. Universal Scenarios (11 Standard Types)

### `CASE-01`: Happy Path Nominal Execution (Radix Conversion & Bitwise Operations)
- **Actor**: `ProgrammerUser`
- **Preconditions**: Initial clean calculator state in programmer mode.
- **Action Sequence / Input**:
  - In HEX radix, enter `FF`, click `AND`, enter `0F`, click `=`.
  - In DEC radix, enter `12`, click `OR`, enter `10`, click `=`.
  - In DEC radix, enter `12`, click `XOR`, enter `10`, click `=`.
  - In DEC radix, enter `1`, click `LSH`, enter `4`, click `=`.
  - In DEC radix, enter `16`, click `RSH`, enter `2`, click `=`.
  - In DEC radix, enter `0`, click `NOT`.
- **Expected Outcome**:
  - `0xFF & 0x0F` evaluates to `0x0F` (display `"F"` in HEX).
  - `12 | 10` evaluates to `"14"`.
  - `12 ^ 10` evaluates to `"6"`.
  - `1 << 4` evaluates to `"16"`.
  - `16 >> 2` evaluates to `"4"`.
  - `~0` evaluates to `"-1"` in DEC (`"FFFFFFFF"` in HEX).
  - Zero dynamic evaluation (`eval()` or `new Function()`) is utilized (`NEVER-CALC-001`).
- **Enforces**: `RULE-CALC-004`, `SEAM-ENGINE-01`, `NEVER-CALC-001`

### `CASE-02`: Empty State & First Use (Bootstrap, Default Radix & Multi-Radix Preview Initialization)
- **Actor**: `ProgrammerUser`
- **Preconditions**: Freshly mounted `<stay-calc>` component switched to programmer mode.
- **Action Sequence / Input**:
  - Inspect initial programmer mode UI components and state without prior input.
- **Expected Outcome**:
  - Engine initialized with `radix: "HEX"`, display is `"0"`.
  - `#multiRadixPreview` displays `HEX: "0"`, `DEC: "0"`, `OCT: "0"`, `BIN: "0"`.
  - Radix button `#btnRadixHex` reflects `aria-pressed="true"`.
  - `#programmerKeys` is visible with all bitwise buttons and hex keys A–F.
- **Enforces**: `RULE-CALC-004`, `RULE-RESP-001`

### `CASE-03`: Error State & Input Lock (Integer Division by Zero Lockout & Escape Unlock)
- **Actor**: `ProgrammerUser`
- **Preconditions**: Programmer mode active in DEC radix.
- **Action Sequence / Input**:
  - Enter `42 / 0 =`.
  - Attempt to enter digits `7` or operators.
  - Press `Escape` or click `C`.
- **Expected Outcome**:
  - Division by zero immediately displays `"Cannot divide by zero"` and locks input (`isLocked = true`) (`RULE-CALC-001`).
  - Subsequent digit or operator entries are ignored while locked.
  - Pressing `Escape` or clicking `C` unlocks the engine and restores display to `"0"`.
  - Zero `NaN` or `Infinity` leaked (`NEVER-CALC-004`).
- **Enforces**: `RULE-CALC-001`, `NEVER-CALC-004`

### `CASE-04`: Mid-Flow Operator Replacement with Bitwise Operator
- **Actor**: `ProgrammerUser`
- **Preconditions**: Programmer mode active.
- **Action Sequence / Input**:
  - Enter `12 +`, then immediately click `AND`, enter `10 =`.
- **Expected Outcome**:
  - Operator replacement replaces pending `+` with `AND` (`RULE-CALC-008`).
  - Calculation evaluates `12 AND 10 = 8`.
  - Display shows `"8"`.
- **Enforces**: `RULE-CALC-008`, `SEAM-ENGINE-01`

### `CASE-05`: Idempotency & Repeated Operations (Radix Toggle Idempotency & Sequential Shift/NOT)
- **Actor**: `ProgrammerUser`
- **Preconditions**: Programmer mode active with display `"42"`.
- **Action Sequence / Input**:
  - Sequentially click radix buttons: `HEX` -> `BIN` -> `OCT` -> `DEC` -> `HEX`.
  - In DEC radix, enter `1`, click `LSH 1 =`, click `= = =`.
  - In DEC radix, enter `5`, click `NOT` twice consecutively.
- **Expected Outcome**:
  - Repeated radix switches convert value losslessly without state drift (`42` -> `2A` -> `101010` -> `52` -> `42` -> `2A`).
  - Sequential equals on shift performs repeated shifting (`1 << 1 = 2`, `2 << 1 = 4`, `4 << 1 = 8`).
  - Double NOT returns original value (`~(~5) = 5`).
- **Enforces**: `RULE-CALC-004`, `SEAM-ENGINE-01`

### `CASE-06`: Precision Normalization & 32-Bit Integer Two's Complement Boundary Clamping
- **Actor**: `ProgrammerUser`
- **Preconditions**: Programmer mode active.
- **Action Sequence / Input**:
  - Enter `2147483647 + 1 =` (32-bit signed overflow).
  - Switch radix between `DEC` and `HEX`.
  - Compute `0 - 1 =` in DEC, switch to `HEX` and `BIN`.
- **Expected Outcome**:
  - `2147483647 + 1` wraps cleanly to 32-bit signed `-2147483648` (`RULE-CALC-004`).
  - In HEX, `-2147483648` is formatted as `"80000000"`.
  - `0 - 1` evaluates to `"-1"`, represented as `"FFFFFFFF"` in HEX and 32 ones in BIN.
  - Multi-radix preview cards reflect exact two's complement unsigned binary/hex strings.
- **Enforces**: `RULE-CALC-004`, `NEVER-CALC-004`

### `CASE-07`: Hexadecimal and Octal Input Handling (Digit Capacity & Prefix/Case Normalization)
- **Actor**: `ProgrammerUser`
- **Preconditions**: Programmer mode active in HEX radix.
- **Action Sequence / Input**:
  - Enter hex digits `A`, `B`, `C`, `D`, `E`, `F`.
  - Switch to OCT radix and enter `7`, `0`, `5`.
- **Expected Outcome**:
  - Hex digits format in clean uppercase (`"ABCDEF"`).
  - `#multiRadixPreview` displays converted DEC, OCT, and BIN representations accurately.
  - In OCT radix, input `"705"` formats and converts accurately.
- **Enforces**: `RULE-CALC-004`, `SEAM-ENGINE-01`

### `CASE-08`: State Persistence Across Mode Toggles (Standard <-> Scientific <-> Programmer Retention)
- **Actor**: `ProgrammerUser`
- **Preconditions**: Standard mode active.
- **Action Sequence / Input**:
  - Enter `50 +`.
  - Enter `25`, press `M+` (memory register set).
  - Switch mode to programmer mode.
  - Inspect accumulator `50`, pending `+`, memory `25`, and display.
  - Switch mode back to standard, enter `10 =`.
- **Expected Outcome**:
  - Accumulator `50`, pending operator `+`, memory value `25`, and calculation history persist across mode switches (`RULE-CALC-006`).
  - Final calculation evaluates `50 + 10 = 60`.
- **Enforces**: `RULE-CALC-006`, `SEAM-ENGINE-01`

### `CASE-09`: Clear & Reset Semantics in Programmer Mode (C vs AC Register Isolation)
- **Actor**: `ProgrammerUser`
- **Preconditions**: Programmer mode active in HEX radix.
- **Action Sequence / Input**:
  - Enter `FF AND AA`.
  - Press Clear (`C`).
  - Enter `0F =`.
  - Press All Clear (`AC`).
- **Expected Outcome**:
  - `C` resets active display buffer to `"0"` while preserving accumulator `0xFF`, pending operator `AND`, and active radix `HEX`.
  - Evaluating with `0F =` computes `0xFF & 0x0F = 0x0F` (display `"F"`).
  - `AC` resets accumulator, pending operator, and buffer to `"0"`, but preserves mode `"programmer"` and radix `"HEX"`.
- **Enforces**: `RULE-CALC-004`, `RULE-CALC-006`, `SEAM-ENGINE-01`

### `CASE-10`: Dynamic Keypad Gating & Radix Invariant Enforcement
- **Actor**: `ProgrammerUser`
- **Preconditions**: `<stay-calc>` component mounted in programmer mode.
- **Action Sequence / Input**:
  - Switch to `BIN` radix: inspect enabled/disabled states of keys 0–9, A–F, and `.`.
  - Switch to `OCT` radix: inspect keys 0–7, 8–9, A–F, and `.`.
  - Switch to `DEC` radix: inspect keys 0–9, A–F, and `.`.
  - Switch to `HEX` radix: inspect keys 0–9, A–F, and `.`.
  - Test physical keyboard presses matching disabled keys (e.g. typing `'2'` in BIN or `'9'` in OCT).
- **Expected Outcome**:
  - `BIN`: only 0 and 1 enabled; 2–9, A–F, `.` disabled and have `aria-disabled="true"`.
  - `OCT`: only 0–7 enabled; 8, 9, A–F, `.` disabled.
  - `DEC`: only 0–9 enabled; A–F, `.` disabled.
  - `HEX`: 0–9 and A–F enabled; `.` disabled.
  - Inactive keyboard keypresses are strictly intercepted and ignored (`preventDefault()`).
- **Enforces**: `RULE-CALC-004`, `SEAM-UI-01`

### `CASE-11`: Component UI, Container Queries, Accessibility & Event Synchronization
- **Actor**: `ScreenReaderUser` / `KeyboardPowerUser`
- **Preconditions**: `<stay-calc>` mounted in browser/DOM in programmer mode.
- **Action Sequence / Input**:
  - Inspect `#radixSelector` buttons and `aria-pressed` states.
  - Inspect `#multiRadixPreview` container and row elements.
  - Inspect `#programmerKeys` buttons for accessible ARIA labels.
  - Verify container queries across 320px, 375px, and 390px viewports.
  - Verify dispatched `calc-change` and `mode-change` CustomEvents.
- **Expected Outcome**:
  - Active radix button has `aria-pressed="true"`.
  - All programmer function and hex buttons feature descriptive `aria-label` attributes.
  - Zero horizontal scroll overflow (`scrollWidth <= clientWidth`) across 320px–390px viewports (`RULE-RESP-001`).
  - `mode-change` and `calc-change` events dispatch complete state details including `radix` and `multiRadix`.
- **Enforces**: `RULE-RESP-001`, `SEAM-UI-01`

---

## 2. Lived-System Stall Matrix (12 Canonical Stalls)

| Stall # & Name | Trigger Condition | Visible System Response | Recovery Action | Target Test File |
| :--- | :--- | :--- | :--- | :--- |
| **1. Empty or zero match** | First mount before mode switch | Programmer keys and radix selector hidden | Switch mode to programmer | `test/programmer.test.ts` |
| **2. Stuck or slow wait** | Rapid bitwise calculations | Synchronous execution (`< 1ms`) | N/A (instant execution) | `test/programmer.test.ts` |
| **3. Bad or incomplete input** | Typing 'A' while in DEC or BIN radix | Key disabled, input ignored | Switch radix to HEX | `test/programmer.test.ts` |
| **4. Hard failure or outage** | Integer division by zero (`42 / 0`) | Error displayed (`"Cannot divide by zero"`); input locked | Clear with `C` or `AC` or `Escape` | `test/programmer.test.ts` |
| **5. Double-tap or race** | Rapid repeated clicks on radix buttons | Clean idempotent radix conversion | N/A | `test/programmer.test.ts` |
| **6. Two concurrent sessions** | Multiple `<stay-calc>` instances | Isolated mode and radix state per component | N/A | `test/programmer.test.ts` |
| **7. Partial success** | 32-bit signed integer overflow | Wraps cleanly per two's complement rules | N/A (predictable wrapping) | `test/programmer.test.ts` |
| **8. Leave and return** | Mode switched mid-calculation | Intermediate accumulator and operator preserved | Return to programmer mode | `test/programmer.test.ts` |
| **9. Offline** | Complete offline execution | 100% zero-dependency local code | Full offline capability | `test/programmer.test.ts` |
| **10. Stale seam arrival** | Unknown action dispatched | Calculator state preserved unchanged | Dispatch valid action | `test/programmer.test.ts` |
| **11. UI desync** | Radix gating out of sync with state | `syncUI()` ensures 1:1 state reflection | Automatic DOM synchronization | `test/programmer.test.ts` |
| **12. Auth halfway** | N/A (Guest-safe utility) | Unrestricted local utility | N/A | `test/programmer.test.ts` |

---

## 3. Traceability Chain

| Rule / Invariant ID | Flow Decision | Seam ID | Case ID | Test Category | Target Test File |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `RULE-CALC-004` | `DEC-PROG-01` | `SEAM-ENGINE-01` | `CASE-01` | Bitwise Nominal Execution | `test/programmer.test.ts` |
| `NEVER-CALC-001` | `DEC-PROG-01` | `SEAM-ENGINE-01` | `CASE-01` | Zero Dynamic Eval | `test/programmer.test.ts` |
| `RULE-CALC-004` | `DEC-PROG-01` | `SEAM-UI-01` | `CASE-02` | Initial Bootstrap & Defaults | `test/programmer.test.ts` |
| `RULE-CALC-001` | `DEC-PROG-03` | `SEAM-ENGINE-01` | `CASE-03` | Division by Zero Lockout | `test/programmer.test.ts` |
| `NEVER-CALC-004` | `DEC-PROG-03` | `SEAM-ENGINE-01` | `CASE-03` | No Unhandled NaN/Infinity | `test/programmer.test.ts` |
| `RULE-CALC-008` | `DEC-PROG-04` | `SEAM-ENGINE-01` | `CASE-04` | Bitwise Operator Replacement | `test/programmer.test.ts` |
| `RULE-CALC-004` | `DEC-PROG-01` | `SEAM-ENGINE-01` | `CASE-05` | Radix Toggle Idempotency | `test/programmer.test.ts` |
| `RULE-CALC-004` | `DEC-PROG-01` | `SEAM-ENGINE-01` | `CASE-06` | 32-Bit Two's Complement Clamping | `test/programmer.test.ts` |
| `RULE-CALC-004` | `DEC-PROG-02` | `SEAM-ENGINE-01` | `CASE-07` | Hex & Octal Input Normalization | `test/programmer.test.ts` |
| `RULE-CALC-006` | `DEC-PROG-01` | `SEAM-ENGINE-01` | `CASE-08` | State Persistence Across Modes | `test/programmer.test.ts` |
| `RULE-CALC-004` | `DEC-PROG-01` | `SEAM-ENGINE-01` | `CASE-09` | Clear & Reset Semantics | `test/programmer.test.ts` |
| `RULE-CALC-004` | `DEC-PROG-02` | `SEAM-UI-01` | `CASE-10` | Dynamic Keypad Gating | `test/programmer.test.ts` |
| `RULE-RESP-001` | `DEC-PROG-01` | `SEAM-UI-01` | `CASE-11` | UI, Container Queries & Events | `test/programmer.test.ts` |

---

## 4. Cases N/A Declarations

- **Network Latency & Timeout (`CASE-06` in macro catalog)**: N/A (Programmer mode operations are synchronous in-memory state transitions without network calls).
- **Tenant Auth & Permissions (`CASE-03` in macro catalog)**: N/A (StayCalc operates locally within the client browser session without user access controls).

---

## 5. References
- [Feature Specification](./feature.md)
- [User Flow & Decision Trees](./flow.md)
