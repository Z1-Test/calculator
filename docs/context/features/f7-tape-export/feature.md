---
type: Feature
title: "F7: Calculation Tape Export & Clipboard"
description: "Export history tape calculations as formatted plain text or structured JSON, with clipboard copy integration."
status: stable
tags: [feature, export, clipboard, history, f7]
generated: { by: "factory:planner", at: "2026-10-13T14:32:00Z" }
sources:
  - id: source-issue-25
    resource: https://github.com/Z1-Test/calculator/issues/25
    title: Issue 25 - Calculation Tape Export & Clipboard Copy
---

# Feature Specification: Calculation Tape Export & Clipboard (F7)

## 1. Intent & Scope
Users who perform multiple calculations in StayCalc need a reliable, native mechanism to extract their calculation session for documentation, audit trails, and sharing. Feature F7 provides export serialization services and clipboard copy capabilities directly within the calculation history drawer.

## 2. Behavioral Rules & Invariants
- `RULE-EXP-001 (Text Serialization)`: Formatted text export presents entries sequentially:
  ```
  StayCalc Calculation Tape
  -------------------------
  [expression] = [result]
  ...
  -------------------------
  Total Entries: [count]
  ```
- `RULE-EXP-002 (JSON Serialization)`: Formatted JSON export produces standard RFC 8259 JSON array of history objects containing `id`, `expression`, `result`, and `timestamp`.
- `RULE-EXP-003 (Empty Tape Protection)`: Exporting or copying an empty tape produces clear indicator `"Tape is empty"`, avoiding corrupt output or undefined crashes.
- `RULE-EXP-004 (Clipboard Fallback)`: Clipboard copy operations gracefully handle environments without `navigator.clipboard` by providing plain formatted string returns for direct consumption.
- `RULE-EXP-005 (Zero External Dependencies)`: Native TypeScript serialization with zero external libraries.

## 3. Architecture & Data Contracts
Export service lives in `src/services/history-export.ts`:
```ts
export interface ExportPayload {
  format: 'text' | 'json';
  content: string;
  count: number;
}
```
Integration within `<stay-calc>` drawer exposes:
- `button#btn-copy-history`: Copies formatted tape text to clipboard.
- `button#btn-export-json`: Downloads or generates structured JSON tape.
