---
type: Flow
title: "F7: Calculation Tape Export Flow"
description: "Screen transitions and interaction logic for exporting tape and copying to clipboard."
status: stable
tags: [flow, export, clipboard, f7]
generated: { by: "factory:planner", at: "2026-10-13T14:32:00Z" }
sources:
  - id: source-feature
    resource: docs/context/features/f7-tape-export/feature.md
    title: F7 Feature Specification
---

# User Flow: Calculation Tape Export (F7)

## 1. Flow Diagram

```mermaid
graph TD
  A[User Opens History Drawer] --> B{Entries Exist?}
  B -- No --> C[Display Empty Notice / Disable Export]
  B -- Yes --> D[Show History List + Action Bar]
  D --> E[User Clicks Copy Tape]
  E --> F[Serialize to Formatted Text]
  F --> G[Write to Clipboard API / Return String]
  D --> H[User Clicks Export JSON]
  H --> I[Serialize to RFC 8259 JSON]
  I --> J[Trigger Data Payload Download / Event]
```

## 2. Interaction States
- **SCR-EXP-01 (Drawer Action Bar)**: Top bar of history drawer houses `Copy`, `JSON`, and `Clear` buttons.
- **DEC-EXP-01 (Clipboard Availability)**: If `navigator.clipboard` is available and active document is focused, copy async; else emit or return string payload safely.
- **REC-EXP-01 (Empty State Guard)**: When tape is empty, copy action notifies "Tape is empty" without clipboard mutation.
