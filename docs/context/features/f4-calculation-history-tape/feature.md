---
type: Feature
title: "F4: Calculation History Tape & Drawer"
status: stable
description: "Authoritative product problem, rules, boundary invariants, scope, and survivability matrix for Calculation History Tape and Drawer."
tags: [feature, history, tape, drawer, audit, web-component, okf-v0.2]
sources:
  - resource: ../../project/vision.md
  - resource: ../../project/domain-rules.md
  - resource: ../../project/architecture.md
  - resource: ../../project/design.md
  - resource: ../f1-precision-arithmetic-engine/feature.md
  - resource: ../f2-accessible-ui-keyboard-nav/feature.md
  - resource: ../f3-memory-registers/feature.md
---

# Feature: F4 - Calculation History Tape & Drawer

Authoritative product specification for the StayCalc calculation history tape audit subsystem and accessible slide-out drawer panel. Governed by `docs/context/project/`.

## 1. Problem, Actors & Outcome
- **Problem & Context**: Users performing complex, multi-step calculations need an audit trail of previous operations to verify entered operands, review intermediate formulas, and recall past computation results without re-typing. Physical desktop adding machines provided paper audit tapes; modern virtual calculators must provide an equivalent digital history tape. Without a calculation history tape, mistakes require restarting entire workflows, and past totals cannot be reused. Crucially, the history drawer must remain accessible, responsive, isolated from arithmetic errors, and dismissible via standard keyboard patterns (such as `Escape`) without inadvertently resetting active calculation state.
- **Target Actors & Roles**:
  | Role / Persona | Surface | Arrival State / Prerequisite | Permissions & Access |
  | :--- | :--- | :--- | :--- |
  | `GeneralUser` | `<stay-calc>` Host | Pointer or touchscreen interaction | Toggle history drawer, view tape, click entry to reload, clear history |
  | `KeyboardPowerUser` | `<stay-calc>` Host | Physical keyboard navigation | Press Escape to close open drawer without clearing accumulator; Tab focus |
  | `ScreenReaderUser` | `<stay-calc>` ARIA Live Region | Assistive technology active | Receive polite ARIA announcements, `aria-expanded`, and entry labels |
- **Checkable Success ("This Worked")**:
  1. Every successful calculation evaluation via Equals (`=`) prepends a new immutable `CalculationHistoryEntry` recording `id`, `expression` (e.g. `"5 + 3"`), `result` (e.g. `"8"`), and `timestamp`.
  2. The history tape enforces a strict 100-entry FIFO ceiling (`RULE-CALC-005`): adding the 101st calculation automatically prunes the oldest recorded calculation.
  3. Failed calculations and error states (such as division by zero `"Cannot divide by zero"`) are strictly excluded from history (`RULE-CALC-007`).
  4. Calculation history persists across active buffer clear (`C`) and all-clear (`AC`) operations (`RULE-CALC-008`), resetting only upon explicit history clear (`CLEAR_HISTORY` or `#clearHistory` button).
  5. The interactive history drawer panel (`#historyDrawer`) slides or expands into view upon activating `#historyToggle` (`aria-expanded="true"`), displaying `#historyEmpty` ("No calculations yet") when empty, and interactive clickable entry buttons when populated.
  6. Clicking any past `.history-entry` loads its formatted result into the active input buffer (`waitingForOperand = true`), permitting immediate use in subsequent arithmetic.
  7. Pressing the `Escape` key while the history drawer is open closes the drawer and restores focus without clearing the calculator accumulator or display (`RULE-UI-002`).
  8. History mutations dispatch both `calc-change` and dedicated `history-change` `CustomEvent` notifications (`SEAM-UI-01`).
- **Checkable Failure ("This Is Broken")**: Error states recorded into history tape; history lost when user presses `C` or `AC`; tape exceeds 100 entries without pruning; pressing Escape with drawer open flushes active calculation; history entries lack accessible labels; mobile viewport horizontal scroll overflow occurs.

## 2. Scope & Boundary Invariants
- **In This Revision**:
  - `CalculationHistoryEntry` contract: `{ readonly id: string; readonly expression: string; readonly result: string; readonly timestamp: number; }`.
  - Actions: `CLEAR_HISTORY` and `LOAD_HISTORY_ENTRY`.
  - Extended engine state: `history: readonly CalculationHistoryEntry[]`.
  - Precision engine history tape recording on successful `EQUALS` action with 100-entry FIFO cap.
  - History preservation across `CLEAR` (`C`) and `ALL_CLEAR` (`AC`).
  - History drawer panel (`#historyDrawer`) with container queries and CSS logical properties.
  - History toggle button (`#historyToggle`) with `aria-expanded` and `aria-controls="historyDrawer"`.
  - Clear history button (`#clearHistory`) and empty state message (`#historyEmpty`).
  - Interactive history entry buttons (`.history-entry`) reloading past result into active buffer.
  - Escape key drawer dismissal handling.
  - Facade methods: `getHistory()`, `clearHistory()`, `loadHistoryEntry(entryOrId)`.
  - Event dispatching: `calc-change` and `history-change`.
- **Refused / Owned Elsewhere**:
  - Cloud database persistence or cross-device history synchronization (owned by client in-memory state).
  - Exporting history tape to CSV, PDF, or external clipboard files.
  - Scientific trigonometric/exponential calculations (owned by F5).
  - Graphing or formula plotting tape views.
- **Underlying Product Rules (Screen-Agnostic Truths)**:
  - `RULE-CALC-005` (History Tape Cap): The local history tape must retain a maximum of 100 entries. When the limit is reached, the oldest entries must be automatically pruned (FIFO).
  - `RULE-CALC-007` (Exclude Error States from History): Mathematical error states (`"Cannot divide by zero"`) must not be pushed to the calculation history tape.
  - `RULE-CALC-008` (History Persistence across Clears): Calculation history persists across standard clear (`C`) and all clear (`AC`) operations, resetting only upon explicit history clearance (`CLEAR_HISTORY`).
  - `RULE-UI-002` (Accessible History Drawer & Keyboard Focus): `<stay-calc>` encapsulates an accessible collapsible `#historyDrawer` with `#historyToggle` (`aria-expanded`, `aria-controls="historyDrawer"`), `#clearHistory`, and interactive `.history-entry` items. Dismissible via Escape key when open without clearing calculator state.
  - `RULE-RESP-001` (Responsive Drawer Layout): History drawer adheres to container queries (`@container calc-host`) and CSS logical properties with zero horizontal scroll overflow (`scrollWidth <= clientWidth`) across 320px–390px mobile viewports.
- **What Must Never Happen**:
  - `NEVER-CALC-001` (No Dynamic Eval): Never evaluate history expressions or results using JavaScript `eval()` or `new Function()`.
  - `NEVER-CALC-004` (No Unhandled NaN/Infinity): History tape cannot store or ingest `NaN` or `Infinity`.

## 3. Object Lifecycle, Survivability & Storage Architecture
- **Dual-Tier Draft Storage**:
  - **Tier 1 (Client In-Memory Engine State)**: `CalculatorState.history` storing immutable `readonly CalculationHistoryEntry[]` capped at 100 items.
  - **Tier 2 (Component DOM Projection)**: Shadow DOM elements (`#historyToggle`, `#historyDrawer`, `#clearHistory`, `#historyEmpty`, `.history-entry`) rendered within `<stay-calc>`.
- **SLA & Latency Ceilings**:
  - History entry creation and FIFO pruning: synchronous deterministic execution `<= 1ms`.
  - Drawer open/close transition and DOM re-render: `<= 16ms` (60fps feedback).

| Entity / Object | Identity Model | State (Draft vs Committed) | Survives Refresh? | Survives App Kill? | Survives Clear (C)? | Survives All Clear (AC)? | Survives Clear History? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `history` Tape Array | Engine State Array | Committed | No | No | Yes (`RULE-CALC-008`) | Yes (`RULE-CALC-008`) | No (Resets to `[]`) |
| `CalculationHistoryEntry` | UUID / Timestamp ID | Immutable Object | No | No | Yes | Yes | No (Flushed) |
| `#historyDrawer` | Shadow DOM Panel | UI Open / Closed State | No | No | Yes | Yes | Yes (Shows empty state) |
| `#historyToggle` | Shadow DOM Button | Static Interactive Node | Yes | Yes | Yes | Yes | Yes |

## 4. Notifications, Auditing & Reporting
- **Drawer Accessibility**: `#historyToggle` exposes `aria-expanded` reflecting the drawer's visibility and `aria-controls="historyDrawer"`.
- **Screen Reader Support**: Each `.history-entry` button provides a full verbalization label (e.g. `aria-label="5 + 3 equals 8"`).
- **CustomEvent Dispatch**: Whenever history is recorded, cleared, or loaded, `<stay-calc>` dispatches a `history-change` CustomEvent (`detail: { history: state.history }`) and the standard `calc-change` CustomEvent.

## 5. Cross-Feature Seams (`SEAM-*`)
Seam contracts live in this file — do **not** author a separate `contract.md` in the slice.

| Seam ID | Source Slice | Destination Slice | Arrival Payload | Handoff Payload | Failure Owner | Related RULE / NEVER |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `SEAM-ENGINE-02` | F4 UI (`<stay-calc>`) | F1 Engine | `CLEAR_HISTORY` or `LOAD_HISTORY_ENTRY` | `CalculatorState` (`history`) | destination | `RULE-CALC-005`, `RULE-CALC-007`, `RULE-CALC-008` |
| `SEAM-UI-01` | F4 UI (`<stay-calc>`) | Host App / Consumers | Custom Events `calc-change`, `history-change` | `{ detail: CalculatorState }` | source | `RULE-UI-002`, `RULE-RESP-001` |

## 6. References
- [User Flow](./flow.md)
- [Test Cases](./cases.md)
