---
type: Feature
title: "F3: Memory Registers & Active Indicator"
status: stable
description: "Authoritative product problem, rules, boundary invariants, scope, and survivability matrix for Memory Registers & Active Indicator."
tags: [feature, memory, registers, math, indicator, web-component, okf-v0.2]
sources:
  - resource: ../../project/vision.md
  - resource: ../../project/domain-rules.md
  - resource: ../../project/architecture.md
  - resource: ../../project/design.md
  - resource: ../f1-precision-arithmetic-engine/feature.md
  - resource: ../f2-accessible-ui-keyboard-nav/feature.md
---

# Feature: F3 - Memory Registers & Active Indicator

Authoritative product specification for the StayCalc memory register subsystems (M+, M-, MR, MC) and visual active memory indicator badge. Governed by `docs/context/project/`.

## 1. Problem, Actors & Outcome
- **Problem & Context**: Precision arithmetic in multi-step workflows requires users to stash, accumulate, subtract, and recall intermediate calculation values without losing the current input buffer or accumulator total. Standard pocket calculators provide dedicated memory registers (`M+`, `M-`, `MR`, `MC`). Without a dedicated memory system, users must manually write down running sub-totals or execute tedious chained mental arithmetic. Crucially, users require visual confirmation (an active "M" badge) whenever a non-zero value is stored in memory, preventing accidental overwrite or recall errors.
- **Target Actors & Roles**:
  | Role / Persona | Surface | Arrival State / Prerequisite | Permissions & Access |
  | :--- | :--- | :--- | :--- |
  | `GeneralUser` | `<stay-calc>` Keypad | Touchscreen or pointer interaction | Click memory keys (`MC`, `MR`, `M-`, `M+`), observe "M" badge |
  | `KeyboardPowerUser` | `<stay-calc>` Host | Physical keyboard / programmatic API | Dispatch memory actions via engine API or UI interaction |
  | `ScreenReaderUser` | `<stay-calc>` Live Region | Screen reader active | Receive accessible button labels and polite state announcements |
- **Checkable Success ("This Worked")**:
  1. `M+` adds active display value to the internal memory register, normalizing precision (`RULE-CALC-002`) to eliminate float noise.
  2. `M-` subtracts active display value from the memory register with precision normalization.
  3. `MR` recalls stored memory value into the active input buffer and sets `waitingForOperand = true` so subsequent operations use it cleanly.
  4. `MC` resets the memory register to `0` and immediately dismisses the active visual "M" badge.
  5. The visual "M" badge (`#memoryIndicator`) is displayed if and only if `memory !== 0` (`hasActiveMemory === true`).
  6. Memory state persists across successive arithmetic evaluations (`=`) and buffer clear (`C`), resetting only upon `MC` or `AC`.
  7. All 4 memory keys render with accessible `aria-label` attributes and conform to WCAG 2.2 AA styling and responsive bounds.
- **Checkable Failure ("This Is Broken")**: Memory addition produces IEEE 754 precision noise (e.g. `0.30000000000000004`); "M" badge fails to appear when memory is non-zero or remains visible when memory reaches zero; memory resets when `=` or `C` is pressed; component overflows mobile viewport width.

## 2. Scope & Boundary Invariants
- **In This Revision**:
  - Memory register actions: `MEMORY_ADD` (`M+`), `MEMORY_SUBTRACT` (`M-`), `MEMORY_RECALL` (`MR`), `MEMORY_CLEAR` (`MC`).
  - Extended engine state: `memory: number` and `hasActiveMemory: boolean`.
  - Visual display "M" indicator badge (`#memoryIndicator`) reflecting `hasActiveMemory`.
  - 4 dedicated memory keypad buttons (`MC`, `MR`, `M-`, `M+`) in `<stay-calc>` keypad grid.
  - State persistence across intermediate evaluations (`=`) and buffer clears (`C`).
  - Strict float precision normalization via `normalizePrecision` (`RULE-CALC-002`).
  - Full synchronization across `CalculatorEngine` and `<stay-calc>` via `SEAM-ENGINE-01` and `SEAM-UI-01`.
- **Refused / Owned Elsewhere**:
  - Multi-register memory arrays (e.g., M1, M2, M3) or named variables (standard pocket calculator single register only).
  - History tape drawer UI and persistence (owned by F4).
  - Scientific trigonometric/exponential operations (owned by F5).
  - Remote persistent database synchronization (client in-memory session only).
- **Underlying Product Rules (Screen-Agnostic Truths)**:
  - `RULE-CALC-002` (Precision Normalization): All memory accumulation (`M+`) and subtraction (`M-`) operations must eliminate IEEE 754 float representation noise via `normalizePrecision` (e.g., `0.1 M+` and `0.2 M+` stores `0.3`).
  - `RULE-CALC-006` (Memory Register Persistence): The memory register value must persist across mode switches, standard arithmetic evaluations (`=`), and input buffer clear (`C`) within the session.
  - `RULE-CALC-009` (Register Reset Invariant): Clear (`C`) resets the active display buffer to `"0"` without altering the memory register; All Clear (`AC`) flushes all engine registers including memory (`memory = 0`, `hasActiveMemory = false`).
  - `RULE-UI-001` (Keypad & Display Projection): `<stay-calc>` encapsulates display screen with `#memoryIndicator` badge and keypad grid with 4 memory buttons.
- **What Must Never Happen**:
  - `NEVER-CALC-001` (No Dynamic Eval): Never evaluate memory arithmetic with JavaScript `eval()` or `new Function()`.
  - `NEVER-CALC-004` (No Unhandled NaN/Infinity): Memory cannot store or ingest error strings (`"Cannot divide by zero"`), `NaN`, or `Infinity`.

## 3. Object Lifecycle, Survivability & Storage Architecture
- **Dual-Tier Draft Storage**:
  - **Tier 1 (Client Transient)**: In-memory `CalculatorState` tracking `memory: number` and `hasActiveMemory: boolean`.
  - **Tier 2 (Component State)**: Shadow DOM visual elements (`#memoryIndicator`, `.btn-memory`) synchronized on each dispatch.
- **SLA & Latency Ceilings**:
  - Memory dispatch and state transition: synchronous deterministic execution `<= 1ms`.
  - UI badge update and re-render: `<= 16ms` (60fps feedback).

| Entity / Object | Identity Model | State (Draft vs Committed) | Survives Refresh? | Survives App Kill? | Survives Clear (C)? | Survives All Clear (AC)? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `memory` Register | Numeric Engine State | Committed | No | No | Yes (`RULE-CALC-006`) | No (`RULE-CALC-009`) |
| `hasActiveMemory` | Boolean Derived State | Committed | No | No | Yes | No (`false`) |
| `#memoryIndicator` | Shadow DOM Span | Visual Badge | No | No | Yes (Preserves state) | Yes (Becomes hidden) |
| Memory Buttons | Shadow DOM Buttons | Static Interactive Nodes | Yes | Yes | Yes | Yes |

## 4. Notifications, Auditing & Reporting
- **Visual Memory Indicator ("M")**: When `hasActiveMemory === true`, the visual "M" badge is displayed in `#memoryIndicator`. When `hasActiveMemory === false`, the badge is hidden (`visibility: hidden`).
- **Screen Reader Accessibility**: Memory buttons provide clear accessible labels (`Memory Clear`, `Memory Recall`, `Memory Subtract`, `Memory Add`). The "M" badge is decorated with `aria-hidden="true"` to prevent duplicate voice clutter, while display changes resulting from `MR` are announced via the existing polite ARIA live region.

## 5. Cross-Feature Seams (`SEAM-*`)
Seam contracts live in this file — do **not** author a separate `contract.md` in the slice.

| Seam ID | Source Slice | Destination Slice | Arrival Payload | Handoff Payload | Failure Owner | Related RULE / NEVER |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `SEAM-ENGINE-01` | F3 UI (`<stay-calc>`) | F1 Engine | `CalculatorAction` (`MEMORY_*`) | `CalculatorState` (`memory`, `hasActiveMemory`) | destination | `RULE-CALC-002`, `RULE-CALC-006` |
| `SEAM-UI-01` | F3 UI (`<stay-calc>`) | Host App / Consumers | Custom Event `calc-change` | `{ detail: CalculatorState }` | source | `RULE-UI-001`, `RULE-CALC-006` |

## 6. References
- [User Flow](./flow.md)
- [Test Cases](./cases.md)
