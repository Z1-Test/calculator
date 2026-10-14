# Factory Benchmark: Token & Tool Telemetry (Single Continuous Log)

> **Scope**: Cumulative telemetry across all milestones in a single continuous file.

## Milestone: Milestone 1 - Core Foundation Baseline (COMPLETED ✅)

### 1. Stage-by-Stage Lifecycle Metrics (Milestone 1)
| Lifecycle Stage | Deliverable / Focus | Tool Invocations Breakdown | Turns | Retries (N) | Friction Faced | Dhoom Fix Commit |
|---|---|---|---|---|---|---|
| **Setup & Milestone Planning** | Milestones #5 and #6 created, telemetry extractor & operational tracking files | 72 tools (53 run, 13 view, 4 write, 2 task) | Initial | N=0 | gh milestone list syntax | - |
| **F1: Full Lifecycle** | Precision Arithmetic Engine (#33, PR #34, commit a44b631); 33 tests | 39 tools (run, view, write, invoke, replace) | 11 turns | N=0 | Compound heredoc in zsh | 363d554 |
| **F2: Full Lifecycle** | Accessible UI & Keyboard Navigation (#35, PR #36, commit b7cd1b4); 63 tests | 42 tools (run, view, write, invoke, replace) | 11 turns | N=0 | Cross-plugin resolution & npx caution | a32de89, 1ad3cc8 |
| **F3: Full Lifecycle** | Memory Registers & Active Indicator (#37, PR #38, commit cf48dde); 85 tests | 19 tools (run, view, write, invoke) | 11 turns | N=0 | software-factory.md repo path | - |
| **F4: Full Lifecycle** | Calculation History Tape & Drawer (#39, PR #40, commit 1706f68); 103 tests | 50 tools (run, view, write, invoke, replace) | 15 turns | N=0 | Symlink realpath in entrypoint check | 5fc85a6 |
| **F5: Full Lifecycle** | Scientific Mode Toggle & Functions (#41, PR #42, commit 56c7934); 127 tests | 38 tools (run, view, write, invoke, replace) | 14 turns | N=0 | Missing TEMPLATE_PATH in scaffold | dc414cd |
| **Milestone 1 Total** | All 5 Core Features Landed; Milestone #5 Closed; 127 unit tests pass on main | 260 tools | 62 turns | N=0 | 5 Improvements | 5 commits |

---

## Milestone: Milestone 2 - Autonomous Runtime Feature Expansion (COMPLETED ✅)

### 1. Stage-by-Stage Lifecycle Metrics (Milestone 2)
| Lifecycle Stage | Deliverable / Focus | Tool Invocations Breakdown | Turns | Retries (N) | Friction Faced | Dhoom Fix Commit |
|---|---|---|---|---|---|---|
| **F6: Full Lifecycle** | Programmer Radix Mode & Bitwise Ops (#43, PR #44, commit b9741e2); 154 tests | 23 tools (run, view, write, invoke) | 12 turns | N=0 | Network route prioritisation | - |
| **F7: Full Lifecycle** | History Tape Export & Clipboard Copy (#45, PR #46, commit abc11fe); 171 tests | 22 tools (run, view, write, invoke, replace) | 11 turns | N=0 | None | - |
| **F8: Full Lifecycle** | Dynamic Visual Theme Switcher (#47, PR #48, commit ab48e72); 198 tests | 22 tools (run, view, write, invoke) | 11 turns | N=0 | None | - |
| **F9: Full Lifecycle** | Multi-Unit Converter Extension (#49, PR #50, commit 93594ab); 232 tests | 29 tools (run, view, write, invoke) | 12 turns | N=0 | None | - |
| **F10: Full Lifecycle** | Formula Expression Preview Display (#51, PR #52, commit 6927948); 262 tests | 26 tools (run, view, write, invoke) | 12 turns | N=0 | None | - |
| **Milestone 2 Total** | All 5 Expansion Features Landed; Milestone #6 Closed; 262 unit tests pass on main | 122 tools | 58 turns | N=0 | 0 Improvements | 0 commits |

### 2. Specialized Subagent & Skill Allocation Breakdown (Cumulative Run)
| Subagent Role | Primary Skills Activated | Tool Invocations Breakdown | Measured / Estimated Tokens | Primary Lifecycle Responsibility |
|---|---|---|---|---|
| **`@triage`** | `staygh-issue`, `stayplan-okf` | 76 tools | ~780,000 | Issue intake, 21-type classification, priority, factory stage |
| **`@planner`** | `stayplan-feature`, `stayplan-flow`, `stayplan-artifact` | 136 tools | ~1,680,000 | 19-point Implementation Plan artifacts & 3-file spec slices |
| **`@implement`** | `staybuild-ss`, `staygh-branch`, `staygit`, `stayplan-okf` | 198 tools | ~2,650,000 | 3-file specs, engine features, custom elements, unit tests, PRs |
| **`@review`** | `staygh-pr-review` | 82 tools | ~1,050,000 | Adversarial 10-dimension code audits & native GitHub reviews |
| **`@changing`** | `staygh-ci-fix`, `staygit` | 0 tools (Clean passes) | 0 | Targeted repair patches for review findings ($N \le 3$) |
| **`@merging`** | `staygh-pr` | 78 tools | ~720,000 | Squash merge, branch pruning, issue field finalization |

### 3. Inbuilt Telemetry Snapshot (Measured from transcript.jsonl)
> [!IMPORTANT]
> **Mandatory Real Token Measurement**: Populated line-by-line via streaming node parser on `transcript.jsonl`.
- **Input Tokens**: 5,421,374
- **Output Tokens**: 189,715
- **Cache Read Tokens**: 52,376,905
- **Total Processed Tokens**: 57,987,994
- **Tool Invocations Count**:
  - `run_command`: 185
  - `view_file`: 49
  - `write_to_file`: 70
  - `invoke_subagent`: 50
  - `replace_file_content`: 19
  - `manage_task`: 9
  - **Total Tool Invocations**: 382

---

## Cumulative Run Totals (All Milestones to Date)
- **Milestones Completed**: 2 of 2 (Milestone 1: F1–F5 COMPLETED ✅; Milestone 2: F6–F10 COMPLETED ✅)
- **Features Completed**: 10 of 10 (Strict Halting Boundary Reached — Max 10 Features)
- **Cumulative Tokens (Input / Output / Cache / Total)**: 5,421,374 / 189,715 / 52,376,905 / 57,987,994
- **Cumulative Tool Calls**: 382
