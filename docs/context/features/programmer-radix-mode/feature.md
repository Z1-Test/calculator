---
type: Feature
title: "Programmer Radix Mode & Bitwise Operations"
status: stable
description: "Multi-radix integer representation (HEX, DEC, OCT, BIN), real-time live readout panel, bitwise operations, selectable word sizes, and active keypad gating for StayCalc."
tags: [feature, programmer, radix, bitwise, hex, binary, okf-v0.2]
generated: { by: "process:implement", at: "2026-10-15T00:00:00Z" }
sources:
  - id: source-domain-rules
    resource: docs/context/project/domain-rules.md
    title: Domain Rules
  - id: source-architecture
    resource: docs/context/project/architecture.md
    title: System Architecture
---

# Feature: Programmer Radix Mode & Bitwise Operations

Authoritative specification for the StayCalc programmer calculation mode, multi-radix integer arithmetic, live four-base readout panel, bitwise operations, configurable word sizes, and active radix keypad gating.

## 1. Problem, Actors & Outcome
- **Problem & Context**: Software engineers, computer systems students, and embedded firmware developers frequently work with bitmasks, binary data, memory addresses, and radix conversions. Standard decimal pocket calculators cannot perform bitwise operations (`AND`, `OR`, `XOR`, `NOT`, `LSH`, `RSH`) or display simultaneous conversions across Hexadecimal (`HEX`), Decimal (`DEC`), Octal (`OCT`), and Binary (`BIN`) representations. Additionally, entering digits invalid for the active base (such as `8` in octal or `A` in decimal) leads to silent bugs if the keypad is not reactively gated.
- **Target Actors & Roles**:
  | Role / Persona | Surface | Arrival State / Prerequisite | Permissions & Access |
  | :--- | :--- | :--- | :--- |
  | `StandardUser` | `<stay-calc>`, `src/engine/` | Calculator interface loaded | Full calculation & mode toggle access |
- **Checkable Success ("This Worked")**:
  - The `#programmer-toggle` button toggles `#programmer-panel` with synchronized `aria-expanded` and `aria-controls`.
  - The `#radix-panel` renders live values simultaneously across all 4 bases: `HEX`, `DEC`, `OCT`, and `BIN`.
  - Clicking any base row in `#radix-panel` sets the active radix base without losing the current numeric value or accumulator (`NEVER-CALC-002`).
  - Bitwise operations (`AND`, `OR`, `XOR`, `NOT`, `LSH`, `RSH`) evaluate correctly with two's complement integer arithmetic.
  - Configurable word sizes (`8-bit`, `16-bit`, `32-bit`, `64-bit`) clamp values using unsigned masking (`BigInt.asUintN(bits, BigInt(val))`) and signed decimal representation.
  - Keypad buttons and physical keyboard keys are gated according to active radix: hex keys `A-F` are enabled only in `HEX`; digits `8-9` are disabled in `OCT`; digits `2-9` are disabled in `BIN`; decimal point `.` is disabled in all programmer modes.
  - Zero horizontal overflow (`scrollWidth <= clientWidth`) across 320px–390px mobile viewports.
- **Checkable Failure ("This Is Broken")**:
  - Engine produces floating-point decimals, `NaN`, or unhandled `Infinity` in programmer mode.
  - Programmer panel or 64-bit binary string overflows the mobile viewport.
  - Mode toggle or base switch clears the active accumulator, memory, or history registers.

## 2. Scope & Boundary Invariants
- **In This Revision**:
  - Multi-radix base selection: `HEX` (base 16), `DEC` (base 10), `OCT` (base 8), `BIN` (base 2).
  - Word size configuration: `8` (BYTE), `16` (WORD), `32` (DWORD), `64` (QWORD).
  - Bitwise operators: binary `AND` (`&`), `OR` (`|`), `XOR` (`^`), `LSH` (`<<`), `RSH` (`>>`); unary `NOT` (`~`).
  - Real-time `getMultiRadixState()` returning formatted `{ hex, dec, oct, bin }`.
  - Live `#radix-panel` UI with clickable base selectors and synchronized ARIA states.
  - Reactive keypad gating for hex keys `A` through `F` and numeric keys `0` through `9`.
  - Keyboard listener gating matching active radix and programmer mode rules.
- **Refused / Owned Elsewhere**:
  - Floating-point radix conversions (e.g. IEEE-754 hex float representation) - integer only.
  - 128-bit or arbitrary-width integer bit widths - bounded to standard word sizes (8, 16, 32, 64).
  - Interactive 64-bit individual bit matrix toggle grid - reserved for follow-up backlog.
- **Underlying Product Rules**:
  - `RULE-PROG-001` (Multi-Radix Integer Representation): In programmer mode, values are represented as arbitrary-precision BigInt integers and formatted simultaneously into HEX, DEC, OCT, and BIN representations.
  - `RULE-PROG-002` (Word Size Masking & Overflow): Calculations truncate and wrap to the active word size (`8`, `16`, `32`, `64`-bit) using two's complement unsigned masking (`BigInt.asUintN(bits, BigInt(val))`).
  - `RULE-PROG-003` (Active Radix Keypad Gating): Digits outside active base (`8-9` in OCT, `2-9` in BIN, `A-F` in DEC/OCT/BIN, `.` in all programmer modes) are disabled via HTML `disabled` attribute and ignored on keyboard typing.
  - `RULE-PROG-004` (Programmer UI Zero Horizontal Overflow): `#programmer-panel`, `#radix-panel`, and hex keypad grids must maintain `scrollWidth <= clientWidth` on 320px–390px mobile viewports.
- **What Must Never Happen**:
  - `NEVER-CALC-001`: Never evaluate mathematical expressions using JavaScript `eval()` or `new Function()`.
  - `NEVER-CALC-002`: Never lose active buffer, accumulator, memory registers, or history tape upon mode toggles.
  - `NEVER-CALC-003`: Never allow mutations while engine is locked in error state until `clear()` or `allClear()` is invoked.

## 3. Object Lifecycle, Survivability & Storage
- **Engine State Extension**:
  - `radix: RadixBase` (`"HEX"` | `"DEC"` | `"OCT"` | `"BIN"`), defaults to `"DEC"`.
  - `wordSize: WordSize` (`8` | `16` | `32` | `64`), defaults to `64`.
  - `isProgrammerMode: boolean`, defaults to `false`.
- **UI State Extension**:
  - `isProgrammerOpen: boolean`, defaults to `false`.
- **SLA & Latency Ceilings**:
  - BigInt radix formatting and bitwise computation latency: `<= 1ms` synchronous evaluation.
  - Radix switch and keypad gating reactivity: instant synchronous DOM update.

| Entity / Object | Identity Model | State (Draft vs Committed) | Survives Page Refresh? | Survives App Kill? | Survives Mode Switch? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `radix` | In-memory `CalcEngine` | Committed | No (session in-memory) | No | Yes |
| `wordSize` | In-memory `CalcEngine` | Committed | No (session in-memory) | No | Yes |
| `isProgrammerOpen` | In-memory `<stay-calc>` | Committed | No (session in-memory) | No | Yes |
| `multiRadixState` | Derived `CalcEngine` | Committed | No (session in-memory) | No | Yes |
