---
type: Feature
title: "F2: Accessible UI & Keyboard Navigation"
description: "W3C Autonomous Custom Element (<stay-calc>) with Declarative Shadow DOM (DSD), tactile pill keypad, keyboard navigation, focus management, and mobile zero-overflow."
status: stable
tags: [ui, custom-elements, accessibility, a11y, keyboard, f2]
generated: { by: "factory:planner", at: "2026-10-13T14:04:00Z" }
sources:
  - id: source-architecture
    resource: docs/context/project/architecture.md
    title: System Architecture
  - id: source-design
    resource: docs/context/project/design.md
    title: Design System
---

# Feature: Accessible UI & Keyboard Navigation (F2)

## 1. Intent & Scope

Implement `<stay-calc>`, the autonomous W3C custom element serving as the primary user interface for StayCalc. Provides a tactile pill button grid layout, responsive container queries, visible focus rings, WCAG 2.2 AA contrast compliance, physical keyboard event listeners, and 390px mobile viewport zero-overflow.

## 2. Invariants & Rules

- **`RULE-A11Y-001` (Physical Keyboard Mapping)**:
  - Numeric digits `0` through `9` invoke `inputDigit()`.
  - Operator keys `+`, `-`, `*`, `/` invoke `inputOperator()`.
  - `Enter` and `=` invoke `calculate()`.
  - `Escape` invokes `allClear()`.
  - `Backspace` removes the last digit or sets display to `"0"`.
  - `.` invokes `inputDecimal()`.
- **`RULE-A11Y-002` (Focus Management & Visibility)**: All interactive buttons must feature visible focus rings via `:focus-visible` with high contrast (minimum 3:1 contrast against surface).
- **`RULE-A11Y-003` (Zero Mobile Overflow)**: The component must ensure `scrollWidth <= clientWidth` across 320px, 375px, and 390px mobile viewport widths.
- **`RULE-A11Y-004` (ARIA Live Region)**: The primary calculation display must declare `role="status"` and `aria-live="polite"` so screen readers announce calculated results without interrupting active user keystrokes.
- **`NEVER-CALC-004` (No Hardcoded Global Inline Styles)**: All styles must reside in the component shadow root or CSS custom properties.

## 3. Component Specification

```typescript
export class StayCalcElement extends HTMLElement {
  // Lifecycle
  connectedCallback(): void;
  disconnectedCallback(): void;

  // Public Properties & API
  public readonly engine: CalcEngine;
  public get displayValue(): string;
  public handleKeydown(event: KeyboardEvent): void;
}
```
