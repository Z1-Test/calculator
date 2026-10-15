---
type: Test Cases
title: "Audit Tape Export & Clipboard Synchronization Test Cases"
status: stable
description: "Unified test scenarios, 11 universal cases, stall matrix, and traceability for audit tape export and clipboard synchronization."
tags: [cases, test-cases, export, clipboard, toast, okf-v0.2]
generated: { by: "process:implement", at: "2026-10-15T00:00:00Z" }
sources:
  - id: source-feature
    resource: ./feature.md
    title: Feature Specification
  - id: source-flow
    resource: ./flow.md
    title: User Flow
---

# Test Cases: Audit Tape Export & Clipboard Synchronization

Authoritative test scenarios for StayCalc audit tape export (CSV and plain text), clipboard synchronization, permission fallbacks, and accessible status toast notifications. Grounded in `feature.md` invariants (`RULE-*` / `NEVER-*`) and `flow.md` decisions.

---

## 1. Universal Scenarios (11 Standard Types)

### `CASE-EXP-01`: Happy Path CSV Export with RFC 4180 Header
- **Actor**: `StandardUser`
- **Preconditions**: `CalcEngine` contains history records `2 + 3 = 5` and `10 * 4 = 40`.
- **Action Sequence / Input**: Invoke `exportHistoryToCSV()`.
- **Expected Outcome**: Returns CSV formatted string starting with `timestamp,expression,result\n`, followed by 2 lines containing valid ISO-8601 UTC timestamps, expressions, and numeric results.
- **Enforces**: `RULE-EXP-001`, `RULE-CALC-005`, `NEVER-CALC-001`, `SEAM-EXP-01`

### `CASE-EXP-02`: RFC 4180 Escaping for Formulas Containing Quotes and Commas
- **Actor**: `StandardUser`
- **Preconditions**: History record contains formula with comma or quotes (e.g. `2,000 + 500 = 2500` or `format("test") = 0`).
- **Action Sequence / Input**: Invoke `exportHistoryToCSV()`.
- **Expected Outcome**: Expressions containing commas or quotes are wrapped in double quotes, and internal quotes are escaped as `""` (e.g. `"format(""test"") = 0"`).
- **Enforces**: `RULE-EXP-001`, `NEVER-EXP-001`, `DEC-EXP-02`

### `CASE-EXP-03`: ISO-8601 UTC Timestamp Formatting in CSV
- **Actor**: `StandardUser`
- **Preconditions**: History entry recorded at timestamp `1700000000000`.
- **Action Sequence / Input**: Invoke `exportHistoryToCSV()`.
- **Expected Outcome**: First column of the record equals `new Date(1700000000000).toISOString()` (e.g. `2023-11-14T22:13:20.000Z`).
- **Enforces**: `RULE-EXP-001`, `SEAM-EXP-01`

### `CASE-EXP-04`: Human-Readable Plain Text Export Formatting
- **Actor**: `StandardUser`
- **Preconditions**: Engine contains history entries `5 + 5 = 10` and `20 / 4 = 5`.
- **Action Sequence / Input**: Invoke `exportHistoryToText()`.
- **Expected Outcome**: Returns lines formatted as `[YYYY-MM-DD HH:mm:ss UTC] <expression> = <result>\n`.
- **Enforces**: `RULE-EXP-001`, `SEAM-EXP-02`

### `CASE-EXP-05`: Empty History Tape Export Handling
- **Actor**: `StandardUser`
- **Preconditions**: Clean `CalcEngine` with empty history (`history.length === 0`).
- **Action Sequence / Input**: Invoke `exportHistoryToCSV()` and `exportHistoryToText()`.
- **Expected Outcome**: `exportHistoryToCSV()` returns `"timestamp,expression,result\n"`. `exportHistoryToText()` returns `"(No calculation entries recorded)\n"`. Neither throws an exception.
- **Enforces**: `RULE-EXP-001`, `DEC-EXP-01`

### `CASE-EXP-06`: Copy Result to System Clipboard via Native API
- **Actor**: `StandardUser`
- **Preconditions**: Calculator display contains `"12345"`.
- **Action Sequence / Input**: Click `#copy-result` button.
- **Expected Outcome**: `navigator.clipboard.writeText` is invoked with `"12345"`, and `#calc-toast` displays `"Copied to clipboard"`.
- **Enforces**: `RULE-CLIP-001`, `SEAM-EXP-04`

### `CASE-EXP-07`: Clipboard Permission Rejection & Fallback Handling
- **Actor**: `StandardUser`
- **Preconditions**: `navigator.clipboard.writeText` rejects with `NotAllowedError`.
- **Action Sequence / Input**: Click `#copy-result` button.
- **Expected Outcome**: Catch block executes `document.execCommand('copy')` fallback; if both fail, `#calc-toast` displays `"Unable to copy to clipboard"` without unhandled promise rejections.
- **Enforces**: `RULE-CLIP-001`, `NEVER-EXP-002`, `DEC-EXP-03`, `REC-EXP-01`

### `CASE-EXP-08`: Accessible `#calc-toast` Notification Lifecycle
- **Actor**: `StandardUser`
- **Preconditions**: Toast element present in shadow root with `role="status"` and `aria-live="polite"`.
- **Action Sequence / Input**: Trigger toast with message `"Exported CSV"`.
- **Expected Outcome**: `#calc-toast` receives `.show` class, announces message to screen readers without moving focus, and automatically removes `.show` class after 2.5 seconds.
- **Enforces**: `RULE-TOAST-001`, `NEVER-TOAST-001`, `SEAM-EXP-04`

### `CASE-EXP-09`: Export Button Rendering & Focus Rings in History Drawer
- **Actor**: `StandardUser`
- **Preconditions**: History drawer opened.
- **Action Sequence / Input**: Inspect drawer header controls (`#export-csv`, `#export-txt`, `#copy-result`).
- **Expected Outcome**: All buttons have descriptive `aria-label`s, tactile styling, and visible `:focus-visible` outline rings conforming to WCAG 2.2 AA.
- **Enforces**: `RULE-UI-010`, `RULE-EXP-001`

### `CASE-EXP-10`: Rapid Successive Action Toast Debouncing
- **Actor**: `StandardUser`
- **Preconditions**: Drawer open.
- **Action Sequence / Input**: Rapidly click `#export-csv`, then `#export-txt`, then `#copy-result` within 500ms.
- **Expected Outcome**: Active timer resets via `clearTimeout()`, final message displays cleanly, and toast dismisses 2.5 seconds after the final click.
- **Enforces**: `DEC-EXP-04`, `RULE-TOAST-001`

### `CASE-EXP-11`: Mobile Viewport Zero-Overflow Constraint (320px–390px)
- **Actor**: `StandardUser`
- **Preconditions**: Viewport sized to 320px, 375px, and 390px widths.
- **Action Sequence / Input**: Open history drawer with export action buttons displayed.
- **Expected Outcome**: Action bar wraps cleanly (`flex-wrap: wrap`); `scrollWidth <= clientWidth` holds across all mobile viewport widths.
- **Enforces**: `RULE-UI-009`, `RULE-EXP-001`

---

## 2. Stall Scenarios (12 Failure Modes & Mitigations)

| Stall ID | Scenario Description | Impact | Likelihood | Automated Recovery / Mitigation |
| :--- | :--- | :---: | :---: | :--- |
| `STL-EXP-01` | Formula contains commas breaking CSV column alignment | High | High | Wrap formula in RFC 4180 double quotes (`"2,000 + 1 = 2001"`). |
| `STL-EXP-02` | Formula contains double quotes breaking CSV parsing | High | Medium | Escape quotes as `""` per RFC 4180 standard. |
| `STL-EXP-03` | User clicks Export CSV before any calculations exist | Low | Medium | Emit header row only; display confirmation toast without throwing. |
| `STL-EXP-04` | User clicks Export TXT before any calculations exist | Low | Medium | Emit `(No calculation entries recorded)\n` line without crashing. |
| `STL-EXP-05` | Clipboard write fails in insecure HTTP context | Medium | Low | Execute `document.execCommand('copy')` fallback cleanly. |
| `STL-EXP-06` | Both clipboard APIs fail or are denied by browser | Low | Low | Display `"Unable to copy to clipboard"` status toast; catch error cleanly. |
| `STL-EXP-07` | Rapid repeated clicks spawn overlapping toast elements | Low | Medium | Single singleton `#calc-toast` element with debounced timeout handle. |
| `STL-EXP-08` | Toast interrupts keyboard focus during intensive calculation | High | Low | Toast container never invokes `.focus()`; uses passive `aria-live="polite"`. |
| `STL-EXP-09` | Object URL memory leak on repeated file exports | Medium | Medium | Immediately schedule `URL.revokeObjectURL(url)` after download trigger. |
| `STL-EXP-10` | Export buttons overflow history drawer on 320px screen | High | Low | Flex container with `flex-wrap: wrap` and `max-width: 100%`. |
| `STL-EXP-11` | Non-standard line endings corrupt text file parsing | Low | Low | Use standardized `\n` line delimiters across all exports. |
| `STL-EXP-12` | Slotted custom display misses clipboard copy synchronization | Low | Low | Copy action reads active current buffer directly from `CalcEngine`. |

---

## 3. Specification Traceability Matrix

| Test Case | Invariant / Rule | Flow State / Decision | Target Code Location |
| :--- | :--- | :--- | :--- |
| `CASE-EXP-01` | `RULE-EXP-001` | `FLW-EXP-01`, `SEAM-EXP-01` | `src/engine/calc-engine.ts:exportHistoryToCSV` |
| `CASE-EXP-02` | `RULE-EXP-001`, `NEVER-EXP-001` | `DEC-EXP-02` | `src/engine/calc-engine.ts:exportHistoryToCSV` |
| `CASE-EXP-03` | `RULE-EXP-001` | `SEAM-EXP-01` | `src/engine/calc-engine.ts:exportHistoryToCSV` |
| `CASE-EXP-04` | `RULE-EXP-001` | `FLW-EXP-02`, `SEAM-EXP-02` | `src/engine/calc-engine.ts:exportHistoryToText` |
| `CASE-EXP-05` | `RULE-EXP-001` | `DEC-EXP-01` | `src/engine/calc-engine.ts:exportHistoryToCSV` |
| `CASE-EXP-06` | `RULE-CLIP-001` | `FLW-EXP-03`, `SEAM-EXP-04` | `src/components/stay-calc.ts:copyToClipboard` |
| `CASE-EXP-07` | `RULE-CLIP-001`, `NEVER-EXP-002` | `DEC-EXP-03`, `REC-EXP-01` | `src/components/stay-calc.ts:copyToClipboard` |
| `CASE-EXP-08` | `RULE-TOAST-001`, `NEVER-TOAST-001` | `SCR-EXP-03`, `SEAM-EXP-04` | `src/components/stay-calc.ts:showToast` |
| `CASE-EXP-09` | `RULE-UI-010` | `SCR-EXP-01` | `src/components/stay-calc.ts:render` |
| `CASE-EXP-10` | `DEC-EXP-04`, `RULE-TOAST-001` | `DEC-EXP-04` | `src/components/stay-calc.ts:showToast` |
| `CASE-EXP-11` | `RULE-UI-009` | `SCR-EXP-01` | `src/components/stay-calc.ts:styles` |
