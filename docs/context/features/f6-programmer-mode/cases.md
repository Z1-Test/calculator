---
type: Cases
title: "F6: Programmer Radix Mode Test Scenarios"
description: "Universal test cases verifying base conversions, bitwise AND/OR/XOR/NOT, shifts, and word clamping."
status: stable
tags: [cases, programmer, radix, f6]
generated: { by: "factory:planner", at: "2026-10-13T14:24:00Z" }
sources:
  - id: source-feature
    resource: docs/context/features/f6-programmer-mode/feature.md
    title: F6 Feature Specification
---

# Test Scenarios: Programmer Radix Mode (F6)

## 1. Universal Cases

1. **`CASE-F6-001` (Base Conversions for 255)**:
   - DEC: `"255"`
   - HEX: `"FF"`
   - OCT: `"377"`
   - BIN: `"11111111"`
2. **`CASE-F6-002` (Bitwise AND Operation)**: `0b1100 & 0b1010` = `0b1000` (`12 & 10 = 8`).
3. **`CASE-F6-003` (Bitwise OR Operation)**: `0b1100 | 0b1010` = `0b1110` (`12 | 10 = 14`).
4. **`CASE-F6-004` (Bitwise XOR Operation)**: `0b1100 ^ 0b1010` = `0b0110` (`12 ^ 10 = 6`).
5. **`CASE-F6-005` (Bitwise NOT in BYTE Mode)**: `NOT 0` with 8-bit mask = `255` (`0xFF`).
6. **`CASE-F6-006` (Left Shift LSH)**: `5 << 2 = 20`.
7. **`CASE-F6-007` (Right Shift RSH)**: `20 >> 2 = 5`.
8. **`CASE-F6-008` (Word Clamping BYTE 8-bit)**: Setting value `300` in BYTE mode clamps to `44` (`300 & 0xFF = 44`).
9. **`CASE-F6-009` (Word Clamping WORD 16-bit)**: Setting value `70000` in WORD mode clamps to `4464` (`70000 & 0xFFFF`).
10. **`CASE-F6-010` (BigInt 64-bit QWORD Support)**: Values up to `0xFFFFFFFFFFFFFFFFn` handle without precision overflow.
11. **`CASE-F6-011` (Component Mode Integration)**: Switching to Programmer mode displays radix values cleanly.
