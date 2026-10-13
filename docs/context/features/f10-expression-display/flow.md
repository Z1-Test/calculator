---
type: Flow
title: "F10: Formula Expression Preview Display Flow"
description: "User interaction flow for updating formula expression preview in real-time."
status: stable
tags: [flow, expression, preview, f10]
generated: { by: "factory:planner", at: "2026-10-13T14:45:00Z" }
sources:
  - id: source-feature
    resource: docs/context/features/f10-expression-display/feature.md
    title: F10 Feature Specification
---

# User Flow: Formula Expression Preview Display (F10)

## 1. Flow Diagram

```mermaid
graph TD
  A[User Types First Operand '42'] --> B[Display shows '42', Preview empty]
  B --> C[User Presses Operator '+']
  C --> D[Preview displays '42 +', Display awaits second operand]
  D --> E[User Types Second Operand '8']
  E --> F[Preview displays '42 +', Display shows '8']
  F --> G[User Presses Equals '=']
  G --> H[Preview displays '42 + 8 =', Display shows '50']
  H --> I[User Presses All Clear 'AC']
  I --> J[Preview resets to '', Display resets to '0']
```

## 2. Interaction States
- **SCR-EXP-01 (Display Container Sub-Row)**: Sub-row `#expression-preview` rendered above `#display` with subtle text styling (`var(--calc-text-secondary)`).
- **DEC-EXP-01 (Continuous Operator Flow)**: Chaining operations dynamically appends or computes left-folded representations.
- **REC-EXP-01 (Error State Reflection)**: On division by zero or domain errors, preview retains error equation (e.g. `"10 / 0 ="`) while display indicates error message.
