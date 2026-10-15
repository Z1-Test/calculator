---
type: Feature
title: "Accessible UI and Keyboard Navigation"
status: stable
description: "Autonomous W3C Custom Element <stay-calc> with Declarative Shadow DOM slot projection, physical keyboard navigation, and WCAG 2.2 AA focus rings."
tags: [feature, ui, custom-elements, keyboard-navigation, okf-v0.2]
generated: { by: "process:implement", at: "2026-10-15T00:00:00Z" }
sources:
  - id: source-domain-rules
    resource: docs/context/project/domain-rules.md
    title: Domain Rules
  - id: source-design
    resource: docs/context/project/design.md
    title: Design System
  - id: source-architecture
    resource: docs/context/project/architecture.md
    title: System Architecture
---

# Feature: Accessible UI and Keyboard Navigation

Authoritative specification for the StayCalc `<stay-calc>` Autonomous W3C Custom Element, Declarative Shadow DOM (DSD) slot projection graph, tactile button keypad, physical keyboard navigation, and WCAG 2.2 AA compliant focus rings. Grounded in `docs/context/project/domain-rules.md`, `docs/context/project/design.md`, and `docs/context/project/architecture.md`.

## 1. Problem, Actors & Outcome
- **Problem & Context**: StayCalc requires an accessible, responsive, and native client-side presentation layer that connects user interactions (button clicks, physical keyboard typing, assistive touch) directly to `CalcEngine` without external framework runtime dependencies, while guaranteeing zero horizontal scroll overflow on mobile viewports (320px–390px) and WCAG 2.2 AA focus ring compliance.
- **Target Actors & Roles**:
  | Role / Persona | Surface | Arrival State / Prerequisite | Permissions & Access |
  | :--- | :--- | :--- | :--- |
  | `StandardUser` | Browser DOM (`<stay-calc>`) | Navigating page via mouse, touch, or keyboard | Full interaction with keypad, keyboard navigation, and clear triggers |
- **Checkable Success ("This Worked")**:
  - Autonomous W3C Custom Element `<stay-calc>` registers cleanly in `customElements` registry.
  - Open Shadow DOM renders interactive display (`<slot name="display">`), status indicator, and tactile 4-column keypad (`<slot name="keypad">`).
  - Physical keyboard typing (`0-9`, `.`, `+`, `-`, `*`, `/`, `Enter`, `=`, `Backspace`, `Escape`, `c`, `Delete`) updates display buffer synchronously.
  - Visible focus rings (`:focus-visible`) adhere to 2px solid primary color (`var(--calc-primary, #2563eb)`) with 2px offset meeting WCAG 2.2 AA contrast standards.
  - Mobile zero-overflow holds strictly (`scrollWidth <= clientWidth`) across 320px, 375px, and 390px viewports.
- **Checkable Failure ("This Is Broken")**:
  - Custom element fails to register or throws duplicate registration errors.
  - Display desynchronizes from `CalcEngine` internal buffer or accumulator state.
  - Modifier key combos (e.g., `Ctrl+C`, `Cmd+R`) are hijacked by the calculator instead of passing through to browser.
  - Keypad buttons clip or produce horizontal scrolling on mobile viewports.

## 2. Scope & Boundary Invariants
- **In This Revision**:
  - Autonomous W3C Custom Element `<stay-calc>` with Shadow DOM and slot projections (`display`, `keypad`).
  - Tactile button keypad mapping to `CalcEngine` actions (`0-9`, `.`, `+`, `-`, `*`, `/`, `=`, `C`, `AC`).
  - Physical keyboard typing listeners on `window` for `0-9`, `.`, `+`, `-`, `*`, `/`, `Enter`, `=`, `Backspace`, `Escape`, `c`, `Delete`.
  - Accessible `:focus-visible` focus rings and design token styling from `docs/context/project/design.md`.
  - Responsive mobile zero-overflow container bounds across 320px, 375px, and 390px viewports.
- **Refused / Owned Elsewhere**:
  - Memory registers (`M+`, `M-`, `MR`, `MC`) and memory badge persistence (owned by Memory Coordinator slice).
  - Calculation history drawer and local storage tape (owned by History Tape slice).
  - Scientific trigonometric functions and Programmer radix conversion modes.
- **Underlying Product Rules**:
  - `RULE-UI-001` (W3C Custom Element Architecture): `<stay-calc>` must be implemented as an autonomous Custom Element inheriting from `HTMLElement`, encapsulated within an open Shadow Root (`mode: 'open'`).
  - `RULE-UI-002` (Slot Projection Graph): The component must support Declarative Shadow DOM slot projection with named slots `<slot name="display">` and `<slot name="keypad">`, falling back to default interactive elements when slots are unpopulated.
  - `RULE-UI-003` (Keyboard Navigation Mapping): Keyboard listeners must map physical keys:
    - Digits: `'0'` through `'9'` $\to$ `engine.inputDigit()`
    - Decimal: `'.'` $\to$ `engine.inputDecimal()`
    - Operators: `'+'`, `'-'`, `'*'`, `'/'` $\to$ `engine.inputOperator()`
    - Evaluation: `'Enter'` or `'='` $\to$ `engine.calculate()`
    - Clear: `'Escape'` or `'c'` / `'C'` $\to$ `engine.clear()`
    - All Clear / Delete: `'Delete'` $\to$ `engine.allClear()`
    - Backspace: `'Backspace'` $\to$ backspace active buffer or clear to `'0'`
  - `RULE-UI-004` (Keyboard Modifier Passthrough): Keydown events with `event.ctrlKey`, `event.metaKey`, or `event.altKey` must be ignored to preserve native browser shortcuts (e.g., `Ctrl+C`, `Cmd+R`).
  - `RULE-UI-005` (WCAG 2.2 AA Focus Rings): All interactive buttons and inputs must declare visible `:focus-visible` outline rings with at least 2px width, 2px offset, and 3:1 contrast ratio against adjacent surfaces.
  - `RULE-UI-006` (Mobile Viewport Zero-Overflow): The custom element host and inner containers must enforce `scrollWidth <= clientWidth` on 320px, 375px, and 390px viewports without horizontal scrollbars.
  - `RULE-CALC-001`: Division by zero yields sanitized user-facing `"Cannot divide by zero"` error with locked input until cleared.
  - `RULE-CALC-002`: Decimal precision normalized up to 10 decimal digits eliminating IEEE-754 noise.
  - `RULE-CALC-007`: Consecutive operator entry replaces pending operator without intermediate evaluation.
  - `RULE-CALC-008`: Clear entry (`C`) resets buffer to `"0"` and unlocks error, while All Clear (`AC`) resets all registers.
- **What Must Never Happen**:
  - `NEVER-UI-001`: Never introduce external runtime UI frameworks (React, Vue, Svelte, Lit) or CSS-in-JS libraries.
  - `NEVER-UI-002`: Never use `!important` in component stylesheets or break mobile 320px container bounds.
  - `NEVER-CALC-001`: Never evaluate mathematical expressions using JavaScript `eval()` or `new Function()`.
  - `NEVER-CALC-004`: Never allow arithmetic mutations while engine is in an error-locked state without prior `C` or `AC`.

## 3. Object Lifecycle, Survivability & Storage Architecture
- **Lifecycle Phases**:
  - `constructor()`: Initializes open Shadow DOM, attaches template markup, instantiates `CalcEngine`.
  - `connectedCallback()`: Binds click event delegation on keypad slot and registers global window `keydown` listener.
  - `disconnectedCallback()`: Unbinds global window `keydown` listener to prevent memory leaks.
- **Storage Tier**: In-memory instance state (`CalcEngine` state: buffer, accumulator, pending operator, locked state).

## 4. System Contracts & Seams
- **`SEAM-CALC-01` (Keypad/Keyboard $\to$ `CalcEngine`)**:
  - Keypad button click or physical keydown triggers corresponding `CalcEngine` method call.
- **`SEAM-CALC-02` (`CalcEngine` $\to$ `<stay-calc>` Display Slot)**:
  - Display value is updated synchronously to match `engine.getDisplay()` after each state change.
