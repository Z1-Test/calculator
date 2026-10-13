---
type: Flow
title: "F2: Accessible UI Event & Lifecycle Flow"
description: "User interaction, keyboard input flow, and DOM lifecycle for <stay-calc> custom element."
status: stable
tags: [flow, ui, keyboard, f2]
generated: { by: "factory:planner", at: "2026-10-13T14:04:00Z" }
sources:
  - id: source-feature
    resource: docs/context/features/f2-accessible-ui/feature.md
    title: F2 Feature Specification
---

# Logic Flow: Accessible UI & Keyboard Navigation (F2)

## 1. Interaction Architecture

```mermaid
flowchart TD
    UserTrigger["User Event: Keystroke or Keypad Click"] --> InputType{"Input Type"}
    
    InputType -->|Physical Keyboard| KeyListener["keydown Event Listener on window/host"]
    InputType -->|Mouse / Touch| ButtonClick["click Event Listener on button"]
    
    KeyListener --> KeyFilter{"Allowed Key?"}
    KeyFilter -->|Digit 0-9| ActionDigit["engine.inputDigit(key)"]
    KeyFilter -->|Operator +, -, *, /| ActionOp["engine.inputOperator(op)"]
    KeyFilter -->|Enter or =| ActionCalc["engine.calculate()"]
    KeyFilter -->|Escape| ActionAC["engine.allClear()"]
    KeyFilter -->|Backspace| ActionBS["Delete last char / '0'"]
    KeyFilter -->|Decimal .| ActionDec["engine.inputDecimal()"]
    KeyFilter -->|Other| Ignored["preventDefault() bypassed"]
    
    ButtonClick --> ActionDispatch["Dispatch corresponding engine method"]
    
    ActionDigit --> RenderDisplay["Update Shadow DOM #display Text & ARIA"]
    ActionOp --> RenderDisplay
    ActionCalc --> RenderDisplay
    ActionAC --> RenderDisplay
    ActionBS --> RenderDisplay
    ActionDec --> RenderDisplay
```

## 2. Decision Tree (`DEC-*`)

- **`DEC-F2-001` (Keyboard Event Binding)**:
  - Attached on `connectedCallback()` and detached cleanly on `disconnectedCallback()` to avoid memory leaks.
- **`DEC-F2-002` (Event Key Normalization)**:
  - Map `x` or `X` to `*` if shift key or numpad used.
  - Map `Enter` to `=` calculation.
  - Prevent default browser scroll when `Space` or `/` (Firefox quick search) is intercepted.
