---
type: Cases
title: "F10: Formula Expression Preview Display Test Scenarios"
description: "Universal test cases verifying real-time expression preview, equals termination, operator replacement, and clear operations."
status: stable
tags: [cases, expression, preview, f10]
generated: { by: "factory:planner", at: "2026-10-13T14:45:00Z" }
sources:
  - id: source-feature
    resource: docs/context/features/f10-expression-display/feature.md
    title: F10 Feature Specification
---

# Test Scenarios: Formula Expression Preview Display (F10)

## 1. Universal Cases

1. **`CASE-F10-001` (Initial Empty State)**: Initial expression preview is empty string `""`.
2. **`CASE-F10-002` (Operator Selection Preview)**: Inputting `5` and `+` sets preview to `"5 +"`.
3. **`CASE-F10-003` (Calculation Equals Termination)**: Inputting `5 + 3 =` sets preview to `"5 + 3 ="` and display to `"8"`.
4. **`CASE-F10-004` (Operator Replacement Reflection)**: Inputting `5 +` then `*` updates preview to `"5 *"`.
5. **`CASE-F10-005` (Chained Arithmetic Preview)**: `2 + 3 * 4 =` preserves sequential preview steps.
6. **`CASE-F10-006` (All Clear Full Reset)**: Pressing `AC` resets preview to `""` and display to `"0"`.
7. **`CASE-F10-007` (Clear Entry Preservation)**: Pressing `C` clears active input while keeping pending preview `"5 +"`.
8. **`CASE-F10-008` (Scientific Operation Reflection)**: Evaluating `sqrt(25)` updates preview expression appropriately.
9. **`CASE-F10-009` (Division By Zero Preview)**: `10 / 0 =` shows preview `"10 / 0 ="` with error in display.
10. **`CASE-F10-010` (Accessibility Role & Label)**: Element `#expression-preview` has `role="status"` and accessible aria-label.
11. **`CASE-F10-011` (Component Shadow DOM Integration)**: Expression preview is rendered and visible inside Shadow DOM.
