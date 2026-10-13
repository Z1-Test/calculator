---
type: Cases
title: "F8: Visual Theme Switcher Test Scenarios"
description: "Universal test cases verifying theme cycling, host attribute reflection, fallback safety, and token palettes."
status: stable
tags: [cases, theme, f8]
generated: { by: "factory:planner", at: "2026-10-13T14:36:00Z" }
sources:
  - id: source-feature
    resource: docs/context/features/f8-theme-switcher/feature.md
    title: F8 Feature Specification
---

# Test Scenarios: Theme Switcher (F8)

## 1. Universal Cases

1. **`CASE-F8-001` (Initial Default Theme)**: Default theme initialized as `'light'`.
2. **`CASE-F8-002` (Cycle Sequence)**: Calling `cycleTheme()` transitions `light` ➔ `dark` ➔ `oled` ➔ `light`.
3. **`CASE-F8-003` (Direct Theme Set)**: Setting `'dark'` sets theme to `'dark'`.
4. **`CASE-F8-004` (Direct OLED Theme Set)**: Setting `'oled'` sets theme to `'oled'`.
5. **`CASE-F8-005` (Invalid Theme Fallback)**: Setting invalid value `'cyberpunk'` falls back safely to `'light'`.
6. **`CASE-F8-006` (Host data-theme Attribute Reflection)**: Element reflects active theme on `element.getAttribute('data-theme')`.
7. **`CASE-F8-007` (Custom Event Dispatch)**: Changing theme emits `'theme-change'` custom event with `{ theme: string }`.
8. **`CASE-F8-008` (Theme Controller Service Unit Tests)**: `ThemeController` operates independently of DOM for portability.
9. **`CASE-F8-009` (Theme Toggle Button Text/Icon Synchronization)**: `#btn-toggle-theme` updates text content per theme (`☀️ Light`, `🌙 Dark`, `⚡ OLED`).
10. **`CASE-F8-010` (Dark Mode Token Definition in CSS)**: Component stylesheet includes `:host([data-theme="dark"])` tokens.
11. **`CASE-F8-011` (OLED Mode Token Definition in CSS)**: Component stylesheet includes `:host([data-theme="oled"])` tokens with pure `#000000` surface.
