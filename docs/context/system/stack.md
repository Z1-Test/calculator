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
| **Language** | TypeScript 5.8+ / ES2024 | Strict type safety, native BigInt, and modern JS features. |
| **UI Components** | W3C Custom Elements & DSD | Zero-framework native browser standard with shadow encapsulation. |
| **Styling & Theming** | Native CSS + Staylook Tokens | Zero runtime CSS-in-JS; uses CSS custom properties (`--sl-*`). |
| **Compute Engine** | Web Worker API | Offloads mathematical evaluation and parsing off the main UI thread. |
| **Offline & PWA** | Service Worker API + Web App Manifest | Cache-first offline execution with installability. |
| **Local Storage** | `localStorage` / `IndexedDB` | Low-latency client persistence for calculation history and preferences. |
| **Build & Tooling** | Native ES Modules & TypeScript | Lightweight standard development without external framework lock-in. |
| **Test Runner** | Node.js Test Runner (`node --test`) | Fast, native unit testing built directly into Node.js runtime. |

## 2. Dependency Invariants

- **Zero External Runtime Dependencies**: No runtime frameworks (React, Vue, Angular, Svelte) or heavyweight math libraries.
- **Pure Native Math Engine**: Custom tokenizer and Shunting-Yard evaluator implemented in TypeScript without third-party evaluation bloat.
- **Node.js 22+ Compatibility**: Development, build, and test pipelines run on Node.js 22 LTS or newer.
