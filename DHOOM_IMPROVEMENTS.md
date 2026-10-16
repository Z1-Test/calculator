# Dhoom Improvements Record

| Date | Milestone | Friction in Target Workspace | Dhoom Capability Improved | Dhoom Commit | Verification Result |
|---|---|---|---|---|---|
| 2026-10-15 | Pre-Run Setup | Unclosed function bracket in `stayplan-artifact.ts` | `skills/stayplan-artifact/scripts/stayplan-artifact.ts` | `02fa384a` | Syntax verified & passes |
| 2026-10-15 | Milestone 1 (F1) | Hardcoded StaytunedLLP field IDs returned HTTP 422 in Z1-Test | `agents/{triage,planner,review,changing,merging}.agent.md`, `software-factory.md` | `dd9fa5f7` | Dynamic field ID resolution verified & passes |
| 2026-10-15 | Milestone 1 (F1) | `@triage` attempted to read non-existent `docs/factory/software/01-sf-taxonomy.md` in consumer workspace | `agents/triage.agent.md` | `88625f45` | Grounded to RULE-TRI-4 inline taxonomy |
| 2026-10-15 | Milestone 1 (F2) | `@merging` did not mark acceptance criteria `- [x]` in Issue #56 body | `agents/merging.agent.md`, `software-factory.md` | `21578c08` | Mandated RULE-MRG-5 acceptance criteria checkoff prior to merge |
| 2026-10-15 | Milestone 1 (F3) | Lean prompts needed automated trigger for S4 Adversarial Gate on F3/F4 | `agents/review.agent.md`, `software-factory.md` | `663a4fd0` | Codified RULE-REV-8 for mandatory S4 review rejection on Cycle 1 |
