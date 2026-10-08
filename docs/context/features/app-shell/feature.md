---
type: Feature
title: "Application Shell, Layout, and Theme System"
status: stable
tags: [app-shell, dsd, theme, layout]
generated:
  by: "process:implement"
  at: "2026-10-08T00:00:00Z"
sources:
  - resource: "docs/context/project/architecture.md"
  - resource: "docs/context/project/design.md"
---

# Application Shell, Layout, and Theme System

## 1. Intent & Overview

The Application Shell provides the foundational visual container, Declarative Shadow DOM (DSD) markup, custom element registration, and multi-mode theme management (`light`, `dark`, `system`) for StayCalc. It guarantees zero-flicker startup, immediate responsiveness across viewports, and WCAG 2.2 AA accessibility standards without external runtime framework overhead.

## 2. Scope

- **Application Shell Element (`<stay-calc-app>`)**: Top-level web component coordinating header, display, and keypad child elements.
- **Header Component (`<stay-calc-header>`)**: Branding, calculation mode selector pills (`Standard`, `Scientific`, `Programmer`), and theme toggle switch.
- **Display Component (`<stay-calc-display>`)**: Dual-line output rendering active input / result (primary line) and calculation history expression (secondary line) with `aria-live="polite"`.
- **Keypad Grid (`<stay-calc-keypad>`)**: 4-column arithmetic grid containing tactile pill buttons for digits `0–9`, decimal `.`, operations `+`, `-`, `×`, `÷`, `=`, `C`, `±`, and `%`.
- **Theme Persistence (`ThemeManager`)**: Reactive color scheme manager binding `--sl-*` tokens to `:root` via `data-theme` and syncing with `localStorage`.

## 3. Invariants & Business Rules

- `RULE-SHELL-001` (Zero Runtime Dependencies): All components are authored as standard W3C Custom Elements extending `HTMLElement` with zero external JS frameworks.
- `RULE-SHELL-002` (DSD Zero FOUC): Initial markup in `index.html` leverages `<template shadowrootmode="open">` to render server-safe structure before client hydration.
- `RULE-SHELL-003` (Theme Persistence & Fallback): Theme choice is persisted in `localStorage` under key `staycalc_theme`. When unconfigured, it defaults to the user's OS preference (`prefers-color-scheme`). If `localStorage` throws a `SecurityError`, the theme manager degrades gracefully to in-memory state.
- `RULE-SHELL-004` (ARIA Live Updates): Active evaluation results in `<stay-calc-display>` are announced politely to assistive technologies via `aria-live="polite"` and `aria-atomic="true"`.
- `RULE-SHELL-005` (Pill Button Target Geometry): All interactive keypad buttons maintain pill-shaped geometry (`border-radius: var(--sl-radius-full)`) and meet minimum touch target dimensions (≥44px × 44px).

## 4. Component Contracts & Custom Events

### 4.1 Custom Event Protocol

| Event Name | Source Component | Detail Payload | Target / Listener |
| :--- | :--- | :--- | :--- |
| `calc-input` | `<stay-calc-keypad>` | `{ value: string }` | Handled by `<stay-calc-app>` to append characters to active input buffer |
| `calc-action` | `<stay-calc-keypad>` | `{ action: string }` | Handled by `<stay-calc-app>` to trigger operations (`add`, `subtract`, `evaluate`, etc.) |
| `calc-clear` | `<stay-calc-keypad>` | `{ all: boolean }` | Handled by `<stay-calc-app>` to clear current or all buffers |
| `theme-toggle` | `<stay-calc-header>` | `{ theme: "light" \| "dark" \| "system" }` | Intercepted by `ThemeManager` to switch active tokens |
| `theme-changed` | `window` / `ThemeManager` | `{ theme: "light" \| "dark", mode: "light" \| "dark" \| "system" }` | Dispatched to notify components of palette updates |

## 5. Styling & Token Integration

All styles strictly utilize Staylook CSS custom property tokens defined in `src/theme/tokens.css` referencing `docs/context/project/design.md`:
- Primary Action: `var(--sl-primary, #2563eb)` / `var(--sl-on-primary, #ffffff)`
- Surface Canvas: `var(--sl-background, #ffffff)` and `var(--sl-surface, #f4f4f5)`
- Outline / Dividers: `var(--sl-outline-low, #e4e4e7)`
- Typography: Plus Jakarta Sans / Inter with tabular numbers (`font-variant-numeric: tabular-nums`).
