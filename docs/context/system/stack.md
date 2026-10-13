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
| **Language** | TypeScript / ES2024 | Strict type safety, native BigInt, and modern JS features. |
| **UI Components** | W3C Custom Elements & DSD | Zero-framework native browser standard with Declarative Shadow DOM. |
| **Styling & Theming** | Native CSS + Semantic Custom Properties | Zero runtime CSS-in-JS; uses CSS custom properties for theming. |
| **Compute Engine** | Pure Native Arithmetic Engine | Fast, deterministic decimal arithmetic and state evaluation. |
| **Offline & PWA** | Service Worker API + Web App Manifest | Cache-first offline execution with installability. |
| **Local Storage** | `localStorage` | Low-latency client persistence for calculation history and preferences. |
| **Build & Tooling** | Native ES Modules | Lightweight standard development without external framework lock-in. |
| **Test Runner** | Automated Test Suite (`npm test`) | Fast, native unit testing without external test framework lock-in. |

## 2. Dependency Invariants

- **Zero External Runtime Dependencies**: No runtime frameworks (React, Vue, Angular, Svelte) or heavyweight external runtime packages (`"dependencies": {}`).
- **Pure Native Math Engine**: Custom decimal arithmetic and operator execution implemented in pure TypeScript/ESM without third-party evaluation bloat.
- **Node.js 22+ Compatibility**: Development, build, and test pipelines run on Node.js 22 LTS or newer.
