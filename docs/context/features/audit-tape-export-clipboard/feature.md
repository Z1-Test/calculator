---
type: Feature
title: "Audit Tape Export & Clipboard Synchronization"
status: stable
description: "Accessible calculation audit tape export (CSV and plain text) and clipboard synchronization with non-intrusive toast notifications for StayCalc."
tags: [feature, export, csv, txt, clipboard, toast, okf-v0.2]
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

# Feature: Audit Tape Export & Clipboard Synchronization

Authoritative specification for StayCalc calculation history tape export to standard RFC 4180 CSV and formatted plain text, one-click clipboard synchronization for calculation results, and non-intrusive accessible status toast notifications.

## 1. Problem, Actors & Outcome
- **Problem & Context**: Accountants, engineers, researchers, and students performing continuous calculations need to export their session calculation history tape to persistent file formats (`CSV` and `TXT`) for auditing, bookkeeping, or documentation. Furthermore, users need to copy active calculation results to the system clipboard for immediate reuse in spreadsheets or documents, accompanied by polite, non-intrusive feedback confirming the action.
- **Target Actors & Roles**:
  | Role / Persona | Surface | Arrival State / Prerequisite | Permissions & Access |
  | :--- | :--- | :--- | :--- |
  | `StandardUser` | Browser DOM (`<stay-calc>`) | History drawer opened, entries or active calculation present | Export tape to CSV/TXT, copy result to clipboard, observe status notifications |
- **Checkable Success ("This Worked")**:
  - `CalcEngine` serializes history tape to RFC 4180 CSV with header `timestamp,expression,result\n` via `exportHistoryToCSV()`.
  - `CalcEngine` formats history tape to plain text lines `[YYYY-MM-DD HH:mm:ss UTC] <expression> = <result>\n` via `exportHistoryToText()`.
  - Formulas with commas, double quotes, or parentheses are properly quoted and escaped per RFC 4180 rules.
  - History drawer contains accessible action buttons: `#export-csv`, `#export-txt`, and `#copy-result`.
  - Client-side download helper triggers browser file download using native `Blob` and temporary anchor object URL without foreign dependencies.
  - `#copy-result` copies the active display buffer to `navigator.clipboard.writeText`, falling back gracefully to `document.execCommand('copy')` if rejected or unsupported.
  - `#calc-toast` provides polite accessible status feedback (`role="status"`, `aria-live="polite"`), auto-dismissing after 2.5 seconds without stealing keyboard focus.
  - All export and copy controls maintain `scrollWidth <= clientWidth` across 320px–390px mobile viewports.
- **Checkable Failure ("This Is Broken")**:
  - CSV export generates unescaped delimiters causing column corruption in spreadsheet tools.
  - Clipboard write throws uncaught promise rejections on denied permissions or insecure contexts.
  - Toast notification moves keyboard focus away from current user interactions or interrupts screen readers.
  - UI controls cause horizontal scroll overflow on mobile viewports.
  - External npm packages or libraries are introduced into `package.json`.

## 2. Scope & Boundary Invariants
- **In This Revision**:
  - Export format types (`ExportTapeFormat`, `ExportTapeOptions`) in `src/engine/types.ts`.
  - Pure serialization methods `exportHistoryToCSV()` and `exportHistoryToText()` in `CalcEngine`.
  - History drawer action buttons (`#export-csv`, `#export-txt`, `#copy-result`) in `<stay-calc>`.
  - Client-side download triggers using native Web `Blob` and `URL.createObjectURL()`.
  - Clipboard copy handler with `navigator.clipboard.writeText` and fallback.
  - Polite live region toast container (`#calc-toast`, `role="status"`, `aria-live="polite"`).
  - High-contrast visual styling and `:focus-visible` focus rings for all new controls.
  - Zero-overflow flex-wrapping inside history drawer actions header.
- **Refused / Owned Elsewhere**:
  - Server-side export generation or remote cloud storage (StayCalc is offline-first).
  - External PDF export or Excel binary generation (strictly zero dependencies).
  - Persistent disk storage across browser reloads (addressed in future persistence backlog).
- **Underlying Product Rules**:
  - `RULE-EXP-001` (Deterministic Tape Export): CSV and TXT exports must generate deterministic byte-clean strings conforming to RFC 4180 without external parsing libraries.
  - `RULE-CLIP-001` (Safe Clipboard Synchronization): Clipboard operations must safely catch permission rejections and fallback cleanly without unhandled exceptions.
  - `RULE-TOAST-001` (Polite Live Region Feedback): Status feedback must use `aria-live="polite"` and auto-dismiss without moving keyboard focus.
  - `RULE-CALC-005` (History Tape Cap): The calculation history tape retains a maximum of 50 entries with FIFO pruning.
  - `RULE-UI-009` (Mobile Viewport Zero-Overflow): All components and drawer panels must enforce `scrollWidth <= clientWidth` across 320px–390px mobile viewports.
- **What Must Never Happen**:
  - `NEVER-CALC-001`: Never evaluate or serialize expressions using `eval()` or `new Function()`.
  - `NEVER-EXP-001`: Never leak unescaped quotes or delimiter commas into raw CSV lines.
  - `NEVER-EXP-002`: Never throw unhandled rejections during clipboard write failures.
  - `NEVER-TOAST-001`: Never grab keyboard focus or shift document layout when presenting status toasts.

## 3. System Contracts & Seams
- **`SEAM-EXP-01` (`CalcEngine.exportHistoryToCSV`)**:
  - Signature: `exportHistoryToCSV(options?: ExportTapeOptions): string`
  - Input: Optional `delimiter?: string` (defaults to `,`), `includeHeader?: boolean` (defaults to `true`).
  - Output: Deterministic CSV string. If history is empty, returns `timestamp,expression,result\n`.
- **`SEAM-EXP-02` (`CalcEngine.exportHistoryToText`)**:
  - Signature: `exportHistoryToText(options?: ExportTapeOptions): string`
  - Output: Plain text string. If history is empty, returns `(No calculation entries recorded)\n`.
- **`SEAM-EXP-03` (`<stay-calc>` File Download Trigger)**:
  - Invokes `URL.createObjectURL(new Blob([content], { type }))`, creates a hidden `<a download="...">`, triggers `.click()`, and revokes the object URL.
- **`SEAM-EXP-04` (`<stay-calc>` Clipboard & Toast Synchronization)**:
  - Copies active display value to clipboard.
  - Shows temporary status message in `#calc-toast` with 2500ms auto-dismiss timer.

## 4. Technical Dependencies & Resources
- **Runtime Environment**: Standard W3C Custom Elements and modern web platform APIs.
- **Platform Web APIs**: `Blob`, `URL.createObjectURL`, `URL.revokeObjectURL`, `navigator.clipboard.writeText`, `document.execCommand`.
- **Dependencies**: `dependencies: {}` in `package.json` (strictly 0 external runtime packages).
