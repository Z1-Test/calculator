---
type: Policy
title: "StayCalc Data Retention & Privacy Policy"
description: "Local data classifications, storage lifecycles, and privacy retention rules for StayCalc."
status: stable
tags: [data-retention, privacy, storage, lifecycle]
generated: { by: "human:maintainer", at: "2026-10-08T00:00:00Z" }
sources:
  - id: source-vision
    resource: docs/context/project/vision.md
    title: Product Vision
---

# StayCalc Data Retention & Privacy Policy

## 1. Data Classification

All data in StayCalc resides exclusively on the client device:

| Data Type | Storage Mechanism | Retention Period | Deletion Method |
| :--- | :--- | :--- | :--- |
| **Calculation History** | `localStorage` / `IndexedDB` | Max 100 entries (FIFO) or manual clear | One-click "Clear History" or browser data clear. |
| **User Preferences** | `localStorage` | Indefinite on device | Browser site data clear or settings reset. |
| **Memory Registers** | Session In-Memory (`StateStore`) | Session duration (cleared on tab close) | `MC` button or tab close. |
| **PWA Cache** | `CacheStorage` | Until updated by new Service Worker | Automatic version invalidation. |

## 2. Privacy Guarantees

- **No Remote Telemetry**: Zero external tracking requests or behavioral telemetry.
- **Zero Third-Party Cookies**: No cookies set or read.
- **Immediate Local Purge**: When the user clicks "Clear History", records are immediately and irreversibly purged from local storage.
