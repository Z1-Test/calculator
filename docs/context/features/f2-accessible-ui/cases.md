---
type: Cases
title: "F2: Accessible UI & Keyboard Navigation Test Scenarios"
description: "Universal test scenarios and verification cases for <stay-calc> custom element and keyboard listeners."
status: stable
tags: [cases, ui, accessibility, keyboard, f2]
generated: { by: "factory:planner", at: "2026-10-13T14:04:00Z" }
sources:
  - id: source-feature
    resource: docs/context/features/f2-accessible-ui/feature.md
    title: F2 Feature Specification
---

# Test Scenarios: Accessible UI & Keyboard Navigation (F2)

## 1. Universal Cases

1. **`CASE-F2-001` (Custom Element Registration)**: Custom element `<stay-calc>` registers cleanly with `customElements.define` without collisions or errors.
2. **`CASE-F2-002` (Shadow DOM Encapsulation)**: Creates an open shadow root containing the display `#display` and keypad grid `#keypad`.
3. **`CASE-F2-003` (Initial Render State)**: Initial display shows `"0"` and aria-live attribute is `"polite"`.
4. **`CASE-F2-004` (Digit Button Clicks)**: Clicking button `7` updates `#display` text to `"7"`.
5. **`CASE-F2-005` (Keyboard Digit Input)**: Pressing key `'5'` updates `#display` to `"5"`.
6. **`CASE-F2-006` (Keyboard Operator Input)**: Pressing `'+'` followed by `'3'` and `'Enter'` calculates `"8"`.
7. **`CASE-F2-007` (Keyboard Escape)**: Pressing `'Escape'` resets the calculator display to `"0"`.
8. **`CASE-F2-008` (Keyboard Backspace)**: Pressing `'Backspace'` on `"42"` truncates to `"4"`.
9. **`CASE-F2-009` (Mobile Zero-Overflow Layout)**: Keypad grid conforms to responsive width (`max-width: 100%`) without horizontal scrolling.
10. **`CASE-F2-010` (Focus Rings & Accessibility)**: All keypad buttons have `:focus-visible` styling and accessible names (`aria-label`).
11. **`CASE-F2-011` (Lifecycle Cleanup)**: Removing element from DOM detaches window keyboard event listeners cleanly.
