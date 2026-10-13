---
type: Flow
title: "F8: Visual Theme Switcher Flow"
description: "User interaction and state transitions for cycling themes."
status: stable
tags: [flow, theme, f8]
generated: { by: "factory:planner", at: "2026-10-13T14:36:00Z" }
sources:
  - id: source-feature
    resource: docs/context/features/f8-theme-switcher/feature.md
    title: F8 Feature Specification
---

# User Flow: Theme Switcher (F8)

## 1. Flow Diagram

```mermaid
graph TD
  A[User Clicks Theme Toggle Button] --> B{Current Theme}
  B -- light --> C[Apply dark Theme]
  B -- dark --> D[Apply oled Theme]
  B -- oled --> E[Apply light Theme]
  C --> F[Update host data-theme attr]
  D --> F
  E --> F
  F --> G[Update toggle button icon & label]
  G --> H[Dispatch CustomEvent 'theme-change']
```

## 2. Interaction States
- **SCR-THM-01 (Header Theme Toggle Button)**: Header displays button `#btn-toggle-theme` showing active icon (`☀️ Light`, `🌙 Dark`, `⚡ OLED`).
- **DEC-THM-01 (Direct API Selection)**: Calling `setTheme(theme)` validates input and transitions immediately.
- **REC-THM-01 (Fallback)**: Unknown theme value resets cleanly to `light`.
