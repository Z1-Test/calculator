---
type: Flow
title: "F5: Scientific Mode Logic Flow"
description: "Execution flow, unary and binary operations, angle mode toggling, and domain validation."
status: stable
tags: [flow, scientific, f5]
generated: { by: "factory:planner", at: "2026-10-13T14:18:00Z" }
sources:
  - id: source-feature
    resource: docs/context/features/f5-scientific-mode/feature.md
    title: F5 Feature Specification
---

# Logic Flow: Scientific Mode Toggle (F5)

## 1. Decision & Execution Flow

```mermaid
flowchart TD
    KeyTrigger["User presses Scientific Key"] --> KeyType{"Key Type"}
    
    KeyType -->|Unary: sqrt, square, sin, cos, tan| ReadBuffer["Read current display value"]
    KeyType -->|Constant: pi, e| LoadConstant["Set display to formatted constant"]
    KeyType -->|Angle Mode Toggle| ToggleUnit["Toggle DEG <-> RAD; update button label"]
    KeyType -->|Binary: x^y| SetBinaryOp["calcEngine.inputOperator('^')"]
    
    ReadBuffer --> CheckDomain{"Domain Valid?"}
    CheckDomain -->|No (sqrt(-1) or tan(90 deg))| TriggerError["Display: 'Invalid input', set hasError = true"]
    CheckDomain -->|Yes| ExecuteFunction["Execute Math calculation"]
    
    ExecuteFunction --> CheckAngle{"Trig Function?"}
    CheckAngle -->|Yes & DEG| ConvertRad["Angle in radians = val * PI / 180"]
    CheckAngle -->|Yes & RAD| DirectVal["Use angle directly"]
    CheckAngle -->|No| PureMath["Perform Math function"]
    
    ConvertRad --> NormResult["normalizePrecision(result)"]
    DirectVal --> NormResult
    PureMath --> NormResult
    
    NormResult --> UpdateUI["calcEngine.setDisplayValue(formatDisplay(result))"]
```

## 2. Decision Tree (`DEC-*`)

- **`DEC-F5-001` (Negative Square Root)**:
  - If $x < 0$, return `"Invalid input"`. Lock calculator until `C` or `AC`.
- **`DEC-F5-002` (Tangent Asymptote)**:
  - In `DEG`, if $x \equiv 90 \pmod{180}$, $\tan(x)$ is undefined $\to$ return `"Invalid input"`.
- **`DEC-F5-003` (Trig Float Normalization)**:
  - Round near-zero values ($|\text{result}| < 10^{-12}$) to $0$ (eliminates $\sin(180^\circ) = 1.22 \times 10^{-16}$ float artifact).
