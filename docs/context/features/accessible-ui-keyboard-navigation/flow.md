---
type: Flow
title: "Accessible UI and Keyboard Navigation Flow"
status: stable
description: "DSD slot projection graph, user input routing, physical keyboard mapping, screen state transitions, and error recovery flows."
tags: [flow, state-machine, ui, keyboard-navigation, okf-v0.2]
generated: { by: "process:implement", at: "2026-10-15T00:00:00Z" }
sources:
  - id: source-feature
    resource: ./feature.md
    title: Feature Specification
---

# User Flow: Accessible UI and Keyboard Navigation Flow

Authoritative screen states, interaction logic, physical keyboard event mapping, Declarative Shadow DOM slot projection flow, and error recovery for `<stay-calc>`.

---

## 1. Flow Overview & Interaction Bounds
- **Goal**: Provide responsive, accessible UI and keyboard navigation for arithmetic calculations with DSD slot projection and mobile zero-overflow.
- **Primary Surface**: `<stay-calc>` Autonomous Custom Element in `src/components/stay-calc.ts`.
- **Actor Role**: `StandardUser`
- **Entry Trigger**: User clicks/taps keypad buttons or types physical keyboard keys.
- **Exit Outcome**: Synchronous update of Shadow DOM display slot and internal engine state.
- **Storage Tier**: In-memory instance registers (`CalcEngine`).
- **Latency & SLA Bounds**: Immediate synchronous DOM display update (`<= 1ms`).

---

## 2. Entry Points

| Entry ID | Trigger / Source | Preconditions | Initial Surface | Inbound Flow |
| :--- | :--- | :--- | :--- | :--- |
| `ENT-UI-01` | Keypad Button Click / Tap | User clicks button inside `<stay-calc>` | Keypad Slot | `FLW-UI-01` |
| `ENT-UI-02` | Physical Keyboard Keydown | Window captures `keydown` event | Global Window | `FLW-UI-02` |
| `ENT-UI-03` | Clear / All Clear Action | User clicks `C`/`AC` or presses `Escape`/`c` | Keypad / Keyboard | `FLW-UI-03` |

---

## 3. Canonical Flow Sequences

### Flow A: Keypad Interaction & Calculation Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User as "User"
    participant Calc as "<stay-calc>"
    participant Keypad as "Keypad Slot"
    participant Engine as "CalcEngine"
    participant Display as "Display Slot"

    User->>Keypad: Click button [data-action="digit", value="7"]
    Keypad->>Calc: dispatch click event (delegated)
    Calc->>Engine: inputDigit("7")
    Engine-->>Calc: state updated
    Calc->>Display: update textContent = "7"
    User->>Keypad: Click button [data-action="operator", value="+"]
    Keypad->>Calc: dispatch click event
    Calc->>Engine: inputOperator("+")
    User->>Keypad: Click button [data-action="digit", value="3"]
    Keypad->>Calc: dispatch click event
    Calc->>Engine: inputDigit("3")
    Calc->>Display: update textContent = "3"
    User->>Keypad: Click button [data-action="calculate"]
    Keypad->>Calc: dispatch click event
    Calc->>Engine: calculate()
    Engine-->>Calc: result = 10
    Calc->>Display: update textContent = "10"
```

### Flow B: Physical Keyboard Event Routing

```mermaid
flowchart TD
    Start(["Window Keydown Event"]) --> ModCheck{"DEC-UI-01: Is Ctrl, Meta, or Alt pressed?"}
    ModCheck -- Yes --> PassThrough["Ignore event / Native browser shortcut"]
    ModCheck -- No --> KeyType{"DEC-UI-02: Key Match"}

    KeyType -- "0-9" --> InputDigit["engine.inputDigit(key)"]
    KeyType -- "." --> InputDecimal["engine.inputDecimal()"]
    KeyType -- "+, -, *, /" --> InputOp["engine.inputOperator(op)"]
    KeyType -- "Enter or =" --> Calc["engine.calculate()"]
    KeyType -- "Backspace" --> Backspace["engine.backspace() or slice buffer"]
    KeyType -- "Escape, c, C" --> Clear["engine.clear()"]
    KeyType -- "Delete" --> AllClear["engine.allClear()"]
    KeyType -- Other --> Ignore["Ignore unmapped key"]

    InputDigit --> SyncDisplay["Sync Display textContent"]
    InputDecimal --> SyncDisplay
    InputOp --> SyncDisplay
    Calc --> SyncDisplay
    Backspace --> SyncDisplay
    Clear --> SyncDisplay
    AllClear --> SyncDisplay
    SyncDisplay --> End(["Display Rendered"])
```

---

## 4. Screen States & Slots

| Screen / Slot State | Description | Active Content | Status Indicator |
| :--- | :--- | :--- | :--- |
| `SCR-DISPLAY-NORMAL` | Standard buffer or calculated result display | Tabular numeral string (e.g., `"0"`, `"42"`) | Clean / unlocked |
| `SCR-DISPLAY-ERROR` | Division by zero error state | `"Cannot divide by zero"` | Locked error indicator |
| `SCR-KEYPAD-GRID` | 4-column tactile button keypad | 16-19 pill buttons (`0-9`, `.`, `+`, `-`, `*`, `/`, `=`, `C`, `AC`) | Tactile `:active` depression |

---

## 5. Decisions & Branching Rules

- **`DEC-UI-01` (Modifier Key Guard)**: If `event.ctrlKey || event.metaKey || event.altKey` is true, do not intercept or call `event.preventDefault()`. Allow native copy, paste, refresh, or developer tools shortcuts.
- **`DEC-UI-02` (Error State Lockout)**: If engine is locked due to division by zero, all numeric and operator inputs are rejected by `CalcEngine`. Display remains `"Cannot divide by zero"` until user triggers `C` or `AC`.
- **`DEC-UI-03` (Slot Projection Fallback)**: If consumers provide projected children in `<div slot="display">` or `<div slot="keypad">`, `<stay-calc>` projects them through `<slot>`. Otherwise, default Shadow DOM template elements render.

---

## 6. Recovery & Error Safeguards

- **`REC-UI-01` (Division by Zero Recovery)**: Pressing `C` or `Escape` unlocks engine state, resets buffer to `"0"`, and restores interactive calculation.
- **`REC-UI-02` (Mobile Viewport Safeguard)**: CSS grid on keypad container enforces `min-width: 0` and flexible `1fr` columns so that container does not exceed mobile screen bounds (`scrollWidth <= clientWidth` at 320px).
