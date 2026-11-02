---
type: Test Cases
title: Accessible web calculator component cases
status: draft
description: Comprehensive verification cases for web calculator custom element and accessibility.
level: L3
tier: T2
owner: unassigned
last_reviewed: 2026-11-02
tags: [cases, ui, component, accessibility]
---

# Cases

Up: [flow](./flow.md). One row per case.

| ID | Given | When | Then |
| :--- | :--- | :--- | :--- |
| CASE-UI-01 | Custom element registration | Page loads or element attached | `<stay-calc>` attaches open Shadow DOM with DSD template per `RULE-UI-001` and `DEC-CALC-02` |
| CASE-UI-02 | Keypad rendered | User clicks digits and operators | Inputs route to arithmetic engine and update display per `RULE-UI-002` |
| CASE-UI-03 | Component mounted | User presses standard number keys and operators | Keystrokes delegate to engine and update display per `RULE-UI-003` |
| CASE-UI-04 | Component mounted | User presses Numpad keys (0-9, Add, Subtract, Enter) | Numpad keys normalize and trigger calculations per `RULE-UI-003` |
| CASE-UI-05 | Component rendered | User tabs through buttons | `:focus-visible` outline rings display with WCAG 2.2 AA contrast per `RULE-UI-004` |
| CASE-UI-06 | Narrow viewport simulated | Resized to 320px, 375px, 390px | Layout fits container without horizontal overflow per `RULE-UI-005` and `LIM-CALC-MIN-VIEWPORT` |
| CASE-UI-07 | Display updates | Calculation completes or resets | Polite ARIA live status region announces updated text per `RULE-UI-006` |
| CASE-UI-08 | Division by zero triggered | Key sequence 8 / 0 = executed | Display shows `ERR-CALC-0001` and unlocks on C or AC per `RULE-UI-002` |
| CASE-UI-09 | Keypad rendered | User clicks M+, M-, MR, MC buttons | Memory actions delegate to engine and update display per `RULE-UI-007` and `DEC-CALC-03` |
| CASE-UI-10 | Memory register non-zero | User performs M+ with value | Visual M indicator badge unhides and becomes visible per `RULE-UI-008` and `DEC-CALC-03` |
| CASE-UI-11 | Visual M indicator visible | User clicks MC or reduces memory to zero | Visual M indicator badge hides immediately per `RULE-UI-008` and `DEC-CALC-03` |
| CASE-UI-12 | Responsive keypad rendered | Viewport resized to 320px, 375px, 390px | 6-row keypad layout maintains zero horizontal scroll overflow per `RULE-UI-005` and `LIM-CALC-MIN-VIEWPORT` |


## Not applicable

- Permission denied: Calculator component is entirely client-side and requires no authorization.
- Auth lost halfway: No authentication session exists for client-side calculator.
