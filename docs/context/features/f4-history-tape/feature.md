---
type: Feature
title: "F4: Calculation History Tape & Drawer"
description: "Audit tape logging completed calculations, FIFO 100-entry storage, interactive drawer, click-to-load recall, and empty state rendering."
status: stable
tags: [history, tape, audit, drawer, f4]
generated: { by: "factory:planner", at: "2026-10-13T14:13:00Z" }
sources:
  - id: source-architecture
    resource: docs/context/project/architecture.md
    title: System Architecture
  - id: source-rules
    resource: docs/context/project/domain-rules.md
    title: Domain Rules & Invariants
---

# Feature: Calculation History Tape & Drawer (F4)

## 1. Intent & Scope

Provide a persistent calculation history tape logging every completed evaluation (`=`) in format `<expression> = <result>` (e.g., `12 * 4 = 48`). A collapsible drawer panel in `<stay-calc>` allows users to view previous entries, click an entry to reload its result into the active input buffer, or clear history.

## 2. Invariants & Rules

- **`RULE-CALC-005` (History Tape Cap)**: The local history tape retains a maximum of 100 entries. When the 101st entry is appended, the oldest entry is pruned automatically (FIFO).
- **`RULE-HIST-001` (Evaluation Audit Trigger)**: Every calculation completed via `=` that produces a valid non-error result generates a history record. Intermediate operator replacements or cancelled operations do not generate records.
- **`RULE-HIST-002` (Click-to-Load Contract)**: Clicking any tape entry immediately sets the calculator display to the entry's `result` value and sets `waitingForOperand = true` so the user can immediately continue calculating.
- **`RULE-HIST-003` (Clear History & Empty State)**: Invoking `clearHistory()` empties the record list. When empty, the drawer renders an accessible empty state `"No calculations yet"`.

## 3. Interfaces & Contracts

```typescript
export interface HistoryRecord {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
}

export class HistoryStore {
  getEntries(): ReadonlyArray<HistoryRecord>;
  addEntry(expression: string, result: string): HistoryRecord;
  clear(): void;
  count(): number;
}
```
