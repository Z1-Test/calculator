# Milestone 2: Autonomous Runtime Feature Expansion (COMPLETED ✅)

> **Boundary Condition**: Max 10 features total across the entire factory run. Features F1–F10 complete the benchmark.

## Milestone 1: Core Foundation Baseline (COMPLETED ✅)
- [x] Feature 1 (F1): Precision Arithmetic Engine (`src/engine/calculator-engine.ts`, `test/calc-engine.test.ts`) - PR #34
- [x] Feature 2 (F2): Accessible UI & Keyboard Navigation (`src/components/stay-calc.ts`, `test/stay-calc.test.ts`) - PR #36
- [x] Feature 3 (F3): Memory Registers (`M+`, `M-`, `MR`, `MC`, active `M` badge) - PR #38
- [x] Feature 4 (F4): Calculation History Tape (Drawer panel, clickable reload, clear action) - PR #40
- [x] Feature 5 (F5): Scientific Mode Toggle ($\sqrt{x}$, $x^2$, $x^y$, $\pi$, $e$, $\sin$, $\cos$, $\tan$, DEG/RAD) - PR #42

---

## Milestone 2: Autonomous Runtime Feature Expansion (COMPLETED ✅)
- [x] Feature 6 (F6): Programmer Radix Mode (HEX, DEC, OCT, BIN display & bitwise AND, OR, XOR, NOT) - PR #44
- [x] Feature 7 (F7): History Tape Export & Clipboard Copy (Export formatted text/CSV, one-click copy with toast) - PR #46
- [x] Feature 8 (F8): Dynamic Visual Theme Switcher (Dark, Light, High-Contrast themes with WCAG 2.2 AAA/AA) - PR #48
- [x] Feature 9 (F9): Multi-Unit Converter Extension (Length, Mass, Temperature conversions with active buffer handoff) - PR #50
- [x] Feature 10 (F10): Formula Expression Preview Display (Secondary preview row showing complete formula expression) - PR #52

## FORBIDDEN / OUT OF SCOPE:
- ❌ Features beyond Feature 10 (Strict Halting Boundary: Stop at F10 and produce FACTORY_EVALUATION_REPORT.md).
- ❌ External runtime dependencies — Strictly prohibited (`"dependencies": {}` must remain empty).
- ❌ Direct commits to `main` — All changes delivered via isolated branches and Pull Requests.

## Execution Rules:
- **Max Retry Rule**: Max 3 attempts ($N \le 3$).
- **9 Lifecycle Steps**: `Issue` ➔ `Triage` ➔ `Plan` ➔ `Branch` ➔ `Code & Docs` ➔ `PR` ➔ `Review` ➔ `Solve` ➔ `Merge`.
- **Process Over Speed**: Full verification and certified skills for each stage.
