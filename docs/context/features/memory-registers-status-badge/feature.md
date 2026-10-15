---
type: Feature
title: "Memory Registers and Status Badge"
status: stable
description: "Discrete memory register operations (M+, M-, MR, MC), active visual M indicator badge, and persistent memory synchronization across calculation cycles."
tags: [feature, memory, memory-registers, status-badge, okf-v0.2]
generated: { by: "process:implement", at: "2026-10-15T00:00:00Z" }
sources:
  - id: source-domain-rules
    resource: docs/context/project/domain-rules.md
    title: Domain Rules
  - id: source-design
    resource: docs/context/project/design.md
    title: Design System
  - id: source-architecture
    resource: docs/context/project/architecture.md
    title: System Architecture
---

# Feature: Memory Registers and Status Badge

Authoritative specification for StayCalc discrete memory registers (`M+`, `M-`, `MR`, `MC`), reactive visual `M` memory indicator badge on the display card, and state persistence across calculation cycles and clear resets. Governed by `docs/context/project/domain-rules.md`, `docs/context/project/design.md`, and `docs/context/project/architecture.md`.

## 1. Problem, Actors & Outcome
- **Problem & Context**: Users performing multi-step financial or scientific calculations need to store intermediate totals, accumulate running sums (`M+`), deduct values (`M-`), and recall stored totals (`MR`) into active calculations without losing intermediate results when clearing current input buffers via `C` or resetting the calculation cycle via `AC`. Furthermore, users need an unambiguous, reactive visual badge indicating whether a non-zero value is currently held in memory.
- **Target Actors & Roles**:
  | Role / Persona | Surface | Arrival State / Prerequisite | Permissions & Access |
  | :--- | :--- | :--- | :--- |
  | `StandardUser` | Browser DOM (`<stay-calc>`) | Interacting with keypad or physical keyboard | Full access to memory registers (`M+`, `M-`, `MR`, `MC`) and display status |
- **Checkable Success ("This Worked")**:
  - `CalcEngine` implements discrete memory methods: `memoryAdd()`, `memorySubtract()`, `memoryRecall()`, `memoryClear()`, `hasMemory()`, and `getMemoryValue()`.
  - Memory register accumulator normalizes floating-point arithmetic to 10 decimal digits (`RULE-CALC-002`, `RULE-CALC-009`).
  - Memory persists across calculations, `clear()` (`C`), and `allClear()` (`AC`). Only `memoryClear()` (`MC`) resets memory to 0.
  - Recalling memory via `MR` sets the active buffer to the recalled number and allows immediate chaining with pending or subsequent arithmetic operators (`5 + MR =`).
  - Display card in `<stay-calc>` renders an active visual `M` badge when `hasMemory()` is true (`memory !== 0`) and hides it when memory is cleared or equals 0.
  - Tactile keypad contains accessible `MC`, `MR`, `M-`, `M+` buttons with descriptive `aria-label` tags, `:focus-visible` rings, and zero horizontal scroll overflow across 320px–390px mobile viewports.
- **Checkable Failure ("This Is Broken")**:
  - `C` or `AC` inadvertently wipes the memory register value.
  - Repeated additions in memory produce IEEE-754 precision artifacts (e.g. `0.30000000000000004`).
  - Memory badge remains visible when memory register equals 0 or fails to appear when memory is non-zero.
  - Invoking memory operations while locked in error state (e.g. "Cannot divide by zero") mutates memory or corrupts engine state.

## 2. Scope & Boundary Invariants
- **In This Revision**:
  - `CalcEngine` memory register accumulator (`memory: number`) initialized to `0`.
  - Memory register methods:
    - `memoryAdd()`: adds active buffer value to memory register with precision normalization; sets `isWaitingForOperand = true`.
    - `memorySubtract()`: subtracts active buffer value from memory register with precision normalization; sets `isWaitingForOperand = true`.
    - `memoryRecall()`: updates `currentBuffer` with stringified memory value; sets `isWaitingForOperand = false` to enable immediate operand chaining.
    - `memoryClear()`: resets memory register to `0`.
    - `hasMemory()`: returns `this.memory !== 0`.
    - `getMemoryValue()`: returns current numeric value in memory register.
  - `CalcEngineState` interface extended with `memory: number` and `hasMemory: boolean`.
  - `<stay-calc>` keypad extended with a dedicated top row containing `MC`, `MR`, `M-`, `M+` action buttons.
  - `<stay-calc>` display card extended with a reactive `#memory-badge` indicator styled with semantic tokens (`--calc-primary`, `--calc-container-low`).
- **Refused / Owned Elsewhere**:
  - Multi-bank memory slots (`M1`, `M2`, `M3`) (owned by scientific calculator slice).
  - Cross-session persistent storage in `localStorage` or IndexedDB (owned by History Tape slice).
- **Underlying Product Rules**:
  - `RULE-CALC-006` (Memory Register Persistence): Memory register values must persist across calculation cycles, mode switches, and clear resets (`C` and `AC`) within the active session.
  - `RULE-CALC-009` (Memory Precision Normalization): All memory additions and subtractions must apply `normalizePrecision()` capping IEEE-754 representation noise to 10 decimal digits.
  - `RULE-UI-007` (Reactive Memory Badge): An active visual badge displaying letter `M` must be visible on the display card if and only if `hasMemory()` is true (`memory !== 0`).
  - `RULE-UI-008` (Memory Keypad Accessibility): Keypad memory buttons (`MC`, `MR`, `M-`, `M+`) must provide accessible `aria-label` attributes (`Memory Clear`, `Memory Recall`, `Memory Subtract`, `Memory Add`) and adhere to tactile pill shape with `:focus-visible` outline rings.
- **What Must Never Happen**:
  - `NEVER-CALC-005`: Never clear or corrupt memory registers when user invokes `C` (Clear Entry) or `AC` (All Clear). Only `MC` or explicit `memoryClear()` resets memory.
  - `NEVER-CALC-006`: Never mutate memory registers while calculator is locked in division-by-zero error state.

## 3. Object Lifecycle, Survivability & Storage Architecture
- **Register Storage Architecture**:
  - **Tier 1 (Client Transient Memory)**: Engine memory register is maintained in-memory within the active `CalcEngine` instance (`private memory: number = 0;`).
  - **Survivability**: Preserved across all calculation steps, chained operations, Clear Entry (`C`), and All Clear (`AC`). Re-initialized to 0 only on explicit `memoryClear()` (`MC`) or fresh page load.

| Entity / Object | Identity Model | State (Draft vs Committed) | Survives Page Refresh? | Survives App Kill? | Survives Logout / Login? | Conflict Winner (2 Sessions) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `MemoryRegister` | In-memory instance | Active numeric accumulator | No (transient memory) | No | No | Local active instance |

## 4. Notifications, Auditing & Reporting
- **Reactive UI Synchronization**: State changes to memory registers immediately publish `hasMemory` in `CalcEngineState`, driving the reactive visibility of `#memory-badge` within the `<stay-calc>` shadow DOM display slot.

## 5. Cross-Feature Seams (`SEAM-*`)

| Seam ID | Source Slice | Destination Slice | Arrival Payload | Handoff Payload | Failure Owner | Related RULE / NEVER |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `SEAM-MEM-01` | `<stay-calc>` Keypad | `CalcEngine` | Button click (`memoryAdd`, `memorySubtract`, `memoryRecall`, `memoryClear`) | Method invocation | `<stay-calc>` UI | `RULE-UI-008`, `RULE-CALC-006` |
| `SEAM-MEM-02` | `CalcEngine` State | `<stay-calc>` Display | `CalcEngineState.hasMemory: boolean` | `#memory-badge` class/style toggle | `<stay-calc>` UI | `RULE-UI-007` |
