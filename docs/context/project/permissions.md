---
type: Policy
title: "StayCalc Permissions & Security Policy"
description: "Client-side permissions, local storage access boundaries, and security model for StayCalc."
status: stable
tags: [permissions, policy, security, local-storage]
generated: { by: "human:maintainer", at: "2026-10-08T00:00:00Z" }
sources:
  - id: source-vision
    resource: docs/context/project/vision.md
    title: Product Vision
---

# StayCalc Permissions & Security Policy

## 1. Authorization & Access Scopes

StayCalc operates on a client-first, zero-remote-credential security model. No user accounts, passwords, or server-side session tokens are utilized:

| Resource Scope | Access Mode | Actor Permissions | Description |
| :--- | :--- | :--- | :--- |
| `calc:evaluate` | Client Local | All Actors | Perform local mathematical evaluations in Web Worker. |
| `storage:history` | Client Local | All Actors | Read, write, and clear local calculation history log. |
| `storage:preferences` | Client Local | All Actors | Read and write theme preference, default mode, and angle mode. |
| `pwa:service-worker` | Browser Scope | All Actors | Cache static application assets for offline capability. |

## 2. Browser Storage Security

- **Origin Isolation**: Local storage and cache keys are restricted to the origin (`staycalc.local` or deployed domain).
- **Zero Third-Party Exfiltration**: No outbound HTTP requests or analytics calls are permitted during or after calculations.
- **Sanitized Clipboard Integration**: Copy-to-clipboard actions sanitize numeric values to prevent clipboard injection attacks.
