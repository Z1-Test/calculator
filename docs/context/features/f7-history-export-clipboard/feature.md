---
type: Feature
title: "F7: History Tape Export & Clipboard Copy"
status: stable
description: "Authoritative product problem, rules, boundary invariants, scope, and survivability matrix for History Tape Export and Clipboard Copy."
tags: [feature, history, export, clipboard, csv, text, web-component, okf-v0.2]
sources:
  - resource: ../../project/vision.md
  - resource: ../../project/domain-rules.md
  - resource: ../../project/architecture.md
  - resource: ../../project/design.md
  - resource: ../f1-precision-arithmetic-engine/feature.md
  - resource: ../f2-accessible-ui-keyboard-nav/feature.md
  - resource: ../f4-calculation-history-tape/feature.md
---

# Feature: F7 - History Tape Export & Clipboard Copy

Authoritative product specification for the StayCalc calculation history tape export subsystem (Plain Text and CSV formats), active result and history clipboard integration, and accessible auto-dismissing toast notifications. Governed by `docs/context/project/`.

## 1. Problem, Actors & Outcome
- **Problem & Context**: Users calculating financial totals, engineering estimates, or multi-step arithmetic need to extract calculation audit trails out of the calculator into external tools such as spreadsheets, text editors, email clients, and documentation systems. Currently, history is confined to the visual history drawer within `<stay-calc>`, requiring manual re-typing. Users require one-click mechanisms to copy the active calculation result, copy the complete history tape to the system clipboard, or export history in structured formats (Plain Text `.txt` and Comma-Separated Values `.csv`). In addition, copy and export operations must provide accessible, non-intrusive feedback via an accessible auto-dismissing toast notification with debounce timer resets, while gracefully handling empty history states and clipboard permission denials without throwing uncaught runtime exceptions.
- **Target Actors & Roles**:
  | Role / Persona | Surface | Arrival State / Prerequisite | Permissions & Access |
  | :--- | :--- | :--- | :--- |
  | `GeneralUser` | `<stay-calc>` History Drawer | History drawer open or closed | Copy active result, copy full history tape, export history as TXT or CSV |
  | `SpreadsheetAnalyst` | Data ingest surface | External spreadsheet or text editor | Ingest exported CSV or formatted plain text audit trails |
  | `KeyboardPowerUser` | `<stay-calc>` Host | Physical keyboard navigation | Tab-navigate drawer action buttons, receive visible focus indicators |
  | `ScreenReaderUser` | `<stay-calc>` ARIA Live Region | Assistive technology active | Receive polite ARIA live announcements from `#toastNotification` (`aria-live="polite"`) |
- **Checkable Success ("This Worked")**:
  1. Plain Text export (`exportHistoryToText`) produces a standardized audit tape header (`"--- StayCalc Calculation History ---"`), 1-indexed rows `[${index + 1}] ${expression} = ${result} (${isoTimestamp})`, and a summary footer `Total calculations: ${count} | Summary total: ${formatNumber(total)}`.
  2. CSV export (`exportHistoryToCsv`) outputs RFC 4180-compliant header `'"Index","Expression","Result","Timestamp","ISO"'` and rows `${index + 1},"${expression}","${result}",${timestamp},"${isoTimestamp}"`.
  3. Action controls inside the history drawer (`#btnCopyResult`, `#btnCopyHistory`, `#btnExportTxt`, `#btnExportCsv`) trigger corresponding copy and export workflows.
  4. Copying active result (`#btnCopyResult`) safely writes current display to clipboard, displays `"Result copied to clipboard"` toast, and dispatches `copy-clipboard` CustomEvent.
  5. Copying history (`#btnCopyHistory`) safely writes plain text formatted tape to clipboard, displays `"History copied to clipboard"` toast, and dispatches `copy-clipboard` CustomEvent.
  6. Attempting to copy or export with an empty history displays polite feedback (`"No history to copy"` / `"No history to export"`) without throwing or corrupting state.
  7. Accessible `#toastNotification` container (`role="status"`, `aria-live="polite"`, `aria-atomic="true"`) displays feedback, automatically dismisses after duration (default 2000ms), and debounces timer resets on rapid successive triggers.
  8. Clipboard copy helper wraps `navigator.clipboard?.writeText(text)` safely, catching permission or environment rejections without throwing unhandled exceptions.
  9. CustomEvents `export-history` and `copy-clipboard` are dispatched to host application (`SEAM-UI-01`).
  10. Zero external runtime dependencies are introduced; container queries ensure zero horizontal scroll overflow across 320px–390px mobile viewports (`RULE-RESP-001`).
- **Checkable Failure ("This Is Broken")**: Error states included in export total or rows; unhandled rejection when clipboard is unavailable; toast notification fails to auto-dismiss or stutters on rapid clicks; horizontal scrollbar appears on mobile viewports; external npm packages installed.

## 2. Scope & Boundary Invariants
- **In This Revision**:
  - `HistoryExportFormat` union: `'text' | 'csv'`.
  - `HistoryExportResult` contract: `{ readonly format: HistoryExportFormat; readonly content: string; readonly count: number; readonly total: number; }`.
  - Precision engine export formatters: `exportHistoryToText()` and `exportHistoryToCsv()`.
  - Facade methods on `CalculatorEngine`: `exportHistoryAsText()`, `exportHistoryAsCsv()`, `exportHistory(format)`.
  - Drawer action controls: `#btnCopyResult`, `#btnCopyHistory`, `#btnExportTxt`, `#btnExportCsv`.
  - Accessible `#toastNotification` live region (`role="status"`, `aria-live="polite"`, `aria-atomic="true"`).
  - Toast dismissal lifecycle with auto-dismiss and debounce timer reset (`showToast(message, duration)`).
  - Empty history guard messages: `"No history to copy"`, `"No history to export"`.
  - Safe clipboard copy helper with graceful rejection fallback.
  - Event dispatching: `export-history` and `copy-clipboard` CustomEvents.
  - Responsive container queries and CSS logical properties with zero horizontal scroll overflow (320px–390px).
- **Refused / Owned Elsewhere**:
  - Direct file system download triggers / blob anchor clicks (`<a download>`) that require host DOM file handling.
  - Server-side export persistence or cloud database storage.
  - PDF or binary spreadsheet (.xlsx) generation (strictly zero external dependencies).
- **Underlying Product Rules (Screen-Agnostic Truths)**:
  - `RULE-CALC-005` (History Tape Cap): The local history tape retains a maximum of 100 entries. Export formatters format exactly the entries currently in the history tape (max 100).
  - `RULE-CALC-007` (Exclude Error States from History): Error states (`"Cannot divide by zero"`, `"Invalid input"`) are excluded from history tape and exports; summary totals strictly sum valid finite calculation results.
  - `RULE-CALC-008` (History Persistence across Clears): History tape and export capability persist across buffer clear (`C`) and all-clear (`AC`), resetting only upon explicit history clearance (`CLEAR_HISTORY`).
  - `RULE-UI-002` (Accessible History Drawer, Controls & Keyboard Focus): `<stay-calc>` encapsulates drawer action buttons (`#btnCopyResult`, `#btnCopyHistory`, `#btnExportTxt`, `#btnExportCsv`) and `#toastNotification` with accessible labels, polite ARIA live attributes, and visible focus rings.
  - `RULE-RESP-001` (Responsive Layout & Mobile Zero Overflow): All drawer action buttons, history items, and toast notifications adhere to container queries (`@container calc-host`) with zero horizontal scroll overflow (`scrollWidth <= clientWidth`) across 320px–390px viewports.
- **What Must Never Happen**:
  - `NEVER-CALC-001` (No Dynamic Eval): Never evaluate history expressions or export totals using `eval()` or `new Function()`.
  - `NEVER-CALC-004` (No Unhandled NaN/Infinity): Export formatters and clipboard payload never emit `NaN` or `Infinity`; non-finite result values default to 0 in summary calculations.

## 3. Object Lifecycle, Survivability & Storage Architecture
- **Dual-Tier Draft Storage**:
  - **Tier 1 (Client In-Memory Engine State)**: `CalculatorState.history` storing immutable `readonly CalculationHistoryEntry[]` capped at 100 items, and `CalculatorState.display`.
  - **Tier 2 (Component DOM Projection & Feedback)**: Shadow DOM elements (`#btnCopyResult`, `#btnCopyHistory`, `#btnExportTxt`, `#btnExportCsv`, `#toastNotification`) rendered within `<stay-calc>`.
- **SLA & Latency Ceilings**:
  - Export string generation (`exportHistoryToText`, `exportHistoryToCsv`): synchronous execution `<= 2ms` for 100 entries.
  - Clipboard copy operation: asynchronous `<= 50ms` browser clipboard dispatch.
  - Toast display and debounce reset: immediate synchronous DOM update `<= 16ms`.

| Entity / Object | Identity Model | State (Draft vs Committed) | Survives Refresh? | Survives App Kill? | Survives Clear (C)? | Survives All Clear (AC)? | Survives Clear History? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Export Formatted String | Computed String | Transient Payload | No | No | Yes (`RULE-CALC-008`) | Yes (`RULE-CALC-008`) | Returns empty tape format |
| Clipboard Data | OS Clipboard Buffer | Committed System Data | Yes (System level) | Yes | Yes | Yes | Yes |
| `#toastNotification` | Shadow DOM Live Region | UI Ephemeral Message | No | No | Yes | Yes | Yes |
| Action Buttons | Shadow DOM Interactive Nodes | Static Interactive Nodes | Yes | Yes | Yes | Yes | Yes |

## 4. Notifications, Auditing & Reporting
- **Accessible Toast Live Region**: `#toastNotification` is configured with `role="status"`, `aria-live="polite"`, `aria-atomic="true"` ensuring screen readers announce copy and export status messages automatically without interrupting active user speech.
- **Auto-Dismiss & Debounce**: Toast automatically clears after 2000ms. Rapid consecutive triggers clear any active timeout and restart the 2000ms display timer smoothly.
- **CustomEvent Dispatch**:
  - `export-history`: Dispatched on export action with `detail: { format: HistoryExportFormat, content: string, count: number, total: number }`.
  - `copy-clipboard`: Dispatched on clipboard copy attempts with `detail: { text: string, type?: 'result' | 'history', success: boolean }`.

## 5. Cross-Feature Seams (`SEAM-*`)
Seam contracts live in this file — do **not** author a separate `contract.md` in the slice.

| Seam ID | Source Slice | Destination Slice | Arrival Payload | Handoff Payload | Failure Owner | Related RULE / NEVER |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `SEAM-ENGINE-02` | F7 UI (`<stay-calc>`) | F1 Engine Formatters | Format request (`'text' \| 'csv'`) | `HistoryExportResult` (`{ format, content, count, total }`) | destination | `RULE-CALC-005`, `RULE-CALC-007`, `NEVER-CALC-004` |
| `SEAM-UI-01` | F7 UI (`<stay-calc>`) | Host App / Consumers | Custom Events `export-history`, `copy-clipboard` | Event detail payloads | source | `RULE-UI-002`, `RULE-RESP-001` |

## 6. References
- [User Flow](./flow.md)
- [Test Cases](./cases.md)
