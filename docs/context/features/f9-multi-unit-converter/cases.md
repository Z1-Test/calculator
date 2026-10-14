---
type: Test Cases
title: "Multi-Unit Converter Extension Test Cases"
status: stable
description: "Unified test scenarios CASE-01 to CASE-11, 12-stall matrix, traceability chain, and N/A declarations for Multi-Unit Converter Extension."
tags: [cases, test-cases, converter, units, length, mass, temperature, precision, okf-v0.2]
sources:
  - resource: ./feature.md
  - resource: ./flow.md
---

# Test Cases: Multi-Unit Converter Extension

Authoritative test scenarios for the StayCalc multi-unit converter subsystem, supporting bidirectional conversions across Length, Mass, and Temperature categories, drawer UI, precision normalization, buffer loading into calculation state, and custom event lifecycle notifications. Grounded in `docs/context/project/domain-rules.md`, Feature rules (`RULE-*` / `NEVER-*`), and Flow decisions.

---

## 1. Universal Scenarios (11 Standard Types)

### `CASE-01`: Happy Path Nominal Execution (Bidirectional Length Conversions: cm, m, km, in, ft)
- **Actor**: `GeneralUser` / `EngineerUser`
- **Preconditions**: Converter engine initialized with length category.
- **Action Sequence / Input**:
  - Convert `100` from `cm` to `m`.
  - Convert `1` from `km` to `m`.
  - Convert `1` from `in` to `cm`.
  - Convert `1` from `ft` to `in`.
  - Convert `5280` from `ft` to `km`.
- **Expected Outcome**:
  - `100 cm` yields `1 m`.
  - `1 km` yields `1000 m`.
  - `1 in` yields `2.54 cm`.
  - `1 ft` yields `12 in`.
  - Results format cleanly without trailing float noise.
- **Enforces**: `RULE-CALC-002`, `SEAM-ENGINE-01`

### `CASE-02`: Empty State & First Use (Clean Initial Drawer Mount: Hidden by Default, Accessible Attributes, Clean Default Output "-")
- **Actor**: `GeneralUser` / `FirstTimeVisitor`
- **Preconditions**: `<stay-calc>` component mounted.
- **Action Sequence / Input**:
  - Inspect `#converterToggle` button in shadow DOM.
  - Inspect `#converterDrawer` visibility and ARIA attributes.
  - Inspect initial category, source unit, target unit, and output display.
- **Expected Outcome**:
  - `#converterToggle` has `aria-label="Toggle unit converter"`, `aria-expanded="false"`, `aria-controls="converterDrawer"`.
  - `#converterDrawer` has `role="region"`, `aria-label="Unit Converter"`, `aria-hidden="true"`, and is hidden (`display: none`).
  - Drawer options default cleanly (e.g. Category `length`, Source `cm`, Target `m`).
  - Output display `#converterOutput` displays `"-"` when input is empty.
- **Enforces**: `RULE-UI-002`, `SEAM-UI-01`

### `CASE-03`: Error State & Absolute Zero Lockout (Thermodynamic Boundary: Sub-Absolute Zero Yields "Invalid temperature")
- **Actor**: `EngineerUser`
- **Preconditions**: Category set to `temperature`.
- **Action Sequence / Input**:
  - Convert `-300` from `C` to `F` (below `-273.15 C`).
  - Convert `-500` from `F` to `C` (below `-459.67 F`).
  - Convert `-1` from `K` to `C` (below `0 K`).
  - Attempt to click `#btnLoadConvertedValue` while in error state.
- **Expected Outcome**:
  - Conversion returns `error: "Invalid temperature"` and `formatted: "Invalid temperature"`.
  - Output display presents `"Invalid temperature"`.
  - Attempting to load buffer ignores or blocks action, preventing NaN or invalid states in calculator.
- **Enforces**: `RULE-CALC-002`, `RULE-UI-002`

### `CASE-04`: Mid-Flow Operator Replacement & State Preservation (Loading Converted Value Into Active Calculation Preserves Accumulator & Operator)
- **Actor**: `GeneralUser`
- **Preconditions**: Calculator in standard mode with in-flight operation.
- **Action Sequence / Input**:
  - Enter `50 + ` into calculator (`accumulator = 50`, `pendingOperator = '+'`).
  - Open converter drawer, convert `100 cm` to `m` (result: `1`).
  - Click `#btnLoadConvertedValue`.
  - Verify calculator display shows `"1"`.
  - Press `=`.
- **Expected Outcome**:
  - Calculator display evaluates `50 + 1 = 51`.
  - Accumulator `50` and operator `'+'` were strictly preserved across drawer interaction and buffer loading (`NEVER-CALC-004`).
- **Enforces**: `NEVER-CALC-004`, `RULE-CALC-006`, `SEAM-ENGINE-01`

### `CASE-05`: Idempotency & Repeated Operations (Same-Unit Identity Conversions and Repeated Re-evaluation Without Float Drift)
- **Actor**: `GeneralUser`
- **Preconditions**: Engine converter module loaded.
- **Action Sequence / Input**:
  - Convert `42.5` from `m` to `m`.
  - Convert `16` from `oz` to `oz`.
  - Convert `100` from `C` to `C`.
  - Execute conversion 100 times in a tight loop.
- **Expected Outcome**:
  - Identity conversions return exact input value (`42.5`, `16`, `100`) without modification or rounding loss.
  - Consecutive repeated evaluations are strictly idempotent and produce zero memory leaks or drift.
- **Enforces**: `RULE-CALC-002`, `NEVER-CALC-001`, `SEAM-ENGINE-01`

### `CASE-06`: Precision Normalization (Truncates IEEE-754 Representation Noise to Max 12 Significant Digits)
- **Actor**: `EngineerUser`
- **Preconditions**: Converter engine loaded.
- **Action Sequence / Input**:
  - Convert `1` from `oz` to `g` (1 oz = 28.349523125 g).
  - Convert `1` from `lb` to `kg` (1 lb = 0.45359237 kg).
  - Convert `1` from `in` to `m` (1 in = 0.0254 m).
  - Convert `3` from `in` to `ft` (3 in = 0.25 ft).
- **Expected Outcome**:
  - Results truncate floating point representation noise (`RULE-CALC-002`).
  - Formatted strings contain clean numbers without values like `0.025400000000000002`.
- **Enforces**: `RULE-CALC-002`

### `CASE-07`: Mass Conversions Across Metric and Imperial Units (g, kg, oz, lb Bidirectional Precision Ratios)
- **Actor**: `GeneralUser`
- **Preconditions**: Category set to `mass`.
- **Action Sequence / Input**:
  - Convert `1` from `kg` to `g`.
  - Convert `1000` from `g` to `kg`.
  - Convert `16` from `oz` to `lb`.
  - Convert `1` from `lb` to `oz`.
  - Convert `1` from `lb` to `g`.
- **Expected Outcome**:
  - `1 kg = 1000 g`.
  - `1000 g = 1 kg`.
  - `16 oz = 1 lb`.
  - `1 lb = 16 oz`.
  - `1 lb = 453.59237 g`.
- **Enforces**: `RULE-CALC-002`, `SEAM-ENGINE-01`

### `CASE-08`: Temperature Scale Conversions Across C, F, K (Thermodynamic Conversions: C <-> F, C <-> K, F <-> K)
- **Actor**: `EngineerUser`
- **Preconditions**: Category set to `temperature`.
- **Action Sequence / Input**:
  - Convert `0` from `C` to `F` (freezing point: `32 F`).
  - Convert `100` from `C` to `F` (boiling point: `212 F`).
  - Convert `32` from `F` to `C` (freezing point: `0 C`).
  - Convert `212` from `F` to `C` (boiling point: `100 C`).
  - Convert `0` from `C` to `K` (`273.15 K`).
  - Convert `373.15` from `K` to `C` (`100 C`).
  - Convert `98.6` from `F` to `C` (`37 C`).
- **Expected Outcome**:
  - Exact cardinal thermodynamic temperatures match standard physics definitions.
  - All conversions produce verified mathematical outputs with precision normalization.
- **Enforces**: `RULE-CALC-002`, `SEAM-ENGINE-01`

### `CASE-09`: Clear & Reset Semantics (Calculator C / AC Resets Registers But Preserves Converter Drawer State and Selections)
- **Actor**: `GeneralUser`
- **Preconditions**: Converter drawer is open with user input `100` and selections `mass: kg -> g`.
- **Action Sequence / Input**:
  - Press calculator `C` (Clear buffer).
  - Press calculator `AC` (All Clear).
  - Check converter drawer visibility, input value, unit selections, and output display.
- **Expected Outcome**:
  - Calculator registers reset to initial state.
  - Converter drawer remains open, `#converterCategory` remains `mass`, `#converterInput` remains `100`, `#converterOutput` remains `1000`.
- **Enforces**: `RULE-CALC-006`, `NEVER-CALC-004`

### `CASE-10`: Buffer Loading Integration (#btnLoadConvertedValue / loadBuffer Updates Display, MultiRadix, Clears Error, Dispatches calc-change)
- **Actor**: `GeneralUser`
- **Preconditions**: `<stay-calc>` mounted.
- **Action Sequence / Input**:
  - Open drawer, convert `50` from `in` to `cm` (result: `127`).
  - Click `#btnLoadConvertedValue`.
  - Inspect calculator display text, `engine.getState().display`, and `waitingForOperand`.
  - In programmer mode, verify `multiRadix` is updated to represent the loaded integer.
  - If calculator was previously in an error state (`Cannot divide by zero`), verify error is cleared and calculator is unlocked.
- **Expected Outcome**:
  - Main display displays `"127"`.
  - State has `display: "127"`, `waitingForOperand: true`, `error: null`, `isLocked: false`.
  - Event `calc-change` is dispatched with detail.
- **Enforces**: `SEAM-ENGINE-01`, `SEAM-UI-01`, `NEVER-CALC-004`

### `CASE-11`: Component UI, Toggle Interaction, Accessibility & Mobile Zero-Overflow (#converterToggle, #converterDrawer, unit-convert Event, 320px–390px Viewports)
- **Actor**: `KeyboardPowerUser` / `ScreenReaderUser`
- **Preconditions**: `<stay-calc>` mounted.
- **Action Sequence / Input**:
  - Query `#converterToggle` in shadow DOM and verify ARIA attributes.
  - Click `#converterToggle` to open drawer; verify `aria-expanded="true"`, drawer `style.display !== 'none'`.
  - Listen for `unit-convert` CustomEvent on component host; trigger input change in `#converterInput`.
  - Click `#converterToggle` again to close drawer; verify `aria-expanded="false"`, drawer hidden.
  - Inspect component container queries and styles across 320px, 375px, and 390px viewports.
- **Expected Outcome**:
  - `#converterToggle` and drawer controls are fully accessible and keyboard-operable.
  - `unit-convert` CustomEvent bubbles and is composed, containing `{ category, sourceUnit, targetUnit, inputValue, convertedValue, formatted }`.
  - Mobile layout exhibits zero horizontal scroll overflow (`scrollWidth <= clientWidth`).
- **Enforces**: `RULE-RESP-001`, `RULE-UI-002`, `SEAM-UI-01`

---

## 2. Lived-System Stall Matrix (12 Canonical Stalls)

| Stall # & Name | Trigger Condition | Visible System Response | Recovery Action | Target Test File |
| :--- | :--- | :--- | :--- | :--- |
| **1. Empty or zero match** | Empty input in `#converterInput` | Output displays `"-"` | User enters numeric digit | `test/converter.test.ts` |
| **2. Stuck or slow wait** | Rapid sequential input keystrokes | Synchronous recalculation (`< 1ms`) | Instant execution | `test/converter.test.ts` |
| **3. Bad or incomplete input** | Non-numeric characters or stray punctuation (`"abc"`, `"--"`) | Output displays `"-"` gracefully | Guard discards non-numeric value | `test/converter.test.ts` |
| **4. Hard failure or outage** | Below absolute zero temperature (`-300 C`) | Output displays `"Invalid temperature"` | Error flag returned; buffer load blocked | `test/converter.test.ts` |
| **5. Double-tap or race** | Rapid repeated clicks on `#converterToggle` or `#btnLoadConvertedValue` | Synchronous deterministic state transitions | Safe synchronous dispatch | `test/converter.test.ts` |
| **6. Two concurrent sessions** | Multiple `<stay-calc>` elements on same page | Isolated shadow DOM instances and engine states | Fully encapsulated component state | `test/converter.test.ts` |
| **7. Partial success** | Converted value loaded into buffer mid-expression (`10 + [load 5]`) | Display updated to 5, pending operator `+` preserved (`NEVER-CALC-004`) | User presses `=` to finish calculation | `test/converter.test.ts` |
| **8. Leave and return** | User closes and reopens converter drawer | Selections and input preserved in active component | User resumes conversion seamlessly | `test/converter.test.ts` |
| **9. Offline** | Complete offline execution | 100% client-side pure mathematical ratios | Full offline support | `test/converter.test.ts` |
| **10. Stale seam arrival** | Invalid category string passed to engine function | Safe fallback or typed guard error | Type-safe union checks | `test/converter.test.ts` |
| **11. UI desync** | Output text out of sync with input field | Live event listener (`input`, `change`) triggers instant re-evaluation | Pure reactive binding | `test/converter.test.ts` |
| **12. Auth halfway** | N/A (Guest-safe client utility) | Unrestricted local utility | N/A | `test/converter.test.ts` |

---

## 3. Traceability Chain

| Rule / Invariant ID | Flow Decision | Seam ID | Case ID | Test Category | Target Test File |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `RULE-CALC-002` | `DEC-CONV-02` | `SEAM-ENGINE-01` | `CASE-01` | Length Conversion | `test/converter.test.ts` |
| `RULE-UI-002` | `DEC-CONV-04` | `SEAM-UI-01` | `CASE-02` | Initial Mount & Drawer Attributes | `test/converter.test.ts` |
| `RULE-CALC-002` | `DEC-CONV-02` | `SEAM-ENGINE-01` | `CASE-03` | Absolute Zero Validation | `test/converter.test.ts` |
| `NEVER-CALC-004` | `DEC-CONV-03` | `SEAM-ENGINE-01` | `CASE-04` | Mid-Flow Calculation Preservation | `test/converter.test.ts` |
| `NEVER-CALC-001` | `DEC-CONV-02` | `SEAM-ENGINE-01` | `CASE-05` | Identity & Idempotency | `test/converter.test.ts` |
| `RULE-CALC-002` | `DEC-CONV-02` | `SEAM-ENGINE-01` | `CASE-06` | Precision Normalization | `test/converter.test.ts` |
| `RULE-CALC-002` | `DEC-CONV-02` | `SEAM-ENGINE-01` | `CASE-07` | Mass Conversion | `test/converter.test.ts` |
| `RULE-CALC-002` | `DEC-CONV-02` | `SEAM-ENGINE-01` | `CASE-08` | Temperature Conversion | `test/converter.test.ts` |
| `RULE-CALC-006` | `DEC-CONV-04` | `SEAM-ENGINE-01` | `CASE-09` | Clear & Reset Semantics | `test/converter.test.ts` |
| `NEVER-CALC-004` | `DEC-CONV-03` | `SEAM-UI-01` | `CASE-10` | Buffer Loading Integration | `test/converter.test.ts` |
| `RULE-RESP-001` | `DEC-CONV-04` | `SEAM-UI-01` | `CASE-11` | Header UI, A11y & Mobile | `test/converter.test.ts` |

---

## 4. Cases N/A Declarations

- **Network Latency & Timeout (`CASE-06` in macro catalog)**: N/A (Unit conversions are 100% client-side and execute synchronously without network dependencies).
- **Tenant Auth & Permissions (`CASE-03` in macro catalog)**: N/A (StayCalc is an autonomous client calculator with zero backend authentication constraints).

---

## 5. References
- [Feature Specification](./feature.md)
- [User Flow & Decision Trees](./flow.md)
