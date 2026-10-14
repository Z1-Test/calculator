---
type: Feature
title: "F5: Scientific Mode Toggle and Functions"
status: stable
description: "Authoritative product problem, rules, boundary invariants, scope, and survivability matrix for Scientific Mode Toggle and Trigonometric/Exponential Functions."
tags: [feature, scientific, trigonometry, powers, mode-toggle, web-component, okf-v0.2]
sources:
  - resource: ../../project/vision.md
  - resource: ../../project/domain-rules.md
  - resource: ../../project/architecture.md
  - resource: ../../project/design.md
  - resource: ../f1-precision-arithmetic-engine/feature.md
  - resource: ../f2-accessible-ui-keyboard-nav/feature.md
  - resource: ../f3-memory-registers/feature.md
  - resource: ../f4-calculation-history-tape/feature.md
---

# Feature: F5 - Scientific Mode Toggle and Functions

Authoritative product specification for the StayCalc scientific calculation subsystem, mode switching, angle unit toggling (DEG/RAD), mathematical constants, and precision trigonometric/exponential functions. Governed by `docs/context/project/`.

## 1. Problem, Actors & Outcome
- **Problem & Context**: Standard four-function desktop calculators are insufficient for STEM professionals, engineers, students, and financial analysts who require advanced scientific operations including square root, squaring, exponentiation/powers, mathematical constants ($\pi$ and $e$), and trigonometric functions ($\sin$, $\cos$, $\tan$). Switching between standard and scientific modes must be instantaneous, accessible, and seamless: active calculations, intermediate accumulators, memory registers, and calculation history must never be reset or corrupted when switching modes (`RULE-CALC-006`). Furthermore, angle mode semantics (degrees vs. radians) must be transparently indicated and faithfully evaluated, and mathematical edge cases (such as $\tan(90^\circ)$, $\sqrt{-n}$, or division by zero) must enter protected, locked error states without throwing JavaScript runtime exceptions.
- **Target Actors & Roles**:
  | Role / Persona | Surface | Arrival State / Prerequisite | Permissions & Access |
  | :--- | :--- | :--- | :--- |
  | `GeneralUser` | `<stay-calc>` Host | Pointer or touchscreen interaction | Toggle mode, toggle angle unit, execute scientific functions |
  | `KeyboardPowerUser` | `<stay-calc>` Host | Physical keyboard navigation | Use keyboard hotkeys (including `^`), Tab focus scientific keys |
  | `ScreenReaderUser` | `<stay-calc>` ARIA Live Region | Assistive technology active | Receive polite ARIA announcements, mode change alerts, angle unit badge |
- **Checkable Success ("This Worked")**:
  1. Activating `#modeToggle` switches `CalculatorState.mode` between `"standard"` and `"scientific"`, updating the UI layout and toggling `#scientificKeys` visibility without resetting in-progress computations or memory (`RULE-CALC-006`).
  2. Activating `#angleUnitToggle` switches `CalculatorState.angleUnit` between `"DEG"` and `"RAD"`, updating `#angleUnitIndicator` to match.
  3. Unary square root (`√`) evaluates non-negative numbers accurately and triggers locked error state `"Invalid input"` for negative values (`RULE-CALC-001`).
  4. Unary square (`x²`) computes $x^2$ accurately with 10-digit precision normalization (`RULE-CALC-002`).
  5. Binary power (`xʸ` / `^`) evaluates $x^y$, correctly handling operator replacement, zero bases, and non-integer powers of negative numbers.
  6. Mathematical constants $\pi$ (`3.141592654`) and $e$ (`2.718281828`) can be loaded directly into the active input buffer (`waitingForOperand = true`).
  7. Trigonometric functions ($\sin$, $\cos$, $\tan$) evaluate according to the active `angleUnit`: in `"DEG"` mode, cardinal angles evaluate with exact precision ($\sin(0^\circ) = 0$, $\sin(90^\circ) = 1$, $\cos(90^\circ) = 0$, $\tan(45^\circ) = 1$; $\tan(90^\circ) \to$ `"Invalid input"`). In `"RAD"` mode, values are evaluated with IEEE-754 noise suppression ($< 10^{-15} \to 0$).
  8. CustomEvents `calc-change` and `mode-change` are dispatched upon state transitions (`SEAM-UI-01`).
- **Checkable Failure ("This Is Broken")**: Memory, history, or accumulator lost when switching modes; $\cos(90^\circ)$ displays float noise like `6.12e-17` instead of `0`; $\tan(90^\circ)$ returns `Infinity` instead of `"Invalid input"`; square root of negative number produces `NaN`; horizontal scrollbar appears on 320px–390px mobile viewports.

## 2. Scope & Boundary Invariants
- **In This Revision**:
  - `AngleUnit` contract: `"DEG" | "RAD"`.
  - `CalculatorMode` contract: `"standard" | "scientific"`.
  - Actions: `SQUARE_ROOT`, `SQUARE`, `SIN`, `COS`, `TAN`, `LOAD_CONSTANT`, `TOGGLE_ANGLE_UNIT`, `TOGGLE_MODE`.
  - Operator union extension: `'+' | '-' | '*' | '/' | '^'`.
  - State extension: `mode: CalculatorMode`, `angleUnit: AngleUnit`.
  - Mode toggle button (`#modeToggle`) with accessible `aria-label`.
  - Angle unit toggle button (`#angleUnitToggle`) and visual badge (`#angleUnitIndicator`).
  - Scientific keys section (`#scientificKeys`) containing 8 dedicated buttons: `√`, `x²`, `xʸ`, `π`, `e`, `sin`, `cos`, `tan`.
  - Precision engine trigonometric normalization and cardinal angle exactness.
  - Responsive layout ensuring zero horizontal overflow on 320px–390px viewports (`RULE-RESP-001`).
  - Event dispatching: `calc-change` and `mode-change`.
- **Refused / Owned Elsewhere**:
  - Complex numbers / imaginary roots (e.g. $\sqrt{-1} = i$).
  - Inverse trigonometric functions ($\arcsin$, $\arccos$, $\arctan$) or hyperbolic functions.
  - Base-N radix conversion / Programmer mode (F6).
  - Graphing / canvas equation plotting.
- **Underlying Product Rules (Screen-Agnostic Truths)**:
  - `RULE-CALC-001` (Zero Division & Error Safeguard): Division by zero or invalid operations (such as $\sqrt{-n}$ or $\tan(90^\circ)$) immediately enter protected error state (`"Cannot divide by zero"` or `"Invalid input"`), setting `isLocked = true`.
  - `RULE-CALC-002` (Precision Normalization): All floating-point operations in Standard and Scientific modes must truncate IEEE-754 representation noise to a maximum of 10-12 significant decimal digits.
  - `RULE-CALC-003` (Trigonometric Angle Mode): Scientific trigonometric functions (`sin`, `cos`, `tan`) must respect the active angle unit mode (`DEG` by default, togglable to `RAD`).
  - `RULE-CALC-006` (Memory Register & State Persistence Across Modes): Memory register, calculation history tape, accumulator, and display buffer must persist across mode switches (`standard` <-> `scientific`).
  - `RULE-CALC-008` (Operator Replacement & History Integrity): Operator replacement applies to power operator `^`, and successful scientific calculations record to history tape.
  - `RULE-RESP-001` (Responsive Viewport Layout): Scientific UI components strictly obey CSS container queries (`@container calc-host`) and CSS logical properties with zero horizontal scroll overflow (`scrollWidth <= clientWidth`) across 320px–390px mobile viewports.
- **What Must Never Happen**:
  - `NEVER-CALC-001` (No Dynamic Eval): Never evaluate mathematical expressions using JavaScript `eval()` or `new Function()`.
  - `NEVER-CALC-004` (No Unhandled NaN/Infinity): Calculator engine must never leak unhandled `NaN`, `Infinity`, or `-Infinity` into display or state.

## 3. Object Lifecycle, Survivability & Storage Architecture
- **Dual-Tier Draft Storage**:
  - **Tier 1 (Client In-Memory Engine State)**: `CalculatorState.mode` (`CalculatorMode`), `CalculatorState.angleUnit` (`AngleUnit`).
  - **Tier 2 (Component DOM Projection)**: Shadow DOM elements (`#modeToggle`, `#angleUnitToggle`, `#angleUnitIndicator`, `#scientificKeys`).
- **SLA & Latency Ceilings**:
  - Scientific arithmetic and trigonometric evaluations: synchronous deterministic execution `<= 1ms`.
  - Mode switch layout transition and key re-render: `<= 16ms` (60fps feedback).

| Entity / Object | Identity Model | State (Draft vs Committed) | Survives Refresh? | Survives App Kill? | Survives Mode Switch? | Survives Clear (C)? | Survives All Clear (AC)? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `mode` | Engine State Property | Committed | No | No | N/A (Toggled) | Yes | Yes |
| `angleUnit` | Engine State Property | Committed | No | No | Yes | Yes | Yes |
| `memory` Register | Numeric Engine State | Committed | No | No | Yes (`RULE-CALC-006`) | Yes | No |
| `history` Tape | History Entry Array | Committed | No | No | Yes (`RULE-CALC-006`) | Yes | Yes |
| `accumulator` / `buffer` | Engine Arithmetic State | Committed / Draft | No | No | Yes (`RULE-CALC-006`) | C resets buffer | AC resets all |
| `#scientificKeys` | Shadow DOM Container | UI Visible / Hidden | No | No | Yes (Reflects mode) | Yes | Yes |

## 4. Notifications, Auditing & Reporting
- **Mode Toggle Accessibility**: `#modeToggle` dynamically exposes `aria-label="Switch to scientific mode"` or `"Switch to standard mode"`.
- **Angle Unit Accessibility**: `#angleUnitToggle` exposes current and target unit in `aria-label`, complemented by `#angleUnitIndicator` badge.
- **Scientific Keys Accessibility**: Every scientific button features descriptive ARIA labels (`aria-label="Square Root"`, `aria-label="Sine"`, `aria-label="Pi"`, etc.).
- **CustomEvent Dispatch**: State changes dispatch `calc-change` (`detail: CalculatorState`) and `mode-change` (`detail: { mode, angleUnit }`).

## 5. Cross-Feature Seams (`SEAM-*`)
Seam contracts live in this file — do **not** author a separate `contract.md` in the slice.

| Seam ID | Source Slice | Destination Slice | Arrival Payload | Handoff Payload | Failure Owner | Related RULE / NEVER |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `SEAM-ENGINE-01` | F5 UI (`<stay-calc>`) | F1 Engine | `CalculatorAction` (Scientific Actions) | `CalculatorState` (`mode`, `angleUnit`) | destination | `RULE-CALC-001`, `RULE-CALC-002`, `RULE-CALC-003`, `RULE-CALC-006` |
| `SEAM-UI-01` | F5 UI (`<stay-calc>`) | Host App / Consumers | Custom Events `calc-change`, `mode-change` | `{ detail: CalculatorState }` | source | `RULE-RESP-001`, `NEVER-CALC-004` |

## 6. References
- [User Flow](./flow.md)
- [Test Cases](./cases.md)
