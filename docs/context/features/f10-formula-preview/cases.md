---
type: Test Cases
title: "Formula Expression Preview Display Test Cases"
status: stable
description: "Unified test scenarios CASE-01 to CASE-11, 12-stall matrix, traceability chain, and N/A declarations for Formula Expression Preview Display."
tags: [cases, test-cases, expression, preview, display, formula, okf-v0.2]
sources:
  - resource: ./feature.md
  - resource: ./flow.md
---

# Test Cases: Formula Expression Preview Display

Authoritative test scenarios for the StayCalc secondary formula expression preview display row (`#expressionPreview`), validating real-time expression updates, mid-flow operator replacement, unary function wrapping, chained operations, equals finalization, multi-radix token formatting, reset semantics, and accessible live region presentations. Grounded in `docs/context/project/domain-rules.md`, Feature rules (`RULE-*` / `NEVER-*`), and Flow decisions.

---

## 1. Universal Scenarios (11 Standard Types)

### `CASE-01`: Happy Path Nominal Execution (Binary Operation Expression Formulation: "15 * 4 = 60")
- **Actor**: `GeneralUser`
- **Preconditions**: Calculator engine initialized in standard mode.
- **Action Sequence / Input**:
  - Enter digit `1`, digit `5`.
  - Press operator `*`.
  - Verify expression is `"15 * "` and display is `"15"`.
  - Enter digit `4`.
  - Press equals `=`.
- **Expected Outcome**:
  - Expression updates to `"15 * 4 ="`.
  - Main display displays `"60"`.
  - Calculation history entry recorded with matching expression.
- **Enforces**: `RULE-CALC-007`, `SEAM-ENGINE-01`

### `CASE-02`: Empty State & First Use (Initial Clean Mount: Expression is Empty String `""`, No Layout Jump)
- **Actor**: `GeneralUser` / `FirstTimeVisitor`
- **Preconditions**: `<stay-calc>` component mounted.
- **Action Sequence / Input**:
  - Inspect initial state of `CalculatorEngine`.
  - Inspect shadow DOM element `#expressionPreview`.
- **Expected Outcome**:
  - `engine.getExpression()` returns `""`.
  - `#expressionPreview` text content is `""`.
  - Element has attributes `id="expressionPreview"`, `class="expression-preview"`, `role="status"`, `aria-label="Expression preview"`, `aria-live="polite"`.
  - CSS min-height prevents vertical layout jumping when empty.
- **Enforces**: `RULE-CALC-007`, `RULE-UI-002`

### `CASE-03`: Error State & Division by Zero ("15 / 0 =" Formula Expression with Input Lock and Error Readout)
- **Actor**: `GeneralUser`
- **Preconditions**: Engine in standard mode.
- **Action Sequence / Input**:
  - Enter `15`.
  - Press `/`.
  - Enter `0`.
  - Press `=`.
- **Expected Outcome**:
  - Expression preview row displays `"15 / 0 ="`.
  - Main display displays `"Cannot divide by zero"`.
  - Engine enters locked error state (`isLocked: true`, `error: "Cannot divide by zero"`).
  - Attempting subsequent digit input does not mutate display or expression.
- **Enforces**: `RULE-CALC-001`, `RULE-CALC-007`

### `CASE-04`: Mid-Flow Operator Replacement (Instant Expression Update e.g. "15 + " -> "15 * " without Evaluation)
- **Actor**: `GeneralUser`
- **Preconditions**: First operand entered.
- **Action Sequence / Input**:
  - Enter `15`.
  - Press `+`.
  - Verify expression is `"15 + "`.
  - Press `*`.
  - Verify expression is `"15 * "` without evaluating intermediate calculation.
  - Press `-`.
  - Verify expression is `"15 - "`.
  - Enter `5`, press `=`.
- **Expected Outcome**:
  - Expression cleanly replaces trailing operator immediately on each press (`"15 + "` -> `"15 * "` -> `"15 - "`).
  - Final evaluation computes `15 - 5 = 10` with expression `"15 - 5 ="`.
- **Enforces**: `RULE-CALC-008`

### `CASE-05`: Idempotency & Repeated Equals ("5 =" or Repeated Equals Maintains Stable Expression)
- **Actor**: `GeneralUser`
- **Preconditions**: Engine in clean state.
- **Action Sequence / Input**:
  - Enter `5`.
  - Press `=`.
  - Verify expression is `"5 ="`.
  - Press `=` again 3 times consecutively.
- **Expected Outcome**:
  - Expression remains stably `"5 ="` without appending redundant `=` signs.
  - Display remains `"5"`.
- **Enforces**: `RULE-CALC-007`, `NEVER-CALC-001`

### `CASE-06`: Precision Normalization in Expression (Normalized Float Representation in Formula: e.g. "0.1 + 0.2 =")
- **Actor**: `EngineerUser`
- **Preconditions**: Engine in standard mode.
- **Action Sequence / Input**:
  - Enter `0.1`.
  - Press `+`.
  - Enter `0.2`.
  - Press `=`.
- **Expected Outcome**:
  - Expression preview displays `"0.1 + 0.2 ="`.
  - Main display displays normalized `"0.3"`.
  - Free from IEEE-754 representation noise.
- **Enforces**: `RULE-CALC-002`, `RULE-CALC-007`

### `CASE-07`: Unary Function Operand Wrapping (Wrapping Operands: "√(25)", "sqr(5)", "sin(90)")
- **Actor**: `StudentUser`
- **Preconditions**: Engine in scientific mode.
- **Action Sequence / Input**:
  - Enter `25`, press `sqrt` (`SQUARE_ROOT`).
  - Verify expression is `"√(25)"` and display is `"5"`.
  - Enter `5`, press `sqr` (`SQUARE`).
  - Verify expression is `"sqr(5)"` and display is `"25"`.
  - Enter `90`, press `sin` (`SIN`).
  - Verify expression is `"sin(90)"` and display is `"1"`.
  - Chained unary inside binary: enter `10`, press `+`, enter `25`, press `sqrt`.
  - Verify expression is `"10 + √(25)"` and display is `"5"`.
  - Press `=`.
  - Verify expression is `"10 + 5 ="` or `"10 + √(25) ="` and display is `"15"`.
- **Expected Outcome**:
  - Unary function wrapping cleanly encapsulates the active operand string in expression preview.
- **Enforces**: `RULE-CALC-003`, `RULE-CALC-007`

### `CASE-08`: Chained Operations & Accumulator Propagation ("2 + 3 *" Evaluates 5 and Updates Expression to "5 * ")
- **Actor**: `GeneralUser`
- **Preconditions**: Engine in standard mode.
- **Action Sequence / Input**:
  - Enter `2`.
  - Press `+`.
  - Enter `3`.
  - Press `*`.
  - Verify display evaluates to `"5"` and expression updates to `"5 * "`.
  - Enter `4`.
  - Press `=`.
- **Expected Outcome**:
  - Pocket calculator immediate execution model evaluates `2 + 3 = 5` upon pressing `*`.
  - Expression updates to `"5 * "`, then `"5 * 4 ="` on equals.
  - Final display is `"20"`.
- **Enforces**: `RULE-CALC-007`, `SEAM-ENGINE-01`

### `CASE-09`: Clear & Reset Semantics (C Preserves Expression Prefix; AC Completely Clears Expression to `""`)
- **Actor**: `GeneralUser`
- **Preconditions**: In-flight operation `15 + 99`.
- **Action Sequence / Input**:
  - Enter `15`, press `+`, enter `99`.
  - Press `C` (Clear).
  - Verify display resets to `"0"`, but expression maintains `"15 + "`.
  - Enter `5`, press `=`.
  - Verify evaluation yields `20` with expression `"15 + 5 ="`.
  - Press `AC` (All Clear).
  - Verify display resets to `"0"` and expression resets completely to `""`.
- **Expected Outcome**:
  - `C` preserves formula expression prefix (`RULE-CALC-009`).
  - `AC` flushes expression preview row to empty string (`RULE-CALC-009`).
- **Enforces**: `RULE-CALC-009`

### `CASE-10`: Multi-Radix Programmer Mode Formatting (Hex, Octal, Binary Expression Tokens e.g. "0xFF + " or "FF & ")
- **Actor**: `ProgrammerUser`
- **Preconditions**: Engine in programmer mode with HEX radix.
- **Action Sequence / Input**:
  - Enter `FF`, press `+`.
  - Verify expression contains `"FF + "`.
  - Switch radix to BIN, enter `1010`, press `&` (`AND`).
  - Verify expression displays binary tokens cleanly (e.g. `"1010 & "`).
  - Enter `1100`, press `=`.
- **Expected Outcome**:
  - Operands in expression preview format according to active radix.
  - Bitwise operations format with corresponding operator symbols.
- **Enforces**: `RULE-CALC-004`, `RULE-CALC-007`

### `CASE-11`: Component UI, Live Region & Accessibility (#expressionPreview attributes, `calc-change` event detail, mobile zero-overflow 320px–390px)
- **Actor**: `ScreenReaderUser` / `KeyboardPowerUser`
- **Preconditions**: `<stay-calc>` mounted in DOM.
- **Action Sequence / Input**:
  - Inspect `#expressionPreview` DOM attributes (`role="status"`, `aria-label="Expression preview"`, `aria-live="polite"`).
  - Listen for `calc-change` CustomEvent.
  - Perform calculation `8 * 2 = 16`.
  - Inspect event detail and style layout across container widths (320px, 375px, 390px).
- **Expected Outcome**:
  - `calc-change` event detail contains `expression: "8 * 2 ="`.
  - `#expressionPreview` displays `"8 * 2 ="`.
  - Subdued text styling with high-contrast accessibility.
  - Zero horizontal scroll overflow across 320px–390px viewports (`RULE-RESP-001`).
- **Enforces**: `RULE-RESP-001`, `RULE-UI-002`, `SEAM-UI-01`

---

## 2. 12-Stall Survivability & Edge Case Matrix

| Stall ID | Edge Condition / Failure Mode | System Impact | Mitigation / System Guarantee |
| :--- | :--- | :--- | :--- |
| `STALL-01` | Equals pressed when input is empty (`""` or `"0"`) | Potential empty expression crash | Handled gracefully: expression formats as `"0 ="` without error |
| `STALL-02` | Rapid consecutive clicks on operator buttons (`+ - * /`) | Potential race condition or memory leak | Synchronous reducer replaces operator deterministically in `< 1ms` (`RULE-CALC-008`) |
| `STALL-03` | Network connectivity shift (online <-> offline) | Transient network changes | Expression preview relies 100% on local memory state (`NEVER-CALC-002`) |
| `STALL-04` | Theme toggle clicked mid-calculation | DOM re-rendering | Expression preview string and calculation state strictly preserved (`NEVER-CALC-002`) |
| `STALL-05` | Mode switch (Standard <-> Scientific <-> Programmer) | Mode layout toggle | Active expression persists or converts to active radix format (`RULE-CALC-006`) |
| `STALL-06` | Max display digits exceeded in operand | Buffer overflow | Display capacity enforced; expression preview truncates/wraps with ellipsis |
| `STALL-07` | Square root of negative number (`-25 sqrt`) | Invalid math domain | Expression shows error, display shows `"Invalid input"`, engine locks input |
| `STALL-08` | Repeated equals pressed 10 times consecutively | Potential expression string bloat | Idempotency guard prevents appending multiple trailing `=` signs |
| `STALL-09` | Backspace pressed while entering second operand | Operand digit erasure | Backspace erases active display buffer; expression prefix remains intact |
| `STALL-10` | Slotted display custom element inserted by host | Light DOM slot projection | Component synchronizes state while keeping default preview intact |
| `STALL-11` | Constrained 320px mobile viewport | Narrow horizontal width | Subdued font and container queries prevent horizontal scroll overflow (`RULE-RESP-001`) |
| `STALL-12` | Alternating `C` and digit input multiple times | Buffer churn | Active buffer clears while formula prefix remains stable |

---

## 3. Traceability Matrix & Specification Coverage

| Feature Rule | Flow Step / Decision | Test Case | Target Suite / Verification |
| :--- | :--- | :--- | :--- |
| `RULE-CALC-001` | `REC-EXP-01` | `CASE-03` | `test/expression.test.ts` |
| `RULE-CALC-007` | `SCR-EXPR-ACTIVE`, `SCR-EXPR-EQUALS`, `DEC-EXP-01`, `DEC-EXP-02` | `CASE-01`, `CASE-02`, `CASE-05`, `CASE-08` | `test/expression.test.ts` |
| `RULE-CALC-008` | `DEC-EXP-01`, `REC-EXP-02` | `CASE-04` | `test/expression.test.ts` |
| `RULE-CALC-009` | `ENT-EXP-05`, `REC-EXP-03` | `CASE-09` | `test/expression.test.ts` |
| `RULE-RESP-001` | `SCR-EXPR-ACTIVE` | `CASE-11` | `test/expression.test.ts` |
| `RULE-UI-002` | `SCR-EXPR-EMPTY`, `SCR-EXPR-ACTIVE` | `CASE-02`, `CASE-11` | `test/expression.test.ts` |
| `NEVER-CALC-001` | `DEC-EXP-01`, `DEC-EXP-02` | `CASE-01`, `CASE-05` | `test/expression.test.ts` |
| `NEVER-CALC-004` | `DEC-EXP-01` | `CASE-08`, `CASE-09` | `test/expression.test.ts` |
| `SEAM-ENGINE-01` | `ENT-EXP-01` to `ENT-EXP-05` | `CASE-01`, `CASE-08` | `test/expression.test.ts` |
| `SEAM-UI-01` | `SCR-EXPR-ACTIVE`, `SCR-EXPR-EQUALS` | `CASE-11` | `test/expression.test.ts` |

---

## 4. N/A Declarations & Exclusions

- **Arbitrary-length multi-parenthesis editing**: N/A for this release; StayCalc adheres strictly to the pocket calculator immediate execution model.
- **Server-side expression persistence**: N/A; StayCalc is an autonomous client-side application.
- **Symbolic equation solving**: N/A; StayCalc evaluates numeric expressions rather than algebraic CAS polynomials.
