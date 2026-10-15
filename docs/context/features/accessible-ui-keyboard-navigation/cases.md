---
type: Test Cases
title: "Accessible UI and Keyboard Navigation Test Cases"
status: stable
description: "Unified test scenarios, 11 universal cases, stall matrix, and traceability for <stay-calc> UI and keyboard navigation."
tags: [cases, test-cases, ui, keyboard, okf-v0.2]
generated: { by: "process:implement", at: "2026-10-15T00:00:00Z" }
sources:
  - id: source-feature
    resource: ./feature.md
    title: Feature Specification
  - id: source-flow
    resource: ./flow.md
    title: User Flow
---

# Test Cases: Accessible UI and Keyboard Navigation

Authoritative test scenarios for the `<stay-calc>` Autonomous W3C Custom Element, DSD slot projections, keyboard navigation, and responsive mobile bounds. Grounded in `feature.md` invariants (`RULE-*` / `NEVER-*`) and `flow.md` decisions.

---

## 1. Universal Scenarios (11 Standard Types)

### `CASE-UI-01`: Happy Path Custom Element Lifecycle & DSD Slot Projections
- **Actor**: `StandardUser`
- **Preconditions**: Custom element `<stay-calc>` defined and registered in `customElements`.
- **Action Sequence / Input**: Instantiate element `<stay-calc>`, verify shadowRoot exists, mode is open, and contains named slots `<slot name="display">` and `<slot name="keypad">`.
- **Expected Outcome**: Element mounts cleanly with shadowRoot attached, slots present, and default keypad and display rendered without external runtime frameworks.
- **Enforces**: `RULE-UI-001`, `RULE-UI-002`, `NEVER-UI-001`

### `CASE-UI-02`: Empty State & Initial Display Synchronization
- **Actor**: `StandardUser`
- **Preconditions**: Freshly mounted `<stay-calc>` element.
- **Action Sequence / Input**: Inspect initial display content before any user interaction.
- **Expected Outcome**: Display shows `"0"`, status indicator is unlocked, and no error message is displayed.
- **Enforces**: `RULE-CALC-008`, `SEAM-CALC-02`

### `CASE-UI-03`: Error State Guard (Division by Zero Locked Display)
- **Actor**: `StandardUser`
- **Preconditions**: Element mounted.
- **Action Sequence / Input**: User triggers `8` -> `/` -> `0` -> `=`.
- **Expected Outcome**: Display renders `"Cannot divide by zero"`. Subsequent digit clicks or keyboard keydown events do not append to buffer or modify error until `C` or `AC` is pressed.
- **Enforces**: `RULE-CALC-001`, `NEVER-CALC-004`, `DEC-UI-02`

### `CASE-UI-04`: Keypad Button Click Event Dispatch & Engine Sync
- **Actor**: `StandardUser`
- **Preconditions**: Element mounted.
- **Action Sequence / Input**: Click button `[data-action="digit"][data-value="7"]`, then `[data-action="operator"][data-value="+"]`, then `[data-action="digit"][data-value="8"]`, then `[data-action="calculate"]`.
- **Expected Outcome**: Display updates synchronously at each step: `"7"`, `"7"`, `"8"`, and finally `"15"`.
- **Enforces**: `SEAM-CALC-01`, `SEAM-CALC-02`

### `CASE-UI-05`: Physical Keyboard Navigation & Typing Event Mapping
- **Actor**: `StandardUser`
- **Preconditions**: Element mounted and window keydown listener active.
- **Action Sequence / Input**: Dispatch keydown events for `'2'`, `'+'`, `'3'`, `'*'`, `'4'`, `'Enter'`.
- **Expected Outcome**: Immediate left-to-right evaluation: display shows `"20"` using normalized precision without JavaScript eval.
- **Enforces**: `RULE-UI-003`, `RULE-CALC-002`, `RULE-CALC-007`, `NEVER-CALC-001`

### `CASE-UI-06`: Keyboard Modifier Key Passthrough Guard
- **Actor**: `StandardUser`
- **Preconditions**: Element mounted.
- **Action Sequence / Input**: Dispatch keydown event for `'c'` with `ctrlKey: true` (`Ctrl+C`) or `metaKey: true` (`Cmd+C`).
- **Expected Outcome**: Event is ignored by calculator; `clear()` is NOT invoked; display remains intact.
- **Enforces**: `RULE-UI-004`, `DEC-UI-01`

### `CASE-UI-07`: Backspace and Delete Key Handling
- **Actor**: `StandardUser`
- **Preconditions**: Buffer contains `"123"`.
- **Action Sequence / Input**: Dispatch keydown `'Backspace'`.
- **Expected Outcome**: Buffer becomes `"12"`. If buffer has single digit, becomes `"0"`. Dispatching `'Delete'` resets all registers via `allClear()`.
- **Enforces**: `RULE-UI-003`

### `CASE-UI-08`: Accessible Focus Rings (`:focus-visible`) & WCAG 2.2 AA Contrast
- **Actor**: `StandardUser` (Keyboard navigation)
- **Preconditions**: Element mounted.
- **Action Sequence / Input**: Tab through interactive keypad buttons.
- **Expected Outcome**: Each button styles `:focus-visible` with `2px solid var(--calc-primary, #2563eb)` outline and `2px` offset.
- **Enforces**: `RULE-UI-005`

### `CASE-UI-09`: Mobile Viewport Zero-Overflow (320px, 375px, 390px)
- **Actor**: `StandardUser` (Mobile screen)
- **Preconditions**: Element rendered in 320px, 375px, and 390px viewport width container.
- **Action Sequence / Input**: Measure container dimensions.
- **Expected Outcome**: `scrollWidth <= clientWidth` across 320px, 375px, and 390px viewports without horizontal scrollbar and without !important overrides.
- **Enforces**: `RULE-UI-006`, `NEVER-UI-002`

### `CASE-UI-10`: Clear (`C`) vs All Clear (`AC`) UI Trigger Synchronization
- **Actor**: `StandardUser`
- **Preconditions**: Calculation in progress (`10 + 5`).
- **Action Sequence / Input**: Click `C` button; buffer resets to `"0"`; enter `8` and click `=`.
- **Expected Outcome**: Evaluates `10 + 8 = 18`. If `AC` is clicked, accumulator and operator are cleared completely.
- **Enforces**: `RULE-CALC-008`

### `CASE-UI-11`: Consecutive Operator Keying & Mid-Calculation Overrides
- **Actor**: `StandardUser`
- **Preconditions**: First operand entered (`10`).
- **Action Sequence / Input**: Key sequence `+` followed immediately by `*`, then `5`, then `=`.
- **Expected Outcome**: Operator `*` overrides `+`; calculates `10 * 5 = 50`.
- **Enforces**: `RULE-CALC-007`

---

## 2. Stall Matrix & Failure Edge Cases

| Stall ID | Scenario / Trigger | Impact | Likelihood | Mitigation / Recovery |
| :--- | :--- | :---: | :---: | :--- |
| `STL-UI-01` | Browser modifier shortcut (`Cmd+R` / `Ctrl+C`) | High | High | `DEC-UI-01`: Ignore keydown when `ctrlKey`, `metaKey`, or `altKey` is active. |
| `STL-UI-02` | Rapid keydown queuing | Medium | Medium | Synchronous immediate evaluation on keydown prevents input drift. |
| `STL-UI-03` | 320px mobile viewport squeeze | High | Medium | CSS grid with flexible `1fr` and `min-width: 0` ensures zero overflow. |
| `STL-UI-04` | Division by zero locked state | High | Medium | All inputs ignored until user triggers `C` or `AC`. |
| `STL-UI-05` | Custom element re-registration | Medium | Low | Guard registration with `if (!customElements.get('stay-calc'))`. |
| `STL-UI-06` | Decimal point entered multiple times | Low | High | Subsequent decimal points ignored by `CalcEngine`. |
| `STL-UI-07` | Non-numeric typing (e.g. `'a'`, `'x'`, `'!'`) | Low | High | Keydown filter ignores any unmapped character. |
| `STL-UI-08` | Memory leaks on element unmount | High | Medium | `disconnectedCallback` removes global `keydown` event listener. |
| `STL-UI-09` | Multiple `<stay-calc>` instances on page | Medium | Low | Each instance owns its isolated Shadow DOM and `CalcEngine`. |
| `STL-UI-10` | Tab navigation order drift | Medium | Low | Buttons follow DOM order (1 through 9, operators, clear, equals). |
| `STL-UI-11` | Overflow on large number result | Medium | Low | Font size scales down or truncates smoothly in display card. |
| `STL-UI-12` | Slot projection with consumer markup | Medium | Low | Fallback content automatically projects when slots are unpopulated. |
