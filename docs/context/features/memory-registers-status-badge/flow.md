---
type: Flow
title: "Memory Registers and Status Badge Flow"
status: stable
description: "Interaction flows, state transitions, memory accumulation, recall chaining, and badge indicator lifecycle for StayCalc memory registers."
tags: [flow, state-machine, memory, status-badge, okf-v0.2]
generated: { by: "process:implement", at: "2026-10-15T00:00:00Z" }
sources:
  - id: source-feature
    resource: ./feature.md
    title: Feature Specification
---

# User Flow: Memory Registers and Status Badge Flow

Authoritative screen states, interaction sequences, memory accumulator transitions, and reactive badge lifecycle for `<stay-calc>`.

---

## 1. Flow Overview & Interaction Bounds
- **Goal**: Enable users to accumulate, subtract, recall, and clear numeric values in a dedicated memory register, accompanied by an active visual `M` status badge.
- **Primary Surface**: `<stay-calc>` Autonomous Custom Element in `src/components/stay-calc.ts` and `CalcEngine` in `src/engine/calc-engine.ts`.
- **Actor Role**: `StandardUser`
- **Entry Trigger**: User clicks memory buttons (`M+`, `M-`, `MR`, `MC`) on the keypad.
- **Exit Outcome**: Synchronous update of memory register, active buffer, and `#memory-badge` visibility in Shadow DOM.
- **Storage Tier**: In-memory instance register (`CalcEngine.memory`).
- **Latency & SLA Bounds**: Immediate synchronous DOM update (`<= 1ms`).

---

## 2. Entry Points

| Entry ID | Trigger / Source | Preconditions | Initial Surface | Inbound Flow |
| :--- | :--- | :--- | :--- | :--- |
| `ENT-MEM-01` | Keypad `M+` / `M-` Click | Non-error display state | Keypad Memory Row | `FLW-MEM-01` |
| `ENT-MEM-02` | Keypad `MR` Click | Non-error display state | Keypad Memory Row | `FLW-MEM-02` |
| `ENT-MEM-03` | Keypad `MC` Click | Any state | Keypad Memory Row | `FLW-MEM-03` |

---

## 3. Canonical Flow Sequences

### Flow A: Memory Accumulation and Badge Activation Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User as "User"
    participant Keypad as "Keypad Memory Row"
    participant Calc as "<stay-calc>"
    participant Engine as "CalcEngine"
    participant Badge as "#memory-badge"
    participant Display as "#display-value"

    User->>Keypad: Click [data-action="memoryAdd"] (M+)
    Keypad->>Calc: click event (delegated)
    Calc->>Engine: memoryAdd()
    Note over Engine: memory = normalizePrecision(memory + currentBuffer)<br/>isWaitingForOperand = true
    Engine-->>Calc: getState() { hasMemory: true, memory: 42 }
    Calc->>Badge: classList.add("active") / style.display = "inline-block"
    Calc->>Display: retain current display value
```

### Flow B: Memory Recall & Chained Operation Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User as "User"
    participant Keypad as "Keypad Memory Row"
    participant Calc as "<stay-calc>"
    participant Engine as "CalcEngine"
    participant Display as "#display-value"

    User->>Keypad: Click [data-action="digit", value="5"]
    Keypad->>Calc: click
    Calc->>Engine: inputDigit("5")
    User->>Keypad: Click [data-action="operator", value="+"]
    Keypad->>Calc: click
    Calc->>Engine: inputOperator("+")
    User->>Keypad: Click [data-action="memoryRecall"] (MR)
    Keypad->>Calc: click
    Calc->>Engine: memoryRecall()
    Note over Engine: currentBuffer = String(memory)<br/>isWaitingForOperand = false
    Engine-->>Calc: getDisplay() -> "42"
    Calc->>Display: update textContent = "42"
    User->>Keypad: Click [data-action="calculate"] (=)
    Keypad->>Calc: click
    Calc->>Engine: calculate()
    Note over Engine: 5 + 42 = 47
    Engine-->>Calc: getDisplay() -> "47"
    Calc->>Display: update textContent = "47"
```

---

## 4. State Transitions

```mermaid
stateDiagram-v2
    [*] --> MemoryEmpty: Instantiate / Initial Load
    MemoryEmpty --> MemoryActive: M+ or M- (non-zero value)
    MemoryActive --> MemoryActive: M+ or M- (remains non-zero)
    MemoryActive --> MemoryEmpty: M- (reaches exactly 0) or MC
    MemoryActive --> MemoryActive: C (Clear Entry) or AC (All Clear)
    MemoryActive --> MemoryEmpty: MC (Memory Clear)
```

---

## 5. Decision Points & Dynamic Recovery

- **`DEC-MEM-01` (Division by Zero Guard)**:
  - *Condition*: `this.isLocked === true`.
  - *Action*: `memoryAdd()`, `memorySubtract()`, `memoryRecall()` immediately return without modifying memory register or active error display.
  - *Recovery*: User presses `C` or `AC` to unlock the arithmetic engine.
- **`DEC-MEM-02` (Memory Subtraction to Zero)**:
  - *Condition*: `memorySubtract()` causes `memory === 0`.
  - *Action*: `hasMemory()` evaluates to `false`. `#memory-badge` is reactively hidden (`style.display = "none"`, class `.active` removed).
- **`DEC-MEM-03` (MR Active Buffer Chaining)**:
  - *Condition*: `memoryRecall()` executed.
  - *Action*: `isWaitingForOperand = false`. The recalled memory value acts as an immediate numeric operand ready for subsequent operator ingestion or evaluation.

---

## 6. Exit Points

| Exit ID | Destination | Verification Check |
| :--- | :--- | :--- |
| `EXT-MEM-01` | Memory Active State | `hasMemory() === true`, `#memory-badge` visible |
| `EXT-MEM-02` | Memory Cleared State | `hasMemory() === false`, `getMemoryValue() === 0`, `#memory-badge` hidden |
