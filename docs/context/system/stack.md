---
type: Concept
title: "StayCalc Technology Stack"
description: "Platform standards, runtime choices, build tooling, and zero-dependency invariants for StayCalc."
status: stable
tags: [stack, runtime, custom-elements, pwa, typescript]
generated: { by: "human:maintainer", at: "2026-10-08T00:00:00Z" }
sources:
  - id: source-architecture
    resource: docs/context/project/architecture.md
    title: System Architecture
---

# StayCalc Technology Stack

## 1. Core Stack Specifications

| Tier / Layer | Technology Choice | Rationale |
| :--- | :--- | :--- |
| **Core Framework** | `@staytunedllp/staystack` (`1.11.47`) | Official first-party Staystack foundation runtime and consumer primitives. |
| **Base Contracts & Schemas** | Staybase (`staybase/schema`) | Browser-safe shared schemas, types, and mathematical validation contracts. |
| **Language** | TypeScript 5.8+ / ES2024 | Strict type safety, native BigInt, and modern JS features. |
| **UI Components** | Stayfront Custom Elements & DSD | Direct-composition component standard with Declarative Shadow DOM. |
| **Styling & Theming** | Staylook Tokens (`--sl-*`) | Native design system tokens for light, dark, and OLED color palettes. |
| **Compute Engine** | Web Worker API | Offloads mathematical evaluation and parsing off the main UI thread. |
| **Offline & PWA** | Service Worker API + Web App Manifest | Cache-first offline execution with installability. |
| **Local Storage** | `localStorage` / `IndexedDB` | Low-latency client persistence for calculation history and preferences. |
| **Build & Bundle** | Vite / Native ESBuild | Instant HMR and lightweight optimized tree-shaken static output. |
| **Test Runner** | Node.js Test Runner / Vitest | Fast unit testing of arithmetic parsing and edge cases. |

## 2. Dependency Invariants

- **Staystack Core Foundation**: Built strictly on `@staytunedllp/staystack` (`1.11.47`) and Staystack native primitives (`staybase`, `stayfront`, `staylook`).
- **Zero Third-Party Runtime Dependencies**: Prohibits unauthorized external npm runtime frameworks (React, Vue, lodash, mathjs).
- **Node.js 22+ Compatibility**: Development, build, and test pipelines run on Node.js 22 LTS or newer.
