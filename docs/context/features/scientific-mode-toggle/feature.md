---
type: Feature
title: "Scientific Mode Toggle & Advanced Functions"
status: stable
description: "Collapsible scientific keypad panel, angle modes (DEG/RAD), advanced trigonometric, exponential, logarithmic, and mathematical constant operations for StayCalc."
tags: [feature, scientific, trigonometry, math-engine, okf-v0.2]
generated: { by: "process:implement", at: "2026-10-15T00:00:00Z" }
sources:
  - id: source-domain-rules
    resource: docs/context/project/domain-rules.md
    title: Domain Rules
  - id: source-architecture
    resource: docs/context/project/architecture.md
    title: System Architecture
---

# Feature: Scientific Mode Toggle & Advanced Functions

Authoritative specification for the StayCalc scientific calculation mode, advanced arithmetic operations, collapsible scientific panel, angle mode management, and domain error protections.

## 1. Problem, Actors & Outcome
- **Problem & Context**: Engineers and students require advanced scientific calculations (trigonometry with degree/radian modes, powers, roots, logarithms, and constants) in the browser, but conventional pocket calculators either clutter the default interface, lack mobile responsiveness, or crash on domain boundary inputs (e.g., negative square roots or non-positive logarithms).
- **Target Actors & Roles**:
  | Role / Persona | Surface | Arrival State / Prerequisite | Permissions & Access |
  | :--- | :--- | :--- | :--- |
  | `StandardUser` | `<stay-calc>`, `src/engine/` | Calculator interface loaded | Full calculation & mode toggle access |
- **Checkable Success ("This Worked")**:
  - The `#scientific-toggle` button toggles `#scientific-keypad` with synchronized `aria-expanded` and `aria-controls`.
  - Angle mode toggles cleanly between `DEG` (default) and `RAD` with visual indicator.
  - Scientific trigonometric functions (`sin`, `cos`, `tan`), powers (`x^y`, `x²`), square root (`√`), reciprocal (`1/x`), logarithms (`ln`, `log`), and constants (`π`, `e`) evaluate with precision normalization up to 10 decimal digits (`RULE-CALC-002`).
  - Mathematical domain violations (`sqrt(-1)`, `ln(0)`, `log(-5)`, `1/0`) transition engine to error state with informative message (`"Invalid input"` or `"Cannot divide by zero"`) and input lock.
  - Zero horizontal overflow (`scrollWidth <= clientWidth`) across 320px–390px mobile viewports.
- **Checkable Failure ("This Is Broken")**:
  - Engine produces unhandled `NaN` or `Infinity`.
  - Scientific drawer overflows viewport horizontally.
  - Mode toggle wipes active accumulator, memory, or history registers.

## 2. Scope & Boundary Invariants
- **In This Revision**:
  - Unary scientific functions: `sin`, `cos`, `tan`, `sqrt`, `square`, `reciprocal`, `ln`, `log`.
  - Binary power operator: `^` (`x^y`).
  - High-precision constants: `pi` (`Math.PI`) and `e` (`Math.E`).
  - Angle measurement mode state: `DEG` vs `RAD` (`getAngleMode()`, `toggleAngleMode()`).
  - Collapsible `#scientific-keypad` panel and `#scientific-toggle` button with ARIA attributes.
  - Mathematical domain error locking with `"Invalid input"` and `"Cannot divide by zero"`.
- **Refused / Owned Elsewhere**:
  - Hyperbolic trigonometric functions (`sinh`, `cosh`, `tanh`) - reserved for future backlog.
  - Factorials and permutations (`n!`, `nPr`, `nCr`) - reserved for future backlog.
  - Complex numbers and imaginary unit `i`.
- **Underlying Product Rules**:
  - `RULE-CALC-001` (Zero Division Safeguard): Reciprocal `1/0` or division by zero yields `"Cannot divide by zero"` and locks input.
  - `RULE-CALC-002` (Precision Normalization): All scientific evaluations truncate IEEE-754 representation noise to a maximum of 10 decimal digits.
  - `RULE-CALC-003` (Trigonometric Angle Mode): Functions `sin`, `cos`, `tan` evaluate with degree conversion in `DEG` mode (`val * Math.PI / 180`) and direct radians in `RAD` mode.
  - `RULE-CALC-009` (Mathematical Domain Protection): Non-real evaluations (`sqrt(-n)`, `ln(<=0)`, `log(<=0)`) immediately trigger `"Invalid input"` error lock.
- **What Must Never Happen**:
  - `NEVER-CALC-001`: Never evaluate mathematical expressions using JavaScript `eval()` or `new Function()`.
  - `NEVER-CALC-002`: Never lose active buffer, accumulator, memory registers, or history tape upon scientific mode or angle mode toggle.
  - `NEVER-CALC-003`: Never allow mutations while engine is locked in error state until `clear()` or `allClear()` is invoked.

## 3. Object Lifecycle, Survivability & Storage
- **Engine State Extension**:
  - `angleMode: AngleMode` (`"DEG"` | `"RAD"`), defaults to `"DEG"`, persists across calculations.
- **UI State Extension**:
  - `isScientificOpen: boolean`, defaults to `false`.
- **SLA & Latency Ceilings**:
  - Scientific arithmetic computation latency: `<= 1ms` synchronous evaluation.
  - Keypad toggle transition: instant DOM toggle.

| Entity / Object | Identity Model | State (Draft vs Committed) | Survives Page Refresh? | Survives App Kill? | Survives Mode Switch? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `angleMode` | In-memory `CalcEngine` | Committed | No (session in-memory) | No | Yes |
| `isScientificOpen` | In-memory `<stay-calc>` | Committed | No (session in-memory) | No | Yes |
| `activeBuffer` | In-memory `CalcEngine` | Committed | No (session in-memory) | No | Yes |
