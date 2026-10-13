---
type: Cases
title: "F7: Calculation Tape Export Test Scenarios"
description: "Universal test cases verifying plain text serialization, RFC 8259 JSON format, empty state guards, and clipboard interactions."
status: stable
tags: [cases, export, clipboard, f7]
generated: { by: "factory:planner", at: "2026-10-13T14:32:00Z" }
sources:
  - id: source-feature
    resource: docs/context/features/f7-tape-export/feature.md
    title: F7 Feature Specification
---

# Test Scenarios: Calculation Tape Export (F7)

## 1. Universal Cases

1. **`CASE-F7-001` (Single Entry Text Export)**: Exporting a tape with `2 + 3 = 5` yields formatted text containing `"2 + 3 = 5"`.
2. **`CASE-F7-002` (Multi-Entry Text Export Sequential Order)**: Multiple calculations formatted chronologically or in order with entry count.
3. **`CASE-F7-003` (RFC 8259 JSON Export Validity)**: Exporting tape produces valid JSON parseable by `JSON.parse()`.
4. **`CASE-F7-004` (JSON Schema Conformance)**: Each JSON item contains `id`, `expression`, `result`, and numeric `timestamp`.
5. **`CASE-F7-005` (Empty Tape Text Guard)**: Exporting empty history returns indicator `"Tape is empty"`.
6. **`CASE-F7-006` (Empty Tape JSON Guard)**: Exporting empty history produces valid empty JSON array `"[]"`.
7. **`CASE-F7-007` (Special Characters & Precision Retention)**: High-precision entries (e.g., `0.1 + 0.2 = 0.3`) retain exact string formatting without float corruption.
8. **`CASE-F7-008` (Clipboard Copy Payload Generation)**: Copy helper formats text suitable for direct clipboard write.
9. **`CASE-F7-009` (Component UI Export JSON Button)**: History drawer renders button `#btn-export-json` which emits or produces JSON export.
10. **`CASE-F7-010` (Component UI Copy Tape Button)**: History drawer renders button `#btn-copy-history` triggering copy action.
11. **`CASE-F7-011` (Clear Tape Dynamic Sync)**: Clearing history immediately reflects in export generating empty response.
