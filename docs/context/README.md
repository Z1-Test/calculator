---
type: Guide
title: "StayCalc Documentation"
description: "Documentation entrypoint, overview, and quick-start guide for StayCalc multi-mode web calculator."
status: stable
tags: [overview, documentation, guide, staycalc]
generated: { by: "human:maintainer", at: "2026-10-08T00:00:00Z" }
sources:
  - id: source-project
    resource: docs/context/project/vision.md
    title: Product Vision
---

# StayCalc Documentation

> High-precision, multi-mode offline-first PWA web calculator built with W3C Custom Elements and Staystack architecture.

## Overview

StayCalc provides a multi-mode web calculation environment designed for speed, accessibility, and zero-latency offline operation. It features Standard, Scientific, and Programmer calculation modes with responsive light and dark theme support, keyboard navigation, and full session history persistence.

```text
docs/context/
├── README.md
├── project/          vision, architecture, actors, glossary, domain-rules, permissions, entity-statuses, data-retention, brand.md, design.md
├── system/           start-here, stack, routes, api, data, constraints
└── decisions/        0001-offline-first-pwa-custom-elements.md
```

## Documentation Navigation

- **Project Foundations** (`project/`):
  - [Product Vision](./project/vision.md): Executive summary, core principles, outcomes, and non-goals.
  - [System Architecture](./project/architecture.md): Macro topology, component boundaries, and runtime dataflows.
  - [Actors & Personas](./project/actors.md): User roles and capabilities.
  - [Ubiquitous Glossary](./project/glossary.md): Canonical mathematical and architectural terms.
  - [Domain Rules](./project/domain-rules.md): Mathematical invariants, rounding, and safety rules (`RULE-*`, `NEVER-*`).
  - [Permissions Matrix](./project/permissions.md): Local device authorization and storage scopes.
  - [Entity Statuses](./project/entity-statuses.md): Calculator state machines and mode lifecycles.
  - [Data Retention](./project/data-retention.md): Local storage lifecycle and privacy policies.
  - [Brand Guidelines](./project/brand.md): Brand voice, logo rules, and core palette.
  - [Design System](./project/design.md): Staylook design tokens, typography, and component recipes.

- **System Specifications** (`system/`):
  - [Start Here](./system/start-here.md): Developer quick-start guide and setup steps.
  - [Technology Stack](./system/stack.md): Platform runtimes, zero-dependency requirements, and PWA configuration.
  - [Routes & Surfaces](./system/routes.md): URL parameters, mode transitions, and view states.
  - [API & Interfaces](./system/api.md): Client-side Web Worker calculation contracts.
  - [Data Model](./system/data.md): Local storage schemas and history persistence structures.
  - [System Constraints](./system/constraints.md): WCAG 2.2 AA accessibility, performance budgets, and error boundaries.

- **Architectural Decisions** (`decisions/`):
  - [ADR 0001: Offline-First PWA and W3C Custom Elements](./decisions/0001-offline-first-pwa-custom-elements.md).

## Prerequisites

- Node.js 22+ (LTS)
- Modern evergreen web browser with Custom Elements and Service Worker support.
