---
type: Flow
title: Precision arithmetic engine flows
status: draft
description: Immediate execution flow, operator replacement, and error recovery.
level: L3
tier: T2
owner: unassigned
last_reviewed: 2026-11-02
tags: [flow, arithmetic]
---

# Flows

Up: [feature](./feature.md). Next: [cases](./cases.md).

## FLW-CALC-01 Immediate calculation flow

```mermaid
flowchart TD
  S(["Start input"]) --> A["Input operand 1"]
  A --> B["Input operator"]
  B --> C["Input operand 2"]
  C --> D{"Press operator or equals"}
  D -- operator --> E["Evaluate intermediate and store pending"]
  D -- equals --> F["Evaluate final result"]
  E --> G["Ready for next operand"]
  F --> H["Calculation complete"]
```

## FLW-CALC-02 Division by zero and error recovery

```mermaid
flowchart TD
  A["Divide by zero trigger"] --> B["Emit ERR-CALC-0001"]
  B --> C["Lock engine state"]
  C --> D{"User presses C or AC"}
  D -- C --> E["Reset buffer to zero and unlock"]
  D -- AC --> F["Reset entire engine state"]
```

## FLW-CALC-03 Memory accumulation and recall flow

```mermaid
flowchart TD
  A["User enters value"] --> B{"User presses M+, M-, MR, or MC"}
  B -- "M+" --> C["Accumulate into memory register"]
  B -- "M-" --> D["Subtract from memory register"]
  B -- "MR" --> E["Recall memory into active buffer"]
  B -- "MC" --> F["Reset memory register to zero"]
  C --> G["Set isNewInput true and update display"]
  D --> G
  E --> G
  F --> G
```

