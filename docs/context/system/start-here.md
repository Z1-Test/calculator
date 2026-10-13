---
type: Guide
title: "StayCalc System Start Here"
description: "Developer onboarding, setup instructions, and execution commands for StayCalc."
status: stable
tags: [setup, onboarding, start-here, dev]
generated: { by: "human:maintainer", at: "2026-10-08T00:00:00Z" }
sources:
  - id: source-stack
    resource: docs/context/system/stack.md
    title: Technology Stack
---

# StayCalc System Start Here

## 1. Quick Start

Follow these steps to run StayCalc locally:

```bash
# 1. Run automated test suite
npm test
```

## 2. Directory Structure

```text
calculator/
├── docs/context/           # Architecture & specifications
│   ├── README.md
│   ├── project/            # Vision, architecture, domain rules, brand, design
│   ├── system/             # Stack, routes, API, data, constraints
│   └── decisions/          # Architectural Decision Records
├── src/                    # Application source code
│   ├── components/         # W3C Custom Element (<stay-calc>)
│   └── engine/             # Precision arithmetic, memory, and scientific logic
├── test/                   # Automated test suite (npm test)
├── index.html              # HTML entrypoint with Declarative Shadow DOM
└── package.json            # Project manifest & test script
```

## 3. Verification

To verify calculator functionality:
1. Run `npm test` to execute the automated test suite.
2. Verify floating-point precision, division-by-zero protection, and operator replacement.
3. Verify keyboard event listeners (`0-9`, `+`, `-`, `*`, `/`, `Enter`, `Escape`, `Backspace`).
