# Milestone 1 Task Contract: Core Foundation

## In Scope (Only touch these):
- [ ] Math engine: addition, subtraction, multiplication, division, decimal precision (`0.1 + 0.2 = 0.3`).
- [ ] Division-by-zero protection (`Cannot divide by zero`).
- [ ] Operator override logic (`5 + * 2` -> `5 * 2 = 10`).
- [ ] Web component: `<stay-calc>` with accessible display, key grid, and keyboard event listeners (`0-9`, `+`, `-`, `*`, `/`, `Enter`, `Backspace`, `Escape`).
- [ ] Native unit tests in `test/calc-engine.test.ts` passing via `node --test`.
- [ ] Operational tracking updates: `STATE.md`, `TOKEN_USAGE.md`, `DHOOM_IMPROVEMENTS.md`.

## FORBIDDEN / OUT OF SCOPE (Do NOT touch):
- ❌ Memory registers (`M+`, `M-`, `MR`, `MC`) — Strictly deferred to Milestone 2.
- ❌ Calculation history tape — Strictly deferred to Milestone 2.
- ❌ Scientific mode toggle & trigonometry — Strictly deferred to Milestone 3.
- ❌ External npm runtime dependencies or frameworks (React, Vue, Vitest) — Strictly prohibited.

## Execution Rules:
- **Max Retry Rule**: If any test or command fails more than 2 times, STOP. Do not loop. Log friction in `scratch/feedback.md` and improve the factory engine in `sync-dhoom`.
