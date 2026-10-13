---
type: Specification
title: "StayCalc Routes & Surface Mapping"
description: "Surface routing, URL parameter state binding, and modal overlay navigation for StayCalc."
status: stable
tags: [routes, surfaces, navigation, state]
generated: { by: "human:maintainer", at: "2026-10-08T00:00:00Z" }
sources:
  - id: source-architecture
    resource: docs/context/project/architecture.md
    title: System Architecture
---

# StayCalc Routes & Surface Mapping

## 1. Surface Architecture

StayCalc operates on a unified single-page application surface (`/`) with state reflection via URL query parameters and HTML history API:

| Route / State URL | Mode / View | Active Components | Description |
| :--- | :--- | :--- | :--- |
| `/` or `/?mode=standard` | Standard Mode | `<stay-calc-keypad mode="standard">` | Basic 4-function arithmetic and memory keys. |
| `/?mode=scientific` | Scientific Mode | `<stay-calc-keypad mode="scientific">` | Advanced trigonometry, powers, logs, and angle units. |
| `/?mode=programmer` | Programmer Mode | `<stay-calc-keypad mode="programmer">` | Radix conversion (HEX/DEC/OCT/BIN) and bitwise operations. |
| `/?panel=history` | History Overlay | `<stay-calc-history open="true">` | Slide-over drawer displaying chronological calculation tape. |

## 2. Deep Linking & State Synchronization

- **Query Param Synchronization**: Mode selection updates `window.location.search` without triggering page reloads.
- **Back/Forward Button Navigation**: Browser history navigation (`popstate` events) cleanly transitions between modes without clearing active numeric buffers.
- **Preference Fallback**: If no URL parameter is present, the app defaults to the user's saved preference in `localStorage` or `standard`.
