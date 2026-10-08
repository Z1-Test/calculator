---
type: Architecture
title: "StayCalc System Architecture"
description: "Macro architecture, component topology, runtime data flows, and state management for StayCalc."
status: stable
tags: [architecture, topology, custom-elements, pwa]
generated: { by: "human:maintainer", at: "2026-10-08T00:00:00Z" }
sources:
  - id: source-vision
    resource: docs/context/project/vision.md
    title: Product Vision
---

# StayCalc System Architecture

## 1. System Topology

StayCalc operates as a fully client-side Progressive Web Application (PWA) with componentized W3C Custom Elements and an isolated Web Worker calculation engine:

```mermaid
flowchart TD
  subgraph BrowserUI ["Browser UI Thread (W3C Custom Elements + DSD)"]
    Shell["<stay-calc-app> (Application Shell)"]
    Header["<stay-calc-header> (Mode & Theme Controls)"]
    Display["<stay-calc-display> (Expression & Result with ARIA Live)"]
    Keypad["<stay-calc-keypad> (Standard / Scientific / Programmer Keyboards)"]
    HistoryDrawer["<stay-calc-history> (Calculation Tape Overlay)"]
  end

  subgraph StateService ["Local State & Storage Service"]
    StateStore["State Coordinator (Session State, Memory Registers)"]
    LocalStorageAdapter["Local Storage / IndexedDB Adapter"]
  end

  subgraph WorkerThread ["Computation Engine (Web Worker)"]
    CalcWorker["Calculation Worker (Tokenize, Shunting-Yard, BigInt Bitwise)"]
  end

  Shell --> Header
  Shell --> Display
  Shell --> Keypad
  Shell --> HistoryDrawer

  Keypad -->|Input Events| StateStore
  StateStore -->|Evaluate Request| CalcWorker
  CalcWorker -->|Computed Result / Error| StateStore
  StateStore -->|Update Display & Tape| Shell
  StateStore -->|Persist History & Theme| LocalStorageAdapter
```

## 2. Component Boundaries

1. **`<stay-calc-app>`**: Top-level host element managing global keyboard events, active mode routing (`standard`, `scientific`, `programmer`), and theme binding (`light`, `dark`).
2. **`<stay-calc-header>`**: Navigation bar displaying the brand mark, calculation mode selector pills, history toggle button, and theme switch toggle.
3. **`<stay-calc-display>`**: High-contrast, dynamic text display rendering active expression buffer, current evaluation result, memory indicators (`M`), and accessible `aria-live="polite"` announcements.
4. **`<stay-calc-keypad>`**: Responsive grid container projecting standard numeric buttons, operational action triggers (`+`, `-`, `×`, `÷`, `=`), scientific function keys (`sin`, `cos`, `log`, `π`, `^`), and programmer radix/bitwise buttons (`AND`, `OR`, `XOR`, `HEX`, `BIN`).
5. **`<stay-calc-history>`**: Slide-over drawer presenting chronologically recorded calculation entries with one-click reload into the active display buffer.

## 3. Data Flow & Evaluation Lifecycle

- **Input Ingestion**: Button taps and hardware keyboard strokes are normalized into atomic tokens (`NUMBER`, `OPERATOR`, `FUNCTION`, `CONTROL`).
- **Calculation Execution**: Expressions are parsed using a deterministic tokenizer and operator-precedence parser (Shunting-Yard algorithm) inside a dedicated Web Worker to ensure zero UI jank.
- **Precision Normalization**: Decimal floating-point arithmetic is normalized using scaled integer math / epsilon correction to prevent binary approximation artifacts.
- **Persistence**: Successful evaluations are prepended to the local storage history tape and capped at 100 entries.
