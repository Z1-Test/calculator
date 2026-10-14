---
type: Test Cases
title: "History Tape Export and Clipboard Copy Test Cases"
status: stable
description: "Unified test scenarios CASE-01 to CASE-11, 12-stall matrix, traceability chain, and N/A declarations for History Tape Export and Clipboard Copy."
tags: [cases, test-cases, history, export, clipboard, csv, text, okf-v0.2]
sources:
  - resource: ./feature.md
  - resource: ./flow.md
---

# Test Cases: History Tape Export and Clipboard Copy

Authoritative test scenarios for the StayCalc calculation history tape export subsystem (Plain Text and CSV formats), active result and history clipboard integration, and accessible auto-dismissing toast notifications. Grounded in `docs/context/project/domain-rules.md`, Feature rules (`RULE-*` / `NEVER-*`), and Flow decisions.

---

## 1. Universal Scenarios (11 Standard Types)

### `CASE-01`: Happy Path Nominal Execution (Plain Text Format History Export)
- **Actor**: `GeneralUser` / `SpreadsheetAnalyst`
- **Preconditions**: Calculator history tape populated with two calculations (`12 + 8 = 20` and `5 * 4 = 20`).
- **Action Sequence / Input**:
  - Invoke `exportHistoryToText(engine.getHistory())` or click `#btnExportTxt`.
- **Expected Outcome**:
  - Export string contains header `"--- StayCalc Calculation History ---"`.
  - Export rows contain `[1] 5 * 4 = 20 (<ISO_TIMESTAMP>)` and `[2] 12 + 8 = 20 (<ISO_TIMESTAMP>)`.
  - Export footer contains `Total calculations: 2 | Summary total: 40`.
  - Dispatches `export-history` CustomEvent with `{ format: 'text', content, count: 2, total: 40 }`.
  - Shows toast `"History exported as TXT"`.
- **Enforces**: `RULE-CALC-005`, `SEAM-ENGINE-02`, `SEAM-UI-01`, `NEVER-CALC-001`

### `CASE-02`: Happy Path Nominal Execution (CSV Format History Export)
- **Actor**: `SpreadsheetAnalyst`
- **Preconditions**: Calculator history tape populated with calculations (`10 + 5 = 15` and `6 * 7 = 42`).
- **Action Sequence / Input**:
  - Invoke `exportHistoryToCsv(engine.getHistory())` or click `#btnExportCsv`.
- **Expected Outcome**:
  - Export string begins with RFC-compliant CSV header: `'"Index","Expression","Result","Timestamp","ISO"'`.
  - Contains row: `1,"6 * 7","42",<TIMESTAMP>,"<ISO_TIMESTAMP>"`.
  - Contains row: `2,"10 + 5","15",<TIMESTAMP>,"<ISO_TIMESTAMP>"`.
  - Dispatches `export-history` CustomEvent with `{ format: 'csv', content, count: 2, total: 57 }`.
  - Shows toast `"History exported as CSV"`.
- **Enforces**: `RULE-CALC-005`, `SEAM-ENGINE-02`, `SEAM-UI-01`

### `CASE-03`: Empty State & First Use (Copy & Export on Empty History Tape)
- **Actor**: `GeneralUser`
- **Preconditions**: Freshly mounted calculator with zero recorded calculations.
- **Action Sequence / Input**:
  - Click `#btnCopyHistory`.
  - Click `#btnExportTxt`.
  - Click `#btnExportCsv`.
- **Expected Outcome**:
  - Clicking `#btnCopyHistory` displays toast `"No history to copy"` and does not write to clipboard.
  - Clicking `#btnExportTxt` displays toast `"No history to export"` and does not dispatch `export-history`.
  - Clicking `#btnExportCsv` displays toast `"No history to export"` and does not dispatch `export-history`.
  - Direct call to `exportHistoryToText([])` produces clean header and `Total calculations: 0 | Summary total: 0`.
  - Direct call to `exportHistoryToCsv([])` produces clean CSV header line.
- **Enforces**: `RULE-UI-002`, `RULE-RESP-001`, `SEAM-ENGINE-02`

### `CASE-04`: Active Result Clipboard Copy (#btnCopyResult)
- **Actor**: `GeneralUser`
- **Preconditions**: Calculator display shows calculation result `"90"` (from `15 * 6 =`).
- **Action Sequence / Input**:
  - Click `#btnCopyResult` or call `copyResult()`.
- **Expected Outcome**:
  - `navigator.clipboard.writeText("90")` is invoked.
  - Toast displays `"Result copied to clipboard"`.
  - Dispatches `copy-clipboard` CustomEvent with `{ text: "90", success: true }`.
- **Enforces**: `RULE-UI-002`, `SEAM-UI-01`

### `CASE-05`: Full History Tape Clipboard Copy (#btnCopyHistory)
- **Actor**: `GeneralUser`
- **Preconditions**: History tape contains calculations `3 + 2 = 5` and `8 * 2 = 16`.
- **Action Sequence / Input**:
  - Click `#btnCopyHistory` or call `copyHistory()`.
- **Expected Outcome**:
  - History tape text format is passed to `navigator.clipboard.writeText`.
  - Toast displays `"History copied to clipboard"`.
  - Dispatches `copy-clipboard` CustomEvent with `{ text, success: true }`.
- **Enforces**: `RULE-UI-002`, `SEAM-ENGINE-02`, `SEAM-UI-01`

### `CASE-06`: Precision Normalization & Summary Total in Exports (IEEE-754 Artifact Elimination)
- **Actor**: `GeneralUser` / `SpreadsheetAnalyst`
- **Preconditions**: History contains `0.1 + 0.2 = 0.3` and `0.7 + 0.1 = 0.8`.
- **Action Sequence / Input**:
  - Invoke `exportHistory('text')`.
- **Expected Outcome**:
  - Both expression results are normalized cleanly (`"0.3"`, `"0.8"`).
  - Summary total is computed as normalized `"1.1"` without floating point noise like `1.1000000000000001`.
  - Return contract matches `HistoryExportResult` (`{ format: 'text', count: 2, total: 1.1, content }`).
- **Enforces**: `RULE-CALC-002`, `RULE-CALC-005`, `NEVER-CALC-004`

### `CASE-07`: Error State Exclusion from History Exports (RULE-CALC-007)
- **Actor**: `GeneralUser`
- **Preconditions**: One valid calculation `10 + 2 = 12` recorded, followed by `10 / 0 =` triggering `"Cannot divide by zero"`.
- **Action Sequence / Input**:
  - Invoke `exportHistoryAsText()`.
- **Expected Outcome**:
  - History tape contains exactly 1 entry (`10 + 2 = 12`).
  - Error state is completely absent from export rows.
  - Summary total is `12` and total calculations count is `1`.
- **Enforces**: `RULE-CALC-001`, `RULE-CALC-007`, `NEVER-CALC-004`

### `CASE-08`: Export Persistence Across C and AC Clears (RULE-CALC-008)
- **Actor**: `GeneralUser`
- **Preconditions**: Three calculations performed.
- **Action Sequence / Input**:
  - User clicks `C` (Clear active buffer).
  - User clicks `AC` (All Clear registers).
  - Inspect exported history via `exportHistory('text')` and `exportHistory('csv')`.
- **Expected Outcome**:
  - All 3 calculations remain in history tape.
  - Both text and CSV exports contain all 3 entries.
  - Export count remains 3 and summary total is identical.
- **Enforces**: `RULE-CALC-008`, `RULE-CALC-009`

### `CASE-09`: History Export After Explicit Clear (#clearHistory & CLEAR_HISTORY)
- **Actor**: `GeneralUser`
- **Preconditions**: History tape contains recorded calculations.
- **Action Sequence / Input**:
  - Click `#clearHistory` button.
  - Invoke `exportHistoryAsText()`.
  - Click `#btnExportTxt`.
- **Expected Outcome**:
  - History tape length is 0.
  - `exportHistoryAsText()` returns empty header and `Total calculations: 0 | Summary total: 0`.
  - Clicking `#btnExportTxt` displays toast `"No history to export"`.
- **Enforces**: `RULE-CALC-008`, `RULE-UI-002`, `SEAM-ENGINE-02`

### `CASE-10`: 100-Entry FIFO Cap Export Integrity (RULE-CALC-005)
- **Actor**: `GeneralUser`
- **Preconditions**: Clean calculator state.
- **Action Sequence / Input**:
  - Execute 105 distinct calculations sequentially (`1 + 1 = 2`, ..., `1 + 105 = 106`).
  - Invoke `exportHistory('csv')` and `exportHistory('text')`.
- **Expected Outcome**:
  - Exported entries count is exactly 100 (`RULE-CALC-005`).
  - Oldest 5 entries are pruned (FIFO).
  - Summary total accurately reflects the sum of the 100 retained entries.
- **Enforces**: `RULE-CALC-005`, `NEVER-CALC-004`

### `CASE-11`: Toast Notification Lifecycle, Debounce Timer Reset & A11y ARIA Live Region
- **Actor**: `ScreenReaderUser` / `KeyboardPowerUser`
- **Preconditions**: `<stay-calc>` mounted with `#toastNotification` element.
- **Action Sequence / Input**:
  - Verify `#toastNotification` has attributes `role="status"`, `aria-live="polite"`, `aria-atomic="true"`.
  - Trigger `showToast("First message", 2000)`.
  - Immediately trigger `showToast("Second message", 2000)` before timer finishes.
  - Verify timer debounce reset and eventual auto-dismissal.
  - Test graceful fallback when `navigator.clipboard.writeText` rejects.
- **Expected Outcome**:
  - Toast displays `"Second message"` smoothly; timer resets without premature disappearance.
  - Toast auto-dismisses after duration.
  - Clipboard write rejection is caught cleanly without throwing uncaught errors; component stays fully responsive.
- **Enforces**: `RULE-UI-002`, `RULE-RESP-001`, `SEAM-UI-01`

---

## 2. Lived-System Stall Matrix (12 Canonical Stalls)

| Stall # & Name | Trigger Condition | Visible System Response | Recovery Action | Target Test File |
| :--- | :--- | :--- | :--- | :--- |
| **1. Empty or zero match** | Copy/Export clicked before any calculations | Toast displays `"No history to copy"` or `"No history to export"` | User completes a calculation | `test/export.test.ts` |
| **2. Stuck or slow wait** | Exporting 100 history entries | Synchronous format generation (`< 2ms`) | Instant execution | `test/export.test.ts` |
| **3. Bad or incomplete input** | Entry contains non-numeric result or special characters | Formatters safely parse numbers; non-finite falls back to 0 | Safe numeric sanitization | `test/export.test.ts` |
| **4. Hard failure or outage** | `navigator.clipboard.writeText` throws/rejects | Rejection caught gracefully; dispatches event with `success: false` | Component remains responsive | `test/export.test.ts` |
| **5. Double-tap or race** | Rapid repeated clicks on copy or export | Toast timer debounced; active timeout cleared before new timer | Seamless notification update | `test/export.test.ts` |
| **6. Two concurrent sessions** | Multiple `<stay-calc>` instances active | Each component maintains isolated toast, history, and clipboard flows | Isolated component state | `test/export.test.ts` |
| **7. Partial success** | 105 calculations executed in session | Exactly 100 entries exported; oldest 5 pruned via FIFO | Continuous FIFO enforcement | `test/export.test.ts` |
| **8. Leave and return** | History drawer open during export/copy | Drawer remains open; user focus preserved | Seamless continuation | `test/export.test.ts` |
| **9. Offline** | Complete offline environment | Zero-dependency local formatting and clipboard dispatch | Full offline support | `test/export.test.ts` |
| **10. Stale seam arrival** | Unknown format passed to `exportHistory()` | Defaults safely to `'text'` format | Return valid text result | `test/export.test.ts` |
| **11. UI desync** | Toast element text or timer out of sync | Timer reset on every `showToast()` call | Debounce timer reset | `test/export.test.ts` |
| **12. Auth halfway** | N/A (Guest-safe client utility) | Unrestricted local utility | N/A | `test/export.test.ts` |

---

## 3. Traceability Chain

| Rule / Invariant ID | Flow Decision | Seam ID | Case ID | Test Category | Target Test File |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `RULE-CALC-005` | `DEC-EXP-01` | `SEAM-ENGINE-02` | `CASE-01` | Plain Text Export | `test/export.test.ts` |
| `SEAM-UI-01` | `DEC-EXP-01` | `SEAM-UI-01` | `CASE-01` | Export CustomEvent | `test/export.test.ts` |
| `RULE-CALC-005` | `DEC-EXP-01` | `SEAM-ENGINE-02` | `CASE-02` | CSV Export | `test/export.test.ts` |
| `RULE-UI-002` | `DEC-EXP-02` | `SEAM-UI-01` | `CASE-03` | Empty State Guards | `test/export.test.ts` |
| `RULE-UI-002` | `DEC-EXP-04` | `SEAM-UI-01` | `CASE-04` | Active Result Copy | `test/export.test.ts` |
| `RULE-UI-002` | `DEC-EXP-04` | `SEAM-UI-01` | `CASE-05` | History Tape Copy | `test/export.test.ts` |
| `RULE-CALC-002` | `DEC-EXP-01` | `SEAM-ENGINE-02` | `CASE-06` | Precision Normalization | `test/export.test.ts` |
| `RULE-CALC-007` | `DEC-EXP-01` | `SEAM-ENGINE-02` | `CASE-07` | Error State Exclusion | `test/export.test.ts` |
| `RULE-CALC-008` | `DEC-EXP-01` | `SEAM-ENGINE-02` | `CASE-08` | C & AC Persistence | `test/export.test.ts` |
| `RULE-CALC-008` | `DEC-EXP-02` | `SEAM-ENGINE-02` | `CASE-09` | Post-Clear Export | `test/export.test.ts` |
| `RULE-CALC-005` | `DEC-EXP-01` | `SEAM-ENGINE-02` | `CASE-10` | 100-Entry FIFO Cap | `test/export.test.ts` |
| `RULE-UI-002` | `DEC-EXP-03` | `SEAM-UI-01` | `CASE-11` | Toast Lifecycle & A11y | `test/export.test.ts` |

---

## 4. Cases N/A Declarations

- **Network Latency & Timeout (`CASE-06` in macro catalog)**: N/A (Export and clipboard operations are synchronous/browser-local without network calls).
- **Tenant Auth & Permissions (`CASE-03` in macro catalog)**: N/A (StayCalc export and clipboard tools operate locally within the client browser session without user access controls).

---

## 5. References
- [Feature Specification](./feature.md)
- [User Flow & Decision Trees](./flow.md)
