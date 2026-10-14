---
type: Feature
title: "F9: Multi-Unit Converter Extension"
status: stable
description: "Authoritative product problem, rules, boundary invariants, scope, and survivability matrix for Multi-Unit Converter Extension."
tags: [feature, converter, units, length, mass, temperature, drawer, web-component, okf-v0.2]
sources:
  - resource: ../../project/vision.md
  - resource: ../../project/domain-rules.md
  - resource: ../../project/architecture.md
  - resource: ../../project/design.md
  - resource: ../f1-precision-arithmetic-engine/feature.md
  - resource: ../f2-accessible-ui-keyboard-nav/feature.md
---

# Feature: F9 - Multi-Unit Converter Extension

Authoritative product specification for the StayCalc multi-unit converter subsystem, supporting bidirectional conversions across Length, Mass, and Temperature categories, accessible drawer UI, reactive live conversion, buffer loading into active calculation state, custom event lifecycle notifications, and zero external runtime dependencies. Governed by `docs/context/project/`.

## 1. Problem, Actors & Outcome
- **Problem & Context**: Professional users, students, and engineers frequently need to transform physical quantities across metric and imperial measurement systems (length, mass, and temperature) in the middle of broader computational workflows. Forcing users to leave the calculator to look up conversion ratios or perform manual multiplier calculations breaks focus, introduces human calculation errors, and leads to precision drift from floating-point roundoff. Users require an integrated, collapsible unit converter extension embedded directly within StayCalc that performs real-time bidirectional conversions across Length (`cm`, `m`, `km`, `in`, `ft`), Mass (`g`, `kg`, `oz`, `lb`), and Temperature (`C`, `F`, `K`), enforces physical bounds (such as absolute zero), normalizes floating-point precision, seamlessly loads converted results directly into the calculator's active operand buffer without clearing pending operations or accumulator state, and adheres strictly to WCAG 2.2 accessibility standards and mobile zero-overflow constraints with zero external runtime dependencies.
- **Target Actors & Roles**:
  | Role / Persona | Surface | Arrival State / Prerequisite | Permissions & Access |
  | :--- | :--- | :--- | :--- |
  | `GeneralUser` | `<stay-calc>` Header & Drawer | Any calculation state | Open converter drawer, select categories/units, convert values, and load into buffer |
  | `EngineerUser` | `<stay-calc>` Converter Drawer | Needs physical conversions | Convert metric/imperial units with 12-digit precision normalization |
  | `KeyboardPowerUser` | `<stay-calc>` Interactive Controls | Keyboard focus | Tab to `#converterToggle`, open drawer, navigate select menus and input with keyboard |
  | `ScreenReaderUser` | Assistive Technology | Reading ARIA tree | Receive announcements of drawer state (`aria-expanded`, `aria-controls`), live conversion output (`aria-live="polite"`), and clear control labeling |
- **Checkable Success ("This Worked")**:
  1. Engine converter module provides pure mathematical unit conversions across three categories: Length (`cm`, `m`, `km`, `in`, `ft`), Mass (`g`, `kg`, `oz`, `lb`), and Temperature (`C`, `F`, `K`).
  2. Length conversions adhere to exact meter ratios: `cm: 0.01`, `m: 1.0`, `km: 1000.0`, `in: 0.0254`, `ft: 0.3048`.
  3. Mass conversions adhere to exact kilogram ratios: `g: 0.001`, `kg: 1.0`, `oz: 0.028349523125`, `lb: 0.45359237`.
  4. Temperature conversions apply standard thermodynamic linear formulas between Celsius, Fahrenheit, and Kelvin (`C <-> F`, `C <-> K`, `F <-> K`).
  5. Absolute zero check: if target or source in Kelvin is `< 0` (i.e. `C < -273.15`, `F < -459.67`, `K < 0`), conversion returns `error: "Invalid temperature"`.
  6. Non-numeric or empty string input yields formatted output `"-"` without crashing or throwing errors.
  7. Precision normalization eliminates IEEE-754 representation noise by clamping to a maximum of 12 significant decimal digits (`RULE-CALC-002`).
  8. Header contains `#converterToggle` button with accessible attributes: `aria-label="Toggle unit converter"`, `aria-expanded="false"`, `aria-controls="converterDrawer"`.
  9. Collapsible drawer `#converterDrawer` has `role="region"`, `aria-label="Unit Converter"`, is hidden by default (`display: none` or `hidden`), and expands when `#converterToggle` is clicked.
  10. Drawer contains Category select (`#converterCategory`), Source unit select (`#converterSourceUnit`), Target unit select (`#converterTargetUnit`), Numeric input (`#converterInput`), Output display (`#converterOutput`), and Load button (`#btnLoadConvertedValue`).
  11. Reactive live conversion updates `#converterOutput` immediately upon typing in `#converterInput` or changing dropdown selections, and dispatches a `unit-convert` CustomEvent (`SEAM-UI-01`).
  12. Clicking `#btnLoadConvertedValue` invokes `engine.loadBuffer(convertedValue)`, updates the calculator main display, clears error/lockout states, dispatches `calc-change` CustomEvent, and strictly preserves existing `accumulator` and `pendingOperator` (`NEVER-CALC-004`).
  13. Component verifies mobile zero-overflow (`scrollWidth <= clientWidth`) across 320px–390px viewports (`RULE-RESP-001`).
  14. Zero external runtime dependencies introduced (`"dependencies": {}`).
- **Checkable Failure ("This Is Broken")**: Conversions producing IEEE-754 float drift (e.g. `100 cm` displaying `0.9999999999999999 m`); temperature calculations allowing sub-absolute zero values; loading converted value wiping out pending operator or accumulator; drawer missing required ARIA roles or labels; horizontal scrollbars on mobile viewports.

## 2. Scope & Boundary Invariants
- **In This Revision**:
  - Type contracts in `src/engine/types.ts`: `UnitCategory`, `LengthUnit`, `MassUnit`, `TemperatureUnit`, `ConversionUnit`, `ConversionResult`, and `LOAD_BUFFER` action.
  - Pure converter engine in `src/engine/converter.ts` with ratios, temperature formulas, absolute zero validation, precision normalization, and dropdown option helpers.
  - Reducer handling for `LOAD_BUFFER` and facade method `loadBuffer(value: string)` in `src/engine/calculator-engine.ts`.
  - Custom element drawer UI, reactive event listeners, live display updates, and load action in `src/components/stay-calc.ts`.
  - CustomEvent `unit-convert` lifecycle notifications.
  - Comprehensive unit test suite in `test/converter.test.ts`.
- **Out of Scope / Non-Goals**:
  - Currency conversion rates (requires dynamic remote network queries; StayCalc operates 100% offline).
  - Fluid volume, speed, pressure, or area conversion units in this release.
  - Multi-step dimensional unit equations (e.g. converting `m/s` to `mph`).
  - Persistent storage of last selected converter unit in `localStorage` (defaults to clean initial length units).
- **Invariants & Domain Rules**:
  - **`RULE-CALC-002` (Precision Normalization)**: All floating-point conversion results must truncate IEEE-754 representation noise to a maximum of 12 significant decimal digits.
  - **`RULE-CALC-006` (Memory Register Persistence)**: Memory registers and calculation history tape must persist immutably when the converter drawer is toggled or values are converted.
  - **`NEVER-CALC-001` (Zero Dynamic Eval)**: Unit conversions and expression evaluations must execute via pure arithmetic functions without JavaScript `eval()` or `new Function()`.
  - **`NEVER-CALC-004` (No Calculation State Pollution from Auxiliary Converters)**: Loading a converted value into the active calculator buffer must set the current display and prepare the operand (`waitingForOperand = true`), but must never corrupt or wipe an existing in-flight `accumulator` or `pendingOperator`.
  - **`RULE-RESP-001` (Mobile Zero-Overflow 320px–390px)**: The converter drawer, dropdowns, input, and action buttons must remain strictly contained within container width (`scrollWidth <= clientWidth`) across 320px, 375px, and 390px viewports.
  - **`RULE-UI-002` (Polite Live Region & Accessible Controls)**: All interactive elements in the converter drawer must expose explicit accessible labels, semantic roles, and visible focus rings (`:focus-visible`), with `#converterOutput` configured as a polite live region (`aria-live="polite"`).

## 3. Seams & Contracts
- **`SEAM-ENGINE-01` (Engine Buffer Loading & State Preservation)**:
  - Reducer action `LOAD_BUFFER`:
    ```ts
    {
      type: 'LOAD_BUFFER';
      value: string;
    }
    ```
  - Reducer transitions state by setting `display: action.value`, `waitingForOperand: true`, `error: null`, `isLocked: false`, updating `multiRadix`, while strictly preserving `accumulator`, `pendingOperator`, `memory`, `history`, `mode`, `radix`, and `theme`.
  - Engine facade exposes:
    ```ts
    public loadBuffer(value: string): CalculatorState
    ```
- **`SEAM-UI-01` (CustomEvent Protocol)**:
  - Dispatches `CustomEvent<'unit-convert'>` on every conversion calculation:
    ```ts
    {
      detail: {
        category: UnitCategory;
        sourceUnit: string;
        targetUnit: string;
        inputValue: string | number;
        convertedValue: number;
        formatted: string;
      },
      bubbles: true,
      composed: true
    }
    ```
  - Dispatches `CustomEvent<'calc-change'>` when converted value is loaded into main calculator buffer via `#btnLoadConvertedValue`.

## 4. Survivability Matrix

| Failure Mode / Edge Condition | System Impact | Mitigation / System Guarantee |
| :--- | :--- | :--- |
| Temperature input below absolute zero (e.g. `-300 C` or `-500 F`) | Physically impossible thermodynamic state | Conversion intercepts bound and returns `error: "Invalid temperature"`; `#converterOutput` displays `"Invalid temperature"`; loading into buffer is blocked |
| Empty string or non-numeric characters typed in `#converterInput` | Unparseable numeric conversion | Guard returns `formatted: "-"` without throwing; calculator remains responsive |
| Converting between identical source and target units (`m` to `m`, `oz` to `oz`) | Redundant ratio calculation | Direct identity bypass returns normalized input value without rounding error |
| Loading converted value while calculator has pending operator (`50 + [load 10]`) | User performs multi-step calculation with converted quantity | `LOAD_BUFFER` preserves `accumulator: 50` and `pendingOperator: '+'`; pressing `=` yields `60` |
| Loading converted value while calculator is in error lockout state | Calculator display shows error message | `LOAD_BUFFER` clears `error: null` and `isLocked: false`, allowing seamless continuation |
| Rapid sequential typing in converter input | Multiple synchronous conversions | Pure synchronous functional pipeline computes result in `< 1ms` without race conditions |
| Mobile device with 320px screen width | Constrained drawer horizontal width | Container queries format select dropdowns and input to flex/wrap with zero horizontal overflow |
