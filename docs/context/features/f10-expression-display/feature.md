---
type: Feature
title: "F10: Formula Expression Preview Display"
description: "Live multi-line formula expression preview rendered above primary numerical calculation display."
status: stable
tags: [feature, expression, preview, display, f10]
generated: { by: "factory:planner", at: "2026-10-13T14:45:00Z" }
sources:
  - id: source-issue-31
    resource: https://github.com/Z1-Test/calculator/issues/31
    title: Issue 31 - Formula Expression Preview Display
---

# Feature Specification: Formula Expression Preview Display (F10)

## 1. Intent & Scope
Users working on multi-step financial or scientific math need immediate visual visibility into previously entered operators and operands. Feature F10 provides a dedicated expression preview row `#expression-preview` above `#display` in the calculator card.

## 2. Behavioral Rules & Invariants
- `RULE-EXP-001 (Active Sequence Preview)`:
  - When an operator is selected (e.g. `+`), preview shows `[previousValue] [operator]` (e.g. `"12 +"`).
  - When chained (e.g. `12 + 3 *`), preview updates to show the ongoing expression chain.
- `RULE-EXP-002 (Terminal Equation Presentation)`:
  - When equals (`=`) is triggered, preview displays `[expression] =` (e.g. `"12 + 3 ="`), while primary display displays `"15"`.
- `RULE-EXP-003 (Operator Replacement Reflection)`:
  - If user enters `5 +` and then presses `*`, preview updates immediately from `"5 +"` to `"5 *"`.
- `RULE-EXP-004 (Clear Operations)`:
  - `C` (Clear Entry): Clears current entry while preserving preview expression.
  - `AC` (All Clear): Clears both primary display and preview expression to empty string `""`.
- `RULE-EXP-005 (Accessibility & Layout)`:
  - Preview element `#expression-preview` tagged with `role="status"`, `aria-label="Formula expression"`, and `aria-live="polite"`.
- `RULE-EXP-006 (Zero Runtime Dependencies)`: Native DOM and string representation.
