---
type: Cases
title: "F9: Multi-Unit Converter Test Scenarios"
description: "Universal test cases verifying physical conversions across Length, Mass, and Temperature, including boundary conditions and UI controls."
status: stable
tags: [cases, converter, units, f9]
generated: { by: "factory:planner", at: "2026-10-13T14:41:00Z" }
sources:
  - id: source-feature
    resource: docs/context/features/f9-unit-converter/feature.md
    title: F9 Feature Specification
---

# Test Scenarios: Multi-Unit Converter (F9)

## 1. Universal Cases

1. **`CASE-F9-001` (Length: Meters to Kilometers)**: `1000 m = 1 km`.
2. **`CASE-F9-002` (Length: Feet to Inches)**: `1 ft = 12 in`.
3. **`CASE-F9-003` (Length: Miles to Kilometers)**: `1 mi = 1.609344 km`.
4. **`CASE-F9-004` (Mass: Kilograms to Grams)**: `2.5 kg = 2500 g`.
5. **`CASE-F9-005` (Mass: Pounds to Ounces)**: `1 lb = 16 oz`.
6. **`CASE-F9-006` (Mass: Kilograms to Pounds)**: `1 kg ≈ 2.20462262 lb`.
7. **`CASE-F9-007` (Temperature: Celsius to Fahrenheit)**: `100 C = 212 F`, `0 C = 32 F`.
8. **`CASE-F9-008` (Temperature: Celsius to Kelvin)**: `0 C = 273.15 K`, `100 C = 373.15 K`.
9. **`CASE-F9-009` (Temperature: Fahrenheit to Celsius)**: `98.6 F = 37 C`.
10. **`CASE-F9-010` (Temperature: Absolute Zero Violation Guard)**: Converting below `0 K` (`-300 C`) returns `'Invalid input'`.
11. **`CASE-F9-011` (Component Mode Integration)**: Converter panel toggles in `<stay-calc>`, performs conversion, and allows loading into active calculator display.
