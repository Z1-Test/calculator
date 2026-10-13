---
type: Cases
title: "F3: Memory Registers Test Scenarios"
description: "Universal test cases verifying M+, M-, MR, MC, badge synchronization, and persistence."
status: stable
tags: [cases, memory, f3]
generated: { by: "factory:planner", at: "2026-10-13T14:08:00Z" }
sources:
  - id: source-feature
    resource: docs/context/features/f3-memory-registers/feature.md
    title: F3 Feature Specification
---

# Test Scenarios: Memory Registers (F3)

## 1. Universal Cases

1. **`CASE-F3-001` (Initial Zero State)**: Memory register starts at `0`, `hasMemory` is `false`.
2. **`CASE-F3-002` (M+ Addition)**: Adding `42` sets memory to `42`, `hasMemory` becomes `true`.
3. **`CASE-F3-003` (M- Subtraction)**: Starting at `42`, subtracting `12` leaves `30`.
4. **`CASE-F3-004` (MR Recall)**: Recalls stored value `30` into calculator display.
5. **`CASE-F3-005` (MC Clear)**: Clears memory to `0`, `hasMemory` becomes `false`.
6. **`CASE-F3-006` (Persistence Across AC)**: Memory persists when `allClear()` is executed on the arithmetic engine.
7. **`CASE-F3-007` (Decimal Precision in Memory)**: Adding `0.1` and `0.2` to memory equals `0.3` without float inaccuracies.
8. **`CASE-F3-008` (Visual Badge Synchronization)**: Active visual `"M"` badge element is rendered when `hasMemory` is true and hidden when false.
9. **`CASE-F3-009` (Return to Zero via M-)**: Adding `10` then subtracting `10` sets memory to `0` and removes `"M"` badge.
10. **`CASE-F3-010` (Chained Memory Operations)**: `5 [M+] 10 [M+] 3 [M-] [MR]` results in display showing `12`.
11. **`CASE-F3-011` (Memory Recall Operand Chain)**: Recalling memory followed by an operator (`[MR] + 5 =`) performs valid arithmetic on the recalled value.
