---
type: Feature
title: "F6: Programmer Radix Mode and Bitwise Operations"
status: stable
description: "Authoritative product problem, rules, boundary invariants, scope, and survivability matrix for Programmer Radix Mode, Multi-Base Switching, and Bitwise Operations."
tags: [feature, programmer, radix, bitwise, hex, bin, oct, dec, web-component, okf-v0.2]
sources:
  - resource: ../../project/vision.md
  - resource: ../../project/domain-rules.md
  - resource: ../../project/architecture.md
  - resource: ../../project/design.md
  - resource: ../f1-precision-arithmetic-engine/feature.md
  - resource: ../f2-accessible-ui-keyboard-nav/feature.md
  - resource: ../f5-scientific-mode/feature.md
---

# Feature: F6 - Programmer Radix Mode and Bitwise Operations

Authoritative product specification for the StayCalc programmer calculation subsystem, multi-base radix conversions (`HEX`, `DEC`, `OCT`, `BIN`), 32-bit two's complement integer arithmetic, bitwise operations (`AND`, `OR`, `XOR`, `NOT`, `LSH`, `RSH`), dynamic keypad gating, and simultaneous multi-radix preview display. Governed by `docs/context/project/`.

## 1. Problem, Actors & Outcome
- **Problem & Context**: Software engineers, embedded systems programmers, security researchers, and computer science students routinely work across multiple numeral systems (hexadecimal base 16, decimal base 10, octal base 8, and binary base 2) and perform 32-bit bitwise logic operations (`AND`, `OR`, `XOR`, `NOT`, `LSH`, `RSH`). Standard or scientific calculators force awkward decimal approximations or lack bitwise semantics altogether. Furthermore, switching between numeral bases must dynamically gate input keys (e.g., locking out digits 2–9 and A–F in binary mode, or 8–9 and A–F in octal mode) so invalid numbers cannot be typed, while simultaneous multi-radix preview cards give instant cross-base feedback. Mode switching between standard, scientific, and programmer modes must preserve active registers, memory, history, and accumulator without reset or data loss (`RULE-CALC-006`).
- **Target Actors & Roles**:
  | Role / Persona | Surface | Arrival State / Prerequisite | Permissions & Access |
  | :--- | :--- | :--- | :--- |
  | `ProgrammerUser` | `<stay-calc>` Host | Pointer or touchscreen interaction | Switch mode to programmer, select radix, input hex digits, execute bitwise ops |
  | `KeyboardPowerUser` | `<stay-calc>` Host | Physical keyboard navigation | Enter hex/bin digits, use keyboard bitwise shortcuts (`&`, `|`, `^`, `~`), Tab focus |
  | `ScreenReaderUser` | `<stay-calc>` ARIA Live Region | Assistive technology active | Receive polite announcements on radix changes, multi-radix preview values, and keypad gating |
- **Checkable Success ("This Worked")**:
  1. Mode switching transitions `CalculatorState.mode` to `"programmer"`, rendering the radix selector (`#radixSelector`), multi-radix preview panel (`#multiRadixPreview`), and programmer keys (`#programmerKeys: A–F, AND, OR, XOR, NOT, LSH, RSH`).
  2. Selecting a radix (`HEX`, `DEC`, `OCT`, `BIN`) converts the active display value into the chosen numeral system and updates the `#multiRadixPreview` display synchronously.
  3. Dynamic keypad gating disables invalid digits and decimal point per radix:
     - `BIN`: enables 0 and 1; disables 2–9, A–F, and `.`.
     - `OCT`: enables 0–7; disables 8, 9, A–F, and `.`.
     - `DEC`: enables 0–9; disables A–F and `.`.
     - `HEX`: enables 0–9 and A–F; disables `.`.
  4. Bitwise operations (`AND`, `OR`, `XOR`, `LSH`, `RSH`) and unary `NOT` evaluate with exact 32-bit signed integer semantics (`RULE-CALC-004`).
  5. Integer arithmetic (`+`, `-`, `*`, `/`) truncates to 32-bit signed integer boundaries; integer division by zero triggers locked error state `"Cannot divide by zero"` (`RULE-CALC-001`).
  6. Memory registers, calculation history tape, and intermediate accumulators persist across mode switches (`standard` <-> `scientific` <-> `programmer`) (`RULE-CALC-006`).
  7. CustomEvents `calc-change` and `mode-change` are dispatched upon state transitions (`SEAM-UI-01`).
- **Checkable Failure ("This Is Broken")**: Decimal point allowed in programmer mode; invalid digits accepted in BIN or OCT radix; division by zero crashes or returns `Infinity`; negative numbers leak unhandled float representation; horizontal scrollbar on 320px–390px viewports (`RULE-RESP-001`).

## 2. Scope & Boundary Invariants
- **In This Revision**:
  - `Radix` contract: `"HEX" | "DEC" | "OCT" | "BIN"`.
  - `CalculatorMode` contract: `"standard" | "scientific" | "programmer"`.
  - `MultiRadixValues` contract: `{ readonly hex: string; readonly dec: string; readonly oct: string; readonly bin: string; }`.
  - Actions: `SET_RADIX`, `BITWISE_NOT`, `INPUT_HEX_DIGIT`, `SET_MODE`, `CYCLE_MODE`.
  - Extended Operator union: `'+' | '-' | '*' | '/' | '^' | 'AND' | 'OR' | 'XOR' | 'LSH' | 'RSH' | '&' | '|' | '<<' | '>>'`.
  - Radix selector buttons with `aria-pressed` (`#btnRadixHex`, `#btnRadixDec`, `#btnRadixOct`, `#btnRadixBin`).
  - Multi-radix preview cards (`#multiRadixPreview` displaying hex, dec, oct, bin values).
  - Programmer keys container (`#programmerKeys`) with 6 bitwise operators and 6 hex digits (A–F).
  - Dynamic keypad gating for both DOM buttons and physical keyboard events.
  - 32-bit signed integer clamping (`RULE-CALC-004`).
  - Container queries and CSS logical properties with zero horizontal scroll overflow on 320px–390px viewports (`RULE-RESP-001`).
- **Refused / Owned Elsewhere**:
  - Word size selection (BYTE 8-bit, WORD 16-bit, QWORD 64-bit) beyond standard 32-bit integer logic.
  - Floating-point radix arithmetic (fractional binary/hex).
  - ASCII/Unicode string conversion tools.
- **Underlying Product Rules (Screen-Agnostic Truths)**:
  - `RULE-CALC-001` (Zero Division & Error Safeguard): Division by zero in integer arithmetic immediately triggers `"Cannot divide by zero"` and locks input (`isLocked = true`).
  - `RULE-CALC-004` (Radix Integer Clamping): Programmer mode calculations operate on 32-bit signed integers with two's complement representation.
  - `RULE-CALC-006` (Memory Register & State Persistence Across Modes): Memory registers, calculation history tape, accumulator, and display buffer persist intact across mode switches (`standard` <-> `scientific` <-> `programmer`).
  - `RULE-RESP-001` (Responsive Viewport Layout): Programmer UI layout strictly conforms to CSS container queries (`@container calc-host`) with zero horizontal scroll overflow (`scrollWidth <= clientWidth`) across 320px–390px mobile viewports.
- **What Must Never Happen**:
  - `NEVER-CALC-001` (No Dynamic Eval): Never evaluate mathematical or bitwise expressions using JavaScript `eval()` or `new Function()`.
  - `NEVER-CALC-004` (No Unhandled NaN/Infinity): Engine must never leak `NaN`, `Infinity`, or `-Infinity` into display or state.

## 3. Object Lifecycle, Survivability & Storage Architecture
- **Dual-Tier Draft Storage**:
  - **Tier 1 (Client In-Memory Engine State)**: `CalculatorState.mode`, `CalculatorState.radix`, `CalculatorState.multiRadix`.
  - **Tier 2 (Component DOM Projection)**: Shadow DOM elements (`#radixSelector`, `#multiRadixPreview`, `#programmerKeys`).
- **SLA & Latency Ceilings**:
  - Radix conversion and bitwise operations: synchronous deterministic execution `<= 1ms`.
  - Keypad gating and preview UI synchronization: `<= 16ms` (60fps feedback).

| Entity / Object | Identity Model | State (Draft vs Committed) | Survives Refresh? | Survives App Kill? | Survives Mode Switch? | Survives Clear (C)? | Survives All Clear (AC)? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `mode` | Engine State Property | Committed | No | No | N/A (Switched) | Yes | Yes |
| `radix` | Engine State Property | Committed | No | No | Yes | Yes | Yes |
| `multiRadix` | Engine State Object | Committed | No | No | Yes | Resets to "0" | Resets to "0" |
| `memory` Register | Numeric Engine State | Committed | No | No | Yes (`RULE-CALC-006`) | Yes | No |
| `history` Tape | History Entry Array | Committed | No | No | Yes (`RULE-CALC-006`) | Yes | Yes |
| `accumulator` / `buffer` | Engine Arithmetic State | Committed / Draft | No | No | Yes (`RULE-CALC-006`) | C resets buffer | AC resets all |
| `#programmerKeys` | Shadow DOM Container | UI Visible / Hidden | No | No | Yes (Reflects mode) | Yes | Yes |

## 4. Notifications, Auditing & Reporting
- **Radix Selection Accessibility**: `#btnRadixHex`, `#btnRadixDec`, `#btnRadixOct`, `#btnRadixBin` reflect `aria-pressed="true"` for the active radix.
- **Multi-Radix Preview Region**: `#multiRadixPreview` exposes `role="region"` and `aria-label="Multi-radix values"`.
- **Programmer Keys Accessibility**: All bitwise and hex buttons provide descriptive ARIA labels (`aria-label="Bitwise AND"`, `aria-label="Hex A"`, etc.).
- **CustomEvent Dispatch**: State changes dispatch `calc-change` (`detail: CalculatorState`) and `mode-change` (`detail: { mode, angleUnit, radix }`).

## 5. Cross-Feature Seams (`SEAM-*`)
Seam contracts live in this file — do **not** author a separate `contract.md` in the slice.

| Seam ID | Source Slice | Destination Slice | Arrival Payload | Handoff Payload | Failure Owner | Related RULE / NEVER |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `SEAM-ENGINE-01` | F6 UI (`<stay-calc>`) | F1 Engine | `CalculatorAction` (Radix & Bitwise Actions) | `CalculatorState` (`radix`, `multiRadix`) | destination | `RULE-CALC-001`, `RULE-CALC-004`, `RULE-CALC-006` |
| `SEAM-UI-01` | F6 UI (`<stay-calc>`) | Host App / Consumers | Custom Events `calc-change`, `mode-change` | `{ detail: CalculatorState }` | source | `RULE-RESP-001`, `NEVER-CALC-004` |
