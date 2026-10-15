# StayCalc

> High-precision, multi-mode, offline-first Progressive Web App (PWA) calculator built with native W3C Custom Elements, Declarative Shadow DOM (DSD), and pure native Web Standards.

---

## Overview

**StayCalc** is a modern, lightweight, and distraction-free web calculator designed for students, engineers, developers, and everyday users. Built without heavyweight runtime frameworks, StayCalc delivers instant startup, sub-16ms tactile key responsiveness, full offline capabilities, and comprehensive keyboard accessibility.

---

## Features

- 🔢 **Multi-Mode Calculation**:
  - **Standard Mode**: 4-function arithmetic (`+`, `-`, `×`, `÷`), percentage, square root, and memory registers (`M+`, `M-`, `MR`, `MC`).
  - **Scientific Mode**: Advanced trigonometry (`sin`, `cos`, `tan`), inverse/hyperbolic functions, logarithms (`log`, `ln`), powers (`x^y`), constants (`π`, `e`), and angle mode toggling (`DEG` / `RAD`).
  - **Programmer Mode**: Instant radix conversions (`HEX`, `DEC`, `OCT`, `BIN`), bitwise operations (`AND`, `OR`, `XOR`, `NOT`, `LSH`, `RSH`), and bit-width clamping (`BYTE`, `WORD`, `DWORD`, `QWORD`).
- ⚡ **Zero External Runtime Dependencies**: Built directly on native browser standards (W3C Custom Elements, Declarative Shadow DOM, and modern CSS custom properties).
- 🧠 **Memory Registers & Reactive Status Badge**:
  - Discrete memory registers: `M+` (Add to Memory), `M-` (Subtract from Memory), `MR` (Memory Recall), and `MC` (Memory Clear).
  - High-precision normalization preventing IEEE-754 floating-point drift.
  - Reactive visual `M` indicator badge on display when memory holds a non-zero value.
  - Full memory persistence across chained calculations, Clear Entry (`C`), and All Clear (`AC`).
  - Accessible tactile keypad buttons with WCAG 2.2 AA compliant focus rings and screen reader labels.
- 📴 **Offline-First PWA**: Cache-first Service Worker architecture allowing 100% functionality without an active internet connection.
- 🎨 **Dynamic Theming**: Seamless Light, Dark, and System Auto-Detect themes powered by standard CSS design tokens.
- 📜 **Persistent History Tape**: Session calculation history saved locally in `localStorage` with one-click recall to the active display.
- ♿ **WCAG 2.2 AA Accessible**: Full physical keyboard support (Numpad, Enter, Escape, Backspace, shortcuts), high-contrast ratios, and polite ARIA live regions for screen readers.

---

## Quick Start

### Prerequisites
- [Node.js 22+](https://nodejs.org/)

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/Z1-Test/calculator.git
cd calculator

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev

# 4. Run test suite
npm test
```

---

## System Architecture & Specifications

For complete mathematical domain rules, system specifications, design system tokens, and Architectural Decision Records (ADRs), explore the **[Documentation Hub](./docs/context/README.md)**:

- **[Product Vision](./docs/context/project/vision.md)**: Core principles, outcomes, and non-goals.
- **[System Architecture](./docs/context/project/architecture.md)**: Custom Elements topology and calculation protocol.
- **[Domain Rules & Invariants](./docs/context/project/domain-rules.md)**: `RULE-*` and `NEVER-*` mathematical safety policies.
- **[Design System](./docs/context/project/design.md)**: Semantic token recipes, typography, and color tokens.
- **[ADR 0001](./docs/context/decisions/0001-offline-first-pwa-custom-elements.md)**: Offline-first PWA and W3C Custom Elements architectural decision record.

---

## License

MIT © [StayTuned](https://staytuned.website)
