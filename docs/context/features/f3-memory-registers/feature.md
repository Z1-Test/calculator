---
type: Feature
title: "F3: Memory Registers & Visual Indicator"
description: "Discrete memory state register supporting M+, M-, MR, MC and synchronized visual 'M' indicator badge on the display."
status: stable
tags: [memory, state, registers, badge, f3]
generated: { by: "factory:planner", at: "2026-10-13T14:08:00Z" }
sources:
  - id: source-architecture
    resource: docs/context/project/architecture.md
    title: System Architecture
  - id: source-rules
    resource: docs/context/project/domain-rules.md
    title: Domain Rules & Invariants
---

# Feature: Memory Registers & Visual Indicator (F3)

## 1. Intent & Scope

Provide standard calculator memory register capabilities: `M+` (Memory Add), `M-` (Memory Subtract), `MR` (Memory Recall), and `MC` (Memory Clear). A persistent indicator badge `"M"` appears on the display whenever the stored memory register value is non-zero (`memory !== 0`).

## 2. Invariants & Rules

- **`RULE-MEM-001` (Memory Arithmetic)**:
  - `M+`: Adds current display value to memory register: $M \leftarrow M + \text{display}$.
  - `M-`: Subtracts current display value from memory register: $M \leftarrow M - \text{display}$.
  - `MR`: Recalls current memory value into the active display buffer: $\text{display} \leftarrow M$. Sets `waitingForOperand = true` so subsequent digit entry replaces the recalled number.
  - `MC`: Resets memory register to zero: $M \leftarrow 0$.
- **`RULE-MEM-002` (Active Indicator Synchrony)**: The visual badge `"M"` is visible if and only if $M \ne 0$. Calling `MC` instantly hides the badge.
- **`RULE-MEM-003` (Calculation Independence)**: Memory register values must survive `C` (Clear Entry), `AC` (All Clear), and intermediate calculations (`+`, `-`, `*`, `/`, `=`).
- **`RULE-MEM-004` (Precision Normalization in Memory)**: Additions and subtractions to memory must pass through decimal normalization (`normalizePrecision`) to eliminate IEEE-754 drift.

## 3. Interfaces

```typescript
export interface MemoryState {
  value: number;
  hasMemory: boolean;
}

export class MemoryStore {
  getValue(): number;
  hasMemory(): boolean;
  add(amount: number): number;
  subtract(amount: number): number;
  recall(): number;
  clear(): void;
}
```
