---
type: Feature
title: "F10: Formula Expression Preview Display"
status: stable
description: "Authoritative product problem, rules, boundary invariants, scope, and survivability matrix for Formula Expression Preview Display."
tags: [feature, expression, preview, formula, display, web-component, okf-v0.2]
sources:
  - resource: ../../project/vision.md
  - resource: ../../project/domain-rules.md
  - resource: ../../project/architecture.md
  - resource: ../../project/design.md
  - resource: ../f1-precision-arithmetic-engine/feature.md
  - resource: ../f2-accessible-ui-keyboard-nav/feature.md
---

# Feature: F10 - Formula Expression Preview Display

Authoritative product specification for the StayCalc secondary formula expression preview display row (`#expressionPreview`), providing real-time visual feedback of mathematical expressions, active operands, binary operators, unary functions, chained evaluations, multi-radix token formatting, and calculation finalization with trailing equals. Governed by `docs/context/project/`.

## 1. Problem, Actors & Outcome
- **Problem & Context**: In standard pocket-style digital calculators, users often lose track of their calculation context when entering multi-step or chained arithmetic problems (such as `15 * 4` or `2 + 3 * 4`). Because the primary digital display exclusively presents the currently active input buffer or the latest evaluated result, users cannot readily confirm which previous operand was entered, which operator is currently pending, or how unary operations transformed an operand without consulting separate history drawers. This creates cognitive load, user hesitation, and input errors. Users require an integrated, secondary formula expression preview display row (`#expressionPreview`) situated directly above the main readout (`#display` / `#displayValue`) that continuously mirrors the formulation of the mathematical calculation in real time. The expression row must dynamically update as operands, binary operators (`+`, `-`, `*`, `/`, `^`, bitwise ops), and unary functions (`sqrt`, `sqr`, `sin`, `cos`, `tan`) are executed, dynamically replace operators on consecutive presses without intermediate evaluation, finalize with trailing `=` upon evaluation, respect active radix and angle modes, adhere to polite ARIA live region semantics, and preserve zero horizontal scroll overflow across mobile viewports (320px–390px) with zero external runtime dependencies.
- **Target Actors & Roles**:
  | Role / Persona | Surface | Arrival State / Prerequisite | Permissions & Access |
  | :--- | :--- | :--- | :--- |
  | `GeneralUser` | `<stay-calc>` Digital Display | Any calculation state | View running formula expression preview above main display |
  | `StudentUser` | `<stay-calc>` Math Operations | Learning arithmetic & trig | Inspect unary function transformations (e.g. `sin(90)`, `√(25)`) and chained equations |
  | `ProgrammerUser` | `<stay-calc>` Bitwise & Radix | Programmer mode active | Inspect binary bitwise formulas formatted in active radix (HEX, DEC, OCT, BIN) |
  | `KeyboardPowerUser` | `<stay-calc>` Interactive Keypad | Typing numbers and keys | Track calculation flow seamlessly without losing entry context |
  | `ScreenReaderUser` | Assistive Technology | Reading ARIA tree | Receive live announcements of formula updates via polite ARIA live region (`aria-live="polite"`, `role="status"`) |
- **Checkable Success ("This Worked")**:
  1. Engine state `CalculatorState` includes `expression: string`, initialized to empty string `''`.
  2. Engine facade exposes `getExpression(): string` reflecting the current expression string.
  3. When an operator is entered (`OPERATOR` action):
     - If no pending operator: expression becomes `${formattedAccumulator} ${operatorSymbol} ` (e.g. `"15 + "`).
     - If chained operation (e.g. `2 + 3 *`): evaluates `2 + 3 = 5`, display updates to `5`, and expression updates to `"5 * "`.
     - If mid-flow operator replacement (`RULE-CALC-008`): replaces trailing operator immediately (e.g. `"15 + "` -> `"15 * "`).
  4. Unary functions (`SQUARE_ROOT`, `SQUARE`, `SIN`, `COS`, `TAN`):
     - Wrap active operand string in expression (e.g. `"√(25)"`, `"sqr(5)"`, `"sin(90)"`).
     - If an operator was already pending (e.g. `"15 + "`), appending the wrapped unary expression produces `"15 + √(25)"`.
  5. Equals (`EQUALS`):
     - When evaluating with pending operator, appends the second operand and `"="` (e.g. `"15 * 4 ="`), while main display shows the evaluated result (`60`).
     - If equals is pressed with no pending operator (e.g. `5 =`): expression becomes `"5 ="` and display maintains `5`.
     - If division by zero occurs (e.g. `15 / 0 =`): expression displays `"15 / 0 ="`, display displays `"Cannot divide by zero"`, and engine locks input (`RULE-CALC-001`).
  6. Digit / Hex Digit / Decimal Input (`DIGIT`, `INPUT_HEX_DIGIT`, `DECIMAL`):
     - If previous action was equals (i.e. expression ends with `'='`), typing a new digit starts a fresh calculation and resets expression to `''`.
  7. Clear Register (`CLEAR` / `C`):
     - Resets active input buffer to `"0"`, but preserves the formula expression prefix (e.g. `"15 + "`).
  8. All Clear (`ALL_CLEAR` / `AC`):
     - Resets display to `"0"` and completely resets expression to `''` (`RULE-CALC-009`).
  9. Radix formatting in programmer mode:
     - Formats numbers in expression with active radix representation (e.g. `"0xFF + "` or `"FF + "`, `"1010 & "`) (`RULE-CALC-004`).
  10. Load buffer (`LOAD_BUFFER`):
      - If pending operator exists, buffer value is ready as second operand; if fresh, resets expression (`NEVER-CALC-004`).
  11. Component UI in `src/components/stay-calc.ts`:
      - `#expressionPreview` element rendered directly above `#displayValue` inside `.display-screen`.
      - Attributes: `id="expressionPreview"`, `class="expression-preview"`, `role="status"`, `aria-label="Expression preview"`, `aria-live="polite"`.
      - Styling: subdued font (0.85rem–0.95rem), opacity 0.7 or dedicated token, right-aligned, min-height to prevent layout jumping.
      - High-contrast theme compliance: prominent contrast (white/amber) and zero `!important`.
      - Verified mobile zero horizontal scroll overflow across 320px–390px viewports (`RULE-RESP-001`).
  12. CustomEvent seam:
      - `calc-change` CustomEvent detail includes `expression: string` (`SEAM-UI-01`).
  13. Zero external runtime dependencies (`"dependencies": {}`).
- **Checkable Failure ("This Is Broken")**: Expression row out of sync with accumulator; mid-flow operator replacement failing to update formula string; unary functions failing to wrap operands; typing new numbers after equals appending to old formula; division by zero failing to show formula equation with trailing `=`; horizontal scrollbars appearing on 320px–390px mobile viewports.

## 2. Scope & Boundary Invariants
- **In This Revision**:
  - Type contract extension in `src/engine/types.ts`: `expression: string` on `CalculatorState`.
  - Reducer expression logic in `src/engine/calculator-engine.ts` across `DIGIT`, `INPUT_HEX_DIGIT`, `DECIMAL`, `OPERATOR`, `EQUALS`, `CLEAR`, `ALL_CLEAR`, `LOAD_BUFFER`, and unary functions.
  - Facade method `getExpression(): string` on `CalculatorEngine`.
  - Shadow DOM template and stylesheet additions in `src/components/stay-calc.ts` for `#expressionPreview`.
  - `calc-change` event payload synchronization.
  - Comprehensive unit test suite in `test/expression.test.ts`.
- **Out of Scope / Non-Goals**:
  - Arbitrary-length multi-parenthesis editable formula input bar (StayCalc adheres to the pocket calculator immediate execution model).
  - Reverse Polish Notation (RPN) mode.
  - LaTeX or MathML symbolic equation rendering.
  - Persistent storage of transient in-progress expression string in `localStorage`.
- **Invariants & Domain Rules**:
  - **`RULE-CALC-001` (Zero Division Safeguard)**: Division by zero (`n / 0`) must immediately yield a sanitized `"Cannot divide by zero"` error state, lock input, and format the expression as `${operand} / 0 =`.
  - **`RULE-CALC-007` (Formula Expression Preview Visibility and Synchronization)**: Formula expression preview row (`#expressionPreview`) must reflect active running calculation state, including accumulator, pending operator, chained operations, unary transformations, and evaluated formulas with trailing `=`.
  - **`RULE-CALC-008` (Dynamic Operator Replacement in Expression)**: When a user enters consecutive operators without an intervening operand (e.g. `15 + *`), the expression preview replaces the trailing operator immediately without executing an intermediary calculation.
  - **`RULE-CALC-009` (Formula Clear and All-Clear Semantics)**: Clear register (`C`) flushes the active input buffer while strictly preserving the existing formula expression prefix; All Clear (`AC`) flushes the formula expression to empty string (`''`).
  - **`RULE-RESP-001` (Mobile Zero-Overflow 320px–390px)**: The formula expression preview row and container must maintain zero horizontal scroll overflow (`scrollWidth <= clientWidth`) across 320px, 375px, and 390px mobile viewports.
  - **`RULE-UI-002` (Polite Live Region & Accessible Controls)**: `#expressionPreview` exposes `role="status"`, `aria-label="Expression preview"`, and `aria-live="polite"`.
  - **`NEVER-CALC-001` (Zero Dynamic Eval)**: Formula expressions are constructed deterministically from typed tokens and evaluated through reducer logic, never JavaScript `eval()` or `new Function()`.
  - **`NEVER-CALC-004` (No Calculation State Pollution from Auxiliary Converters/Buffers)**: Loading a value into the active buffer prepares the operand cleanly without corrupting the formula expression.

## 3. Seams & Contracts
- **`SEAM-ENGINE-01` (Engine State Contract)**:
  - `CalculatorState` includes `expression: string`.
  - Initial state: `expression: ''`.
  - Engine facade exposes:
    ```ts
    public getExpression(): string
    ```
- **`SEAM-UI-01` (CustomEvent Protocol)**:
  - Dispatches `CustomEvent<'calc-change'>` on every state transition:
    ```ts
    {
      detail: {
        display: string;
        expression: string;
        accumulator: number | null;
        pendingOperator: Operator | null;
        waitingForOperand: boolean;
        error: string | null;
        isLocked: boolean;
        memory: number;
        hasActiveMemory: boolean;
        history: readonly CalculationHistoryEntry[];
        mode: CalculatorMode;
        angleUnit: AngleUnit;
        radix: Radix;
        multiRadix: MultiRadixValues;
        theme: CalculatorTheme;
      },
      bubbles: true,
      composed: true
    }
    ```

## 4. Survivability Matrix

| Failure Mode / Edge Condition | System Impact | Mitigation / System Guarantee |
| :--- | :--- | :--- |
| Division by zero (`15 / 0 =`) | Arithmetic division failure | Expression shows `"15 / 0 ="`, display shows `"Cannot divide by zero"`, engine locks input (`RULE-CALC-001`) |
| Repeated consecutive operator entry (`15 + - *`) | Ambiguous operation intent | Reducer replaces trailing operator in expression preview without evaluation (`RULE-CALC-008`) |
| Multiple consecutive equals clicks (`5 = = =`) | Redundant evaluation trigger | Expression maintains stable finalized equation (`"5 ="`) without appending extra `=` characters |
| Typing new number immediately following equals | Ambiguity between chaining or new calculation | Fresh calculation started: expression resets to `''` and display receives new digit |
| Floating point arithmetic with IEEE noise (`0.1 + 0.2 =`) | Visual representation noise | Expression tokens and display results are normalized via `normalizePrecision` (`RULE-CALC-002`) |
| Long formula expression exceeding container width | Potential horizontal layout overflow | Text aligns to the right (`text-align: end`), wraps or truncates with ellipsis, and enforces `overflow: hidden` with zero mobile scrollbars |
| Clear register `C` clicked mid-calculation | User error correction on second operand | Input buffer resets to `"0"`, but expression prefix (e.g. `"15 + "`) remains intact |
| All Clear `AC` clicked | Full calculation reset | Both main display (`"0"`) and expression row (`""`) reset completely |
| Unary function applied in programmer mode | Non-standard unary operations | Unary operations safely formatted without NaN or unhandled exceptions |
| Mobile device on 320px screen width | Constrained display screen width | Container queries scale font size down to `0.85rem` with zero horizontal overflow |
