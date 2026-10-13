---
type: Flow
title: "F3: Memory Registers Logic Flow"
description: "State transition and event flow for memory addition, recall, subtraction, and clearing."
status: stable
tags: [flow, memory, f3]
generated: { by: "factory:planner", at: "2026-10-13T14:08:00Z" }
sources:
  - id: source-feature
    resource: docs/context/features/f3-memory-registers/feature.md
    title: F3 Feature Specification
---

# Logic Flow: Memory Registers (F3)

## 1. State Machine

```mermaid
stateDiagram-v2
    [*] --> MemoryZero: Init (M = 0, badge = hidden)
    
    MemoryZero --> MemoryActive: M+ (val > 0) or M- (val != 0)
    MemoryActive --> MemoryActive: M+ / M-
    MemoryActive --> MemoryActive: MR (Display updated, M unchanged)
    
    MemoryActive --> MemoryZero: MC (M = 0, badge hidden)
    MemoryActive --> MemoryZero: M- (when resulting M == 0)
    
    note right of MemoryActive
      Badge "M" is displayed
      Memory survives AC / C
    end note
```

## 2. Decision Tree (`DEC-*`)

- **`DEC-F3-001` (M+ Trigger)**:
  - If input buffer has valid number, add to accumulator $M$. If $M \ne 0$, show `"M"` badge. Set `waitingForOperand = true`.
- **`DEC-F3-002` (M- Trigger)**:
  - Subtract input buffer from $M$. If $M \ne 0$, show `"M"` badge; if $M = 0$, hide badge. Set `waitingForOperand = true`.
- **`DEC-F3-003` (MR Trigger)**:
  - Load $M$ value into display buffer. Set `waitingForOperand = true`.
- **`DEC-F3-004` (MC Trigger)**:
  - Reset $M = 0$. Hide `"M"` badge immediately.
