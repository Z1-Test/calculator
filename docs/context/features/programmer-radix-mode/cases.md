---
type: Test Cases
title: "Programmer Radix Mode & Bitwise Test Cases"
status: stable
description: "Unified verification scenarios, 11 universal cases, stall matrix, and traceability for multi-radix conversions, bitwise arithmetic, and keypad gating."
tags: [cases, test-cases, programmer, radix, bitwise, okf-v0.2]
generated: { by: "process:implement", at: "2026-10-15T00:00:00Z" }
sources:
  - id: source-feature
    resource: ./feature.md
    title: Feature Specification
  - id: source-flow
    resource: ./flow.md
    title: User Flow
---

# Test Cases: Programmer Radix Mode & Bitwise Arithmetic

Authoritative test scenarios for the StayCalc programmer calculation mode. Grounded in `feature.md` invariants (`RULE-*` / `NEVER-*`) and `flow.md` decisions.

## 1. Universal Scenarios (11 Standard Types)

### `CASE-PROG-01`: Multi-Radix Integer Conversion
- **Actor**: `StandardUser`
- **Preconditions**: `CalcEngine` instantiated in programmer mode.
- **Action Sequence**: Input decimal `255`, query `getMultiRadixState()`.
- **Expected Outcome**: `hex` returns `"FF"`, `dec` returns `"255"`, `oct` returns `"377"`, `bin` returns `"11111111"`.
- **Enforces**: `RULE-PROG-001`

### `CASE-PROG-02`: Real-time Multi-Radix State Readout
- **Actor**: `StandardUser`
- **Preconditions**: Initial state with buffer `0`.
- **Action Sequence**: Call `getMultiRadixState()`.
- **Expected Outcome**: All four representations return clean zeros (`hex: "0"`, `dec: "0"`, `oct: "0"`, `bin: "0"`).
- **Enforces**: `RULE-PROG-001`

### `CASE-PROG-03`: Bitwise AND (`&`) and OR (`|`) Operations
- **Actor**: `StandardUser`
- **Preconditions**: Numbers in buffer.
- **Action Sequence**: Evaluate `12 & 10` -> `8` (`1100 & 1010 = 1000`); evaluate `12 | 10` -> `14` (`1100 | 1010 = 1110`).
- **Expected Outcome**: Correct bitwise AND and OR results formatted according to active radix without dynamic eval.
- **Enforces**: `RULE-PROG-001`, `RULE-PROG-002`, `NEVER-CALC-001`

### `CASE-PROG-04`: Bitwise XOR (`^`) and Unary NOT (`~`)
- **Actor**: `StandardUser`
- **Preconditions**: Active word size 8-bit.
- **Action Sequence**: Evaluate `12 ^ 10` -> `6` (`1100 ^ 1010 = 0110`); evaluate `~0` in 8-bit mode.
- **Expected Outcome**: XOR yields `6`; unary NOT on `0` in 8-bit yields `255` (unsigned) / `-1` (signed).
- **Enforces**: `RULE-PROG-002`

### `CASE-PROG-05`: Bitwise Left Shift (`<<`) and Right Shift (`>>`)
- **Actor**: `StandardUser`
- **Preconditions**: Word size 16-bit.
- **Action Sequence**: Evaluate `5 << 2` -> `20`; evaluate `20 >> 2` -> `5`.
- **Expected Outcome**: Shift operations compute correctly without bit loss within word size boundary.
- **Enforces**: `RULE-PROG-002`, `DEC-PROG-04`

### `CASE-PROG-06`: Selectable Word Sizes & Overflow Truncation
- **Actor**: `StandardUser`
- **Preconditions**: Set word sizes to 8-bit, 16-bit, 32-bit, 64-bit.
- **Action Sequence**: In 8-bit mode, compute `200 + 100` (`300`).
- **Expected Outcome**: Truncates via modulo 256 to `44` (`300 & 0xFF = 44`).
- **Enforces**: `RULE-PROG-002`

### `CASE-PROG-07`: Signed vs Unsigned Multi-Radix Representation
- **Actor**: `StandardUser`
- **Preconditions**: Word size 8-bit.
- **Action Sequence**: Enter `-1` or compute `0 - 1`.
- **Expected Outcome**: Unsigned masks yield `hex: "FF"`, `bin: "11111111"`, `oct: "377"`, while decimal displays `-1`.
- **Enforces**: `RULE-PROG-001`, `RULE-PROG-002`

### `CASE-PROG-08`: Accessible Programmer Mode Panel Toggle
- **Actor**: `StandardUser`
- **Preconditions**: `<stay-calc>` mounted.
- **Action Sequence**: Click `#programmer-toggle`.
- **Expected Outcome**: `#programmer-panel` toggles `.open` class and display, `#programmer-toggle` synchronizes `aria-expanded` (`true`/`false`).
- **Enforces**: `FLW-PROG-01`, WCAG 2.2 AA

### `CASE-PROG-09`: Live Radix Panel Interaction & Mid-Entry Base Switch
- **Actor**: `StandardUser`
- **Preconditions**: Input buffer has `"255"` in `DEC`.
- **Action Sequence**: Click `HEX` row in `#radix-panel`.
- **Expected Outcome**: Active radix becomes `HEX`, display converts to `"FF"`, accumulator and memory are preserved (`NEVER-CALC-002`).
- **Enforces**: `DEC-PROG-05`, `NEVER-CALC-002`

### `CASE-PROG-10`: Active Radix Keypad Gating
- **Actor**: `StandardUser`
- **Preconditions**: Programmer panel open.
- **Action Sequence**: Switch to `BIN`, verify buttons `2`–`9` and `A`–`F` are disabled; switch to `OCT`, verify `8`–`9` and `A`–`F` are disabled; switch to `HEX`, verify `A`–`F` are enabled. Verify decimal point `.` is disabled across all bases.
- **Expected Outcome**: Correct HTML `disabled` attributes on buttons; keyboard typing ignores invalid characters.
- **Enforces**: `RULE-PROG-003`, `DEC-PROG-01`, `DEC-PROG-02`

### `CASE-PROG-11`: Mobile Viewport Zero-Overflow
- **Actor**: `StandardUser`
- **Preconditions**: Viewport widths 320px, 375px, 390px.
- **Action Sequence**: Render `<stay-calc>` with programmer panel open (displaying 64-bit binary string).
- **Expected Outcome**: `scrollWidth <= clientWidth`, zero horizontal overflow across all mobile viewports.
- **Enforces**: `RULE-PROG-004`

## 2. Stall Matrix & Recovery

| Stall ID | Cause / Trigger | Manifestation | Resolution |
| :--- | :--- | :--- | :--- |
| `STL-PROG-01` | Integer division by zero (`n / 0`) | Display shows `"Cannot divide by zero"` (enforces `NEVER-CALC-003`) | Press `C` or `AC` to unlock |
| `STL-PROG-02` | Shift by negative or excessive bits | Clamped to `[0, wordSize - 1]` | Automatic boundary recovery |
| `STL-PROG-03` | User types invalid radix key (e.g. 'F' in BIN) | Key ignored via `preventDefault()` | Zero visual corruption |
| `STL-PROG-04` | 64-bit binary string length | Word wrapped with tabular nums | Zero horizontal overflow |
