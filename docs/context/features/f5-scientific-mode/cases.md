---
type: Test Cases
title: "Scientific Mode Toggle and Functions Test Cases"
status: stable
description: "Unified test scenarios CASE-01 to CASE-11, 12-stall matrix, traceability chain, and N/A declarations for Scientific Mode."
tags: [cases, test-cases, scientific, mode-toggle, angle-unit, okf-v0.2]
sources:
  - resource: ./feature.md
  - resource: ./flow.md
---

# Test Cases: Scientific Mode Toggle and Functions

Authoritative test scenarios for the StayCalc scientific calculation subsystem, mode switching, angle unit toggling, mathematical constants, and precision trigonometric/exponential functions. Grounded in `docs/context/project/domain-rules.md`, Feature rules (`RULE-*` / `NEVER-*`), and Flow decisions.

---

## 1. Universal Scenarios (11 Standard Types)

### `CASE-01`: Happy Path Nominal Execution (Scientific Mode Toggle & Function Evaluation)
- **Actor**: `GeneralUser`
- **Preconditions**: Initial clean calculator state in standard mode.
- **Action Sequence / Input**:
  - Click `#modeToggle` to switch to scientific mode.
  - Enter `25`, click square root (`√`).
  - Enter `6`, click square (`x²`).
  - Enter `2`, click power (`xʸ`), enter `8`, click equals (`=`).
- **Expected Outcome**:
  - Mode transitions to `"scientific"`, `#scientificKeys` is visible.
  - $\sqrt{25}$ displays `"5"`.
  - $6^2$ displays `"36"`.
  - $2^8$ evaluates to `"256"`.
  - Zero dynamic evaluation (`eval()` or `new Function()`) is utilized (`NEVER-CALC-001`).
- **Enforces**: `RULE-CALC-002`, `RULE-CALC-006`, `SEAM-ENGINE-01`, `NEVER-CALC-001`

### `CASE-02`: Empty State & First Use (Clean Initial Bootstrap & Standard Mode Defaults)
- **Actor**: `GeneralUser`
- **Preconditions**: Freshly mounted `<stay-calc>` component.
- **Action Sequence / Input**:
  - Inspect initial calculator state and DOM elements without user interaction.
- **Expected Outcome**:
  - Engine initialized with `mode: "standard"` and `angleUnit: "DEG"`.
  - Display is `"0"`.
  - `#scientificKeys` is hidden / not active.
  - `#modeToggle` button provides accessible label `"Switch to scientific mode"`.
- **Enforces**: `RULE-CALC-003`, `RULE-RESP-001`

### `CASE-03`: Error State & Input Lock (Negative Square Root & Invalid Tangent Lockout)
- **Actor**: `GeneralUser`
- **Preconditions**: Scientific mode active in DEG angle unit.
- **Action Sequence / Input**:
  - Enter `9`, press `+/-` (display `"-9"`), click square root (`√`).
  - Clear error with `C`.
  - Enter `90`, click tangent (`tan`).
- **Expected Outcome**:
  - $\sqrt{-9}$ immediately triggers `"Invalid input"`, enters locked error state (`isLocked = true`) (`RULE-CALC-001`).
  - Unlocked via `C` back to `"0"`.
  - $\tan(90^\circ)$ immediately triggers `"Invalid input"`, enters locked error state (`isLocked = true`).
  - Zero `NaN` or `Infinity` leaked (`NEVER-CALC-004`).
- **Enforces**: `RULE-CALC-001`, `RULE-CALC-003`, `NEVER-CALC-004`

### `CASE-04`: Mid-Flow Operator Replacement with Power Operator
- **Actor**: `GeneralUser`
- **Preconditions**: Scientific mode active.
- **Action Sequence / Input**:
  - Enter `2 +`, then immediately click power (`xʸ`), enter `3 =`.
- **Expected Outcome**:
  - Operator replacement replaces pending `+` with `^` (`RULE-CALC-008`).
  - Calculation evaluates $2^3 = 8$.
  - Display shows `"8"`.
- **Enforces**: `RULE-CALC-008`, `SEAM-ENGINE-01`

### `CASE-05`: Idempotency & Repeated Operations (Repeated Mode Toggle, Angle Toggle & Squaring)
- **Actor**: `GeneralUser`
- **Preconditions**: Scientific mode active.
- **Action Sequence / Input**:
  - Click `#modeToggle` 4 times consecutively (standard -> scientific -> standard -> scientific).
  - Enter `2`, click square (`x²`) twice consecutively.
  - Click `#angleUnitToggle` 4 times consecutively.
- **Expected Outcome**:
  - Repeated mode toggles alternate mode cleanly without state corruption or error (`RULE-CALC-006`).
  - First square produces `"4"`, second square produces `"16"`.
  - Repeated angle unit toggles cycle between `DEG` and `RAD` stably.
- **Enforces**: `RULE-CALC-006`, `SEAM-ENGINE-01`

### `CASE-06`: Precision Normalization (Trigonometric Boundaries & IEEE-754 Noise Suppression)
- **Actor**: `GeneralUser`
- **Preconditions**: Scientific mode active in DEG angle unit.
- **Action Sequence / Input**:
  - Evaluate `sin(0)`, `sin(90)`, `cos(90)`, `cos(0)`, `tan(45)`, `sin(30)`, `cos(60)`.
  - Switch to RAD mode, enter `π`, click `cos`.
- **Expected Outcome**:
  - Exact cardinal angle values in DEG: $\sin(0^\circ) = 0$, $\sin(90^\circ) = 1$, $\cos(90^\circ) = 0$, $\cos(0^\circ) = 1$, $\tan(45^\circ) = 1$.
  - Exact fractional values: $\sin(30^\circ) = 0.5$, $\cos(60^\circ) = 0.5$.
  - In RAD mode, $\cos(\pi)$ evaluates to `"-1"`.
  - No float noise (e.g. `6.12e-17`) appears (`RULE-CALC-002`).
- **Enforces**: `RULE-CALC-002`, `RULE-CALC-003`

### `CASE-07`: Constants Loading (Pi & Euler's Number Precision & Arithmetic Use)
- **Actor**: `GeneralUser`
- **Preconditions**: Scientific mode active.
- **Action Sequence / Input**:
  - Click $\pi$ button.
  - Click `* 2 =`.
  - Click `e` button.
- **Expected Outcome**:
  - $\pi$ loads as `"3.141592654"` with `waitingForOperand = true`.
  - Multiplication by 2 yields `"6.283185308"`.
  - $e$ loads as `"2.718281828"` with `waitingForOperand = true`.
- **Enforces**: `RULE-CALC-002`, `SEAM-ENGINE-01`

### `CASE-08`: State Persistence Across Mode Toggles (Memory, History & Accumulator Retention)
- **Actor**: `GeneralUser`
- **Preconditions**: Standard mode active.
- **Action Sequence / Input**:
  - Enter `10 +`.
  - Enter `42`, press `M+` (active memory indicator visible).
  - Toggle `#modeToggle` to scientific mode.
  - Inspect accumulator, pending operator, memory register, and display.
  - Toggle back to standard mode, enter `5 =`.
- **Expected Outcome**:
  - Mode switch preserves accumulator `10`, pending `+`, memory value `42`, and active memory indicator (`RULE-CALC-006`).
  - Final equals evaluates $10 + 5 = 15$.
  - Calculation history tape is completely preserved across both mode switches.
- **Enforces**: `RULE-CALC-006`, `RULE-CALC-008`

### `CASE-09`: Clear & Reset Semantics in Scientific Mode (C vs AC)
- **Actor**: `GeneralUser`
- **Preconditions**: Scientific mode active in RAD angle unit.
- **Action Sequence / Input**:
  - Enter `25 ^ 99`.
  - Press Clear (`C`).
  - Enter `2 =`.
  - Press All Clear (`AC`).
- **Expected Outcome**:
  - `C` resets display buffer to `"0"` while preserving accumulator `25`, pending `^`, mode `"scientific"`, and unit `"RAD"`.
  - Evaluating with `2 =` yields $25^2 = 625$.
  - `AC` resets accumulator, pending operator, and buffer to `"0"`, but preserves mode `"scientific"` and angle unit `"RAD"`.
- **Enforces**: `RULE-CALC-006`, `SEAM-ENGINE-01`

### `CASE-10`: Angle Unit Mode Switching (DEG vs RAD Calculation Differences)
- **Actor**: `GeneralUser`
- **Preconditions**: Scientific mode active in DEG unit.
- **Action Sequence / Input**:
  - Enter `90`, click `sin` (yields `"1"`).
  - Click `#angleUnitToggle` (switches to `RAD`).
  - Enter `90`, click `sin`.
- **Expected Outcome**:
  - In DEG mode, $\sin(90^\circ) = 1$.
  - In RAD mode, $\sin(90\text{ rad}) \approx 0.893996664$.
  - `#angleUnitIndicator` updates badge text between `"DEG"` and `"RAD"`.
- **Enforces**: `RULE-CALC-003`, `SEAM-ENGINE-01`

### `CASE-11`: Component UI, Container Queries, Accessibility & Event Synchronization
- **Actor**: `ScreenReaderUser` / `KeyboardPowerUser`
- **Preconditions**: `<stay-calc>` mounted in browser/DOM.
- **Action Sequence / Input**:
  - Toggle `#modeToggle` and `#angleUnitToggle`.
  - Inspect `#scientificKeys` buttons: `√`, `x²`, `xʸ`, `π`, `e`, `sin`, `cos`, `tan`.
  - Verify container queries and CSS logical properties across 320px–390px viewports.
  - Verify dispatched `calc-change` and `mode-change` events.
- **Expected Outcome**:
  - `#modeToggle` dynamically updates `aria-label` ("Switch to scientific mode" / "Switch to standard mode").
  - `#scientificKeys` renders all 8 buttons with accessible `aria-label` attributes.
  - Zero horizontal scroll overflow (`scrollWidth <= clientWidth`) at 320px, 375px, and 390px (`RULE-RESP-001`).
  - `mode-change` and `calc-change` CustomEvents are dispatched with complete payload details.
- **Enforces**: `RULE-RESP-001`, `SEAM-UI-01`

---

## 2. Lived-System Stall Matrix (12 Canonical Stalls)

| Stall # & Name | Trigger Condition | Visible System Response | Recovery Action | Target Test File |
| :--- | :--- | :--- | :--- | :--- |
| **1. Empty or zero match** | First mount before mode switch | `#scientificKeys` hidden, clean standard mode | User clicks `#modeToggle` | `test/scientific.test.ts` |
| **2. Stuck or slow wait** | Rapid trigonometric calculations | Instantaneous synchronous evaluation (`< 1ms`) | N/A (instant execution) | `test/scientific.test.ts` |
| **3. Bad or incomplete input** | Unary function on zero buffer | Evaluates mathematically (e.g. $\sqrt{0} = 0$, $\sin(0) = 0$) | User enters operand | `test/scientific.test.ts` |
| **4. Hard failure or outage** | Negative square root or $\tan(90^\circ)$ | Error displayed (`"Invalid input"`); input locked | User clears error with `C` or `AC` | `test/scientific.test.ts` |
| **5. Double-tap or race** | Consecutive mode or unit toggle clicks | Idempotent alternation without state drift | N/A | `test/scientific.test.ts` |
| **6. Two concurrent sessions** | Multiple `<stay-calc>` instances | Mode and angle units isolated per component | N/A | `test/scientific.test.ts` |
| **7. Partial success** | Fractional power of negative base | Yields `"Invalid input"` with input lock | User clears error with `C` | `test/scientific.test.ts` |
| **8. Leave and return** | Mode toggled mid-calculation | In-progress accumulator and operator preserved | User resumes calculation | `test/scientific.test.ts` |
| **9. Offline** | Complete offline execution | 100% zero-dependency local code | Full offline capability | `test/scientific.test.ts` |
| **10. Stale seam arrival** | Unknown action dispatched | Calculator state preserved unchanged | Dispatch valid action | `test/scientific.test.ts` |
| **11. UI desync** | Scientific keys out of sync with mode | `syncUI()` ensures 1:1 state reflection | Automatic DOM synchronization | `test/scientific.test.ts` |
| **12. Auth halfway** | N/A (Guest-safe utility) | Unrestricted local utility | N/A | `test/scientific.test.ts` |

---

## 3. Traceability Chain

| Rule / Invariant ID | Flow Decision | Seam ID | Case ID | Test Category | Target Test File |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `RULE-CALC-002` | `DEC-SCI-01` | `SEAM-ENGINE-01` | `CASE-01` | Scientific Nominal Execution | `test/scientific.test.ts` |
| `NEVER-CALC-001` | `DEC-SCI-01` | `SEAM-ENGINE-01` | `CASE-01` | Zero Dynamic Eval | `test/scientific.test.ts` |
| `RULE-CALC-003` | `DEC-SCI-02` | `SEAM-UI-01` | `CASE-02` | Initial Bootstrap & Defaults | `test/scientific.test.ts` |
| `RULE-CALC-001` | `DEC-SCI-03` | `SEAM-ENGINE-01` | `CASE-03` | Domain Error Lockout | `test/scientific.test.ts` |
| `NEVER-CALC-004` | `DEC-SCI-03` | `SEAM-ENGINE-01` | `CASE-03` | No Unhandled NaN/Infinity | `test/scientific.test.ts` |
| `RULE-CALC-008` | `DEC-SCI-04` | `SEAM-ENGINE-01` | `CASE-04` | Power Operator Replacement | `test/scientific.test.ts` |
| `RULE-CALC-006` | `DEC-SCI-01` | `SEAM-ENGINE-01` | `CASE-05` | Toggle Idempotency | `test/scientific.test.ts` |
| `RULE-CALC-002` | `DEC-SCI-03` | `SEAM-ENGINE-01` | `CASE-06` | Trigonometric Precision | `test/scientific.test.ts` |
| `RULE-CALC-002` | `DEC-SCI-01` | `SEAM-ENGINE-01` | `CASE-07` | Constants Precision Loading | `test/scientific.test.ts` |
| `RULE-CALC-006` | `DEC-SCI-01` | `SEAM-ENGINE-01` | `CASE-08` | State Persistence Across Modes | `test/scientific.test.ts` |
| `RULE-CALC-006` | `DEC-SCI-01` | `SEAM-ENGINE-01` | `CASE-09` | Clear & Reset Semantics | `test/scientific.test.ts` |
| `RULE-CALC-003` | `DEC-SCI-02` | `SEAM-ENGINE-01` | `CASE-10` | Angle Unit DEG vs RAD | `test/scientific.test.ts` |
| `RULE-RESP-001` | `DEC-SCI-01` | `SEAM-UI-01` | `CASE-11` | UI, Container Queries & Events | `test/scientific.test.ts` |

---

## 4. Cases N/A Declarations

- **Network Latency & Timeout (`CASE-06` in macro catalog)**: N/A (Scientific operations are synchronous in-memory state transitions without network calls).
- **Tenant Auth & Permissions (`CASE-03` in macro catalog)**: N/A (StayCalc operates locally within the client browser session without user access controls).

---

## 5. References
- [Feature Specification](./feature.md)
- [User Flow & Decision Trees](./flow.md)
