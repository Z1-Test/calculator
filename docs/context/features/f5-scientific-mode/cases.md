---
type: Cases
title: "F5: Scientific Mode Test Scenarios"
description: "Universal test cases verifying trigonometry, powers, constants, angle toggle, and domain error cases."
status: stable
tags: [cases, scientific, f5]
generated: { by: "factory:planner", at: "2026-10-13T14:18:00Z" }
sources:
  - id: source-feature
    resource: docs/context/features/f5-scientific-mode/feature.md
    title: F5 Feature Specification
---

# Test Scenarios: Scientific Mode Toggle (F5)

## 1. Universal Cases

1. **`CASE-F5-001` (Square Root Nominal)**: $\sqrt{25} = 5$, $\sqrt{2} \approx 1.414213562$.
2. **`CASE-F5-002` (Negative Square Root Domain Error)**: $\sqrt{-1} \to$ displays `"Invalid input"`, locks input.
3. **`CASE-F5-003` (Square Operation)**: $7^2 = 49$, $(-4)^2 = 16$.
4. **`CASE-F5-004` (Binary Power Exponentiation)**: $2^8 = 256$, $5^3 = 125$.
5. **`CASE-F5-005` (Trigonometry in DEG Mode)**:
   - $\sin(30^\circ) = 0.5$
   - $\cos(60^\circ) = 0.5$
   - $\tan(45^\circ) = 1$
   - $\sin(180^\circ) = 0$ (no float artifact)
   - $\cos(90^\circ) = 0$
6. **`CASE-F5-006` (Tangent Asymptote Domain Error)**: $\tan(90^\circ)$ in DEG $\to$ displays `"Invalid input"`.
7. **`CASE-F5-007` (Angle Unit Toggle to RAD)**: Toggling from `DEG` to `RAD` causes $\sin(\pi / 2) = 1$.
8. **`CASE-F5-008` (Pi Constant)**: Pressing $\pi$ inserts `3.1415926536`.
9. **`CASE-F5-009` (Euler Constant e)**: Pressing $e$ inserts `2.7182818285`.
10. **`CASE-F5-010` (Scientific Mode Panel Toggle)**: Panel expands and collapses without horizontal overflow on mobile viewports.
11. **`CASE-F5-011` (Chained Calculation with Scientific Result)**: Calculating $\sqrt{16} = 4$ then $+ 10 = 14$.
