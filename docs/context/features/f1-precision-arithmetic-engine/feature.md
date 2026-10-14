---
type: Feature
title: "F1: Precision Arithmetic Engine"
status: stable
description: "Authoritative product problem, rules, boundary invariants, scope, and survivability matrix for Precision Arithmetic Engine."
tags: [feature, arithmetic-engine, precision, math, okf-v0.2]
sources:
  - resource: ../../project/vision.md
  - resource: ../../project/domain-rules.md
  - resource: ../../project/architecture.md
---

# Feature: F1 - Precision Arithmetic Engine

Authoritative product specification for the StayCalc precision arithmetic engine. Governed by `docs/context/project/`.

## 1. Problem, Actors & Outcome
- **Problem & Context**: Standard JavaScript floating-point arithmetic introduces IEEE 754 binary representation noise (e.g. `0.1 + 0.2 = 0.30000000000000004`), unhandled division by zero yields `Infinity`/`NaN`, and standard pocket calculator users require deterministic, sequential left-to-right immediate evaluation rather than algebraic operator-precedence parsing.
- **Target Actors & Roles**:
  | Role / Persona | Surface | Arrival State / Prerequisite | Permissions & Access |
  | :--- | :--- | :--- | :--- |
  | `GeneralUser` | `src/engine/` | Fresh calculator session or active calculation | Execute binary arithmetic, clear registers, recover errors |
- **Checkable Success ("This Worked")**:
  1. Arithmetic operations evaluate sequentially left-to-right upon operator keying (`2 + 3 * 4 = 20`).
  2. Decimal operations eliminate IEEE 754 precision artifacts (`0.1 + 0.2 = 0.3`, `0.7 + 0.1 = 0.8`).
  3. Division by zero immediately displays `"Cannot divide by zero"` and locks the engine against further input until cleared (`RULE-CALC-001`).
  4. Successive operator keystrokes replace the pending operator (`5 + * 2 = 10`).
  5. Clear registers operate deterministically: `C` flushes active buffer to `"0"`; `AC` flushes accumulator, pending operator, buffer, and error locks.
- **Checkable Failure ("This Is Broken")**: Display outputs `Infinity`, `NaN`, or float artifacts (`0.30000000000000004`); division by zero allows continued digit input; consecutive operators fail or double-apply.

## 2. Scope & Boundary Invariants
- **In This Revision**:
  - Immediate execution calculation model (left-to-right pocket calculator order).
  - Four primary arithmetic operations: addition (`+`), subtraction (`-`), multiplication (`*`), division (`/`).
  - IEEE 754 precision normalization with maximum 10 display digits and clean rounding.
  - Division by zero detection with `"Cannot divide by zero"` display and input lock.
  - Operator replacement on consecutive operator presses (`5 + * 2 = 10`).
  - Register management: Clear (`C`) and All Clear (`AC`).
  - Decimal point deduplication (`3.1.4 -> 3.14`) and sign toggle (`+/-`).
- **Refused / Owned Elsewhere**:
  - DOM rendering and keyboard event bindings (owned by F2 / `<stay-calc>`).
  - Memory registers `M+`/`M-`/`MR`/`MC` (owned by F3).
  - History tape persistence and drawer UI (owned by F4).
  - Scientific trigonometric / exponential functions (owned by F5).
- **Underlying Product Rules (Screen-Agnostic Truths)**:
  - `RULE-CALC-001` (Zero Division Safeguard): Division by zero (`n ÷ 0`) must immediately yield a sanitized, user-facing `"Cannot divide by zero"` error state rather than JavaScript `Infinity` or `NaN`.
  - `RULE-CALC-002` (Precision Normalization): All floating-point operations in Standard and Scientific modes must truncate IEEE-754 representation noise to a maximum of 10 display digits (e.g., `0.1 + 0.2` must display `0.3`).
  - `RULE-CALC-007` (Immediate Execution Model): Arithmetic evaluation follows immediate execution pocket calculator order (left-to-right: `2 + 3 * 4 = 20`).
  - `RULE-CALC-008` (Operator Replacement Invariant): Consecutive operator keying replaces the active pending operator without evaluating intermediary operations (`5 + * 2 = 10`).
  - `RULE-CALC-009` (Register Reset Invariant): Clear (`C`) resets the active input buffer to `"0"` while preserving accumulator and pending operator; All Clear (`AC`) flushes accumulator, pending operator, input buffer, and error lock.
- **What Must Never Happen**:
  - `NEVER-CALC-001` (No Dynamic Eval): Never evaluate mathematical expressions using JavaScript `eval()` or `new Function()`. All expressions must pass through deterministic engine calculation routines.
  - `NEVER-CALC-004` (No Unhandled NaN/Infinity): Never expose unhandled `NaN`, `Infinity`, or `-Infinity` to user display or state buffers.

## 3. Object Lifecycle, Survivability & Storage Architecture
- **Dual-Tier Draft Storage**:
  - **Tier 1 (Client Transient)**: In-memory engine state (`CalculatorState`) tracking accumulator, active display buffer, pending operator, waiting flag, and error lock.
  - **Tier 2 (Server / Client Persistent)**: Completed calculation entries (`CalculationEntry`) handed off to `staycalc_history` upon `=` execution.
- **SLA & Latency Ceilings**:
  - Evaluation execution latency: synchronous deterministic execution `<= 1ms`.
  - Interactive input feedback threshold: `<= 16ms` (60fps UI dispatch).

| Entity / Object | Identity Model | State (Draft vs Committed) | Survives Refresh? | Survives App Kill? | Survives Clear (C)? | Survives All Clear (AC)? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `CalculatorState` | In-memory singleton | Transient | No | No | Yes (Preserves accumulator & operator) | No (Full reset to initial) |
| `CalculationEntry` | UUID v4 / timestamp | Committed on `=` | Yes (`localStorage`) | Yes (`localStorage`) | Yes | Yes |

## 4. Notifications, Auditing & Reporting
- **User Notifications**: Error states render directly within the primary calculator display slot (`"Cannot divide by zero"`).
- **Audit Logging**: Completed operations emit calculation records `{ expression, result, timestamp }` for history tape consumption.

## 5. Cross-Feature Seams (`SEAM-*`)
Seam contracts live in this file — do **not** author a separate `contract.md` in the slice.

| Seam ID | Source Slice | Destination Slice | Arrival Payload | Handoff Payload | Failure Owner | Related RULE / NEVER |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `SEAM-ENGINE-01` | F1 Engine | F2 UI (`<stay-calc>`) | `CalculatorAction` | `CalculatorState` | source | `RULE-CALC-001`, `RULE-CALC-002` |
| `SEAM-ENGINE-02` | F1 Engine | F4 History Tape | Completed calculation `=` | `{ expression: string, result: string }` | source | `RULE-CALC-007` |

## 6. References
- [User Flow](./flow.md)
- [Test Cases](./cases.md)
