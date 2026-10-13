---
type: Feature
title: "F9: Multi-Unit Converter Extension"
description: "Precision physical conversions across Length, Mass, and Temperature categories."
status: stable
tags: [feature, converter, units, physical, f9]
generated: { by: "factory:planner", at: "2026-10-13T14:41:00Z" }
sources:
  - id: source-issue-29
    resource: https://github.com/Z1-Test/calculator/issues/29
    title: Issue 29 - Multi-Unit Converter Extension
---

# Feature Specification: Multi-Unit Converter Extension (F9)

## 1. Intent & Scope
Provide direct unit conversion for real-world mathematical calculations without needing external browser tools or search engines. Integrates into `<stay-calc>` with support for 3 core domains:
- **Length**: m, km, cm, in, ft, mi.
- **Mass**: kg, g, lb, oz.
- **Temperature**: C, F, K.

## 2. Behavioral Rules & Invariants
- `RULE-CONV-001 (Canonical Base Mapping)`:
  - Length converts through Meter (`m`).
  - Mass converts through Kilogram (`kg`).
  - Temperature converts through Celsius (`C`) using exact affine transformations ($F = C \times \frac{9}{5} + 32$, $K = C + 273.15$).
- `RULE-CONV-002 (Identity Conversion)`: Converting between identical units (`m` ➔ `m`) yields the exact input value.
- `RULE-CONV-003 (Domain Safeguards)`:
  - Absolute zero guard: Temperatures below $0\text{ K}$ ($-273.15^\circ\text{C}$) return `'Invalid input'`.
  - Negative lengths/masses: Handled algebraically or safeguarded where specified.
- `RULE-CONV-004 (Precision Normalization)`: Results normalized up to 8 decimal places eliminating IEEE 754 floating point artifacts.
- `RULE-CONV-005 (Zero Runtime Dependencies)`: Pure native TypeScript implementation.
