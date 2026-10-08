---
type: Policy
title: "StayCalc System Constraints"
description: "Accessibility, performance, precision, and operational constraints for StayCalc."
status: stable
tags: [constraints, a11y, performance, budgets]
generated: { by: "human:maintainer", at: "2026-10-08T00:00:00Z" }
sources:
  - id: source-architecture
    resource: docs/context/project/architecture.md
    title: System Architecture
---

# StayCalc System Constraints

## 1. Accessibility Constraints (WCAG 2.2 AA)

- **Keyboard Navigation**: 100% of calculator capabilities must be accessible via physical keyboard (Numpad `0-9`, `+`, `-`, `*`, `/`, `Enter`, `Escape` for AC, `Backspace` for delete, letters for scientific functions).
- **Screen Reader Support**: Display area must include `aria-live="polite"` with explicit descriptive text (e.g., `aria-label="Current result: 42"`).
- **Focus Management**: Focus indicators must maintain a minimum 3:1 contrast ratio against background surfaces.
- **Color Contrast**: Text and interactive elements must satisfy at least 4.5:1 contrast against container surfaces across both Light and Dark themes.

## 2. Performance Budgets

- **Interaction Response Latency**: Keypress to visual display update must complete in under 16ms (60 FPS).
- **Bundle Size Budget**: Total gzipped production build assets (HTML + JS + CSS) must not exceed 50 KB.
- **First Contentful Paint (FCP)**: < 0.8s on 4G mobile networks.
- **Offline Capability**: 100% offline hit rate for cached static assets via Service Worker.

## 3. Mathematical Precision Constraints

- **Floating-Point Limits**: Maximum display precision capped at 12 significant decimal places with scientific notation exponential fallback (`1.234e15`).
- **Bitwise Word Width**: Programmer mode strictly bounded by 64-bit integer limits (QWORD).
