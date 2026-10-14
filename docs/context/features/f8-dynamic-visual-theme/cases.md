---
type: Test Cases
title: "Dynamic Visual Theme Switcher Test Cases"
status: stable
description: "Unified test scenarios CASE-01 to CASE-11, 12-stall matrix, traceability chain, and N/A declarations for Dynamic Visual Theme Switcher."
tags: [cases, test-cases, theme, switcher, tokens, high-contrast, wcag-aaa, okf-v0.2]
sources:
  - resource: ./feature.md
  - resource: ./flow.md
---

# Test Cases: Dynamic Visual Theme Switcher

Authoritative test scenarios for the StayCalc dynamic visual theme subsystem, supporting Dark (default), Light, and High-Contrast modes with design tokens, WCAG 2.2 AAA accessibility compliance, localStorage persistence, header switcher button, and custom event lifecycle notifications. Grounded in `docs/context/project/domain-rules.md`, Feature rules (`RULE-*` / `NEVER-*`), and Flow decisions.

---

## 1. Universal Scenarios (11 Standard Types)

### `CASE-01`: Happy Path Nominal Execution (Theme Cycling: Dark -> Light -> High-Contrast -> Dark)
- **Actor**: `GeneralUser`
- **Preconditions**: Calculator mounted in default initial state.
- **Action Sequence / Input**:
  - Verify initial theme is `'dark'`.
  - Invoke `cycleTheme()` or click `#themeToggle` once.
  - Verify theme transitions to `'light'`.
  - Invoke `cycleTheme()` or click `#themeToggle` second time.
  - Verify theme transitions to `'high-contrast'`.
  - Invoke `cycleTheme()` or click `#themeToggle` third time.
  - Verify theme returns to `'dark'`.
- **Expected Outcome**:
  - State updates synchronously across each transition.
  - Host attribute `data-theme` matches each active theme.
  - `localStorage['staycalc_theme']` matches each active theme.
  - Each transition dispatches `theme-change` CustomEvent with `{ theme, previousTheme }`.
- **Enforces**: `SEAM-ENGINE-01`, `SEAM-UI-01`, `NEVER-CALC-002`

### `CASE-02`: Empty State & First Use (Clean Initial Mount Defaults to Dark Theme Without LocalStorage)
- **Actor**: `GeneralUser` / `FirstTimeVisitor`
- **Preconditions**: Fresh browser session with empty `localStorage`.
- **Action Sequence / Input**:
  - Mount `<stay-calc>` component.
  - Inspect `engine.getTheme()` and host attribute `data-theme`.
  - Inspect `#themeToggle` button label and icon.
- **Expected Outcome**:
  - Theme defaults to `'dark'`.
  - `:host` styles apply dark theme tokens.
  - `#themeToggle` displays dark theme icon and accessible `aria-label="Switch visual theme, current theme: dark"`.
  - `#themeToggle` has attribute `aria-haspopup="false"`.
- **Enforces**: `RULE-UI-002`, `SEAM-ENGINE-01`

### `CASE-03`: Error State & Input Lock (Theme Switching While Engine Is in Error Lockout Preserves Error & Lock)
- **Actor**: `GeneralUser`
- **Preconditions**: Calculator in locked error state (e.g., division by zero `10 / 0 =`).
- **Action Sequence / Input**:
  - Display displays `"Cannot divide by zero"` and `isLocked` is `true`.
  - Invoke `cycleTheme()` or click `#themeToggle`.
- **Expected Outcome**:
  - Theme transitions successfully to `'light'`.
  - Display remains `"Cannot divide by zero"` without clearing.
  - `isLocked` remains `true` and error styling persists.
  - Subsequent number clicks continue to be locked out until `C` or `AC` is pressed.
- **Enforces**: `RULE-CALC-001`, `NEVER-CALC-002`, `DEC-THM-04`

### `CASE-04`: Mid-Flow Operator Replacement & Active Buffer Preservation During Theme Switch
- **Actor**: `GeneralUser`
- **Preconditions**: User has entered operand and operator: `42 +`.
- **Action Sequence / Input**:
  - Enter `42`, press `+`.
  - Switch theme to `'light'`.
  - Enter `8`, press `=`.
- **Expected Outcome**:
  - Active calculation buffer and pending operator `+` are preserved across theme change (`NEVER-CALC-002`).
  - Result computes correctly to `50`.
- **Enforces**: `NEVER-CALC-002`, `RULE-CALC-008`

### `CASE-05`: Idempotency & Repeated Operations (Repeated Direct setTheme Calls & Full 3-Theme Cycle Loop)
- **Actor**: `GeneralUser`
- **Preconditions**: Calculator active in any theme.
- **Action Sequence / Input**:
  - Call `setTheme('light')` three times consecutively.
  - Cycle through full theme sequence multiple times (6 cycles = 2 full rotations).
- **Expected Outcome**:
  - Calling `setTheme('light')` repeatedly is idempotent; theme remains `'light'`.
  - Event `theme-change` is only dispatched when theme actually changes.
  - Cycling completes exactly 2 full cycles (`dark -> light -> high-contrast -> dark -> light -> high-contrast -> dark`) stably.
- **Enforces**: `SEAM-ENGINE-01`, `DEC-THM-02`

### `CASE-06`: Precision Normalization & WCAG 2.2 AAA High-Contrast Compliance (21:1 Contrast & 2px Solid White Borders)
- **Actor**: `LowVisionUser`
- **Preconditions**: High-Contrast theme active (`data-theme="high-contrast"`).
- **Action Sequence / Input**:
  - Inspect design tokens and computed styling for high-contrast mode.
  - Inspect borders of `.calc-container`, `.display-screen`, and interactive buttons.
- **Expected Outcome**:
  - Background is pure black (`#000000`).
  - Text is pure white (`#ffffff`), producing a 21:1 contrast ratio meeting WCAG 2.2 AAA.
  - Prominent 2px solid `#ffffff` borders are applied to all interactive controls and containers.
  - Focus ring provides high visibility (`outline: 2px solid #ffff00` or `#ffffff`).
- **Enforces**: `RULE-UI-002`, `RULE-RESP-001`

### `CASE-07`: Design Token Contract & CSS Custom Property Conformance
- **Actor**: `DesignSystemAuditor`
- **Preconditions**: Custom element template styles loaded.
- **Action Sequence / Input**:
  - Inspect stylesheet rules for design tokens across `:host`, `:host([data-theme="light"])`, and `:host([data-theme="high-contrast"])`.
  - Audit stylesheets for any `!important` occurrences.
- **Expected Outcome**:
  - All 9 tokens are declared across all three themes: `--calc-bg`, `--calc-surface`, `--calc-text`, `--calc-btn-bg`, `--calc-btn-text`, `--calc-btn-op-bg`, `--calc-accent-bg`, `--calc-border`, and `--calc-focus-ring`.
  - Strictly zero `!important` rules exist in the entire stylesheet.
- **Enforces**: `RULE-UI-002`, `NEVER-CALC-001`

### `CASE-08`: State Persistence Across Theme Toggles (RULE-CALC-006 / NEVER-CALC-002)
- **Actor**: `GeneralUser` / `PowerUser`
- **Preconditions**: Calculator has memory stored (`M = 99`), history tape populated, active mode set to `'scientific'`, and angle unit set to `'RAD'`.
- **Action Sequence / Input**:
  - Cycle theme from `'dark'` through `'light'` to `'high-contrast'`.
- **Expected Outcome**:
  - Memory register value (`99`) and indicator remain active (`RULE-CALC-006`).
  - History tape entries remain intact and accessible.
  - Active mode remains `'scientific'`.
  - Active angle unit remains `'RAD'`.
- **Enforces**: `NEVER-CALC-002`, `RULE-CALC-006`

### `CASE-09`: Clear & Reset Semantics (C and AC Reset Buffers but Strictly Preserve Active Theme)
- **Actor**: `GeneralUser`
- **Preconditions**: Theme set to `'light'`; active calculation `25 * 4`.
- **Action Sequence / Input**:
  - Press `C` (Clear active buffer).
  - Press `AC` (All Clear).
- **Expected Outcome**:
  - Pressing `C` resets buffer to `"0"`; theme remains `'light'`.
  - Pressing `AC` resets accumulator, pending operator, and buffer; theme remains `'light'`.
- **Enforces**: `RULE-CALC-009`, `NEVER-CALC-002`

### `CASE-10`: LocalStorage Persistence & Mount Hydration (Saves to 'staycalc_theme', Hydrates on Mount, Handles Exceptions)
- **Actor**: `GeneralUser`
- **Preconditions**: Browser environment with `localStorage`.
- **Action Sequence / Input**:
  - Change theme to `'high-contrast'`.
  - Verify `localStorage.getItem('staycalc_theme') === 'high-contrast'`.
  - Simulate new component mount with `'high-contrast'` in `localStorage`.
  - Simulate restricted environment where `localStorage.setItem` throws `SecurityError`.
- **Expected Outcome**:
  - New component mounts hydrated in `'high-contrast'` theme automatically.
  - Storage exception is caught gracefully; component continues functioning without errors.
- **Enforces**: `SEAM-UI-01`, `REC-THM-01`, `DEC-THM-01`

### `CASE-11`: Component UI, Toggle Interaction, Accessibility & Mobile Zero-Overflow (320px–390px)
- **Actor**: `KeyboardPowerUser` / `ScreenReaderUser`
- **Preconditions**: `<stay-calc>` mounted.
- **Action Sequence / Input**:
  - Query `#themeToggle` in shadow DOM.
  - Verify button attributes (`aria-label`, `aria-haspopup="false"`).
  - Verify `theme-change` CustomEvent dispatched on click with `{ theme, previousTheme }`.
  - Verify container queries at 320px, 375px, and 390px viewports with zero horizontal overflow (`scrollWidth <= clientWidth`).
- **Expected Outcome**:
  - `#themeToggle` is fully accessible and keyboard-focusable.
  - CustomEvent bubbles and is composed.
  - Mobile layout exhibits zero horizontal scroll overflow.
- **Enforces**: `RULE-RESP-001`, `RULE-UI-002`, `SEAM-UI-01`

---

## 2. Lived-System Stall Matrix (12 Canonical Stalls)

| Stall # & Name | Trigger Condition | Visible System Response | Recovery Action | Target Test File |
| :--- | :--- | :--- | :--- | :--- |
| **1. Empty or zero match** | Fresh mount with empty `localStorage` | Defaults cleanly to `'dark'` theme | User toggles theme | `test/theme.test.ts` |
| **2. Stuck or slow wait** | Rapid repeated clicks on `#themeToggle` | Synchronous state update (`< 1ms`) | Instant execution | `test/theme.test.ts` |
| **3. Bad or incomplete input** | Non-existent theme passed to `setTheme('neon')` | Safely ignored or falls back to `'dark'` | Keep valid theme | `test/theme.test.ts` |
| **4. Hard failure or outage** | `localStorage` throws `SecurityError` or quota exceeded | In-memory theme switch continues seamlessly | Exception caught safely | `test/theme.test.ts` |
| **5. Double-tap or race** | Rapid successive theme cycle triggers | Reducer processes actions sequentially without state corruption | Synchronous state loop | `test/theme.test.ts` |
| **6. Two concurrent sessions** | Multiple `<stay-calc>` instances on page | Each instance manages its own engine theme state | Isolated component instances | `test/theme.test.ts` |
| **7. Partial success** | Theme toggled while calculation in progress | Display, registers, and operator preserved (`NEVER-CALC-002`) | Calculation resumes seamlessly | `test/theme.test.ts` |
| **8. Leave and return** | User closes and reopens tab | Stored theme restored on component mount | Automatic hydration | `test/theme.test.ts` |
| **9. Offline** | Complete offline environment | Zero-dependency CSS tokens and local state | Full offline support | `test/theme.test.ts` |
| **10. Stale seam arrival** | Corrupted theme string in storage | Sanitized and restored to `'dark'` | Fallback to default | `test/theme.test.ts` |
| **11. UI desync** | Host attribute `data-theme` out of sync with engine | Single dispatch pipeline updates engine and DOM attribute atomically | Atomic synchronization | `test/theme.test.ts` |
| **12. Auth halfway** | N/A (Guest-safe client utility) | Unrestricted local utility | N/A | `test/theme.test.ts` |

---

## 3. Traceability Chain

| Rule / Invariant ID | Flow Decision | Seam ID | Case ID | Test Category | Target Test File |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `NEVER-CALC-002` | `DEC-THM-02` | `SEAM-ENGINE-01` | `CASE-01` | Theme Cycle Sequence | `test/theme.test.ts` |
| `SEAM-UI-01` | `DEC-THM-02` | `SEAM-UI-01` | `CASE-01` | CustomEvent Dispatch | `test/theme.test.ts` |
| `RULE-UI-002` | `DEC-THM-01` | `SEAM-ENGINE-01` | `CASE-02` | Initial Mount Default | `test/theme.test.ts` |
| `RULE-CALC-001` | `DEC-THM-04` | `SEAM-ENGINE-01` | `CASE-03` | Error Lockout Preservation | `test/theme.test.ts` |
| `NEVER-CALC-002` | `DEC-THM-04` | `SEAM-ENGINE-01` | `CASE-04` | In-Flight Buffer Preservation | `test/theme.test.ts` |
| `SEAM-ENGINE-01` | `DEC-THM-03` | `SEAM-ENGINE-01` | `CASE-05` | Idempotency & Repeated Set | `test/theme.test.ts` |
| `RULE-UI-002` | `DEC-THM-02` | `SEAM-UI-01` | `CASE-06` | High-Contrast WCAG AAA | `test/theme.test.ts` |
| `NEVER-CALC-001` | `DEC-THM-02` | `SEAM-UI-01` | `CASE-07` | Zero !important & Tokens | `test/theme.test.ts` |
| `RULE-CALC-006` | `DEC-THM-04` | `SEAM-ENGINE-01` | `CASE-08` | Memory & State Persistence | `test/theme.test.ts` |
| `RULE-CALC-009` | `DEC-THM-04` | `SEAM-ENGINE-01` | `CASE-09` | C & AC Theme Preservation | `test/theme.test.ts` |
| `SEAM-UI-01` | `DEC-THM-01` | `SEAM-UI-01` | `CASE-10` | LocalStorage Persistence | `test/theme.test.ts` |
| `RULE-RESP-001` | `DEC-THM-02` | `SEAM-UI-01` | `CASE-11` | Header UI, A11y & Mobile | `test/theme.test.ts` |

---

## 4. Cases N/A Declarations

- **Network Latency & Timeout (`CASE-06` in macro catalog)**: N/A (Theming operations are 100% client-side and execute synchronously without network dependencies).
- **Tenant Auth & Permissions (`CASE-03` in macro catalog)**: N/A (StayCalc is an autonomous client calculator with zero backend authentication constraints).

---

## 5. References
- [Feature Specification](./feature.md)
- [User Flow & Decision Trees](./flow.md)
