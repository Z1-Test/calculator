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
# 1. Install dependencies (Node.js 22+)
npm install

# 2. Start local development server
npm run dev

# 3. Run test suite & verification
npm test
```

## 2. Directory Structure

```text
calculator/
├── docs/context/           # Stayplan architecture & specs
│   ├── README.md
│   ├── project/            # Vision, architecture, domain rules, brand, design
│   ├── system/             # Stack, routes, API, data, constraints
│   └── decisions/          # Architectural Decision Records
├── public/                 # PWA manifest, service worker, icons
│   ├── manifest.json
│   ├── sw.js
│   └── favicon.ico
├── src/                    # Application source code
│   ├── components/         # W3C Custom Elements (<stay-calc-*>)
│   ├── workers/            # Web Worker calculation engine
│   ├── services/           # Storage, state coordinator, theme service
│   └── index.ts            # Application bootstrap & custom element registry
├── index.html              # HTML entrypoint with Declarative Shadow DOM
└── package.json            # Project manifest & scripts
```

## 3. PWA Verification

To test offline functionality:
1. Open the browser DevTools -> Application tab.
2. Verify Service Worker registration and Cache Storage.
3. Check "Offline" mode under Network tab and reload the page.
4. Verify all calculation modes continue to function with zero network requests.
