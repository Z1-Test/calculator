---
type: Specification
title: "StayCalc Data Models & Schema"
description: "Data schemas for calculation history entries, session state, and user preference storage."
status: stable
tags: [data, schema, storage, models]
generated: { by: "human:maintainer", at: "2026-10-08T00:00:00Z" }
sources:
  - id: source-architecture
    resource: docs/context/project/architecture.md
    title: System Architecture
---

# StayCalc Data Models & Schema

## 1. History Record Entity (`CalculationEntry`)

Represents one completed calculation stored in `localStorage` under key `staycalc_history`:

```typescript
interface CalculationEntry {
  id: string;             // UUID v4 or timestamp-slug
  timestamp: string;      // ISO-8601 UTC string (e.g., "2026-10-08T12:00:00Z")
  mode: "standard" | "scientific" | "programmer";
  expression: string;     // Raw input formula, e.g., "45 × (12 + 8)"
  result: string;         // Evaluated output string, e.g., "900"
  radix?: {               // Only populated in programmer mode
    hex: string;
    dec: string;
    oct: string;
    bin: string;
  };
}
```

## 2. User Preferences Entity (`UserPreferences`)

Stored under key `staycalc_preferences`:

```typescript
interface UserPreferences {
  theme: "auto" | "light" | "dark";
  defaultMode: "standard" | "scientific" | "programmer";
  angleUnit: "DEG" | "RAD";
  programmerWordSize: "BYTE" | "WORD" | "DWORD" | "QWORD";
  soundEnabled: boolean;
  hapticsEnabled: boolean;
}
```

## 3. Session State Entity (`SessionState`)

In-memory transient state managed by `<stay-calc-app>`:

```typescript
interface SessionState {
  currentInput: string;
  expressionBuffer: string;
  memoryRegister: number;
  hasActiveMemory: boolean;
  isError: boolean;
  errorMessage: string | null;
}
```
