---
type: Glossary
title: "StayCalc Ubiquitous Glossary"
description: "Canonical glossary and terminology definitions for the StayCalc domain."
status: stable
tags: [glossary, terminology, definitions]
generated: { by: "human:maintainer", at: "2026-10-08T00:00:00Z" }
sources:
  - id: source-vision
    resource: docs/context/project/vision.md
    title: Product Vision
---

# StayCalc Ubiquitous Glossary

## 1. Domain Terminology

- **Expression Buffer**: The structured sequence of operands, operators, and parentheses entered by the user prior to final evaluation.
- **Immediate Execution**: Evaluation mode where binary operators compute results immediately upon entering the next operator (Standard Mode).
- **Formula Evaluation**: Evaluation mode utilizing formal mathematical operator precedence (BEDMAS/PEMDAS) on full expression strings (Scientific Mode).
- **Shunting-Yard Algorithm**: An operator-precedence parsing method that converts infix mathematical expressions to Reverse Polish Notation (RPN) or an Abstract Syntax Tree (AST).
- **Floating-Point Artifact**: Undesirable precision discrepancies inherent to IEEE-754 binary floating-point representation (e.g., `0.1 + 0.2 = 0.30000000000000004`).
- **Epsilon Normalization**: Rounding or scaled integer calculation techniques to eliminate floating-point representation errors.
- **Memory Register**: Dedicated storage slot (`M+`, `M-`, `MR`, `MC`) holding a numeric value in local session memory.
- **History Tape**: A chronological, reverse-ordered log of completed calculations stored in local browser storage.
- **Radix**: The base of a positional numeral system (Base 16 = HEX, Base 10 = DEC, Base 8 = OCT, Base 2 = BIN).
- **DSD (Declarative Shadow DOM)**: Web platform standard enabling native encapsulation of Web Components without requiring JavaScript SSR hydration.
- **Staylook Tokens**: Standardized CSS custom property design system (`sl-*`) specifying colors, radii, spacing, and typography across themes.
