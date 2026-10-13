---
type: Policy
title: "StayCalc Domain Rules & Invariants"
description: "Mathematical domain rules, error handling policies, and operational invariants for StayCalc."
status: stable
tags: [domain-rules, invariants, math, safety]
generated: { by: "human:maintainer", at: "2026-10-08T00:00:00Z" }
sources:
  - id: source-vision
    resource: docs/context/project/vision.md
    title: Product Vision
---

# StayCalc Domain Rules & Invariants

## 1. Mathematical Invariants

- **`RULE-CALC-001` (Zero Division Safeguard)**: Division by zero (`n ÷ 0`) must immediately yield a sanitized, user-facing `"Cannot divide by zero"` error state rather than JavaScript `Infinity` or `NaN`.
- **`RULE-CALC-002` (Precision Normalization)**: All floating-point operations in Standard and Scientific modes must truncate IEEE-754 representation noise to a maximum of 12 significant decimal digits (e.g., `0.1 + 0.2` must display `0.3`).
- **`RULE-CALC-003` (Trigonometric Angle Mode)**: Scientific trigonometric functions (`sin`, `cos`, `tan`) must respect the active angle unit mode (`DEG` by default, togglable to `RAD`).
- **`RULE-CALC-004` (Radix Integer Clamping)**: Programmer mode calculations must use BigInt integer arithmetic clamped to the selected bit-width word size (BYTE: 8-bit, WORD: 16-bit, DWORD: 32-bit, QWORD: 64-bit) with two's complement sign representation.
- **`RULE-CALC-005` (History Tape Cap)**: The local history tape must retain a maximum of 100 entries. When the limit is reached, the oldest entries must be automatically pruned (FIFO).
- **`RULE-CALC-006` (Memory Register Persistence)**: Memory register values must persist across mode switches (e.g., switching between Standard and Scientific) within the same session.

## 2. Security & Execution Invariants

- **`NEVER-CALC-001` (No Dynamic Eval)**: Never evaluate mathematical expressions using JavaScript `eval()` or `new Function()`. All expressions must pass through a strict, deterministic lexical tokenizer and parser.
- **`NEVER-CALC-002` (No State Loss on Network Shift)**: Never reset the active expression buffer or history tape during network connectivity changes (online <-> offline) or theme toggles.
- **`NEVER-CALC-003` (No Blocking UI)**: Never execute parsing or large number evaluations synchronously on the main thread; long or complex computations must run in a Web Worker.
