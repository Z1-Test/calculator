---
type: Specification
title: "StayCalc Client API & Worker Protocol"
description: "Web Worker messaging contracts, calculation request/response schemas, and storage interfaces."
status: stable
tags: [api, worker, protocol, interfaces]
generated: { by: "human:maintainer", at: "2026-10-08T00:00:00Z" }
sources:
  - id: source-architecture
    resource: docs/context/project/architecture.md
    title: System Architecture
---

# StayCalc Client API & Worker Protocol

## 1. Web Worker Calculation Protocol

The main UI thread communicates with the calculation engine Web Worker using structured postMessage RPC:

### Request Message Schema (`CalcWorkerRequest`)
```typescript
interface CalcWorkerRequest {
  id: string;
  type: "EVALUATE_EXPRESSION" | "CONVERT_RADIX" | "BITWISE_OP";
  payload: {
    expression?: string;
    mode: "standard" | "scientific" | "programmer";
    angleUnit?: "DEG" | "RAD";
    wordSize?: "BYTE" | "WORD" | "DWORD" | "QWORD";
    value?: string;
    targetRadix?: 2 | 8 | 10 | 16;
  };
}
```

### Response Message Schema (`CalcWorkerResponse`)
```typescript
interface CalcWorkerResponse {
  id: string;
  success: boolean;
  result?: string;
  error?: string; // e.g., "Cannot divide by zero", "Syntax Error"
  radixRepresentations?: {
    hex: string;
    dec: string;
    oct: string;
    bin: string;
  };
  durationMs: number;
}
```

## 2. Storage Service Interface

```typescript
interface StorageService {
  getHistory(): CalculationEntry[];
  addHistoryEntry(entry: CalculationEntry): void;
  clearHistory(): void;
  getPreferences(): UserPreferences;
  savePreferences(prefs: Partial<UserPreferences>): void;
}
```
