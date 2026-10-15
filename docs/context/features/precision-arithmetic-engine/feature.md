---
type: Feature
title: "Precision Arithmetic Engine"
status: stable
description: "Core deterministic immediate-execution arithmetic engine with decimal precision normalization and zero-division safeguard."
tags: [feature, arithmetic, math-engine, okf-v0.2]
generated: { by: "process:implement", at: "2026-10-15T00:00:00Z" }
sources:
  - id: source-domain-rules
    resource: docs/context/project/domain-rules.md
    title: Domain Rules
  - id: source-architecture
    resource: docs/context/project/architecture.md
    title: System Architecture
---

# Feature: Precision Arithmetic Engine

Authoritative specification for the StayCalc precision arithmetic engine. Governed by `docs/context/project/domain-rules.md` and `docs/context/project/architecture.md`.

## 1. Problem, Actors & Outcome
- **Problem & Context**: Standard JavaScript IEEE-754 binary floating-point representation introduces precision noise (e.g., `0.1 + 0.2 = 0.30000000000000004`), returns unhandled `Infinity` or `NaN` on division by zero, and lacks immediate left-to-right calculation evaluation expected in pocket calculators.
- **Target Actors & Roles**:
  | Role / Persona | Surface | Arrival State / Prerequisite | Permissions & Access |
  | :--- | :--- | :--- | :--- |
  | `StandardUser` | `src/engine/` | Interacting with calculator keypad or keyboard | Full calculation & register reset access |
- **Checkable Success ("This Worked")**: Calculations execute sequentially left-to-right (`2 + 3 * 4 = 20`), decimal calculations yield clean rounding up to 10 decimal digits (`0.1 + 0.2 = 0.3`), division by zero immediately produces `"Cannot divide by zero"` with input locking, consecutive operator entry replaces the operator (`5 + * 2 = 10`), and `C`/`AC` reset registers accurately.
- **Checkable Failure ("This Is Broken")**: Engine returns `Infinity`, `NaN`, floating point artifacts (`0.30000000000000004`), fails to replace consecutive operators, or allows arithmetic input while locked in error state.

## 2. Scope & Boundary Invariants
- **In This Revision**:
  - Immediate execution arithmetic engine (`+`, `-`, `*`, `/`).
  - Decimal precision normalization truncating IEEE-754 noise to 10 decimal places.
  - Division by zero error trapping and engine input lock.
  - Consecutive operator replacement (`operator_pending` overwrite).
  - Clear entry (`C`) buffer reset vs All Clear (`AC`) total register reset.
- **Refused / Owned Elsewhere**:
  - UI custom element `<stay-calc>` and DOM event binding (owned by UI slice).
  - Memory registers (`M+`, `M-`, `MR`, `MC`) (owned by Memory Coordinator slice).
  - History tape persistence (owned by History Tape slice).
  - Scientific functions and Programmer bitwise modes.
- **Underlying Product Rules (Screen-Agnostic Truths)**:
  - `RULE-CALC-001`: Division by zero (`n ÷ 0`) must immediately yield a sanitized, user-facing `"Cannot divide by zero"` error state rather than JavaScript `Infinity` or `NaN`.
  - `RULE-CALC-002`: All floating-point operations must truncate IEEE-754 representation noise to a maximum of 12 significant decimal digits (engine normalizes to 10 decimal places, displaying e.g. `0.3`).
  - `RULE-CALC-007`: Entering an operator immediately following an operator before new operand digits replaces the pending operator without evaluating intermediate results.
  - `RULE-CALC-008`: Clear entry (`C`) resets the active input buffer to `"0"` and unlocks error state while preserving accumulator and pending operator. All Clear (`AC`) wipes all registers to initial zero state.
- **What Must Never Happen**:
  - `NEVER-CALC-001`: Never evaluate mathematical expressions using JavaScript `eval()` or `new Function()`.
  - `NEVER-CALC-004`: Never allow digit or operator mutations while engine is in an error-locked state without prior `C` or `AC` invocation.

## 3. Object Lifecycle, Survivability & Storage Architecture
- **Register Storage**:
  - **Tier 1 (Client Transient Memory)**: Engine state is maintained in-memory within the active `CalcEngine` instance (`accumulator: number | null`, `currentBuffer: string`, `pendingOperator: Operator | null`, `isLocked: boolean`, `errorMessage: string | null`).
  - **Tier 2 (External Persistence)**: Completed calculation results are emitted as immutable calculation records to downstream consumers.
- **SLA & Latency Ceilings**:
  - Arithmetic execution latency: `<= 1ms` synchronous evaluation.
  - Buffer digit capacity: 16 digits maximum length.

| Entity / Object | Identity Model | State (Draft vs Committed) | Survives Page Refresh? | Survives App Kill? | Survives Logout / Login? | Conflict Winner (2 Sessions) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `CalcEngineState` | In-memory instance | Active register state | No (transient memory) | No | No | Local active instance |

## 4. Notifications, Auditing & Reporting
- **Error Feedback**: Transition to `isLocked = true` and `errorMessage = "Cannot divide by zero"` immediately available to display consumer.
- **Audit Logging**: Emits calculation record tuples `(operand1, operator, operand2, result)` upon each completed evaluation for history consumption.

## 5. Cross-Feature Seams (`SEAM-*`)

| Seam ID | Source Slice | Destination Slice | Arrival Payload | Handoff Payload | Failure Owner | Related RULE / NEVER |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `SEAM-CALC-01` | `<stay-calc>` Keypad / Input | `CalcEngine` | Digit, decimal, operator, or command key event | Internal register mutation | `CalcEngine` | `RULE-CALC-001`, `RULE-CALC-007` |
| `SEAM-CALC-02` | `CalcEngine` | `<stay-calc>` Display Slot | Internal evaluation event | `{ display: string, isError: boolean, status: string }` | `<stay-calc>` | `RULE-CALC-002`, `RULE-CALC-008` |
| `SEAM-CALC-03` | `CalcEngine` | History Store | Completed calculation | `{ expression: string, result: string, timestamp: number }` | History Store | `RULE-CALC-002` |
