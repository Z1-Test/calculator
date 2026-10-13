---
type: Flow
title: "F6: Programmer Radix Mode Logic Flow"
description: "Bit-level conversions, radix masking, and bitwise execution pipeline."
status: stable
tags: [flow, programmer, radix, f6]
generated: { by: "factory:planner", at: "2026-10-13T14:24:00Z" }
sources:
  - id: source-feature
    resource: docs/context/features/f6-programmer-mode/feature.md
    title: F6 Feature Specification
---

# Logic Flow: Programmer Radix Mode (F6)

## 1. Execution Pipeline

```mermaid
flowchart TD
    RawInput["Input string in active Radix"] --> ParseBigInt["Parse BigInt with radix base (16, 10, 8, 2)"]
    
    ParseBigInt --> MaskCheck{"Apply Word-Size Mask"}
    MaskCheck -->|BYTE| ApplyMask8["BigInt & 0xFFn"]
    MaskCheck -->|WORD| ApplyMask16["BigInt & 0xFFFFn"]
    MaskCheck -->|DWORD| ApplyMask32["BigInt & 0xFFFFFFFFn"]
    MaskCheck -->|QWORD| ApplyMask64["BigInt & 0xFFFFFFFFFFFFFFFFn"]
    
    ApplyMask8 --> StoreValue["Store canonical BigInt value"]
    ApplyMask16 --> StoreValue
    ApplyMask32 --> StoreValue
    ApplyMask64 --> StoreValue
    
    StoreValue --> FormatBases["Generate String for HEX, DEC, OCT, BIN"]
    FormatBases --> UpdateUI["Render 4 base strips on display card"]
```

## 2. Decision Tree (`DEC-*`)

- **`DEC-F6-001` (Radix Selection)**:
  - User switches active radix (e.g. from DEC to HEX). Digits on keypad adjust (A-F enabled in HEX, 2-9 disabled in BIN, 8-9 disabled in OCT).
- **`DEC-F6-002` (Word Size Clamping)**:
  - Switching word size (e.g. from DWORD to BYTE) immediately clamps existing value via `val & 0xFFn`.
- **`DEC-F6-003` (Bitwise Operations)**:
  - Binary bitwise operations execute sequentially with immediate clamping.
