---
type: Test Cases
title: Precision arithmetic engine cases
status: draft
description: Comprehensive verification cases for arithmetic engine rules.
level: L3
tier: T2
owner: unassigned
last_reviewed: 2026-11-02
tags: [cases, arithmetic]
---

# Cases

Up: [flow](./flow.md). One row per case.

| ID | Given | When | Then |
| :--- | :--- | :--- | :--- |
| CASE-CALC-01 | Initial state | Press 2 + 3 * 4 = | Evaluates to 20 per `RULE-CALC-007` and `DEC-CALC-01` |
| CASE-CALC-02 | Operand 5 entered | Press + then * then 2 = | Pending operator replaced with * yielding 10 per `RULE-CALC-008` |
| CASE-CALC-03 | Float inputs | Press 0.1 + 0.2 = | Result displays 0.3 per `RULE-CALC-002` |
| CASE-CALC-04 | Long decimal | Press 1 / 3 = | Rounded cleanly within `LIM-CALC-DIGITS` per `RULE-CALC-002` |
| CASE-CALC-05 | Pending operation | Press C | Buffer resets to 0 preserving accumulator and operator per `RULE-CALC-009` |
| CASE-CALC-06 | Multi-step calculation | Press AC | All registers reset to initial state per `RULE-CALC-010` |
| CASE-CALC-07 | Operand 5 entered | Press / 0 = | Yields `ERR-CALC-0001` and locks input per `RULE-CALC-001` |
| CASE-CALC-08 | Invalid number sequence | Unparseable token input | Handled safely yielding `ERR-CALC-0002` |

## Not applicable

- Permission denied: Calculator is offline client-side and requires no authorization.
- Auth lost halfway: No authentication required for calculator engine.
