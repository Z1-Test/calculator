---
type: Feature
title: "F8: Dynamic Visual Theme Switcher"
description: "Dynamic theme switching between Light, Dark, and OLED High-Contrast palettes via CSS custom properties."
status: stable
tags: [feature, theme, styling, css, f8]
generated: { by: "factory:planner", at: "2026-10-13T14:36:00Z" }
sources:
  - id: source-issue-27
    resource: https://github.com/Z1-Test/calculator/issues/27
    title: Issue 27 - Dynamic Visual Theme Switcher
---

# Feature Specification: Dynamic Visual Theme Switcher (F8)

## 1. Intent & Scope
Provide instantaneous, accessible, and battery-efficient visual theming for `<stay-calc>`. Supports three distinct, WCAG 2.2 AA compliant themes:
- `light`: Clean daylight theme.
- `dark`: Sleek deep slate dark mode.
- `oled`: High-contrast pure black (`#000000`) OLED theme.

## 2. Behavioral Rules & Invariants
- `RULE-THM-001 (Theme Triad)`: The system accepts strictly one of `'light' | 'dark' | 'oled'`. Any invalid input falls back safely to `'light'`.
- `RULE-THM-002 (Host Attribute Reflection)`: Active theme is reflected as attribute `data-theme` on the custom element host (e.g. `<stay-calc data-theme="dark">`).
- `RULE-THM-003 (Token Integrity)`: All UI components consume standard CSS variables:
  - `--calc-surface`
  - `--calc-surface-key`
  - `--calc-surface-op`
  - `--calc-surface-mem`
  - `--calc-text-primary`
  - `--calc-text-secondary`
  - `--calc-border`
  - `--calc-primary`
- `RULE-THM-004 (Cycle Transition)`: Clicking the theme toggle button cycles sequentially through `light` ➔ `dark` ➔ `oled` ➔ `light`.
- `RULE-THM-005 (Zero Runtime Dependencies)`: Built using native CSS Custom Properties and TypeScript DOM APIs.
