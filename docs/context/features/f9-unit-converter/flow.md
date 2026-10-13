---
type: Flow
title: "F9: Multi-Unit Converter Flow"
description: "User interaction flow for selecting physical units and executing conversions."
status: stable
tags: [flow, converter, units, f9]
generated: { by: "factory:planner", at: "2026-10-13T14:41:00Z" }
sources:
  - id: source-feature
    resource: docs/context/features/f9-unit-converter/feature.md
    title: F9 Feature Specification
---

# User Flow: Multi-Unit Converter (F9)

## 1. Flow Diagram

```mermaid
graph TD
  A[User Opens Converter Panel] --> B[Select Category: Length, Mass, Temp]
  B --> C[Select From-Unit and To-Unit]
  C --> D[User Inputs Value or Uses Display Result]
  D --> E[UnitConverterEngine Normalizes to Base Unit]
  E --> F[Converts Base Unit to Destination Unit]
  F --> G[Rounds & Formats Display Result]
  G --> H[User May Load Converted Value into Calculator]
```

## 2. Interaction States
- **SCR-CONV-01 (Converter Panel)**: Toggleable panel containing Category, From-Unit, To-Unit, and Convert button.
- **DEC-CONV-01 (Category Change)**: Selecting new category automatically resets unit dropdowns to category defaults.
- **REC-CONV-01 (Absolute Zero Guard)**: Converting temperatures below -273.15 C displays `'Invalid input'`.
