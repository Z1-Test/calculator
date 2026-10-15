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
- **`RULE-PROG-001` (Multi-Radix Integer Representation)**: In programmer mode, values are represented as arbitrary-precision BigInt integers and formatted simultaneously into HEX, DEC, OCT, and BIN representations.
- **`RULE-PROG-002` (Word Size Masking & Overflow)**: Calculations truncate and wrap to the active word size (8, 16, 32, 64-bit) using two's complement unsigned masking (`BigInt.asUintN(bits, BigInt(val))`).
- **`RULE-PROG-003` (Active Radix Keypad Gating)**: Digits outside active base (e.g. `8-9` in OCT, `2-9` in BIN, `A-F` in DEC/OCT/BIN, `.` in all programmer modes) are disabled via HTML `disabled` attribute and ignored on keyboard typing.
- **`RULE-PROG-004` (Programmer UI Zero Horizontal Overflow)**: `#programmer-panel`, `#radix-panel`, and hex keypad grids must maintain `scrollWidth <= clientWidth` on 320px–390px mobile viewports.
- **`RULE-CALC-005` (History Tape Cap)**: The local history tape must retain a maximum of 50 entries. When the limit is reached, the oldest entries must be automatically pruned (FIFO).
- **`RULE-CALC-006` (Memory Register Persistence)**: Memory register values must persist across mode switches (e.g., switching between Standard and Scientific) within the same session.
- **`RULE-EXP-001` (Deterministic Tape Export)**: CSV and TXT exports must generate deterministic byte-clean strings conforming to RFC 4180 without external parsing libraries.
- **`RULE-CLIP-001` (Safe Clipboard Synchronization)**: Clipboard operations must safely catch permission rejections and fallback cleanly without unhandled exceptions.
- **`RULE-TOAST-001` (Polite Live Region Feedback)**: Status feedback must use `aria-live="polite"` and auto-dismiss without moving keyboard focus.

## 2. Security & Execution Invariants

- **`NEVER-CALC-001` (No Dynamic Eval)**: Never evaluate mathematical expressions using JavaScript `eval()` or `new Function()`. All expressions must pass through a strict, deterministic lexical tokenizer and parser.
- **`NEVER-CALC-002` (No State Loss on Network Shift)**: Never reset the active expression buffer or history tape during network connectivity changes (online <-> offline) or theme toggles.
- **`NEVER-CALC-003` (No Blocking UI)**: Never execute parsing or large number evaluations synchronously on the main thread; long or complex computations must run in a Web Worker.
