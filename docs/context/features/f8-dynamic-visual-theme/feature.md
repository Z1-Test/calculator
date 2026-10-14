---
type: Feature
title: "F8: Dynamic Visual Theme Switcher"
status: stable
description: "Authoritative product problem, rules, boundary invariants, scope, and survivability matrix for Dynamic Visual Theme Switcher."
tags: [feature, theme, styling, tokens, dark-mode, high-contrast, wcag-aaa, web-component, okf-v0.2]
sources:
  - resource: ../../project/vision.md
  - resource: ../../project/domain-rules.md
  - resource: ../../project/architecture.md
  - resource: ../../project/design.md
  - resource: ../f1-precision-arithmetic-engine/feature.md
  - resource: ../f2-accessible-ui-keyboard-nav/feature.md
---

# Feature: F8 - Dynamic Visual Theme Switcher

Authoritative product specification for the StayCalc dynamic visual theme subsystem, supporting Dark (default), Light, and High-Contrast modes with semantic design tokens, WCAG 2.2 AAA contrast compliance, localStorage persistence, header theme switcher button, and custom event lifecycle notifications. Governed by `docs/context/project/`.

## 1. Problem, Actors & Outcome
- **Problem & Context**: Users operate calculators across wildly diverse lighting environments, varying monitor displays, and differing physiological visual needs. A single static light or dark palette creates severe eye strain in dim environments, poor readability in bright sunlight, and complete illegibility for low-vision users requiring maximum contrast. Furthermore, switching visual themes in poorly architected applications frequently causes layout reflows, display resets, or loss of in-flight calculations. Users require a dynamic, instant theme switcher that cycles between Dark (default), Light, and High-Contrast modes, preserves all active calculations, registers, and history, persists user preference across browser restarts via `localStorage`, meets WCAG 2.2 AAA accessibility criteria in High-Contrast mode, and operates with zero external runtime dependencies.
- **Target Actors & Roles**:
  | Role / Persona | Surface | Arrival State / Prerequisite | Permissions & Access |
  | :--- | :--- | :--- | :--- |
  | `GeneralUser` | `<stay-calc>` Header | Any calculation state | Switch theme between Dark, Light, and High-Contrast |
  | `LowVisionUser` | `<stay-calc>` Host | Needs high contrast | Activate High-Contrast mode (21:1 text contrast, 2px solid white borders) |
  | `KeyboardPowerUser` | `<stay-calc>` Header Controls | Keyboard focus | Tab to `#themeToggle`, press Enter/Space to cycle theme |
  | `ScreenReaderUser` | Assistive Technology | Reading ARIA tree | Receive dynamic, descriptive theme status updates via `#themeToggle[aria-label]` |
- **Checkable Success ("This Worked")**:
  1. Engine and component support three distinct visual themes: `'dark'` (default), `'light'`, and `'high-contrast'`.
  2. Nine standard design tokens are declared on the host element: `--calc-bg`, `--calc-surface`, `--calc-text`, `--calc-btn-bg`, `--calc-btn-text`, `--calc-btn-op-bg`, `--calc-accent-bg`, `--calc-border`, and `--calc-focus-ring`.
  3. Token selectors strictly adhere to: `:host` (dark default), `:host([data-theme="light"])`, and `:host([data-theme="high-contrast"])`.
  4. Stylesheets contain strictly ZERO `!important` declarations.
  5. High-Contrast mode satisfies WCAG 2.2 AAA with pure black backgrounds (`#000000`), pure white text (`#ffffff`, yielding 21:1 contrast ratio), and prominent 2px solid `#ffffff` borders across all interactive buttons and containers.
  6. Header contains `#themeToggle` button with accessible dynamic `aria-label` (e.g., `"Switch visual theme, current theme: dark"`) and `aria-haspopup="false"`.
  7. Theme switcher cycles deterministically in sequence: `dark` -> `light` -> `high-contrast` -> `dark`.
  8. Selected theme is persisted in `localStorage` under key `'staycalc_theme'`.
  9. Stored theme is automatically read and applied on component mount (`connectedCallback`).
  10. Switching themes preserves accumulator, pending operator, memory register, calculation history, active buffer, mode, and angle unit without data loss (`NEVER-CALC-002`).
  11. Switching themes dispatches a `theme-change` CustomEvent with `{ theme, previousTheme }` (`SEAM-UI-01`).
  12. Component verifies mobile zero-overflow (`scrollWidth <= clientWidth`) across 320px–390px viewports (`RULE-RESP-001`).
  13. Strictly zero external runtime dependencies are introduced (`"dependencies": {}`).
- **Checkable Failure ("This Is Broken")**: Active calculation buffer or memory cleared on theme switch; High-Contrast mode lacking 2px white borders or failing 21:1 contrast; `!important` declared anywhere in component styles; `#themeToggle` button lacking `aria-haspopup="false"`; `localStorage` exceptions crashing the component; horizontal scrollbars on mobile viewports.

## 2. Scope & Boundary Invariants
- **In This Revision**:
  - `CalculatorTheme` union contract: `'dark' | 'light' | 'high-contrast'`.
  - Actions `SET_THEME` and `CYCLE_THEME` in `CalculatorAction` and `calculatorReducer`.
  - `CalculatorState` extended with `readonly theme: CalculatorTheme`.
  - Facade methods on `CalculatorEngine`: `getTheme()`, `setTheme(theme: CalculatorTheme)`, `cycleTheme()`.
  - Design tokens on `<stay-calc>`: `--calc-bg`, `--calc-surface`, `--calc-text`, `--calc-btn-bg`, `--calc-btn-text`, `--calc-btn-op-bg`, `--calc-accent-bg`, `--calc-border`, `--calc-focus-ring`.
  - Token selectors: `:host` (dark default), `:host([data-theme="light"])`, `:host([data-theme="high-contrast"])`.
  - Header button `#themeToggle` with `aria-haspopup="false"` and dynamic `aria-label`.
  - `localStorage` persistence under `'staycalc_theme'` with safe exception handling.
  - Component hydration on mount (`connectedCallback`).
  - CustomEvent `theme-change` dispatch with detail `{ theme, previousTheme }`.
- **Out of Scope / Non-Goals**:
  - OS-level `prefers-color-scheme` listener overrides (explicit user selection takes deterministic precedence).
  - Custom user-defined color themes or hex picker inputs.
  - External CSS-in-JS frameworks or runtime theming libraries.
- **Invariants & Domain Rules**:
  - **`NEVER-CALC-002` (No State Loss on Network Shift or Theme Toggles)**: Never reset the active expression buffer, pending operator, accumulator, memory registers, mode, radix, or history tape during theme toggles.
  - **`NEVER-CALC-001` (Zero Dynamic Eval)**: Theme application must only adjust CSS custom properties and DOM attributes without dynamic script evaluation.
  - **`RULE-RESP-001` (Mobile Zero-Overflow 320px–390px)**: Component width must remain strictly contained within container (`scrollWidth <= clientWidth`) across all themes and viewports.
  - **`RULE-UI-002` (Polite Live Region & Accessible Controls)**: All interactive buttons must expose valid ARIA roles, labels, and visible focus rings (`:focus-visible`).
  - **`RULE-CALC-006` (Memory Register Persistence)**: Memory and calculation history persist immutably across theme cycles.

## 3. Seams & Contracts
- **`SEAM-ENGINE-01` (Engine Theme State)**:
  - Reducer action `SET_THEME`: accepts `action.theme: CalculatorTheme`.
  - Reducer action `CYCLE_THEME`: transitions `dark -> light -> high-contrast -> dark`.
  - Engine exposes `getTheme(): CalculatorTheme`, `setTheme(theme: CalculatorTheme): CalculatorState`, `cycleTheme(): CalculatorState`.
- **`SEAM-UI-01` (CustomEvent Protocol)**:
  - Dispatches `CustomEvent<'theme-change'>`:
    ```ts
    {
      detail: {
        theme: CalculatorTheme;
        previousTheme: CalculatorTheme;
      },
      bubbles: true,
      composed: true
    }
    ```

## 4. Survivability Matrix

| Failure Mode / Edge Condition | System Impact | Mitigation / System Guarantee |
| :--- | :--- | :--- |
| `localStorage` blocked or throwing `SecurityError` | Unable to persist theme across sessions | Try/catch wrapper ensures in-memory theme continues without throwing runtime errors |
| Corrupted or invalid value in `localStorage` | Stored string is not a valid `CalculatorTheme` | Validation guard rejects invalid string and defaults gracefully to `'dark'` |
| Theme cycled while calculator is in error state | User switches theme after division by zero | Error state, error message, and input lockout are preserved intact (`NEVER-CALC-002`) |
| Rapid repeated clicks on `#themeToggle` | User clicks switcher 10 times consecutively | Synchronous deterministic state transitions without race conditions or memory leaks |
| Narrow viewport (320px width) | Small mobile screen layout | Container queries adapt header padding and font size to maintain zero horizontal overflow |
