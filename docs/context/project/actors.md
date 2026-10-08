---
type: Concept
title: "StayCalc Actors & Personas"
description: "Actor catalog, user roles, interaction modes, and permission boundaries for StayCalc."
status: stable
tags: [actors, personas, permissions]
generated: { by: "human:maintainer", at: "2026-10-08T00:00:00Z" }
sources:
  - id: source-vision
    resource: docs/context/project/vision.md
    title: Product Vision
---

# StayCalc Actors & Personas

## 1. Actor Overview

StayCalc serves unauthenticated client users across three primary interaction personas:

```text
Actor Types
├── General User (Everyday 4-Function Calculations)
├── Student / Engineer (Scientific & Trigonometric Operations)
└── Programmer / Developer (Bitwise & Radix Base Conversions)
```

## 2. Persona Definitions

### Actor 1: General User (`actor:general`)
- **Profile**: Everyday consumer seeking quick, frictionless arithmetic (bills, shopping, budgets).
- **Primary Surface**: Standard Calculator Mode.
- **Key Actions**: Basic arithmetic (`+`, `-`, `×`, `÷`), percentage, square root, memory operations (`M+`, `MR`), history recall.
- **Expectation**: Immediate load time, intuitive numpad, error-tolerant input handling.

### Actor 2: Student & Engineer (`actor:scientific`)
- **Profile**: High school / university student, scientist, or engineer computing algebraic and trigonometric formulas.
- **Primary Surface**: Scientific Calculator Mode.
- **Key Actions**: Trigonometry (`sin`, `cos`, `tan`, inverse/hyp), logarithms (`log`, `ln`), exponents (`x^y`, `e^x`), constants (`π`, `e`), angle unit toggle (Deg / Rad).
- **Expectation**: Operator precedence handling, parentheses nesting, high precision.

### Actor 3: Programmer & Developer (`actor:programmer`)
- **Profile**: Software engineer or student working with low-level computer arithmetic and binary representations.
- **Primary Surface**: Programmer Calculator Mode.
- **Key Actions**: Radix conversions (HEX, DEC, OCT, BIN), bitwise operations (`AND`, `OR`, `XOR`, `NOT`, `LSH`, `RSH`), word size selection (8-bit, 16-bit, 32-bit, 64-bit).
- **Expectation**: Exact integer precision, live bit toggling display, instant radix cross-view.
