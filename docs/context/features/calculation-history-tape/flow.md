---
type: Flow
title: "Calculation History Tape Flow"
status: stable
description: "Interaction flows, drawer panel transitions, calculation audit recording, interactive recall, and clearing lifecycle for StayCalc history tape."
tags: [flow, state-machine, history, drawer, recall, okf-v0.2]
generated: { by: "process:implement", at: "2026-10-15T00:00:00Z" }
sources:
  - id: source-feature
    resource: ./feature.md
    title: Feature Specification
---

# User Flow: Calculation History Tape Flow

Authoritative screen states, interaction sequences, audit buffer transitions, and drawer lifecycle for `<stay-calc>` calculation history tape.

---

## 1. Flow Overview & Interaction Bounds
- **Goal**: Enable users to view past calculations, recall previous results into the active calculation register, and clear the audit tape without disrupting running calculations.
- **Primary Surface**: `<stay-calc>` Autonomous Custom Element in `src/components/stay-calc.ts` and `CalcEngine` in `src/engine/calc-engine.ts`.
- **Actor Role**: `StandardUser`
- **Entry Trigger**: User clicks `#history-toggle`, clicks a history item, presses `Enter`/`Space` on a focused item, or clicks `#history-clear`.
- **Exit Outcome**: Synchronous update of drawer visibility, active calculation register, or history tape.
- **Storage Tier**: In-memory instance buffer (`CalcEngine.history`).
- **Latency & SLA Bounds**: Immediate synchronous DOM update (`<= 1ms`).

---

## 2. Entry Points

| Entry ID | Trigger / Source | Preconditions | Initial Surface | Inbound Flow |
| :--- | :--- | :--- | :--- | :--- |
| `ENT-HIST-01` | `#history-toggle` Click | Custom element mounted | Drawer Header | `FLW-HIST-01` |
| `ENT-HIST-02` | History Entry Click / Keyboard | Drawer open, entries exist | `#history-list` | `FLW-HIST-02` |
| `ENT-HIST-03` | `#history-clear` Click | Drawer open | `#history-panel` | `FLW-HIST-03` |

---

## 3. Canonical Flow Sequences

### Flow A: Drawer Toggle & Entry Rendering Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User as "User"
    participant Toggle as "#history-toggle"
    participant Calc as "<stay-calc>"
    participant Drawer as "#history-drawer"
    participant List as "#history-list"
    participant Empty as "#history-empty"
    participant Engine as "CalcEngine"

    User->>Toggle: Click
    Toggle->>Calc: click event
    Calc->>Engine: getHistory()
    Engine-->>Calc: CalculationRecord[]
    alt History is empty
        Calc->>Empty: style.display = "block"
        Calc->>List: style.display = "none"
    else History has items
        Calc->>Empty: style.display = "none"
        Calc->>List: render items with role="button" and tabindex="0"
    end
    Calc->>Drawer: toggle "open" class / set aria-expanded
```

### Flow B: Interactive History Recall Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User as "User"
    participant Item as "History Entry [data-index]"
    participant Calc as "<stay-calc>"
    participant Engine as "CalcEngine"
    participant Display as "#display-value"

    User->>Item: Click or press Enter/Space
    Item->>Calc: click / keydown event
    Calc->>Engine: recallHistory(index)
    Note over Engine: currentBuffer = String(entry.result)<br/>isWaitingForOperand = false
    Engine-->>Calc: CalculationRecord
    Calc->>Display: update textContent = String(entry.result)
    Note over User: Result is now active operand ready for further math (+, -, *, /)
```

### Flow C: Clear History Tape Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User as "User"
    participant ClearBtn as "#history-clear"
    participant Calc as "<stay-calc>"
    participant Engine as "CalcEngine"
    participant List as "#history-list"
    participant Empty as "#history-empty"

    User->>ClearBtn: Click
    ClearBtn->>Calc: click event
    Calc->>Engine: clearHistory()
    Note over Engine: history = []
    Calc->>List: innerHTML = "" / style.display = "none"
    Calc->>Empty: style.display = "block"
```

---

## 4. State Transitions

```mermaid
stateDiagram-v2
    [*] --> HistoryEmpty: Engine Initialized
    HistoryEmpty --> HistoryPopulated: calculate() or chained inputOperator()
    HistoryPopulated --> HistoryPopulated: subsequent successful calculations (<= 50)
    HistoryPopulated --> HistoryPopulated: FIFO prune oldest when > 50 entries
    HistoryPopulated --> HistoryEmpty: clearHistory()
    HistoryPopulated --> HistoryPopulated: C (Clear Entry) or AC (All Clear)
```

---

## 5. Decision Points & Dynamic Recovery

- **`DEC-HIST-01` (History Entry Count Check)**:
  - *Condition*: `history.length === 0`.
  - *Action*: Render `#history-empty` message; disable or hide individual item actions gracefully.
- **`DEC-HIST-02` (FIFO Eviction Guard)**:
  - *Condition*: `this.history.length > 50`.
  - *Action*: Automatically shift off oldest record (`this.history.shift()`) before completing insertion.
- **`DEC-HIST-03` (Division by Zero Rejection)**:
  - *Condition*: Calculation evaluates to division by zero (`pendingOperator === "/" && currentOperand === 0`).
  - *Action*: Engine locks in error state; calculation is rejected and NEVER committed to history tape (`NEVER-CALC-007`).
- **`REC-HIST-01` (Empty History Recovery)**:
  - *Condition*: User triggers recall on empty history or out-of-bounds index.
  - *Action*: `recallHistory(index)` returns `null` safely without modifying active buffer or throwing exceptions.

---

## 6. Exit Points

| Exit ID | Destination | Verification Check |
| :--- | :--- | :--- |
| `EXT-HIST-01` | Active Operand State | `currentBuffer === String(recalledResult)`, `isWaitingForOperand === false` |
| `EXT-HIST-02` | History Cleared State | `getHistory().length === 0`, `#history-empty` visible |
| `EXT-HIST-03` | Drawer State Toggled | `#history-drawer.classList.contains("open")` matches `aria-expanded` |
