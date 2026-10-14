---
type: Feature
title: "F2: Accessible UI & Keyboard Navigation"
status: stable
description: "Authoritative product problem, rules, boundary invariants, scope, and survivability matrix for Accessible UI & Keyboard Navigation."
tags: [feature, ui, accessibility, keyboard, web-component, okf-v0.2]
sources:
  - resource: ../../project/vision.md
  - resource: ../../project/domain-rules.md
  - resource: ../../project/architecture.md
  - resource: ../../project/design.md
  - resource: ../f1-precision-arithmetic-engine/feature.md
---

# Feature: F2 - Accessible UI & Keyboard Navigation

Authoritative product specification for the StayCalc primary user interface and keyboard navigation layer. Governed by `docs/context/project/`.

## 1. Problem, Actors & Outcome
- **Problem & Context**: Precision arithmetic calculations require an intuitive, tactile, and universally accessible visual interface. Desktop users demand rapid 100% physical keyboard entry without needing mouse or touch interaction, while mobile users require high-density touch targets with zero horizontal viewport clipping. Assistive technology and screen reader users need polite live announcements of calculations and error locks.
- **Target Actors & Roles**:
  | Role / Persona | Surface | Arrival State / Prerequisite | Permissions & Access |
  | :--- | :--- | :--- | :--- |
  | `GeneralUser` | `<stay-calc>` Keypad | Touchscreen or pointer interaction | Click/tap keypad buttons, view calculations |
  | `KeyboardPowerUser` | `<stay-calc>` Host | Physical keyboard attached | Type digits, operators, Enter, Backspace, Escape |
  | `ScreenReaderUser` | `<stay-calc>` Live Region | Screen reader active (NVDA, VoiceOver) | Receive live speech output of inputs and results |
- **Checkable Success ("This Worked")**:
  1. `<stay-calc>` mounts as a standard W3C Autonomous Custom Element with encapsulated Declarative Shadow DOM (DSD) template and `<slot name="display">` / `<slot name="keypad">` projections.
  2. Complete keypad provides 19 tactile interactive buttons (digits 0-9, decimal `.`, operators `+`, `-`, `*`, `/`, equals `=`, clear `C`, all clear `AC`, sign `+/-`).
  3. Physical keyboard navigation intercepts calculator keys (`0-9`, `+`, `-`, `*`, `/`, `Enter`, `=`, `Backspace`, `Escape`, `.`) without hijacking browser navigation hotkeys (`Tab`, `Cmd+R`, `Ctrl+C`).
  4. Visible focus rings (`:focus-visible`) meet at least 3:1 contrast ratio against button surfaces, and button labels satisfy WCAG 2.2 AA contrast.
  5. Live region (`aria-live="polite"`, `aria-atomic="true"`) announces display changes and error notifications cleanly.
  6. Zero horizontal scroll overflow (`scrollWidth <= clientWidth`) across mobile viewports (320px–390px).
- **Checkable Failure ("This Is Broken")**: Display fails to respond to button clicks or keyboard presses; keyboard shortcuts hijack browser navigation; horizontal scrollbar appears on 390px screen; focus rings are missing or low-contrast.

## 2. Scope & Boundary Invariants
- **In This Revision**:
  - W3C Autonomous Custom Element `<stay-calc>` extending `HTMLElement`.
  - Encapsulated Shadow DOM with DSD template and slot projection graph.
  - Interactive keypad button grid (0-9, `.`, `+`, `-`, `*`, `/`, `=`, `C`, `AC`, `+/-`).
  - Physical keyboard event listener with selective key interception.
  - Integration with F1 `CalculatorEngine` via `SEAM-ENGINE-01`.
  - Accessible ARIA live region announcements (`aria-live="polite"`).
  - WCAG 2.2 AA compliant contrast and `:focus-visible` styling.
  - Responsive CSS Grid layout with CSS logical properties and container queries.
- **Refused / Owned Elsewhere**:
  - Arithmetic evaluation engine logic (owned by F1 `src/engine/`).
  - Memory registers `M+`/`M-`/`MR`/`MC` and 'M' indicator (owned by F3).
  - Calculation history tape drawer and persistence (owned by F4).
  - Scientific trigonometric / exponential mode buttons (owned by F5).
- **Underlying Product Rules (Screen-Agnostic Truths)**:
  - `RULE-UI-001` (Keypad & Display Projection): `<stay-calc>` encapsulates display and keypad slots via Declarative Shadow DOM with fallback light DOM enhancement.
  - `RULE-UI-002` (Event Interception & Focus Management): Keyboard interaction must intercept and map calculator keys (`0-9`, `+`, `-`, `*`, `/`, `Enter`, `=`, `Backspace`, `Escape`, `.`) without intercepting unrelated browser keys or interfering with focus order.
  - `RULE-A11Y-001` (WCAG 2.2 AA Contrast & Visible Focus Rings): All interactive buttons must have distinct visible `:focus-visible` outlines meeting at least 3:1 contrast ratio against the button surface, and button text must meet 4.5:1 contrast against button background.
  - `RULE-A11Y-002` (Screen Reader Announcements via Polite Live Region): The display slot must feature an `aria-live="polite"` region with `aria-atomic="true"` announcing calculation updates and error notifications to assistive technology.
  - `RULE-RESP-001` (Mobile Viewport Zero-Overflow): The calculator component must adapt responsively via CSS Grid, logical properties, and container queries to guarantee `scrollWidth <= clientWidth` on mobile viewports from 320px to 390px.
- **What Must Never Happen**:
  - `NEVER-UI-001` (Zero External Frameworks / Dependencies): UI elements must never rely on third-party runtime frameworks (React, Vue, Svelte, Tailwind, etc.) or external CSS files; use only native W3C Custom Elements and encapsulated Shadow DOM CSS tokens.

## 3. Object Lifecycle, Survivability & Storage Architecture
- **Dual-Tier Draft Storage**:
  - **Tier 1 (Client Transient)**: Custom element local DOM state and encapsulated `CalculatorEngine` instance.
  - **Tier 2 (Server / Client Persistent)**: Dispatched custom events for upstream history persistence (`SEAM-UI-01`).
- **SLA & Latency Ceilings**:
  - Interactive click / keypress response latency: `<= 16ms` (60fps UI dispatch).
  - Custom element registration and mount time: `<= 5ms`.

| Entity / Object | Identity Model | State (Draft vs Committed) | Survives Refresh? | Survives App Kill? | Survives Clear (C)? | Survives All Clear (AC)? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `<stay-calc>` Element | DOM Custom Element | Mounted in DOM | No | No | Yes (Preserves DOM mount) | Yes (Preserves DOM mount) |
| Visual Display Slot | DOM Text Node / Live Region | Reflected from Engine | No | No | Yes (Updates to "0") | Yes (Resets to "0") |
| Keypad Buttons | Shadow DOM Elements | Static interactive nodes | Yes (Re-rendered on mount) | Yes | Yes | Yes |

## 4. Notifications, Auditing & Reporting
- **Assistive Technology Announcements**: Display value changes and error messages (`"Cannot divide by zero"`) are spoken by screen readers via `aria-live="polite"` and `aria-atomic="true"`.
- **Error Lock Feedback**: When in locked error state, display applies visual error styling and keypad locks out invalid operations until `C`, `AC`, or `Escape` is triggered.

## 5. Cross-Feature Seams (`SEAM-*`)
Seam contracts live in this file — do **not** author a separate `contract.md` in the slice.

| Seam ID | Source Slice | Destination Slice | Arrival Payload | Handoff Payload | Failure Owner | Related RULE / NEVER |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `SEAM-ENGINE-01` | F2 UI (`<stay-calc>`) | F1 Engine | `CalculatorAction` | `CalculatorState` | destination | `RULE-CALC-001`, `RULE-CALC-002` |
| `SEAM-UI-01` | F2 UI (`<stay-calc>`) | F4 History Tape / Host App | Custom Event `calc-change` | `{ detail: CalculatorState }` | source | `RULE-UI-001`, `RULE-UI-002` |

## 6. References
- [User Flow](./flow.md)
- [Test Cases](./cases.md)
