---
type: Feature
title: "Calculation History Tape"
status: stable
description: "Bounded calculation history audit tape (max 50 entries, FIFO eviction), accessible drawer panel, interactive recall, and clear history operations for StayCalc."
tags: [feature, history, audit-tape, drawer, recall, okf-v0.2]
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

# Feature: Calculation History Tape

Authoritative specification for StayCalc calculation history tape (audit drawer/panel), recording completed calculations into a bounded FIFO buffer (max 50 entries), providing interactive recall of past results into the active input register, and offering clear history functionality with zero horizontal overflow across mobile viewports.

## 1. Problem, Actors & Outcome
- **Problem & Context**: Users performing multi-step arithmetic workflows need an audit trail of previous calculation steps to verify results, reference previous computations, and recall earlier answers into their ongoing calculation without manually writing them down or re-typing them.
- **Target Actors & Roles**:
  | Role / Persona | Surface | Arrival State / Prerequisite | Permissions & Access |
  | :--- | :--- | :--- | :--- |
  | `StandardUser` | Browser DOM (`<stay-calc>`) | Keypad, keyboard navigation, or history drawer | View tape, toggle drawer, recall results into active buffer, clear history |
- **Checkable Success ("This Worked")**:
  - `CalcEngine` records every successfully completed calculation (e.g., `2 + 3 = 5`) into an internal calculation history buffer upon pressing calculate (`=`) or completing chained evaluations.
  - History buffer is clamped to a strict maximum of 50 entries with automatic FIFO pruning (`RULE-CALC-005`).
  - `CalcEngine` provides `getHistory()`, `recallHistory(index)`, and `clearHistory()`.
  - Recalling an entry via `recallHistory(index)` populates the active `currentBuffer` with the stringified entry result, resets `isWaitingForOperand = false`, and allows immediate chaining with pending or subsequent arithmetic operators.
  - `<stay-calc>` provides a toggle button (`#history-toggle`) that controls an accessible, collapsible drawer/panel (`#history-drawer` / `#history-panel`).
  - Drawer renders an interactive list (`#history-list`) of past calculations or an accessible empty-state message (`#history-empty`).
  - Users can click or keyboard-activate (`Enter` or `Space`) any history item to recall its result directly into the active calculation register.
  - Drawer contains a "Clear History" button (`#history-clear`) with an accessible `aria-label` to wipe the tape cleanly.
  - Layout maintains zero horizontal scroll overflow (`scrollWidth <= clientWidth`) across 320px–390px mobile viewports.
- **Checkable Failure ("This Is Broken")**:
  - History buffer exceeds 50 entries, causing unbounded memory growth.
  - Failed calculations (e.g., division by zero) get appended to history.
  - Recalling a history item crashes or corrupts active arithmetic state.
  - History drawer causes horizontal overflow on 320px–390px mobile viewports.
  - History items cannot be activated via keyboard (`Enter`, `Space`).

## 2. Scope & Boundary Invariants
- **In This Revision**:
  - `CalculationRecord` interface extended with `expression: string` representing the complete equation (e.g. `2 + 3 = 5`).
  - `CalcEngineState` interface extended with `history: CalculationRecord[]`.
  - In-memory bounded history buffer (max 50 entries, FIFO eviction) in `CalcEngine`.
  - Engine methods: `getHistory()`, `recallHistory(index)`, `clearHistory()`.
  - Recording triggers on `calculate()` and chained `inputOperator()` evaluations.
  - Custom element `<stay-calc>` history drawer (`#history-drawer` / `#history-panel`), toggle button (`#history-toggle`), entry list (`#history-list`), empty state indicator (`#history-empty`), and clear button (`#history-clear`).
  - Interactive recall on click and keyboard `Enter` / `Space`.
  - Accessible ARIA attributes (`aria-expanded`, `aria-controls`, `aria-label`, `role="list"`, `role="button"`).
  - Mobile zero-overflow compliance with `max-width: 100%`, `overflow-x: hidden`, and word-breaking.
- **Refused / Owned Elsewhere**:
  - Cross-session persistent storage in `localStorage` or IndexedDB (deferred to follow-up backlog).
  - Multi-bank memory slots (`M1`, `M2`, `M3`) (owned by scientific calculator slice).
  - Exporting calculation tape to CSV or PDF (deferred to follow-up backlog).
- **Underlying Product Rules**:
  - `RULE-CALC-005` (History Tape Cap): The calculation history tape must retain a maximum of 50 entries. When the limit is reached, the oldest entries must be automatically pruned (FIFO).
  - `RULE-UI-010` (Accessible History Drawer): History drawer must use semantic HTML (`#history-drawer` / `#history-panel`), provide `#history-list`, and support `#history-clear` with accessible labels.
  - `RULE-UI-011` (Interactive Recall Accessibility): History entries must support activation via mouse click and keyboard (`Enter`, `Space`) with visible `:focus-visible` focus rings.
  - `RULE-UI-009` (Mobile Viewport Zero-Overflow): All components and drawer panels must enforce `scrollWidth <= clientWidth` across 320px–390px mobile viewports.
- **What Must Never Happen**:
  - `NEVER-CALC-007`: Never commit erroneous calculations resulting in division by zero or invalid evaluation to the history tape.
  - `NEVER-CALC-001`: Never evaluate expressions using JavaScript `eval()` or `new Function()`.
  - `NEVER-CALC-008`: Never clear the history tape on Clear Entry (`C`) or All Clear (`AC`). Only `clearHistory()` wipes the tape.

## 3. Object Lifecycle, Survivability & Storage Architecture
- **History Storage Architecture**:
  - **Tier 1 (Client Transient Memory)**: Engine calculation history is maintained in-memory within the active `CalcEngine` instance (`private history: CalculationRecord[] = [];`).
  - **Survivability**: Preserved across calculations, chained operations, Clear Entry (`C`), and All Clear (`AC`). Reset only on explicit `clearHistory()` or fresh page load.
  - **Capacity Boundary**: Strict 50-entry FIFO eviction. When entry 51 is added, entry 0 is removed.

| Entity / Object | Identity Model | State (Draft vs Committed) | Survives Page Refresh? | Survives App Kill? | Survives Logout / Login? | Conflict Winner (2 Sessions) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `CalculationRecord` | Index & Timestamp | Committed calculation | No (transient memory) | No | No | Local active instance |

## 4. Notifications, Auditing & Reporting
- **Reactive UI Synchronization**: Each calculation or history mutation updates `CalcEngineState.history`, reactively synchronizing the drawer list (`#history-list`) and empty state message (`#history-empty`).

## 5. Cross-Feature Seams (`SEAM-*`)

| Seam ID | Source Slice | Destination Slice | Arrival Payload | Handoff Payload | Failure Owner | Related RULE / NEVER |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `SEAM-HIST-01` | `<stay-calc>` UI | `CalcEngine` | Action (`recallHistory`, `clearHistory`, `toggleHistory`) | Method invocation | `<stay-calc>` UI | `RULE-UI-010`, `RULE-CALC-005` |
| `SEAM-HIST-02` | `CalcEngine` Evaluation | History Tape Buffer | Completed evaluation (`operand1`, `operator`, `operand2`, `result`) | `CalculationRecord` appended to buffer | `CalcEngine` | `RULE-CALC-005`, `NEVER-CALC-007` |
| `SEAM-HIST-03` | History Item Activation | Active Calculation Buffer | Click / `Enter` / `Space` on entry index | `currentBuffer = String(result)`, display updated | `<stay-calc>` UI | `RULE-UI-011` |
