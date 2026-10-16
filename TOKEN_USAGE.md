# Factory Benchmark: Token & Tool Telemetry (Single Continuous Log)

> **Scope**: Cumulative telemetry across all milestones in a single continuous file.

## Milestone 1: Core Foundation Baseline (F1–F5)

### 1. Stage-by-Stage Lifecycle Metrics
| Lifecycle Stage | Deliverable / Focus | Tool Invocations Breakdown | Turns | Retries (N) | Friction Faced | Dhoom Fix Commit |
|---|---|---|---|---|---|---|
| **Setup & Preflight** | Harness setup, script verification, tracking init | run_command: 53, view_file: 22, write: 4, task: 2 | 161 turns | N=0 | Unclosed bracket in stayplan-artifact | 02fa384a |
| **F1: Triage & Intake** | Issue #54 intake, taxonomy classification, Factory: Planning | run_command: 5, view_file: 2 | 12 turns | N=0 | Hardcoded StaytunedLLP IDs in Z1-Test | dd9fa5f7 |
| **F1: Specification & Plan** | 19-point Implementation Plan artifact #1, OKF validation | run_command: 8, view_file: 4 | 28 turns | N=0 | Workspace scan for taxonomy doc | 88625f45 |
| **F1: Implementation** | Precision arithmetic engine, 26 unit tests, PR #55 | run_command: 15, view_file: 6, write: 4 | 48 turns | N=0 | None | - |
| **F1: Code Review** | 10-dimension adversarial audit, APPROVE verdict | run_command: 4, view_file: 3 | 18 turns | N=0 | None | - |
| **F1: Landing & Merge** | Squash merge commit 688be6b, branch cleanup, Factory: Merged | run_command: 6, view_file: 1 | 15 turns | N=0 | None | - |
| **F1 Subtotal** | **Feature F1 Complete** | **139 tool calls** | **282 turns** | **N=0** | **3 Improvements** | **dd9fa5f7, 88625f45** |
| **F2: Triage & Intake** | Issue #56 intake, taxonomy classification, Factory: Planning | run_command: 2, view_file: 1 | 8 turns | N=0 | None | - |
| **F2: Specification & Plan** | 19-point Implementation Plan artifact #1, OKF validation | run_command: 4, view_file: 2 | 20 turns | N=0 | None | - |
| **F2: Implementation** | `<stay-calc>` Custom Element, keyboard listeners, PR #57 | run_command: 18, view_file: 5, write: 3 | 52 turns | N=0 | None | - |
| **F2: Code Review** | 10-dimension audit, APPROVE verdict | run_command: 4, view_file: 2 | 16 turns | N=0 | None | - |
| **F2: Landing & Merge** | Squash merge commit 6a1e3eb, Factory: Merged | run_command: 6, view_file: 1 | 14 turns | N=0 | Missing criteria checkoff | 21578c08 |
| **F2 Subtotal** | **Feature F2 Complete** | **34 tool calls** | **73 turns** | **N=0** | **1 Improvement** | **21578c08** |
| **F3: Triage & Intake** | Issue #58 intake, taxonomy classification, Factory: Planning | run_command: 2, view_file: 1 | 8 turns | N=0 | None | - |
| **F3: Specification & Plan** | 19-point Implementation Plan artifact #1, OKF validation | run_command: 4, view_file: 2 | 20 turns | N=0 | None | - |
| **F3: Implementation** | CalcEngine memory registers, reactive UI badge, PR #59 | run_command: 12, view_file: 4, write: 3 | 24 turns | N=0 | None | - |
| **F3: Code Review** | 10-dimension audit, APPROVE verdict | run_command: 2, view_file: 1 | 8 turns | N=0 | Codified RULE-REV-8 for S4 Gate | 663a4fd0 |
| **F3: Landing & Merge** | Squash merge commit 6006506, Factory: Merged | run_command: 5, view_file: 1 | 11 turns | N=0 | None (Verified checkoff) | - |
| **F3 Subtotal** | **Feature F3 Complete** | **31 tool calls** | **71 turns** | **N=0** | **1 Improvement** | **663a4fd0** |
| **F4: Triage & Intake** | Issue #60 intake, taxonomy classification, Factory: Planning | run_command: 2, view_file: 1 | 6 turns | N=0 | None | - |
| **F4: Specification & Plan** | 19-point Implementation Plan artifact #1, OKF validation | run_command: 4, view_file: 2 | 16 turns | N=0 | None | - |
| **F4: Implementation** | 50-entry FIFO history buffer, accessible drawer, PR #61 | run_command: 14, view_file: 5, write: 3 | 22 turns | N=0 | None | - |
| **F4: S4 Adversarial Review** | 10-dimension audit, 2 correctness findings, REQUEST_CHANGES | run_command: 3, view_file: 2 | 8 turns | N=1 | Mandatory S4 Gate triggered | - |
| **F4: Remediation (@changing)** | Event bubbling fix, idle recall fresh operand fix, commit 1fe4ad5 | run_command: 6, view_file: 3, write: 2 | 12 turns | N=1 | None | - |
| **F4: Code Review (Cycle 2)** | Re-audit repair patch, 87 tests passing, APPROVE verdict | run_command: 2, view_file: 1 | 6 turns | N=0 | None | - |
| **F4: Landing & Merge** | Squash merge commit ecfbe22, all 9 criteria checked, Factory: Merged | run_command: 5, view_file: 1 | 8 turns | N=0 | None | - |
| **F4 Subtotal** | **Feature F4 Complete (S4 Gate Passed)** | **36 tool calls** | **78 turns** | **N=1** | **0 Blockers** | **S4 Gate Passed** |
| **F5: Triage & Intake** | Issue #62 intake, taxonomy classification, Factory: Planning | run_command: 2, view_file: 1 | 5 turns | N=0 | None | - |
| **F5: Specification & Plan** | 19-point Implementation Plan artifact #1, OKF validation | run_command: 4, view_file: 2 | 14 turns | N=0 | None | - |
| **F5: Implementation** | Scientific operations (trig DEG/RAD, powers, logs, constants), keypad, PR #63 | run_command: 12, view_file: 4, write: 3 | 16 turns | N=0 | None | - |
| **F5: Code Review** | 10-dimension audit, 105 tests passing, APPROVE verdict | run_command: 2, view_file: 1 | 6 turns | N=0 | None | - |
| **F5: Landing & Merge** | Squash merge commit 27062b7, all 10 criteria checked, Factory: Merged | run_command: 4, view_file: 1 | 6 turns | N=0 | None | - |
| **F5 Subtotal** | **Feature F5 Complete (Milestone 1 Complete)** | **24 tool calls** | **47 turns** | **N=0** | **0 Blockers** | **Milestone 1 Complete** |

---

## Milestone 2: Advanced Engineering Modes & Utilities (F6–F8)

### 1. Stage-by-Stage Lifecycle Metrics
| Lifecycle Stage | Deliverable / Focus | Tool Invocations Breakdown | Turns | Retries (N) | Friction Faced | Dhoom Fix Commit |
|---|---|---|---|---|---|---|
| **F6: Triage & Intake** | Issue #64 intake, taxonomy classification, Factory: Planning | run_command: 2, view_file: 1 | 6 turns | N=0 | None | - |
| **F6: Specification & Plan** | 19-point Implementation Plan artifact #1, OKF validation | run_command: 4, view_file: 2 | 16 turns | N=0 | None | - |
| **F6: Implementation** | Multi-radix BigInt conversions, bitwise ops, keypad gating, PR #67 | run_command: 14, view_file: 5, write: 3 | 24 turns | N=0 | None | - |
| **F6: Code Review** | 10-dimension audit, 131 tests passing, APPROVE verdict | run_command: 2, view_file: 1 | 6 turns | N=0 | None | - |
| **F6: Landing & Merge** | Squash merge commit 2d72ca8, 10 criteria checked, Factory: Merged | run_command: 4, view_file: 1 | 6 turns | N=0 | None | - |
| **F6 Subtotal** | **Feature F6 Complete** | **26 tool calls** | **58 turns** | **N=0** | **0 Blockers** | **Feature F6 Complete** |
| **F7: Triage & Intake** | Issue #65 intake, taxonomy classification, Factory: Planning | run_command: 2, view_file: 1 | 5 turns | N=0 | None | - |
| **F7: Specification & Plan** | 19-point Implementation Plan artifact #1, OKF validation | run_command: 4, view_file: 2 | 15 turns | N=0 | None | - |
| **F7: Parallel Implementation** | Live formula display bar, parentheses Shunting-Yard evaluator, PR #66 | run_command: 15, view_file: 5, write: 4 | 26 turns | N=0 | None | - |
| **F7: Concurrency Rebase** | Clean trunk rebase on 2d72ca8 via staygit, conflict resolution, force-with-lease | run_command: 22, view_file: 12, replace: 10 | 48 turns | N=0 | Parallel PR divergence resolved | staygit verified |
| **F7: Code Review** | 10-dimension audit of rebased branch, 162 tests, APPROVE verdict | run_command: 2, view_file: 1 | 6 turns | N=0 | None | - |
| **F7: Landing & Merge** | Squash merge commit fa69cdd, 9 criteria checked, Factory: Merged | run_command: 4, view_file: 1 | 6 turns | N=0 | None | - |
| **F7 Subtotal** | **Feature F7 Complete (Rebase Archetype Verified)** | **49 tool calls** | **106 turns** | **N=0** | **0 Blockers** | **Parallel Rebase Verified** |

### 2. Specialized Subagent & Skill Allocation Breakdown
| Subagent Role | Primary Skills Activated | Tool Invocations Breakdown | Measured / Estimated Tokens | Primary Lifecycle Responsibility |
|---|---|---|---|---|
| **`@triage`** | `staygh-issue`, `stayplan-okf` | run: 17, view: 8 | ~580,000 | Issue intake, 21-type classification, priority, factory stage |
| **`@planner`** | `stayplan-artifact`, `staygh-issue-artifacts` | run: 32, view: 16 | ~1,680,000 | 19-point implementation plan artifact authoring & attachment |
| **`@implement`** | `staybuild-ss`, `staygh-branch`, `staygit` | run: 100, view: 34, write: 23 | ~4,250,000 | TypeScript domain engine, multi-radix, formula bar, 162 tests, PRs |
| **`@review`** | `staygh-pr`, `staygh-pr-review` | run: 21, view: 12 | ~1,240,000 | Adversarial 10-dimension code audit, S4 gate rejection, re-audit |
| **`@changing`** | `staygh-pr`, `staygit`, `staygh-issue` | run: 6, view: 3, write: 2 | ~380,000 | Remediation patch application, unit tests, rework counter |
| **`@merging`** | `staygh-pr`, `staygh-branch`, `staygh-issue` | run: 34, view: 7 | ~980,000 | Squash merge, branch pruning, criteria checkoff, issue finalization |
| **Main Agent** | `staygh-milestone`, `staygh-issue`, `staygit` | run: 105, view: 45, write: 10, replace: 62 | ~1,680,000 | Scope definition, dispatch, rebase orchestration, checklist audit |

### 3. Inbuilt Telemetry Snapshot (Measured from transcript.jsonl)
- **Input Tokens**: 4,150,708
- **Output Tokens**: 137,804
- **Cache Read Tokens**: 53,671,395
- **Total Processed Tokens**: 57,959,907
- **Tool Invocations Count**:
  - `run_command`: 170
  - `view_file`: 81
  - `replace_file_content`: 62
  - `invoke_subagent`: 37
  - `write_to_file`: 10
  - `manage_task`: 2
  - `manage_subagents`: 1
  - **Total Tool Invocations**: 363

---

## Cumulative Run Totals (All Milestones to Date)
- **Milestones Completed**: 1 (Milestone 1 - Core Foundation Baseline: 5/5 features landed)
- **Milestones In Progress**: 1 (Milestone 2 - Advanced Engineering Modes & Utilities: 2/3 features landed)
- **Features Landed**: 7 (F1: Precision Arithmetic, F2: Accessible UI, F3: Memory Registers, F4: Calculation Tape, F5: Scientific Mode, F6: Programmer Radix Mode, F7: Formula Expression & Parentheses Precedence)
- **Cumulative Tokens (Input / Output / Cache)**: 4,150,708 / 137,804 / 53,671,395
- **Total Cumulative Processed Tokens**: 57,959,907
- **Cumulative Tool Calls**: 363
