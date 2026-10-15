---
type: Feature
title: "Formula Expression Display & Parentheses Precedence Engine"
status: stable
description: "Live formula expression display preview bar, multi-level nested parentheses support, and algebraic operator precedence (BODMAS/PEMDAS) for StayCalc."
tags: [feature, expression, parentheses, bodmas, pemdas, math-engine, okf-v0.2]
generated: { by: "process:implement", at: "2026-10-15T00:00:00Z" }
sources:
  - id: source-domain-rules
    resource: docs/context/project/domain-rules.md
    title: Domain Rules
  - id: source-architecture
    resource: docs/context/project/architecture.md
    title: System Architecture
---

# Feature: Formula Expression Display & Parentheses Precedence Engine

Authoritative specification for the StayCalc live formula expression display bar (`#expression-display`), multi-level nested parentheses handling, and algebraic operator precedence (BODMAS/PEMDAS) engine.

## 1. Problem, Actors & Outcome
- **Problem & Context**: Engineers and students solving multi-step mathematical problems need visual confirmation of their entered calculation context and support for nested parentheses with algebraic precedence (BODMAS/PEMDAS). Pocket calculators that only evaluate immediately left-to-right obscure earlier terms and fail when equations require sub-expression grouping.
- **Target Actors & Roles**:
  | Role / Persona | Surface | Arrival State / Prerequisite | Permissions & Access |
  | :--- | :--- | :--- | :--- |
  | `StandardUser` | `<stay-calc>`, `src/engine/` | Calculator interface loaded | Full calculation & expression input access |
- **Checkable Success ("This Worked")**:
  - Live formula preview bar (`#expression-display`) renders entered operands, operators, and parentheses in real time above the primary display.
  - Multi-level nested parentheses (`(` and `)`) evaluate with correct algebraic precedence (Parentheses > Exponents > Multiplication/Division > Addition/Subtraction).
  - Unclosed parentheses upon pressing `=` are automatically balanced without throwing unhandled exceptions.
  - Dedicated tactile pill buttons (`(` and `)`) on the keypad and keyboard mappings for `(` and `)` trigger responsive input.
  - Backspace (`⌫`), Clear (`C`), and All Clear (`AC`) synchronize cleanly with the active expression and parentheses depth.
  - Zero horizontal overflow (`scrollWidth <= clientWidth`) across 320px–390px mobile viewports.
  - Zero external runtime dependencies (`dependencies: {}` in `package.json`).
- **Checkable Failure ("This Is Broken")**:
  - Engine crashes or produces unhandled exceptions on mismatched parentheses.
  - Expression bar causes horizontal scroll overflow on mobile screens.
  - Division by zero within parenthetical expressions bypasses error safeguards.

## 2. Scope & Boundary Invariants
- **In This Revision**:
  - Real-time expression formula tracking and display (`#expression-display`).
  - Keypad buttons for `(` and `)` with `btn-action` styling.
  - Keyboard mappings for `(` and `)`.
  - Nested parentheses stack management (`parenDepth`).
  - Algebraic precedence evaluation (BODMAS/PEMDAS: `()`, `^`, `*`/`/`, `+`/`-`).
  - Auto-closing of unclosed parentheses upon calculation.
  - Synchronization of Backspace, Clear, and All Clear with expression tokens.
- **Refused / Owned Elsewhere**:
  - Arbitrary Computer Algebra Systems (CAS) with symbolic variables (`x`, `y`).
  - Graphing or coordinate plotting.
  - Complex numbers and matrix arithmetic.
- **Underlying Product Rules**:
  - `RULE-CALC-001` (Zero Division Safeguard): Division by zero anywhere within expressions yields `"Cannot divide by zero"` and locks input.
  - `RULE-CALC-002` (Precision Normalization): All arithmetic results truncate IEEE-754 representation noise to a maximum of 10 decimal digits.
  - `RULE-CALC-010` (Parentheses Precedence & Balancing): Expressions evaluate following standard BODMAS/PEMDAS hierarchy; unclosed open parentheses auto-balance upon calculate (`=`).
  - `RULE-CALC-011` (Expression Preview Synchronization): `#expression-display` updates synchronously upon digit, operator, paren, backspace, and clear events.
- **What Must Never Happen**:
  - `NEVER-CALC-001`: Never evaluate mathematical expressions using JavaScript `eval()` or `new Function()`.
  - `NEVER-CALC-002`: Never lose active buffer, accumulator, memory registers, or history tape upon mode switches or display updates.
  - `NEVER-CALC-003`: Never allow operand or paren mutations while engine is locked in error state until cleared.

## 3. Object Lifecycle, Survivability & Storage
- **Engine State Extension**:
  - `expression: string`, defaults to `""`, tracks current formula string.
  - `parenDepth: number`, defaults to `0`, tracks open parentheses nesting level.
- **UI State Extension**:
  - `#expression-display` element within `.display-card`, reflects `getExpression()`.
- **SLA & Latency Ceilings**:
  - Expression evaluation latency: `<= 1ms` synchronous evaluation.
  - Real-time display update: synchronous DOM sync during input event loop.

| Entity / Object | Identity Model | State (Draft vs Committed) | Survives Page Refresh? | Survives App Kill? | Survives Mode Switch? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `expression` | In-memory `CalcEngine` | Committed | No (session in-memory) | No | Yes |
| `parenDepth` | In-memory `CalcEngine` | Committed | No (session in-memory) | No | Yes |
| `#expression-display` | Shadow DOM element | Rendered | No | No | Yes |
